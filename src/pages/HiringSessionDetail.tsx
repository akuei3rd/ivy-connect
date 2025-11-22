import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Users, Building2, Upload, ArrowLeft, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function HiringSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [registration, setRegistration] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState<any>(null);

  useEffect(() => {
    loadSession();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      checkIfRegistered(user.id);
    }
  };

  const loadSession = async () => {
    const { data, error } = await supabase
      .from("hiring_sessions")
      .select(`
        *,
        companies (
          id,
          name,
          logo_url,
          industry,
          description
        ),
        job_postings (
          id,
          title,
          description
        )
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      setSession(data);
    }
  };

  const checkIfRegistered = async (userId: string) => {
    const { data: regData } = await supabase
      .from("session_registrations")
      .select("*")
      .eq("session_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    
    if (regData) {
      setHasRegistered(true);
      setRegistration(regData);

      // Check for time slot if approved
      if (regData.status === 'approved') {
        const { data: slotData } = await supabase
          .from("session_time_slots")
          .select("*")
          .eq("registration_id", regData.id)
          .maybeSingle();
        
        if (slotData) {
          setTimeSlot(slotData);
        }
      }
    }
  };

  const handleRegister = async () => {
    if (!resume) {
      toast({ title: "Please upload your resume", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const fileExt = resume.name.split('.').pop();
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resume);

      if (uploadError) throw uploadError;

      const { error: registrationError } = await supabase
        .from("session_registrations")
        .insert({
          session_id: id,
          user_id: currentUserId,
          resume_url: fileName,
          cover_letter: coverLetter,
        });

      if (registrationError) throw registrationError;

      toast({ title: "Registration submitted successfully! The company will review your application." });
      checkIfRegistered(currentUserId);
      setCoverLetter("");
      setResume(null);
    } catch (error: any) {
      toast({ title: "Error submitting registration", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const joinVideoCall = () => {
    if (timeSlot?.room_url) {
      window.open(timeSlot.room_url, '_blank');
    }
  };

  if (!session) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/hiring-sessions")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hiring Sessions
        </Button>

        <Card className="p-8 border-border bg-card mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {session.companies?.logo_url ? (
                <img
                  src={session.companies.logo_url}
                  alt={session.companies.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="w-10 h-10 text-primary" />
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{session.title}</h1>
              <p className="text-xl text-muted-foreground font-medium mb-4">{session.companies?.name}</p>
              
              <div className="flex flex-wrap gap-4 text-sm mb-4">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(session.session_date), "MMMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {format(new Date(session.session_date), "h:mm a")}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {session.slot_duration_minutes} min per interview
                </span>
                {session.max_candidates && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Max {session.max_candidates} candidates
                  </span>
                )}
              </div>

              <Badge variant="secondary">
                <Video className="w-3 h-3 mr-1" />
                Virtual Interview
              </Badge>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">About This Session</h2>
              <p className="text-foreground whitespace-pre-wrap">{session.description}</p>
            </div>

            {session.job_postings && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Position</h2>
                <p className="text-lg font-medium text-foreground mb-2">{session.job_postings.title}</p>
                <p className="text-foreground">{session.job_postings.description}</p>
              </div>
            )}

            {session.companies?.description && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">About {session.companies.name}</h2>
                <p className="text-foreground">{session.companies.description}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8 border-border bg-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {hasRegistered ? "Your Registration" : "Register for This Session"}
          </h2>

          {hasRegistered ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-foreground">Status:</span>
                <Badge variant={
                  registration.status === 'approved' ? 'default' : 
                  registration.status === 'rejected' ? 'destructive' : 
                  'secondary'
                }>
                  {registration.status}
                </Badge>
              </div>
              
              {registration.status === 'pending' && (
                <p className="text-muted-foreground">
                  Your registration is under review. The company will notify you once they've made a decision.
                </p>
              )}

              {registration.status === 'rejected' && (
                <p className="text-muted-foreground">
                  Unfortunately, your application was not selected for this session. Keep applying to other opportunities!
                </p>
              )}

              {registration.status === 'approved' && timeSlot && (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-foreground font-medium mb-2">🎉 Congratulations! You've been selected!</p>
                    <p className="text-muted-foreground mb-4">
                      Your interview is scheduled for {format(new Date(timeSlot.start_time), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                    <Button onClick={joinVideoCall} className="w-full">
                      <Video className="w-4 h-4 mr-2" />
                      Join Video Interview
                    </Button>
                  </div>
                </div>
              )}

              {registration.status === 'approved' && !timeSlot && (
                <p className="text-muted-foreground">
                  You've been approved! The company will assign you an interview time slot soon.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Label htmlFor="resume" className="text-foreground">Resume *</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                  className="mt-2 bg-background border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PDF or Word document (Max 5MB)
                </p>
              </div>

              <div>
                <Label htmlFor="coverLetter" className="text-foreground">Cover Letter (Optional)</Label>
                <Textarea
                  id="coverLetter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Why are you interested in this opportunity?"
                  className="mt-2 min-h-[150px] bg-background border-border"
                />
              </div>

              <Button onClick={handleRegister} disabled={loading || !resume} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                {loading ? "Submitting..." : "Submit Registration"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
