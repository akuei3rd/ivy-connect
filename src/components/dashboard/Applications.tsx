import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Star, Calendar, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ApplicationsProps {
  companyId: string;
}

export function Applications({ companyId }: ApplicationsProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (companyId) loadApplications();
  }, [companyId]);

  const loadApplications = async () => {
    const { data } = await supabase
      .from("job_applications")
      .select(`
        *,
        job_postings!inner(title, company_id),
        profiles!inner(full_name, email, school, major, class_year)
      `)
      .eq("job_postings.company_id", companyId)
      .order("created_at", { ascending: false });

    setApplications(data || []);
  };

  const updateApplication = async (id: string, updates: any) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ ...updates, viewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update application");
    } else {
      toast.success("Application updated");
      loadApplications();
    }
  };

  const handleSelectApp = async (app: any) => {
    setSelectedApp(app);
    setNotes(app.notes || "");
    setRating(app.rating);
    
    if (!app.viewed_at) {
      await supabase
        .from("job_applications")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", app.id);
      loadApplications();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Application Pipeline</h2>
        <p className="text-muted-foreground">Review and manage candidate applications</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {applications.map((app) => (
            <Card
              key={app.id}
              className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
                selectedApp?.id === app.id ? "ring-2 ring-primary" : ""
              } ${!app.viewed_at ? "bg-primary/5" : "bg-card"}`}
              onClick={() => handleSelectApp(app)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{app.profiles.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{app.profiles.email}</p>
                </div>
                <Badge variant={app.status === "pending" ? "secondary" : "default"}>
                  {app.status}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                Applied to: {app.job_postings.title}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{app.profiles.school}</span>
                <span>{app.profiles.major}</span>
                <span>Class of {app.profiles.class_year}</span>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                {!app.viewed_at && " • New"}
              </p>
            </Card>
          ))}

          {applications.length === 0 && (
            <Card className="p-12 text-center bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-2">No applications yet</h3>
              <p className="text-muted-foreground">Applications will appear here once candidates start applying</p>
            </Card>
          )}
        </div>

        {selectedApp && (
          <Card className="p-6 bg-card sticky top-4 h-fit">
            <h3 className="text-xl font-bold text-foreground mb-4">Application Details</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Candidate</h4>
                <p className="text-sm">{selectedApp.profiles.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedApp.profiles.email}</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">Education</h4>
                <p className="text-sm">{selectedApp.profiles.school}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedApp.profiles.major} • Class of {selectedApp.profiles.class_year}
                </p>
              </div>

              {selectedApp.cover_letter && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Cover Letter</h4>
                  <p className="text-sm text-muted-foreground">{selectedApp.cover_letter}</p>
                </div>
              )}

              {selectedApp.resume_url && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(selectedApp.resume_url, "_blank")}
                >
                  <FileText className="w-4 h-4" />
                  View Resume
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </Button>
              )}

              <div>
                <h4 className="font-semibold text-foreground mb-2">Rating</h4>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => {
                        setRating(star);
                        updateApplication(selectedApp.id, { rating: star });
                      }}
                      className={`${rating && star <= rating ? "text-yellow-500" : "text-gray-300"}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Internal Notes</h4>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this candidate..."
                  rows={4}
                />
                <Button
                  onClick={() => updateApplication(selectedApp.id, { notes })}
                  className="mt-2 w-full"
                  size="sm"
                >
                  Save Notes
                </Button>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Status</h4>
                <Select
                  value={selectedApp.status}
                  onValueChange={(value) => updateApplication(selectedApp.id, { status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => updateApplication(selectedApp.id, { interview_scheduled: true })}
              >
                <Calendar className="w-4 h-4" />
                Schedule Interview
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
