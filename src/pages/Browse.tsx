import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";

const Browse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
    loadProfiles();
    loadConnections();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = profiles.filter(
        (profile) =>
          profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.school.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchQuery, profiles]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);
  };

  const loadProfiles = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", session.user.id)
      .order("created_at", { ascending: false });

    setProfiles(data || []);
    setFilteredProfiles(data || []);
  };

  const loadConnections = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("connections")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .eq("status", "accepted");

    const connectedIds = new Set<string>();
    data?.forEach((conn) => {
      connectedIds.add(conn.user1_id === session.user.id ? conn.user2_id : conn.user1_id);
    });
    setConnections(connectedIds);
  };

  const handleConnect = async (profileId: string, fullName: string) => {
    if (!currentUserId) return;

    const { error } = await supabase.from("connections").insert({
      user1_id: currentUserId,
      user2_id: profileId,
      status: "accepted",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to connect",
        variant: "destructive",
      });
      return;
    }

    setConnections((prev) => new Set([...prev, profileId]));
    toast({
      title: "Connected!",
      description: `You're now connected with ${fullName}`,
    });
  };

  return (
    <div className="min-h-screen gradient-dark">
      <AppHeader title="Browse Profiles" showBackButton backTo="/home" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-6">Connect with students from Ivy League schools</p>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, major, or school..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-border/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="bg-card/80 backdrop-blur-sm border-border/50 p-6">
              <div className="text-center space-y-4">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarFallback className="bg-foreground/10 text-foreground text-2xl">
                    {profile.full_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-bold text-lg mb-1">{profile.full_name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {profile.major} • Class of {profile.class_year}
                  </p>
                  <p className="text-xs text-muted-foreground">{profile.school}</p>
                </div>

                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {profile.interests.slice(0, 3).map((interest: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  {connections.has(profile.id) ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="w-4 h-4 mr-2" />
                      Connected
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleConnect(profile.id, profile.full_name)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No profiles found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
