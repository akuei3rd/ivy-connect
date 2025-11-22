import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateJobFormProps {
  companyId: string;
  userId: string;
  job?: any;
  onClose: () => void;
}

export function CreateJobForm({ companyId, userId, job, onClose }: CreateJobFormProps) {
  const [formData, setFormData] = useState({
    title: job?.title || "",
    description: job?.description || "",
    location: job?.location || "",
    job_type: job?.job_type || "full-time",
    salary_range: job?.salary_range || "",
    seniority_level: job?.seniority_level || "",
    visibility: job?.visibility || "public",
    status: job?.status || "active",
  });
  
  const [requirements, setRequirements] = useState<string[]>(job?.requirements || []);
  const [skills, setSkills] = useState<string[]>(job?.skills || []);
  const [newRequirement, setNewRequirement] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const jobData = {
      ...formData,
      company_id: companyId,
      posted_by: userId,
      requirements: requirements.length > 0 ? requirements : null,
      skills: skills.length > 0 ? skills : null,
    };

    const { error } = job
      ? await supabase.from("job_postings").update(jobData).eq("id", job.id)
      : await supabase.from("job_postings").insert(jobData);

    if (error) {
      toast.error("Failed to save job");
    } else {
      toast.success(job ? "Job updated successfully" : "Job created successfully");
      onClose();
    }
    setLoading(false);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">
          {job ? "Edit Job Posting" : "Create New Job"}
        </h2>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 bg-card border-border">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and what makes it exciting..."
                rows={6}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Remote, New York, NY"
                />
              </div>

              <div>
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input
                  id="salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  placeholder="e.g. $100k - $150k"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="job_type">Job Type</Label>
                <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="seniority_level">Seniority Level</Label>
                <Select value={formData.seniority_level} onValueChange={(value) => setFormData({ ...formData, seniority_level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="principal">Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={formData.visibility} onValueChange={(value) => setFormData({ ...formData, visibility: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="invite-only">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Required Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a required skill"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Requirements</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <ul className="space-y-1">
                {requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                    <span>• {req}</span>
                    <button
                      type="button"
                      onClick={() => setRequirements(requirements.filter((_, i) => i !== idx))}
                      className="text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : job ? "Update Job" : "Create Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}
