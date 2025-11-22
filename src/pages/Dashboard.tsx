import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { BarChart3, Briefcase, Users, Calendar, Building2, Settings } from "lucide-react";
import { Overview } from "@/components/dashboard/Overview";
import { JobPostings } from "@/components/dashboard/JobPostings";
import { Applications } from "@/components/dashboard/Applications";
import { HiringSessionsManager } from "@/components/dashboard/HiringSessionsManager";
import { CompanyProfile } from "@/components/dashboard/CompanyProfile";
import { TeamManagement } from "@/components/dashboard/TeamManagement";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [isEmployer, setIsEmployer] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user is an employer
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "employer")
      .single();

    if (!roles) {
      navigate("/home");
      return;
    }

    setIsEmployer(true);

    // Load company
    const { data: companyData } = await supabase
      .from("companies")
      .select("*")
      .eq("created_by", session.user.id)
      .single();

    setCompany(companyData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isEmployer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Employer Dashboard</h1>
                {company && <p className="text-sm text-muted-foreground">{company.name}</p>}
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/home")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Overview companyId={company?.id} />
          </TabsContent>

          <TabsContent value="jobs">
            <JobPostings companyId={company?.id} userId={user?.id} />
          </TabsContent>

          <TabsContent value="applications">
            <Applications companyId={company?.id} />
          </TabsContent>

          <TabsContent value="sessions">
            <HiringSessionsManager companyId={company?.id} userId={user?.id} />
          </TabsContent>

          <TabsContent value="company">
            <CompanyProfile company={company} onUpdate={checkAuth} />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement companyId={company?.id} userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
