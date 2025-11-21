import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, Users, Loader2 } from "lucide-react";
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
  });

  useEffect(() => {
    checkAuth();
    subscribeToQueue();
    subscribeToMatches();
  }, []);

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
      const { error } = await supabase.from("queue").insert([{
        user_id: userId!,
        school_filter: filters.schools.length > 0 ? filters.schools as any : null,
        class_year_filter:
          filters.classYears.length > 0
            ? filters.classYears.map(Number)
            : null,
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

    // Find a match
    let query = supabase
      .from("queue")
      .select("*")
      .eq("status", "waiting")
      .neq("user_id", userId)
      .limit(1);

    // Apply filters if any
    if (myQueue.school_filter && myQueue.school_filter.length > 0) {
      // Match users who either have no filter or match our filter
      query = query.or(
        `school_filter.is.null,school_filter.cs.{${myQueue.school_filter.join(",")}}`
      );
    }

    const { data: potentialMatches } = await query;

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

      if (matchError) throw matchError;

      // Delete both queue entries
      await supabase.from("queue").delete().in("user_id", [userId, match.user_id]);
    }
  };

  const leaveQueue = async () => {
    await supabase.from("queue").delete().eq("user_id", userId);
    setInQueue(false);
    toast({
      title: "Left Queue",
      description: "You can re-enter anytime",
    });
  };

  const toggleFilter = (type: "schools" | "classYears", value: string) => {
    setFilters((prev) => {
      const array = prev[type];
      const newArray = array.includes(value)
        ? array.filter((v) => v !== value)
        : [...array, value];
      return { ...prev, [type]: newArray };
    });
  };

  return (
    <div className="min-h-screen gradient-ivy flex flex-col px-4 py-8">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/profile")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Profile
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gold" />
            <h1 className="text-2xl font-bold font-serif text-gradient">
              ProTV
            </h1>
          </div>
          <div className="w-24" />
        </div>

        {/* Queue Status */}
        <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl shadow-card border border-border/50 text-center">
          <Users className="w-12 h-12 text-gold mx-auto mb-3" />
          <h2 className="text-3xl font-bold mb-2">{queueCount}</h2>
          <p className="text-muted-foreground">
            {queueCount === 1 ? "Person" : "People"} in Queue
          </p>
        </div>

        {/* Main Content */}
        {!inQueue ? (
          <div className="bg-card/50 backdrop-blur-sm p-8 rounded-2xl shadow-card border border-border/50 space-y-6 animate-scale-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-serif mb-2">
                Find Your Match
              </h2>
              <p className="text-muted-foreground">
                Filter by preferences or match with anyone
              </p>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Filter by School (Optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {IVY_SCHOOLS.map((school) => (
                    <Badge
                      key={school}
                      variant={
                        filters.schools.includes(school)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer justify-center py-2 hover:scale-105 transition-transform"
                      onClick={() => toggleFilter("schools", school)}
                    >
                      {school.split(" ")[0]}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Filter by Class Year (Optional)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CLASS_YEARS.map((year) => (
                    <Badge
                      key={year}
                      variant={
                        filters.classYears.includes(year.toString())
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer justify-center py-2 hover:scale-105 transition-transform"
                      onClick={() =>
                        toggleFilter("classYears", year.toString())
                      }
                    >
                      {year}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={enterQueue}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Enter Queue
            </Button>
          </div>
        ) : (
          <div className="bg-card/50 backdrop-blur-sm p-8 rounded-2xl shadow-card border border-border/50 space-y-6 animate-scale-in text-center">
            <Loader2 className="w-16 h-16 text-gold mx-auto animate-spin" />
            <div>
              <h2 className="text-2xl font-bold font-serif mb-2">
                Finding Your Match...
              </h2>
              <p className="text-muted-foreground">
                This usually takes just a few seconds
              </p>
            </div>

            {filters.schools.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Filtering by schools:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {filters.schools.map((school) => (
                    <Badge key={school} variant="outline">
                      {school.split(" ")[0]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button variant="destructive" onClick={leaveQueue}>
              Leave Queue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Queue;