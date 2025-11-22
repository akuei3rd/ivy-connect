import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Briefcase, Users, Calendar, TrendingUp, Eye, CheckCircle } from "lucide-react";

interface OverviewProps {
  companyId: string;
}

export function Overview({ companyId }: OverviewProps) {
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    upcomingSessions: 0,
    viewedApplications: 0,
  });

  useEffect(() => {
    if (companyId) loadStats();
  }, [companyId]);

  const loadStats = async () => {
    const [jobsRes, appsRes, sessionsRes] = await Promise.all([
      supabase.from("job_postings").select("status", { count: "exact" }).eq("company_id", companyId),
      supabase.from("job_applications").select("status, viewed_at", { count: "exact" }).eq("job_id", companyId),
      supabase.from("hiring_sessions").select("status", { count: "exact" }).eq("company_id", companyId).eq("status", "upcoming"),
    ]);

    const jobs = jobsRes.data || [];
    const apps = appsRes.data || [];

    setStats({
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === "active").length,
      totalApplications: apps.length,
      pendingApplications: apps.filter(a => a.status === "pending").length,
      upcomingSessions: sessionsRes.data?.length || 0,
      viewedApplications: apps.filter(a => a.viewed_at).length,
    });
  };

  const statCards = [
    { label: "Active Jobs", value: stats.activeJobs, total: stats.totalJobs, icon: Briefcase, color: "text-blue-500" },
    { label: "Total Applications", value: stats.totalApplications, icon: Users, color: "text-green-500" },
    { label: "Pending Review", value: stats.pendingApplications, icon: Eye, color: "text-orange-500" },
    { label: "Upcoming Sessions", value: stats.upcomingSessions, icon: Calendar, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Analytics Overview</h2>
        <p className="text-muted-foreground">Track your recruitment performance and candidate engagement</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-6 bg-card border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                {stat.total !== undefined && (
                  <p className="text-sm text-muted-foreground">/ {stat.total}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-xl font-semibold text-foreground mb-4">Quick Insights</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
            <CheckCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Application Response Rate</p>
              <p className="text-sm text-muted-foreground">
                {stats.totalApplications > 0 
                  ? `${Math.round((stats.viewedApplications / stats.totalApplications) * 100)}% of applications reviewed`
                  : "No applications yet"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
            <Calendar className="w-5 h-5 text-secondary" />
            <div>
              <p className="font-medium text-foreground">Hiring Activity</p>
              <p className="text-sm text-muted-foreground">
                {stats.upcomingSessions} upcoming video interview sessions scheduled
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
