import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Building2, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AppHeader } from "@/components/AppHeader";

export default function HiringSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from("hiring_sessions")
      .select(`
        *,
        companies (
          id,
          name,
          logo_url,
          industry
        ),
        job_postings (
          id,
          title
        )
      `)
      .in("status", ["upcoming", "in_progress"])
      .gte("session_date", new Date().toISOString())
      .order("session_date", { ascending: true });

    if (!error && data) {
      setSessions(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AppHeader title="Hiring Sessions" showBackButton backTo="/home" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-6">Connect with employers through live video interviews</p>

        <div className="grid gap-6">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="p-6 border-border bg-card hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {session.companies?.logo_url ? (
                    <img
                      src={session.companies.logo_url}
                      alt={session.companies.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-primary" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-1">{session.title}</h3>
                      <p className="text-lg text-muted-foreground font-medium">{session.companies?.name}</p>
                    </div>
                    <Badge variant="secondary">
                      <Video className="w-3 h-3 mr-1" />
                      Virtual
                    </Badge>
                  </div>

                  {session.job_postings && (
                    <p className="text-foreground mb-3">
                      Position: <span className="font-medium">{session.job_postings.title}</span>
                    </p>
                  )}

                  <p className="text-foreground mb-4">{session.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(session.session_date), "MMMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(session.session_date), "h:mm a")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.slot_duration_minutes} min per interview
                    </span>
                    {session.max_candidates && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Max {session.max_candidates} candidates
                      </span>
                    )}
                  </div>

                  <Button onClick={() => navigate(`/hiring-sessions/${session.id}`)}>
                    View Details & Register
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground">Check back later for new hiring sessions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
