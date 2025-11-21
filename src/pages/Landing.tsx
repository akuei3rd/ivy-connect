import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, Sparkles } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/profile");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/profile");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-ivy flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Logo/Brand */}
          <div className="space-y-2">
            <div className="inline-block p-3 bg-card/50 rounded-2xl shadow-card backdrop-blur-sm">
              <Sparkles className="w-12 h-12 text-gold" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-gradient">
              ProTV
            </h1>
            <p className="text-xl md:text-2xl text-gold-light font-serif">
              The Ivy League Network
            </p>
          </div>

          {/* Value Proposition */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">
              Connect Instantly with Ivy League Peers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join exclusive 1-on-1 video conversations with students from the 8 Ivy League schools. 
              Network professionally, share insights, and build meaningful connections.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-xl shadow-card border border-border/50 hover:scale-105 transition-transform">
              <Users className="w-10 h-10 text-gold mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Instant Matching</h3>
              <p className="text-sm text-muted-foreground">
                Get paired with fellow Ivy Leaguers in seconds
              </p>
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-xl shadow-card border border-border/50 hover:scale-105 transition-transform">
              <Video className="w-10 h-10 text-gold mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Live Video Chat</h3>
              <p className="text-sm text-muted-foreground">
                Face-to-face conversations that build real connections
              </p>
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-xl shadow-card border border-border/50 hover:scale-105 transition-transform">
              <Sparkles className="w-10 h-10 text-gold mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Smart Filters</h3>
              <p className="text-sm text-muted-foreground">
                Match by school, major, or graduation year
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-8 space-y-4">
            <Button 
              variant="gold" 
              size="xl"
              onClick={() => navigate("/auth")}
              className="group"
            >
              Start Networking
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Exclusive to students with .edu email addresses
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/30">
        <p>© 2025 ProTV. Connecting the Ivy League.</p>
      </footer>
    </div>
  );
};

export default Landing;