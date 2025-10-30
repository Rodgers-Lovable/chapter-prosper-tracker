import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { userId, type, message } = await req.json();

    if (!userId || !type || !message) {
      throw new Error('User ID, type, and message are required');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User not found');
    }

    const subjectMap = {
      metrics: 'Reminder: Submit Your PLANT Metrics',
      payment: 'Reminder: Payment Due',
      general: 'Reminder from Your Chapter Leader'
    };

    // Send reminder email
    const { error: emailError } = await resend.emails.send({
      from: 'MELNET <onboarding@resend.dev>',
      to: [profile.email],
      subject: subjectMap[type as keyof typeof subjectMap] || 'Reminder',
      html: `
        <h1>Hello ${profile.full_name},</h1>
        <p>${message}</p>
        <p>Best regards,<br>Your Chapter Leader</p>
      `,
    });

    if (emailError) {
      throw emailError;
    }

    console.log(`Sent ${type} reminder to ${profile.email}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Reminder sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending reminder:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});