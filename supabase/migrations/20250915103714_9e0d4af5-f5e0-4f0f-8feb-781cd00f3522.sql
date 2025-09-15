-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('member', 'chapter_leader', 'administrator');

-- Create enum for metric types
CREATE TYPE public.metric_type AS ENUM ('participation', 'learning', 'activity', 'networking', 'trade');

-- Create enum for trade status
CREATE TYPE public.trade_status AS ENUM ('pending', 'paid', 'invoiced', 'failed');

-- Create chapters table
CREATE TABLE public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leader_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'member',
    chapter_id UUID REFERENCES public.chapters(id),
    business_name TEXT,
    business_description TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create metrics table for PLANT tracking
CREATE TABLE public.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES public.chapters(id) NOT NULL,
    metric_type metric_type NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table for business transactions
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES public.chapters(id) NOT NULL,
    amount NUMERIC NOT NULL,
    source_member_id UUID REFERENCES auth.users(id),
    beneficiary_member_id UUID REFERENCES auth.users(id),
    description TEXT,
    status trade_status DEFAULT 'pending',
    mpesa_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    amount NUMERIC NOT NULL,
    file_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$;

-- Create function to get user chapter
CREATE OR REPLACE FUNCTION public.get_user_chapter(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT chapter_id FROM public.profiles WHERE id = user_uuid;
$$;

-- RLS Policies for chapters
CREATE POLICY "Administrators can view all chapters"
ON public.chapters FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'administrator');

CREATE POLICY "Chapter leaders can view their chapter"
ON public.chapters FOR SELECT
TO authenticated
USING (leader_id = auth.uid() OR public.get_user_role(auth.uid()) = 'administrator');

CREATE POLICY "Members can view their chapter"
ON public.chapters FOR SELECT
TO authenticated
USING (id = public.get_user_chapter(auth.uid()) OR leader_id = auth.uid() OR public.get_user_role(auth.uid()) = 'administrator');

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Chapter leaders can view members in their chapter"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR 
    (chapter_id = public.get_user_chapter(auth.uid()) AND public.get_user_role(auth.uid()) = 'chapter_leader') OR
    public.get_user_role(auth.uid()) = 'administrator'
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- RLS Policies for metrics
CREATE POLICY "Users can view their own metrics"
ON public.metrics FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Chapter leaders can view chapter metrics"
ON public.metrics FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    (chapter_id = public.get_user_chapter(auth.uid()) AND public.get_user_role(auth.uid()) = 'chapter_leader') OR
    public.get_user_role(auth.uid()) = 'administrator'
);

CREATE POLICY "Users can insert their own metrics"
ON public.metrics FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND chapter_id = public.get_user_chapter(auth.uid()));

CREATE POLICY "Users can update their own metrics"
ON public.metrics FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for trades
CREATE POLICY "Users can view their related trades"
ON public.trades FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR 
    source_member_id = auth.uid() OR 
    beneficiary_member_id = auth.uid() OR
    (chapter_id = public.get_user_chapter(auth.uid()) AND public.get_user_role(auth.uid()) = 'chapter_leader') OR
    public.get_user_role(auth.uid()) = 'administrator'
);

CREATE POLICY "Users can insert trades"
ON public.trades FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND chapter_id = public.get_user_chapter(auth.uid()));

-- RLS Policies for invoices
CREATE POLICY "Users can view related invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.trades t 
        WHERE t.id = trade_id AND (
            t.user_id = auth.uid() OR 
            t.source_member_id = auth.uid() OR 
            t.beneficiary_member_id = auth.uid() OR
            (t.chapter_id = public.get_user_chapter(auth.uid()) AND public.get_user_role(auth.uid()) = 'chapter_leader') OR
            public.get_user_role(auth.uid()) = 'administrator'
        )
    )
);

-- RLS Policies for audit_logs
CREATE POLICY "Administrators can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'administrator');

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_chapters_updated_at
    BEFORE UPDATE ON public.chapters
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at
    BEFORE UPDATE ON public.metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'member'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_profiles_chapter_id ON public.profiles(chapter_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_metrics_user_id ON public.metrics(user_id);
CREATE INDEX idx_metrics_chapter_id ON public.metrics(chapter_id);
CREATE INDEX idx_metrics_date ON public.metrics(date);
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_chapter_id ON public.trades(chapter_id);
CREATE INDEX idx_trades_status ON public.trades(status);
CREATE INDEX idx_invoices_trade_id ON public.invoices(trade_id);

-- Insert sample data for testing
INSERT INTO public.chapters (id, name) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Nairobi Central Chapter'),
    ('00000000-0000-0000-0000-000000000002', 'Mombasa Chapter'),
    ('00000000-0000-0000-0000-000000000003', 'Kisumu Chapter');