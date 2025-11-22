import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, DollarSign, Briefcase, Building2, Upload, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    loadJob();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      checkIfApplied(user.id);
    }
  };

  const loadJob = async () => {
    const { data, error } = await supabase
      .from("job_postings")
      .select(`
        *,
        companies (
          id,
          name,
          logo_url,
          industry,
          description,
          website
        )
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      setJob(data);
    }
  };

  const checkIfApplied = async (userId: string) => {
    const { data } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    
    setHasApplied(!!data);
  };

  const handleApply = async () => {
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

      const { error: applicationError } = await supabase
        .from("job_applications")
        .insert({
          job_id: id,
          user_id: currentUserId,
          resume_url: fileName,
          cover_letter: coverLetter,
        });

      if (applicationError) throw applicationError;

      toast({ title: "Application submitted successfully!" });
      setHasApplied(true);
      setCoverLetter("");
      setResume(null);
    } catch (error: any) {
      toast({ title: "Error submitting application", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/jobs")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>

        <Card className="p-8 border-border bg-card mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {job.companies?.logo_url ? (
                <img
                  src={job.companies.logo_url}
                  alt={job.companies.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="w-10 h-10 text-primary" />
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{job.title}</h1>
              <p className="text-xl text-muted-foreground font-medium mb-4">{job.companies?.name}</p>
              
              <div className="flex flex-wrap gap-4 text-sm mb-4">
                {job.location && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                )}
                {job.salary_range && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    {job.salary_range}
                  </span>
                )}
                {job.companies?.industry && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    {job.companies.industry}
                  </span>
                )}
              </div>

              <Badge variant="secondary" className="capitalize">
                {job.job_type.replace("-", " ")}
              </Badge>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">Job Description</h2>
              <p className="text-foreground whitespace-pre-wrap">{job.description}</p>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Requirements</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground">
                  {job.requirements.map((req: string, index: number) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.companies?.description && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">About {job.companies.name}</h2>
                <p className="text-foreground">{job.companies.description}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8 border-border bg-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {hasApplied ? "You've already applied" : "Apply for this position"}
          </h2>

          {hasApplied ? (
            <p className="text-muted-foreground">
              Your application has been submitted. The hiring team will review it and get back to you soon.
            </p>
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
                  placeholder="Tell us why you're a great fit for this role..."
                  className="mt-2 min-h-[150px] bg-background border-border"
                />
              </div>

              <Button onClick={handleApply} disabled={loading || !resume} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
