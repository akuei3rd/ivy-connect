import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Video, Users, TrendingUp, Sparkles, User, LogOut } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [recentConnections, setRecentConnections] = useState<any[]>([]);
  const [stats, setStats] = useState({ connections: 0, matches: 0, queueSize: 0 });

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
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

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Load recent connections
    const { data: connectionsData } = await supabase
      .from("connections")
      .select(`
        *,
        user1:profiles!connections_user1_id_fkey(full_name, school, major),
        user2:profiles!connections_user2_id_fkey(full_name, school, major)
      `)
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentConnections(connectionsData || []);

    // Load stats
    const { count: connectionsCount } = await supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .eq("status", "accepted");

    const { count: matchesCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);

    const { count: queueCount } = await supabase
      .from("queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "waiting");

    setStats({
      connections: connectionsCount || 0,
      matches: matchesCount || 0,
      queueSize: queueCount || 0,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getConnectionPartner = (connection: any) => {
    return connection.user1_id === profile?.id ? connection.user2 : connection.user1;
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen gradient-ivy">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0s', animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '6s', animationDuration: '9s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gold" />
            <h1 className="text-2xl font-bold text-gradient">ProTV</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/home")}>Home</Button>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="ghost" onClick={() => navigate("/profile")}>
              <User className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleSignOut} size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
              <div className="text-center space-y-4">
                <Avatar className="w-20 h-20 mx-auto">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile.full_name.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{profile.full_name}</h2>
                  <p className="text-sm text-muted-foreground">{profile.major}</p>
                  <p className="text-xs text-muted-foreground">{profile.school}</p>
                </div>
                <div className="pt-4 border-t border-border/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Connections</span>
                    <span className="font-semibold text-gold">{stats.connections}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                Network Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Matches</span>
                  <span className="font-semibold">{stats.matches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Queue</span>
                  <span className="font-semibold">{stats.queueSize} users</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome back, {profile.full_name.split(" ")[0]}!</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  variant="gold" 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate("/queue")}
                >
                  <Video className="w-5 h-5 mr-2" />
                  Start Matching
                </Button>
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate("/dashboard")}
                >
                  <Users className="w-5 h-5 mr-2" />
                  View Dashboard
                </Button>
              </div>
            </Card>

            {/* Recent Connections */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" />
                Recent Connections
              </h3>
              {recentConnections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No connections yet</p>
                  <Button variant="outline" onClick={() => navigate("/queue")}>
                    Start Networking
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConnections.map((connection) => {
                    const partner = getConnectionPartner(connection);
                    return (
                      <div
                        key={connection.id}
                        className="flex items-center gap-4 p-4 bg-background/50 rounded-lg hover:bg-background/70 transition-all hover:scale-[1.02]"
                      >
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {partner.full_name.split(" ").map((n: string) => n[0]).join("")}
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
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate("/dashboard")}
                  >
                    View All Connections
                  </Button>
                </div>
              )}
            </Card>

            {/* Activity Feed Placeholder */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                What's Happening
              </h3>
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">Your network activity will appear here</p>
                <p className="text-sm">Start matching to build your Ivy League network!</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
