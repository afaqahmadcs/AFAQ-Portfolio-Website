-- ==============================================================================
-- SUPABASE MIGRATION: SECURE CLIENT REVIEW & MODERATION SYSTEM
-- Author: Afaq Ahmad Portfolio
-- Date: 2026-10-23
-- Description:
--   1. Reviews table with constraints and RLS.
--   2. Admin allowlist table with security definer helper function.
--   3. Public pending-only submission policy + admin-only moderation policies.
--   4. Secure stored procedure (RPC) with honeypot and input validation.
-- ==============================================================================

-- 1. Enable UUID generator extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(100) NOT NULL CONSTRAINT chk_client_name_len CHECK (char_length(trim(client_name)) >= 2),
    company VARCHAR(100) NULL,
    rating INTEGER NOT NULL CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5),
    review_text VARCHAR(1000) NOT NULL CONSTRAINT chk_review_text_len CHECK (char_length(trim(review_text)) >= 10),
    project_reference VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for public queries (approved reviews ordered by date)
CREATE INDEX IF NOT EXISTS idx_reviews_status_created_at ON public.reviews(status, created_at DESC);

-- Index for admin queue queries
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 3. Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create Admin Users Allowlist Table
-- Only authenticated users explicitly listed here can moderate reviews.
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Security Definer Function: Check if the calling authenticated user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    );
$$;

-- Allow only authenticated admins to query the admin_users allowlist
DROP POLICY IF EXISTS "Admins can view admin allowlist" ON public.admin_users;
CREATE POLICY "Admins can view admin allowlist"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 5. Row Level Security on reviews Table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy 5a: Public / Anonymous can ONLY read approved reviews
-- Prevents leakage of pending or rejected feedback
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
    ON public.reviews
    FOR SELECT
    TO public
    USING (status = 'approved');

-- Policy 5b: Public / Anonymous can submit reviews, but status MUST be 'pending'
-- Even if an attacker passes status='approved' directly in the REST API payload,
-- this WITH CHECK policy rejects the insert at the PostgreSQL engine level.
DROP POLICY IF EXISTS "Public can submit pending reviews" ON public.reviews;
CREATE POLICY "Public can submit pending reviews"
    ON public.reviews
    FOR INSERT
    TO public
    WITH CHECK (status = 'pending');

-- Policy 5c: Admins can view ALL reviews across all statuses (pending, approved, rejected)
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can view all reviews"
    ON public.reviews
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy 5d: Only authorized admins can update reviews (approve, reject, or edit status)
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
CREATE POLICY "Admins can update reviews"
    ON public.reviews
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policy 5e: Only authorized admins can delete reviews
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
CREATE POLICY "Admins can delete reviews"
    ON public.reviews
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 6. Secure Database RPC for Client Review Submission
-- Enforces server-side length constraints, sanitization, honeypot checking,
-- and guarantees status='pending'.
CREATE OR REPLACE FUNCTION public.submit_client_review(
    p_client_name TEXT,
    p_company TEXT,
    p_rating INTEGER,
    p_review_text TEXT,
    p_project_reference TEXT,
    p_honeypot TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_name TEXT;
    v_clean_company TEXT;
    v_clean_text TEXT;
    v_clean_ref TEXT;
    v_new_id UUID;
BEGIN
    -- Honeypot detection: if the hidden spam-trap input has any content, reject immediately
    IF p_honeypot IS NOT NULL AND length(trim(p_honeypot)) > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Spam detected'
        );
    END IF;

    -- Clean and trim values
    v_clean_name := trim(COALESCE(p_client_name, ''));
    v_clean_company := trim(COALESCE(p_company, ''));
    v_clean_text := trim(COALESCE(p_review_text, ''));
    v_clean_ref := trim(COALESCE(p_project_reference, ''));

    -- Validation checks
    IF length(v_clean_name) < 2 OR length(v_clean_name) > 100 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Client display name must be between 2 and 100 characters.'
        );
    END IF;

    IF p_rating < 1 OR p_rating > 5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Star rating must be between 1 and 5.'
        );
    END IF;

    IF length(v_clean_text) < 10 OR length(v_clean_text) > 1000 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Feedback text must be between 10 and 1,000 characters.'
        );
    END IF;

    IF length(v_clean_company) > 100 THEN
        v_clean_company := substring(v_clean_company, 1, 100);
    END IF;

    IF length(v_clean_ref) > 100 THEN
        v_clean_ref := substring(v_clean_ref, 1, 100);
    END IF;

    -- Insert record with guaranteed pending status
    INSERT INTO public.reviews (
        client_name,
        company,
        rating,
        review_text,
        project_reference,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_clean_name,
        NULLIF(v_clean_company, ''),
        p_rating,
        v_clean_text,
        NULLIF(v_clean_ref, ''),
        'pending',
        timezone('utc', now()),
        timezone('utc', now())
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Thanks for your feedback. Your review has been submitted for approval.'
    );
END;
$$;

-- Grant execution permission for RPC to both public (anon) and authenticated users
GRANT EXECUTE ON FUNCTION public.submit_client_review TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon, authenticated;
