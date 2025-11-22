import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    checkAuth();
    loadConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      loadMessages();
      const channel = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
          },
          () => loadMessages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConnection]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);
  };

  const loadConnections = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("connections")
      .select(`
        *,
        user1:profiles!connections_user1_id_fkey(id, full_name, school, major),
        user2:profiles!connections_user2_id_fkey(id, full_name, school, major)
      `)
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .eq("status", "accepted");

    setConnections(data || []);
  };

  const loadMessages = async () => {
    if (!selectedConnection || !profile) return;

    // Find match between current user and selected connection
    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .or(
        `and(user1_id.eq.${profile.id},user2_id.eq.${selectedConnection.id}),and(user1_id.eq.${selectedConnection.id},user2_id.eq.${profile.id})`
      )
      .maybeSingle();

    if (!match) return;

    const { data } = await supabase
      .from("chat_messages")
      .select(`
        *,
        profiles!chat_messages_sender_id_fkey(full_name)
      `)
      .eq("match_id", match.id)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConnection || !profile) return;

    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .or(
        `and(user1_id.eq.${profile.id},user2_id.eq.${selectedConnection.id}),and(user1_id.eq.${selectedConnection.id},user2_id.eq.${profile.id})`
      )
      .maybeSingle();

    if (!match) {
      toast({
        title: "No active match found",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("chat_messages").insert({
      match_id: match.id,
      sender_id: profile.id,
      message: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      loadMessages();
    }
  };

  const getConnectionPartner = (connection: any) => {
    return connection.user1_id === profile?.id ? connection.user2 : connection.user1;
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen gradient-dark">
      <AppHeader title="Messages" showBackButton backTo="/home" />
      
      <div className="max-w-6xl mx-auto p-4">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Connections List */}
          <Card className="bg-card/80 backdrop-blur-sm border-border p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Connections</h3>
            {connections.length === 0 ? (
              <p className="text-muted-foreground text-sm">No connections yet</p>
            ) : (
              <div className="space-y-2">
                {connections.map((connection) => {
                  const partner = getConnectionPartner(connection);
                  return (
                    <div
                      key={connection.id}
                      onClick={() => setSelectedConnection(partner)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConnection?.id === partner.id
                          ? "bg-foreground/10"
                          : "hover:bg-foreground/5"
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback className="bg-foreground/10 text-foreground">
                          {partner.full_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{partner.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{partner.major}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 bg-card/80 backdrop-blur-sm border-border flex flex-col">
            {selectedConnection ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-foreground/10 text-foreground">
                      {selectedConnection.full_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConnection.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedConnection.major} • {selectedConnection.school}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === profile.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_id === profile.id
                            ? "bg-foreground text-background"
                            : "bg-background/50 text-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="bg-background/50 border-border"
                  />
                  <Button onClick={sendMessage} className="bg-foreground text-background hover:bg-foreground/90">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a connection to start chatting
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
