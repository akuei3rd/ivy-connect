import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, MapPin, DollarSign, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { AppHeader } from "@/components/AppHeader";

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("job_postings")
      .select(`
        *,
        companies (
          id,
          name,
          logo_url,
          industry
        )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setJobs(data);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companies?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || job.job_type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AppHeader title="Find Your Dream Job" showBackButton backTo="/home" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-6">Explore opportunities from top companies</p>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search jobs, companies, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            {["all", "full-time", "part-time", "internship", "contract"].map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                onClick={() => setFilterType(type)}
                className="capitalize"
              >
                {type === "all" ? "All Jobs" : type.replace("-", " ")}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-border bg-card"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {job.companies?.logo_url ? (
                    <img
                      src={job.companies.logo_url}
                      alt={job.companies.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-primary" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">{job.title}</h3>
                      <p className="text-muted-foreground font-medium">{job.companies?.name}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {job.job_type.replace("-", " ")}
                    </Badge>
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
                    {job.companies?.industry && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.companies.industry}
                      </span>
                    )}
                  </div>

                  <p className="text-foreground line-clamp-2 mb-2">{job.description}</p>
                  
                  <p className="text-xs text-muted-foreground">
                    Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No jobs found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
