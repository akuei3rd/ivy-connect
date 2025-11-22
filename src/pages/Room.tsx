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
  MessageCircle,
  Send,
  UserPlus,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      loadOtherUserProfile();
      checkConnectionStatus();
      subscribeToChat();
    }
  }, [match, userId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const loadOtherUserProfile = async () => {
    if (!match || !userId) return;
    
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", otherUserId)
      .single();
    
    if (data) {
      setOtherUserProfile(data);
    }
  };

  const checkConnectionStatus = async () => {
    if (!match || !userId) return;
    
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
    
    const { data } = await supabase
      .from("connections")
      .select("*")
      .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
      .single();
    
    if (data) {
      setConnectionStatus(data.status);
    }
  };

  const subscribeToChat = () => {
    if (!match) return;

    const channel = supabase
      .channel(`chat:${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const handleConnect = async () => {
    if (!match || !userId) return;
    
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
    
    const { error } = await supabase.from("connections").insert({
      user1_id: userId,
      user2_id: otherUserId,
      status: "accepted", // Auto-accept for MVP
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to connect",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus("accepted");
    toast({
      title: "Connected!",
      description: `You're now connected with ${otherUserProfile?.full_name}`,
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !match || !userId) return;

    const { error } = await supabase.from("chat_messages").insert({
      match_id: match.id,
      sender_id: userId,
      message: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
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
    <div className="min-h-screen gradient-dark flex flex-col p-4">
      <div className="max-w-7xl mx-auto w-full flex-1 flex gap-4">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-card/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50 flex items-center gap-2">
                <Clock className="w-5 h-5 text-foreground" />
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              {connectionStatus === "accepted" ? (
                <Button variant="outline" size="sm" disabled>
                  <Check className="w-4 h-4 mr-2" />
                  Connected
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleConnect}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* Video Container - Split Screen */}
          <div
            ref={containerRef}
            className="flex-1 bg-card/50 backdrop-blur-sm rounded-2xl shadow-card border border-border/50 overflow-hidden min-h-[600px]"
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

            <Button 
              size="lg"
              variant="default"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-glow"
              onClick={handleNext}
            >
              <SkipForward className="w-5 h-5 mr-2" />
              Skip & Find Next
            </Button>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-card/50 backdrop-blur-sm rounded-2xl shadow-card border border-border/50 flex flex-col">
            <div className="p-4 border-b border-border/50">
              <h3 className="font-bold text-lg">Chat</h3>
              {otherUserProfile && (
                <p className="text-sm text-muted-foreground">
                  {otherUserProfile.full_name}
                </p>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_id === userId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg ${
                        msg.sender_id === userId
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="bg-background/50"
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
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