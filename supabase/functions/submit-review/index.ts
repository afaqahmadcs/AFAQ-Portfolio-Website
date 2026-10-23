// ==============================================================================
// SUPABASE EDGE FUNCTION: submit-review
// Validates client review submissions, checks honeypot, and inserts as pending.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const {
      client_name,
      company,
      rating,
      review_text,
      project_reference,
      website_hp
    } = body;

    // 1. Honeypot check (anti-bot)
    if (website_hp && website_hp.trim().length > 0) {
      return new Response(JSON.stringify({ error: "Invalid submission" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Input validation
    const cleanName = (client_name || "").trim();
    const cleanCompany = (company || "").trim();
    const cleanText = (review_text || "").trim();
    const cleanRef = (project_reference || "").trim();
    const numRating = Number(rating);

    if (cleanName.length < 2 || cleanName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Client name must be between 2 and 100 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return new Response(
        JSON.stringify({ error: "Rating must be an integer between 1 and 5." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cleanText.length < 10 || cleanText.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Review feedback must be between 10 and 1,000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Connect to Supabase using public or service credentials securely
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 4. Insert directly with enforced 'pending' status
    const { error } = await supabase.from("reviews").insert([
      {
        client_name: cleanName,
        company: cleanCompany ? cleanCompany.slice(0, 100) : null,
        rating: numRating,
        review_text: cleanText,
        project_reference: cleanRef ? cleanRef.slice(0, 100) : null,
        status: "pending"
      }
    ]);

    if (error) {
      console.error("Database error inserting review:", error);
      return new Response(
        JSON.stringify({ error: "Unable to submit review. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Thanks for your feedback. Your review has been submitted for approval."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
