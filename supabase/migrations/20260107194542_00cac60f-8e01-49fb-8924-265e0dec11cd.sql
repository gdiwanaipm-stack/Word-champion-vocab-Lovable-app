-- Create session feedback table
CREATE TABLE public.session_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  likes TEXT,
  improvements TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (supports anonymous users)
CREATE POLICY "Anyone can insert feedback"
ON public.session_feedback
FOR INSERT
WITH CHECK (true);

-- Users can view their own feedback if logged in
CREATE POLICY "Users can view their own feedback"
ON public.session_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for querying by date
CREATE INDEX idx_session_feedback_date ON public.session_feedback(session_date);