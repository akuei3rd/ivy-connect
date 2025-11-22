import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, Users, Video, VideoOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const IVY_SCHOOLS = [
  "Princeton University",
  "Harvard University",
  "Yale University",
  "Columbia University",
  "Cornell University",
  "Dartmouth College",
  "Brown University",
  "University of Pennsylvania",
];

const MAJORS = [
  "Computer Science",
  "Engineering",
  "Business",
  "Economics",
  "Biology",
  "Mathematics",
  "Psychology",
  "Political Science",
  "English",
  "History",
  "Physics",
  "Chemistry",
];

const CURRENT_YEAR = new Date().getFullYear();
const CLASS_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i - 1);

const Queue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [inQueue, setInQueue] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [filters, setFilters] = useState({
    schools: [] as string[],
    classYears: [] as string[],
    majors: [] as string[],
  });
  const [videoEnabled, setVideoEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkAuth();
    subscribeToQueue();
    subscribeToMatches();
    
    return () => {
      stopVideo();
    };
  }, []);

  // Ensure video stream is attached when video element is ready
  useEffect(() => {
    if (streamRef.current && videoRef.current && videoEnabled) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [videoEnabled, inQueue]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: false 
      });
      streamRef.current = stream;
      setVideoEnabled(true);
      // Video element will receive stream via useEffect
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use ProTV",
        variant: "destructive",
      });
      throw error;
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoEnabled(false);
  };

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    // Check if in queue
    const { data: queueEntry } = await supabase
      .from("queue")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "waiting")
      .single();

    if (queueEntry) {
      setInQueue(true);
      setFilters({
        schools: queueEntry.school_filter || [],
        classYears: queueEntry.class_year_filter?.map(String) || [],
        majors: queueEntry.major_filter || [],
      });
    }

    updateQueueCount();
  };

  const updateQueueCount = async () => {
    const { count } = await supabase
      .from("queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "waiting");

    setQueueCount(count || 0);
  };

  const subscribeToQueue = () => {
    const channel = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue",
        },
        () => {
          updateQueueCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMatches = () => {
    if (!userId) return;

    const channel = supabase
      .channel("match-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `user1_id=eq.${userId},user2_id=eq.${userId}`,
        },
        (payload) => {
          handleMatch(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleMatch = async (match: any) => {
    toast({
      title: "Match Found!",
      description: "Connecting you now...",
    });

    // Remove from queue
    await supabase
      .from("queue")
      .delete()
      .eq("user_id", userId);

    setInQueue(false);

    // Navigate to room
    navigate(`/room/${match.room_id}`);
  };

  const enterQueue = async () => {
    try {
      // Start video first
      await startVideo();
      
      // First, delete any existing queue entry for this user to avoid unique constraint violation
      await supabase.from("queue").delete().eq("user_id", userId);
      
      const { error } = await supabase.from("queue").insert([{
        user_id: userId!,
        school_filter: filters.schools.length > 0 ? filters.schools as any : null,
        class_year_filter:
          filters.classYears.length > 0
            ? filters.classYears.map(Number)
            : null,
        major_filter: filters.majors.length > 0 ? filters.majors as any : null,
        status: "waiting",
      }]);

      if (error) throw error;

      setInQueue(true);

      toast({
        title: "Entered Queue",
        description: "Looking for a match...",
      });

      // Try to match immediately
      await tryMatch();
    } catch (error: any) {
      stopVideo();
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const tryMatch = async () => {
    if (!userId) return;

    // Get current user's queue entry
    const { data: myQueue } = await supabase
      .from("queue")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "waiting")
      .single();

    if (!myQueue) return;

    // Get my profile to check against other users' filters
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!myProfile) return;

    // Get all waiting users with their profiles
    const { data: potentialMatches } = await supabase
      .from("queue")
      .select("*, profiles(*)")
      .eq("status", "waiting")
      .neq("user_id", userId);

    if (!potentialMatches || potentialMatches.length === 0) return;

    // Filter matches based on both users' criteria
    const compatibleMatches = potentialMatches.filter((candidate: any) => {
      const theirProfile = candidate.profiles;
      if (!theirProfile) return false;

      // Check if their profile matches my filters (if I have any)
      if (myQueue.school_filter && myQueue.school_filter.length > 0) {
        if (!myQueue.school_filter.includes(theirProfile.school)) return false;
      }
      
      if (myQueue.class_year_filter && myQueue.class_year_filter.length > 0) {
        if (!myQueue.class_year_filter.includes(theirProfile.class_year)) return false;
      }
      
      if (myQueue.major_filter && myQueue.major_filter.length > 0) {
        if (!myQueue.major_filter.includes(theirProfile.major)) return false;
      }

      // Check if my profile matches their filters (if they have any)
      if (candidate.school_filter && candidate.school_filter.length > 0) {
        if (!candidate.school_filter.includes(myProfile.school)) return false;
      }
      
      if (candidate.class_year_filter && candidate.class_year_filter.length > 0) {
        if (!candidate.class_year_filter.includes(myProfile.class_year)) return false;
      }
      
      if (candidate.major_filter && candidate.major_filter.length > 0) {
        if (!candidate.major_filter.includes(myProfile.major)) return false;
      }

      return true;
    });

    if (compatibleMatches.length === 0) return;
    
    const match = compatibleMatches[0];

    if (potentialMatches && potentialMatches.length > 0) {
      const match = potentialMatches[0];
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create match
      const { error: matchError } = await supabase.from("matches").insert({
        room_id: roomId,
        user1_id: userId,
        user2_id: match.user_id,
        status: "active",
      });

      if (matchError) {
        console.error("Match creation error:", matchError);
        toast({
          title: "Error",
          description: "Failed to create match",
          variant: "destructive",
        });
        return;
      }

      // Delete both queue entries
      await supabase.from("queue").delete().in("user_id", [userId, match.user_id]);
      
      toast({
        title: "Match Found!",
        description: "Connecting you now...",
      });
    }
  };

  const leaveQueue = async () => {
    await supabase.from("queue").delete().eq("user_id", userId);
    stopVideo();
    setInQueue(false);
    toast({
      title: "Left Queue",
      description: "You can re-enter anytime",
    });
  };

  const toggleFilter = (type: "schools" | "classYears" | "majors", value: string) => {
    setFilters((prev) => {
      const array = prev[type];
      const newArray = array.includes(value)
        ? array.filter((v) => v !== value)
        : [...array, value];
      return { ...prev, [type]: newArray };
    });
  };

  return (
    <div className="min-h-screen gradient-dark flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-6 backdrop-blur-sm bg-background/50 border-b border-border/50">
        <Button variant="ghost" onClick={() => navigate("/home")} className="hover:bg-accent/50">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Home
        </Button>
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-foreground" />
          <h1 className="text-3xl font-display font-bold text-gradient tracking-tight">
            ProTV
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="text-lg font-bold">{queueCount}</span>
          <span className="text-sm text-muted-foreground">online</span>
        </div>
      </div>

      {/* Main Content */}
      {!inQueue ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-card/50 backdrop-blur-sm p-12 rounded-3xl shadow-heavy border border-border/50 space-y-8 animate-scale-in">
            <div className="text-center">
              <h2 className="text-4xl font-display font-bold mb-3 text-gradient">
                Find Your Match
              </h2>
              <p className="text-lg text-muted-foreground">
                Connect with fellow Ivy League students instantly
              </p>
            </div>

            {/* Filters */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Filter by School (Optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {IVY_SCHOOLS.map((school) => (
                    <Badge
                      key={school}
                      variant={filters.schools.includes(school) ? "default" : "outline"}
                      className="cursor-pointer justify-center py-3 text-sm hover:scale-105 transition-all duration-200"
                      onClick={() => toggleFilter("schools", school)}
                    >
                      {school.split(" ")[0]}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Filter by Class Year (Optional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {CLASS_YEARS.map((year) => (
                    <Badge
                      key={year}
                      variant={filters.classYears.includes(year.toString()) ? "default" : "outline"}
                      className="cursor-pointer justify-center py-3 text-sm hover:scale-105 transition-all duration-200"
                      onClick={() => toggleFilter("classYears", year.toString())}
                    >
                      {year}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Filter by Major (Optional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {MAJORS.map((major) => (
                    <Badge
                      key={major}
                      variant={filters.majors.includes(major) ? "default" : "outline"}
                      className="cursor-pointer justify-center py-3 text-sm hover:scale-105 transition-all duration-200"
                      onClick={() => toggleFilter("majors", major)}
                    >
                      {major}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 shadow-glow text-lg font-semibold transition-all duration-300 hover:scale-105"
              onClick={enterQueue}
            >
              <Sparkles className="w-6 h-6 mr-2" />
              Start Matching
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-0 p-8">
          {/* User Video */}
          <div className="relative bg-grey-darker rounded-3xl overflow-hidden shadow-heavy border border-border/50">
            {videoEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-grey-darker to-grey-dark">
                <VideoOff className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
            <div className="absolute bottom-6 left-6 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border/50">
              <p className="text-sm font-medium">You</p>
            </div>
          </div>

          {/* Matching Loader */}
          <div className="relative bg-gradient-to-br from-grey-darker via-grey-dark to-background rounded-3xl overflow-hidden shadow-heavy border border-border/50 flex items-center justify-center">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-shimmer animate-shimmer opacity-20" />
            
            {/* Spinning ProTV Logo */}
            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="relative">
                {/* Outer rotating ring */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                  <div className="w-48 h-48 rounded-full border-4 border-transparent border-t-foreground/30 border-r-foreground/30" />
                </div>
                
                {/* Middle rotating ring */}
                <div className="absolute inset-4 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
                  <div className="w-40 h-40 rounded-full border-4 border-transparent border-b-foreground/50 border-l-foreground/50" />
                </div>
                
                {/* Inner rotating ring */}
                <div className="absolute inset-8 animate-spin" style={{ animationDuration: '1.5s' }}>
                  <div className="w-32 h-32 rounded-full border-4 border-transparent border-t-foreground/70" />
                </div>
                
                {/* Center logo */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-2 text-foreground animate-pulse" />
                    <h3 className="text-3xl font-display font-bold text-gradient">ProTV</h3>
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-display font-bold">Finding Your Match</h2>
                <p className="text-muted-foreground">Connecting you with someone amazing...</p>
                
                {filters.schools.length > 0 && (
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Filtering by:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {filters.schools.map((school) => (
                        <Badge key={school} variant="outline" className="text-xs">
                          {school.split(" ")[0]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Leave Queue Button */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <Button 
                variant="destructive" 
                onClick={leaveQueue}
                className="px-6 py-2 shadow-glow"
              >
                Leave Queue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Queue;