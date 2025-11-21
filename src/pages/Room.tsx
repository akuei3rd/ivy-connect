import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  SkipForward,
  AlertTriangle,
  Clock,
  Plus,
} from "lucide-react";
import DailyIframe from "@daily-co/daily-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [match, setMatch] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [extended, setExtended] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (match && userId) {
      initializeCall();
    }
  }, [match, userId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    // Get match details
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .eq("room_id", roomId)
      .eq("status", "active")
      .single();

    if (!matchData) {
      toast({
        title: "Match not found",
        description: "Redirecting to queue...",
        variant: "destructive",
      });
      navigate("/queue");
      return;
    }

    setMatch(matchData);
  };

  const initializeCall = async () => {
    if (!containerRef.current) return;

    try {
      // Create Daily.co room
      const { data, error } = await supabase.functions.invoke("create-daily-room", {
        body: { roomName: roomId },
      });

      if (error || !data?.data?.url) {
        throw new Error(error?.message || "Failed to create room");
      }

      // Initialize Daily iframe
      callFrameRef.current = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "1rem",
        },
        showLeaveButton: false,
        showFullscreenButton: true,
      });

      await callFrameRef.current.join({ url: data.data.url });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to start video call",
        variant: "destructive",
      });
    }
  };

  const extendTime = () => {
    setTimeLeft(timeLeft + 60);
    setExtended(true);
    toast({
      title: "Time Extended",
      description: "+60 seconds added",
    });
  };

  const handleNext = async () => {
    // End current match
    await supabase
      .from("matches")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", match.id);

    if (callFrameRef.current) {
      await callFrameRef.current.leave();
      callFrameRef.current.destroy();
    }

    toast({
      title: "Finding new match...",
    });

    navigate("/queue");
  };

  const handleReport = async () => {
    const reportedUserId =
      match.user1_id === userId ? match.user2_id : match.user1_id;

    await supabase.from("reports").insert([{
      reporter_id: userId!,
      reported_user_id: reportedUserId,
      match_id: match.id,
      reason: reportReason,
    }]);

    toast({
      title: "Report submitted",
      description: "Thank you for helping keep ProTV safe",
    });

    setShowReport(false);
    setReportReason("");
    handleNext();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen gradient-ivy flex flex-col p-4">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-card/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              <span className="text-xl font-bold font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>
            {!extended && timeLeft <= 30 && (
              <Button variant="outline" size="sm" onClick={extendTime}>
                <Plus className="w-4 h-4 mr-2" />
                Extend +60s
              </Button>
            )}
          </div>
        </div>

        {/* Video Container */}
        <div
          ref={containerRef}
          className="flex-1 bg-card/50 backdrop-blur-sm rounded-2xl shadow-card border border-border/50 overflow-hidden min-h-[500px]"
        />

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => setShowReport(true)}
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Report User
          </Button>

          <Button variant="hero" size="lg" onClick={handleNext}>
            <SkipForward className="w-5 h-5 mr-2" />
            Next Match
          </Button>
        </div>
      </div>

      {/* Report Dialog */}
      <AlertDialog open={showReport} onOpenChange={setShowReport}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Report User</AlertDialogTitle>
            <AlertDialogDescription>
              Please tell us why you're reporting this user. This helps us keep
              ProTV safe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Describe the issue..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="min-h-[100px] bg-background/50"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReport} disabled={!reportReason}>
              Submit Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Room;