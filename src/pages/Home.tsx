import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, Users, LogOut, TrendingUp, MessageSquare, Home as HomeIcon, Briefcase, Video as VideoIcon, Building2, UserSearch } from "lucide-react";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { NavLink } from "@/components/NavLink";

const Home = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [stats, setStats] = useState({ matches: 0, connections: 0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [isEmployer, setIsEmployer] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
    loadPosts();

    // Realtime subscription for posts
    const channel = supabase
      .channel("posts-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => loadPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    // Check if user is an employer
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "employer")
      .single();
    
    setIsEmployer(!!roles);
  };

  const loadPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select(`
        *,
        profiles!posts_user_id_fkey(full_name, school, major)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    setPosts(data || []);
  };

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
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

    setConnections(connectionsData || []);

    // Load stats
    const { count: matchCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);

    const { count: connectionCount } = await supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .eq("status", "accepted");

    setStats({ matches: matchCount || 0, connections: connectionCount || 0 });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getConnectionPartner = (connection: any) => {
    return connection.user1_id === profile?.id
      ? connection.user2
      : connection.user1;
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen gradient-dark">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-card/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-display font-bold text-gradient">ProTV</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/browse")}>
                <UserSearch className="w-4 h-4 mr-2" />
                Browse
              </Button>
              <Button variant="outline" onClick={() => navigate("/queue")}>
                <Video className="w-4 h-4 mr-2" />
                Match
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <NavLink to="/home" icon={<HomeIcon className="w-4 h-4" />}>Feed</NavLink>
            <NavLink to="/jobs" icon={<Briefcase className="w-4 h-4" />}>Jobs</NavLink>
            <NavLink to="/hiring-sessions" icon={<VideoIcon className="w-4 h-4" />}>Hiring Sessions</NavLink>
            {isEmployer && <NavLink to="/dashboard" icon={<Building2 className="w-4 h-4" />}>Dashboard</NavLink>}
            <NavLink to="/messages" icon={<MessageSquare className="w-4 h-4" />}>Messages</NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 p-6">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarFallback className="bg-foreground/10 text-foreground text-2xl">
                    {profile?.full_name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg">{profile?.full_name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {profile?.major} • Class of {profile?.class_year}
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.connections}</p>
                    <p className="text-xs text-muted-foreground">Connections</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.matches}</p>
                    <p className="text-xs text-muted-foreground">Matches</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50 p-6">
              <div className="flex items-center gap-2 text-foreground mb-3">
                <TrendingUp className="w-5 h-5" />
                <h4 className="font-semibold">Quick Actions</h4>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/queue")}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Start Matching
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/messages")}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </Button>
              </div>
            </Card>
          </div>

          {/* Center - Post Feed */}
          <div className="lg:col-span-2 space-y-6">
            {profile && <CreatePost profile={profile} onPostCreated={loadPosts} />}
            
            {posts.length === 0 ? (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 p-12 text-center">
                <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
              </Card>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} currentUserId={profile?.id} />)
            )}
          </div>

          {/* Right Sidebar - Recent Connections */}
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Connections
              </h3>
              {connections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No connections yet</p>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => {
                    const partner = getConnectionPartner(connection);
                    return (
                      <div
                        key={connection.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-foreground/10 text-foreground text-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
