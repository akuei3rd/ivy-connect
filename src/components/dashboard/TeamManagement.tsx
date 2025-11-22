import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TeamManagementProps {
  companyId: string;
  userId: string;
}

export function TeamManagement({ companyId, userId }: TeamManagementProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (companyId) loadMembers();
  }, [companyId]);

  const loadMembers = async () => {
    const { data } = await supabase
      .from("company_members")
      .select(`
        *,
        profiles!company_members_user_id_fkey(full_name, email)
      `)
      .eq("company_id", companyId);

    setMembers(data || []);
  };

  const inviteMember = async () => {
    if (!email.trim()) return;

    // Find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile) {
      toast.error("User not found with this email");
      return;
    }

    const { error } = await supabase
      .from("company_members")
      .insert({
        company_id: companyId,
        user_id: profile.id,
        invited_by: userId,
      });

    if (error) {
      toast.error("Failed to invite member");
    } else {
      toast.success("Team member invited successfully");
      setEmail("");
      loadMembers();
    }
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase
      .from("company_members")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove member");
    } else {
      toast.success("Member removed successfully");
      loadMembers();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Team Management</h2>
        <p className="text-muted-foreground">Manage recruiters and team members</p>
      </div>

      <Card className="p-6 bg-card border-border">
        <h3 className="font-semibold text-foreground mb-4">Invite Team Member</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
            />
          </div>
          <Button onClick={inviteMember} className="gap-2 self-end">
            <UserPlus className="w-4 h-4" />
            Invite
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {members.map((member) => (
          <Card key={member.id} className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground">{member.profiles.full_name}</h4>
                <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{member.role}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeMember(member.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {members.length === 0 && (
          <Card className="p-12 text-center bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-2">No team members yet</h3>
            <p className="text-muted-foreground">Invite colleagues to help manage recruitment</p>
          </Card>
        )}
      </div>
    </div>
  );
}
