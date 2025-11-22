-- Add seniority level and visibility to job postings
ALTER TABLE job_postings 
ADD COLUMN seniority_level text,
ADD COLUMN visibility text DEFAULT 'public',
ADD COLUMN skills text[];

-- Add company members table for team management
CREATE TABLE company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'recruiter',
  permissions text[] DEFAULT ARRAY['view_applications', 'manage_jobs'],
  invited_by uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on company_members
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Policies for company_members
CREATE POLICY "Company creators can manage members"
ON company_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = company_members.company_id 
    AND companies.created_by = auth.uid()
  )
);

CREATE POLICY "Members can view their memberships"
ON company_members FOR SELECT
USING (auth.uid() = user_id);

-- Add application tracking fields
ALTER TABLE job_applications
ADD COLUMN notes text,
ADD COLUMN rating integer CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN interview_scheduled boolean DEFAULT false,
ADD COLUMN viewed_at timestamptz;

-- Create trigger for updated_at on company_members
CREATE TRIGGER update_company_members_updated_at
BEFORE UPDATE ON company_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();