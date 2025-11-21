import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Users, Video, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    checkAuth();
    loadConnections();
    loadMatchCount();
  }, []);

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

    if (!profileData) {
      navigate("/profile");
      return;
    }

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
        user1:profiles!connections_user1_id_fkey(full_name, school, major),
        user2:profiles!connections_user2_id_fkey(full_name, school, major)
      `)
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    setConnections(data || []);
  };

  const loadMatchCount = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { count } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);

    setMatchCount(count || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!profile) return null;

  const getConnectionPartner = (connection: any) => {
    return connection.user1_id === profile.id
      ? connection.user2
      : connection.user1;
  };

  return (
    <div className="min-h-screen gradient-ivy p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <p className="text-muted-foreground">
                {profile.major} • Class of {profile.class_year}
              </p>
              <p className="text-sm text-muted-foreground">{profile.school}</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/queue")}>
              <Video className="w-4 h-4 mr-2" />
              Start Matching
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connections.length}</p>
                <p className="text-sm text-muted-foreground">Connections</p>
              </div>
            </div>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Video className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{matchCount}</p>
                <p className="text-sm text-muted-foreground">Total Matches</p>
              </div>
            </div>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-lg">
                <User className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {profile.interests?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Interests</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Connections List */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
          <h3 className="text-xl font-bold mb-4">Your Connections</h3>
          {connections.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No connections yet. Start matching to build your network!
            </p>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => {
                const partner = getConnectionPartner(connection);
                return (
                  <div
                    key={connection.id}
                    className="flex items-center gap-4 p-4 bg-background/50 rounded-lg hover:bg-background/70 transition-colors"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {partner.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{partner.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {partner.major} • {partner.school}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
