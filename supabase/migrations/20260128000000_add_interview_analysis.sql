-- Add interview analysis columns using hybrid approach
-- This provides fast querying on core metrics while maintaining flexibility with JSONB

-- Add new columns for frequently queried fields ("hot" data)
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS interview_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS technical_competency_score DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS interview_decision TEXT 
  CHECK (interview_decision IN ('Advance', 'Reject', 'Needs Review')),
ADD COLUMN IF NOT EXISTS interview_confidence TEXT
  CHECK (interview_confidence IN ('Low', 'Medium', 'High')),
ADD COLUMN IF NOT EXISTS interview_analysis JSONB;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_applications_decision 
  ON applications(interview_decision) 
  WHERE interview_decision IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_score 
  ON applications(technical_competency_score) 
  WHERE technical_competency_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_status_decision 
  ON applications(status, interview_decision);

-- Add comment for documentation
COMMENT ON COLUMN applications.interview_analysis IS 
  'Stores detailed interview analysis including skill evaluations, strengths, weaknesses, and behavioral observations. Core metrics (score, decision) are in dedicated columns for fast querying.';

COMMENT ON COLUMN applications.technical_competency_score IS 
  'Overall technical competency score (1-10) from interview analysis. Indexed for fast filtering.';

COMMENT ON COLUMN applications.interview_decision IS 
  'Hiring recommendation: Advance, Reject, or Needs Review. Indexed for dashboard queries.';
