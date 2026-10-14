-- ============================================
-- FinePrint.legal — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- COMPANIES TABLE
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  tos_url TEXT,
  privacy_url TEXT,
  overall_grade CHAR(2),
  verdict TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'draft',
  last_analyzed_at TIMESTAMPTZ,
  tos_content_hash TEXT,
  analysis_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PENDING ANALYSES QUEUE
CREATE TABLE pending_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  company_name TEXT,
  source_url TEXT NOT NULL,
  overall_grade CHAR(2),
  verdict TEXT,
  analysis_json JSONB NOT NULL,
  submission_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  published_company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WALL OF SHAME CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT
);

-- Seed initial categories
INSERT INTO categories (slug, name, description, icon) VALUES
  ('invasive-data', 'Most Invasive Data Collection', 'Companies that collect far more data than necessary for their service', '🔍'),
  ('sneaky-renewal', 'Sneakiest Auto-Renewal', 'Auto-renewal terms designed to trap users into continued payments', '🔄'),
  ('ip-grab', 'Worst Content Licensing', 'Aggressive intellectual property claims over user content and feedback', '©️'),
  ('termination', 'Most Aggressive Termination', 'Companies that can delete your account and data without warning or reason', '🚫'),
  ('data-retention', 'Worst Data Retention', 'Keeping your data long after you leave, with no clear deletion process', '🗄️'),
  ('ai-clauses', 'Most Restrictive AI/ML Clauses', 'Either training AI on your data without consent, or blocking all AI interaction with their content', '🤖'),
  ('arbitration', 'Broadest Arbitration Waiver', 'Stripping your right to sue or join class actions', '⚖️');

-- WALL OF SHAME SUBMISSIONS
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_slug TEXT,
  company_id UUID REFERENCES companies(id),
  slug TEXT UNIQUE NOT NULL,
  source_url TEXT,
  clause_text TEXT NOT NULL,
  ai_explanation TEXT,
  category_id UUID REFERENCES categories(id),
  risk_level TEXT DEFAULT 'HIGH',
  submitted_by_ip_hash TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WALL OF SHAME VOTES
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  voter_ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, voter_ip_hash)
);

-- SHARE EVENTS
CREATE TABLE share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  page_slug TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_grade ON companies(overall_grade);
CREATE INDEX idx_pending_domain ON pending_analyses(domain);
CREATE INDEX idx_pending_status ON pending_analyses(status);
CREATE INDEX idx_pending_count ON pending_analyses(submission_count DESC);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_company ON submissions(company_slug);
CREATE INDEX idx_submissions_category ON submissions(category_id);
CREATE INDEX idx_submissions_upvotes ON submissions(upvotes DESC);
CREATE INDEX idx_votes_submission ON votes(submission_id);
CREATE INDEX idx_share_page ON share_events(page_type, page_slug);
CREATE INDEX idx_share_platform ON share_events(platform);
CREATE INDEX idx_share_created ON share_events(created_at);

-- RPC FUNCTION: increment upvotes
CREATE OR REPLACE FUNCTION increment_upvotes(submission_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE submissions
  SET upvotes = upvotes + 1, updated_at = NOW()
  WHERE id = submission_id_param;
END;
$$ LANGUAGE plpgsql;

-- ROW LEVEL SECURITY
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

-- Allow anon reads on categories (needed for submission form dropdown)
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT USING (true);

-- Allow anon reads on approved submissions (Wall of Shame public pages)
CREATE POLICY "Approved submissions are publicly readable"
  ON submissions FOR SELECT USING (status = 'approved');

-- Allow anon reads on published companies
CREATE POLICY "Published companies are publicly readable"
  ON companies FOR SELECT USING (status = 'published');

-- Allow anon inserts on share_events
CREATE POLICY "Anyone can track shares"
  ON share_events FOR INSERT WITH CHECK (true);

-- Allow anon reads on share_events (for count queries)
CREATE POLICY "Share events are publicly readable"
  ON share_events FOR SELECT USING (true);

-- Allow anon inserts on submissions (user submissions)
CREATE POLICY "Anyone can submit"
  ON submissions FOR INSERT WITH CHECK (true);

-- Allow anon inserts on votes
CREATE POLICY "Anyone can vote"
  ON votes FOR INSERT WITH CHECK (true);

-- Allow anon reads on votes (for checking existing votes)
CREATE POLICY "Votes are publicly readable"
  ON votes FOR SELECT USING (true);
