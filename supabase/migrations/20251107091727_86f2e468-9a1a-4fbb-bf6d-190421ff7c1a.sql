-- Create reports_history table
CREATE TABLE public.reports_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  report_period TEXT NOT NULL,
  format TEXT NOT NULL,
  file_name TEXT NOT NULL,
  date_range JSONB,
  generated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  file_size TEXT
);

-- Enable RLS for reports_history
ALTER TABLE public.reports_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports_history
CREATE POLICY "Admins can view all reports" ON public.reports_history
  FOR SELECT USING (get_user_role(auth.uid()) = 'administrator');

CREATE POLICY "Admins can insert reports" ON public.reports_history
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'administrator');

-- Create notifications_history table
CREATE TABLE public.notifications_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_count INTEGER,
  sent_by UUID REFERENCES public.profiles(id),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  metadata JSONB
);

-- Enable RLS for notifications_history
ALTER TABLE public.notifications_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications_history
CREATE POLICY "Admins can view all notifications" ON public.notifications_history
  FOR SELECT USING (get_user_role(auth.uid()) = 'administrator');

CREATE POLICY "Admins can insert notifications" ON public.notifications_history
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'administrator');

-- Create notification_stats view for dashboard
CREATE OR REPLACE VIEW public.notification_stats AS
SELECT 
  DATE_TRUNC('month', sent_at) as month,
  COUNT(*) as total_sent,
  SUM(recipient_count) as total_recipients,
  notification_type
FROM public.notifications_history
WHERE status = 'sent'
GROUP BY DATE_TRUNC('month', sent_at), notification_type;