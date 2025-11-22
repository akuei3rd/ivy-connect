import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock } from "lucide-react";

interface CreateHiringSessionFormProps {
  companyId: string;
  userId: string;
  onSuccess: () => void;
}

export function CreateHiringSessionForm({ companyId, userId, onSuccess }: CreateHiringSessionFormProps) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    job_id: "",
    session_date: "",
    session_time: "",
    slot_duration_minutes: 20,
    max_candidates: 10,
  });

  useEffect(() => {
    loadJobs();
  }, [companyId]);

  const loadJobs = async () => {
    const { data } = await supabase
      .from("job_postings")
      .select("id, title")
      .eq("company_id", companyId)
      .eq("status", "active");
    setJobs(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const sessionDateTime = new Date(`${formData.session_date}T${formData.session_time}`);

      const { error } = await supabase.from("hiring_sessions").insert({
        company_id: companyId,
        created_by: userId,
        title: formData.title,
        description: formData.description,
        job_id: formData.job_id || null,
        session_date: sessionDateTime.toISOString(),
        slot_duration_minutes: formData.slot_duration_minutes,
        max_candidates: formData.max_candidates,
        status: "upcoming",
      });

      if (error) throw error;

      toast.success("Hiring session created successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create hiring session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Session Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Software Engineering Speed Interviews"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what candidates can expect from this session..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="job_id">Related Job Posting (Optional)</Label>
        <Select
          value={formData.job_id}
          onValueChange={(value) => setFormData({ ...formData, job_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a job posting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No specific job</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="session_date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Session Date *
          </Label>
          <Input
            id="session_date"
            type="date"
            value={formData.session_date}
            onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="session_time" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Start Time *
          </Label>
          <Input
            id="session_time"
            type="time"
            value={formData.session_time}
            onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="slot_duration">Slot Duration (minutes) *</Label>
          <Select
            value={String(formData.slot_duration_minutes)}
            onValueChange={(value) =>
              setFormData({ ...formData, slot_duration_minutes: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="20">20 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_candidates">Max Candidates *</Label>
          <Input
            id="max_candidates"
            type="number"
            min="1"
            max="50"
            value={formData.max_candidates}
            onChange={(e) =>
              setFormData({ ...formData, max_candidates: parseInt(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create Hiring Session"}
      </Button>
    </form>
  );
}
