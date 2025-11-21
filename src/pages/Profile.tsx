import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, LogOut } from "lucide-react";

const IVY_SCHOOLS = [
  "Princeton University",
  "Harvard University",
  "Yale University",
  "Columbia University",
  "Cornell University",
  "Dartmouth College",
  "Brown University",
  "University of Pennsylvania",
];

const CURRENT_YEAR = new Date().getFullYear();
const CLASS_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i - 1);

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    school: "",
    major: "",
    class_year: "",
    interests: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);
    setFormData((prev) => ({ ...prev, email: session.user.email || "" }));

    // Check if profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setHasProfile(true);
      setFormData({
        full_name: profile.full_name,
        email: profile.email,
        school: profile.school,
        major: profile.major,
        class_year: profile.class_year.toString(),
        interests: profile.interests?.join(", ") || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData = {
        id: userId!,
        email: formData.email,
        full_name: formData.full_name,
        school: formData.school as any,
        major: formData.major,
        class_year: parseInt(formData.class_year),
        interests: formData.interests
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert([profileData], { onConflict: "id" });

      if (error) throw error;

      toast({
        title: "Profile saved!",
        description: hasProfile ? "Your profile has been updated successfully" : "Welcome to ProTV!",
      });

      setTimeout(() => navigate(hasProfile ? "/home" : "/home"), 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen gradient-ivy flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-gold" />
            <h1 className="text-3xl font-bold font-serif text-gradient">
              ProTV
            </h1>
          </div>
          <Button variant="ghost" onClick={handleLogout} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="bg-card/50 backdrop-blur-sm p-8 rounded-2xl shadow-card border border-border/50 space-y-6 animate-scale-in">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-serif">
              {hasProfile ? "Update Your Profile" : "Complete Your Profile"}
            </h2>
            <p className="text-muted-foreground">
              Tell us about yourself to start connecting
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-background/30"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select
                  value={formData.school}
                  onValueChange={(value) =>
                    setFormData({ ...formData, school: value })
                  }
                  required
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {IVY_SCHOOLS.map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class_year">Class Year</Label>
                <Select
                  value={formData.class_year}
                  onValueChange={(value) =>
                    setFormData({ ...formData, class_year: value })
                  }
                  required
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                placeholder="Computer Science"
                value={formData.major}
                onChange={(e) =>
                  setFormData({ ...formData, major: e.target.value })
                }
                required
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">
                Interests (comma-separated)
              </Label>
              <Input
                id="interests"
                placeholder="AI, Entrepreneurship, Sports"
                value={formData.interests}
                onChange={(e) =>
                  setFormData({ ...formData, interests: e.target.value })
                }
                className="bg-background/50"
              />
            </div>

            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Saving..." : hasProfile ? "Update Profile" : "Save & Continue"}
              </Button>

              {hasProfile && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/home")}
                >
                  Back to Home
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;