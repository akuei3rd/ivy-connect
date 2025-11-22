import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Plus } from "lucide-react";
import { format } from "date-fns";
import { CreateHiringSessionForm } from "./CreateHiringSessionForm";

interface HiringSessionsManagerProps {
  companyId: string;
  userId: string;
}

export function HiringSessionsManager({ companyId, userId }: HiringSessionsManagerProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (companyId) loadSessions();
  }, [companyId]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("hiring_sessions")
      .select(`
        *,
        session_registrations(count)
      `)
      .eq("company_id", companyId)
      .order("session_date", { ascending: false });

    setSessions(data || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Hiring Sessions</h2>
          <p className="text-muted-foreground">Manage video interview sessions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Hiring Session</DialogTitle>
            </DialogHeader>
            <CreateHiringSessionForm
              companyId={companyId}
              userId={userId}
              onSuccess={() => {
                setDialogOpen(false);
                loadSessions();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card
            key={session.id}
            className="p-6 bg-card border-border hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/dashboard/sessions/${session.id}`)}
          >
            <h3 className="text-xl font-semibold text-foreground mb-2">{session.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{session.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(session.session_date), "PPP")}
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {session.session_registrations?.[0]?.count || 0} registrations
              </span>
            </div>
          </Card>
        ))}

        {sessions.length === 0 && (
          <Card className="p-12 text-center bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-2">No hiring sessions yet</h3>
            <p className="text-muted-foreground mb-4">Create sessions for video interviews with candidates</p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Hiring Session</DialogTitle>
                </DialogHeader>
                <CreateHiringSessionForm
                  companyId={companyId}
                  userId={userId}
                  onSuccess={() => {
                    setDialogOpen(false);
                    loadSessions();
                  }}
                />
              </DialogContent>
            </Dialog>
          </Card>
        )}
      </div>
    </div>
  );
}
