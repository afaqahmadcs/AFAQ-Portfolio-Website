-- ==============================================================================
-- SUPABASE MIGRATION: CONTACT INQUIRIES & MESSAGES PIPELINE
-- Author: Afaq Ahmad Portfolio
-- Date: 2026-10-24
-- Description:
--   1. Contact inquiries table storing all portfolio contact form submissions.
--   2. Strict validation constraints (name, email, subject, message).
--   3. Row Level Security (RLS) allowing anonymous public inserts.
--   4. Admin-only read/write access for Afaq Ahmad.
-- ==============================================================================

-- 1. Create Contact Inquiries Table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(30) NOT NULL UNIQUE,
    client_name VARCHAR(120) NOT NULL CONSTRAINT chk_inq_name_len CHECK (char_length(trim(client_name)) >= 2),
    email VARCHAR(255) NOT NULL CONSTRAINT chk_inq_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    subject VARCHAR(200) NOT NULL CONSTRAINT chk_inq_subject_len CHECK (char_length(trim(subject)) >= 3),
    message TEXT NOT NULL CONSTRAINT chk_inq_msg_len CHECK (char_length(trim(message)) >= 10),
    service_tag VARCHAR(80) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'unread' CONSTRAINT chk_inq_status CHECK (status IN ('unread', 'in_progress', 'replied', 'archived')),
    ip_hash VARCHAR(64) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_ref ON public.contact_inquiries(reference_id);

-- Automatic updated_at trigger
DROP TRIGGER IF EXISTS trg_contact_inquiries_updated_at ON public.contact_inquiries;
CREATE TRIGGER trg_contact_inquiries_updated_at
    BEFORE UPDATE ON public.contact_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- 3. Public Insert Policy: Anyone can submit an inquiry
DROP POLICY IF EXISTS "Allow public to submit contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow public to submit contact inquiries"
    ON public.contact_inquiries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        char_length(trim(client_name)) >= 2 AND
        char_length(trim(subject)) >= 3 AND
        char_length(trim(message)) >= 10 AND
        status = 'unread'
    );

-- 4. Admin Only Policies: Afaq can view, update, and manage all inquiries
DROP POLICY IF EXISTS "Admins can view contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can view contact inquiries"
    ON public.contact_inquiries
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can update contact inquiries"
    ON public.contact_inquiries
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can delete contact inquiries"
    ON public.contact_inquiries
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

COMMENT ON TABLE public.contact_inquiries IS 'Stores client contact inquiries submitted from the portfolio website.';
