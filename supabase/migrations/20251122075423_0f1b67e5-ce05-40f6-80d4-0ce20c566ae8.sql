-- Create user roles system
CREATE TYPE public.user_role AS ENUM ('student', 'employer', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user roles"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  industry text,
  website text,
  logo_url text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view companies"
  ON public.companies FOR SELECT
  USING (true);

CREATE POLICY "Employers can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'employer'));

CREATE POLICY "Company creators can update their companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = created_by);

-- Job postings table
CREATE TABLE public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  job_type text DEFAULT 'full-time',
  salary_range text,
  requirements text[],
  posted_by uuid REFERENCES auth.users(id) NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs"
  ON public.job_postings FOR SELECT
  USING (status = 'active' OR auth.uid() = posted_by);

CREATE POLICY "Employers can create jobs for their companies"
  ON public.job_postings FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'employer') AND 
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND created_by = auth.uid())
  );

CREATE POLICY "Job posters can update their jobs"
  ON public.job_postings FOR UPDATE
  USING (auth.uid() = posted_by);

CREATE POLICY "Job posters can delete their jobs"
  ON public.job_postings FOR DELETE
  USING (auth.uid() = posted_by);

-- Job applications table
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_postings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  resume_url text,
  cover_letter text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, user_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Employers can view applications for their jobs"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_postings jp 
      WHERE jp.id = job_id AND jp.posted_by = auth.uid()
    )
  );

CREATE POLICY "Users can create applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can update application status"
  ON public.job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM job_postings jp 
      WHERE jp.id = job_id AND jp.posted_by = auth.uid()
    )
  );

-- Hiring sessions table
CREATE TABLE public.hiring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  session_date timestamptz NOT NULL,
  slot_duration_minutes integer DEFAULT 20,
  max_candidates integer,
  status text DEFAULT 'upcoming',
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.hiring_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upcoming sessions"
  ON public.hiring_sessions FOR SELECT
  USING (status IN ('upcoming', 'in_progress') OR auth.uid() = created_by);

CREATE POLICY "Employers can create sessions for their companies"
  ON public.hiring_sessions FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'employer') AND
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND created_by = auth.uid())
  );

CREATE POLICY "Session creators can update their sessions"
  ON public.hiring_sessions FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Session creators can delete their sessions"
  ON public.hiring_sessions FOR DELETE
  USING (auth.uid() = created_by);

-- Session registrations table
CREATE TABLE public.session_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES hiring_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  resume_url text NOT NULL,
  cover_letter text,
  status text DEFAULT 'pending',
  registered_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations"
  ON public.session_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Employers can view registrations for their sessions"
  ON public.session_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hiring_sessions hs 
      WHERE hs.id = session_id AND hs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can register for sessions"
  ON public.session_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can update registration status"
  ON public.session_registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hiring_sessions hs 
      WHERE hs.id = session_id AND hs.created_by = auth.uid()
    )
  );

-- Session time slots for approved candidates
CREATE TABLE public.session_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES hiring_sessions(id) ON DELETE CASCADE NOT NULL,
  registration_id uuid REFERENCES session_registrations(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  room_url text,
  room_name text,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time slots"
  ON public.session_time_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_registrations sr 
      WHERE sr.id = registration_id AND sr.user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can view time slots for their sessions"
  ON public.session_time_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hiring_sessions hs 
      WHERE hs.id = session_id AND hs.created_by = auth.uid()
    )
  );

CREATE POLICY "Employers can create time slots"
  ON public.session_time_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hiring_sessions hs 
      WHERE hs.id = session_id AND hs.created_by = auth.uid()
    )
  );

CREATE POLICY "Employers can update time slots"
  ON public.session_time_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hiring_sessions hs 
      WHERE hs.id = session_id AND hs.created_by = auth.uid()
    )
  );

-- Storage buckets for resumes and company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('resumes', 'resumes', false),
  ('company-logos', 'company-logos', true);

-- RLS for resumes bucket
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Employers can view resumes from applications and registrations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND (
      EXISTS (
        SELECT 1 FROM job_applications ja
        JOIN job_postings jp ON jp.id = ja.job_id
        WHERE jp.posted_by = auth.uid() AND ja.resume_url = name
      ) OR
      EXISTS (
        SELECT 1 FROM session_registrations sr
        JOIN hiring_sessions hs ON hs.id = sr.session_id
        WHERE hs.created_by = auth.uid() AND sr.resume_url = name
      )
    )
  );

-- RLS for company logos bucket
CREATE POLICY "Anyone can view company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Employers can upload company logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-logos' AND
    public.has_role(auth.uid(), 'employer')
  );

CREATE POLICY "Employers can update their company logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM companies 
      WHERE created_by = auth.uid() AND logo_url = name
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hiring_sessions_updated_at
  BEFORE UPDATE ON public.hiring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();