import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, DollarSign, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { CreateJobForm } from "./CreateJobForm";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface JobPostingsProps {
  companyId: string;
  userId: string;
}

export function JobPostings({ companyId, userId }: JobPostingsProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) loadJobs();
  }, [companyId]);

  const loadJobs = async () => {
    const { data } = await supabase
      .from("job_postings")
      .select(`
        *,
        job_applications(count)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    setJobs(data || []);
  };

  const handleDelete = async () => {
    if (!deleteJobId) return;

    const { error } = await supabase
      .from("job_postings")
      .delete()
      .eq("id", deleteJobId);

    if (error) {
      toast.error("Failed to delete job");
    } else {
      toast.success("Job deleted successfully");
      loadJobs();
    }
    setDeleteJobId(null);
  };

  const toggleVisibility = async (job: any) => {
    const newVisibility = job.visibility === "public" ? "invite-only" : "public";
    
    const { error } = await supabase
      .from("job_postings")
      .update({ visibility: newVisibility })
      .eq("id", job.id);

    if (error) {
      toast.error("Failed to update visibility");
    } else {
      toast.success(`Job is now ${newVisibility}`);
      loadJobs();
    }
  };

  if (showCreateForm || editingJob) {
    return (
      <CreateJobForm
        companyId={companyId}
        userId={userId}
        job={editingJob}
        onClose={() => {
          setShowCreateForm(false);
          setEditingJob(null);
          loadJobs();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Job Postings</h2>
          <p className="text-muted-foreground">Create and manage your job openings</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Job
        </Button>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="p-6 bg-card border-border hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                  <Badge variant={job.status === "active" ? "default" : "secondary"}>
                    {job.status}
                  </Badge>
                  {job.visibility === "invite-only" && (
                    <Badge variant="outline" className="gap-1">
                      <EyeOff className="w-3 h-3" />
                      Invite Only
                    </Badge>
                  )}
                  {job.seniority_level && (
                    <Badge variant="secondary">{job.seniority_level}</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                  )}
                  {job.salary_range && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {job.salary_range}
                    </span>
                  )}
                  <span className="capitalize">{job.job_type}</span>
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })} • 
                  {' '}{job.job_applications?.[0]?.count || 0} applications
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleVisibility(job)}
                  title={job.visibility === "public" ? "Make invite-only" : "Make public"}
                >
                  {job.visibility === "public" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditingJob(job)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleteJobId(job.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {jobs.length === 0 && (
          <Card className="p-12 text-center bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">No jobs posted yet</h3>
            <p className="text-muted-foreground mb-4">Create your first job posting to start receiving applications</p>
            <Button onClick={() => setShowCreateForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Job
            </Button>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job? This action cannot be undone and all applications will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
