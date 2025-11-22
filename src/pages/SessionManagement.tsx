import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, Clock, Check, X, Video, ArrowLeft } from "lucide-react";

interface Registration {
  id: string;
  user_id: string;
  resume_url: string;
  cover_letter: string | null;
  status: string;
  registered_at: string;
  profiles: {
    full_name: string;
    email: string;
    school: string;
    major: string;
    class_year: number;
  };
  session_time_slots?: Array<{
    id: string;
    start_time: string;
    end_time: string;
    room_url: string | null;
    room_name: string | null;
  }>;
}

export default function SessionManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<Record<string, { start: string; end: string }>>({});

  useEffect(() => {
    loadSessionData();
  }, [id]);

  const loadSessionData = async () => {
    if (!id) return;

    const { data: sessionData } = await supabase
      .from("hiring_sessions")
      .select(`
        *,
        companies(name, logo_url),
        job_postings(title)
      `)
      .eq("id", id)
      .single();

    const { data: regsData } = await supabase
      .from("session_registrations")
      .select(`
        *,
        profiles(full_name, email, school, major, class_year),
        session_time_slots(id, start_time, end_time, room_url, room_name)
      `)
      .eq("session_id", id)
      .order("registered_at", { ascending: false });

    setSession(sessionData);
    setRegistrations(regsData || []);
    setLoading(false);
  };

  const updateRegistrationStatus = async (registrationId: string, status: string) => {
    const { error } = await supabase
      .from("session_registrations")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", registrationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update registration status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Registration ${status}`,
    });

    loadSessionData();
  };

  const assignTimeSlot = async (registrationId: string) => {
    const slot = timeSlots[registrationId];
    if (!slot?.start || !slot?.end) {
      toast({
        title: "Error",
        description: "Please set both start and end times",
        variant: "destructive",
      });
      return;
    }

    // Create Daily.co room
    const roomName = `session-${id}-${registrationId}-${Date.now()}`;
    const { data: roomData, error: roomError } = await supabase.functions.invoke(
      "create-daily-room",
      { body: { roomName } }
    );

    if (roomError || !roomData?.data?.url) {
      toast({
        title: "Error",
        description: "Failed to create video room",
        variant: "destructive",
      });
      return;
    }

    // Create time slot
    const { error } = await supabase
      .from("session_time_slots")
      .insert({
        session_id: id,
        registration_id: registrationId,
        start_time: slot.start,
        end_time: slot.end,
        room_name: roomName,
        room_url: roomData.data.url,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to assign time slot",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Time slot assigned and video room created",
    });

    setTimeSlots((prev) => {
      const updated = { ...prev };
      delete updated[registrationId];
      return updated;
    });

    loadSessionData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">{session?.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(session?.session_date), "PPP")}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {session?.slot_duration_minutes} min slots
            </span>
          </div>
        </div>

        <div className="grid gap-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Registrations ({registrations.length})
          </h2>

          {registrations.map((reg) => (
            <Card key={reg.id} className="bg-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{reg.profiles.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reg.profiles.school} • {reg.profiles.major} • Class of {reg.profiles.class_year}
                    </p>
                    <p className="text-sm text-muted-foreground">{reg.profiles.email}</p>
                  </div>
                  <Badge
                    variant={
                      reg.status === "approved"
                        ? "default"
                        : reg.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {reg.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {reg.cover_letter && (
                  <div>
                    <Label className="text-sm font-medium">Cover Letter</Label>
                    <p className="text-sm text-muted-foreground mt-1">{reg.cover_letter}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Resume</Label>
                  <a
                    href={reg.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block mt-1"
                  >
                    View Resume
                  </a>
                </div>

                {reg.session_time_slots && reg.session_time_slots.length > 0 ? (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Video className="w-4 h-4" />
                      Interview Scheduled
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(reg.session_time_slots[0].start_time), "PPP 'at' p")} -{" "}
                      {format(new Date(reg.session_time_slots[0].end_time), "p")}
                    </p>
                    {reg.session_time_slots[0].room_url && (
                      <a
                        href={reg.session_time_slots[0].room_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Video Room Link
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reg.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateRegistrationStatus(reg.id, "approved")}
                          className="gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateRegistrationStatus(reg.id, "rejected")}
                          variant="destructive"
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {reg.status === "approved" && (
                      <div className="space-y-3 p-4 bg-muted rounded-lg">
                        <Label className="text-sm font-medium">Assign Interview Time Slot</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Start Time</Label>
                            <Input
                              type="datetime-local"
                              value={timeSlots[reg.id]?.start || ""}
                              onChange={(e) =>
                                setTimeSlots((prev) => ({
                                  ...prev,
                                  [reg.id]: { ...prev[reg.id], start: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">End Time</Label>
                            <Input
                              type="datetime-local"
                              value={timeSlots[reg.id]?.end || ""}
                              onChange={(e) =>
                                setTimeSlots((prev) => ({
                                  ...prev,
                                  [reg.id]: { ...prev[reg.id], end: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <Button onClick={() => assignTimeSlot(reg.id)} className="w-full gap-2">
                          <Video className="w-4 h-4" />
                          Create Time Slot & Video Room
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {registrations.length === 0 && (
            <Card className="p-12 text-center bg-card">
              <p className="text-muted-foreground">No registrations yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
