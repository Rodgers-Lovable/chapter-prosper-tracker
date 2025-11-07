import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  notificationType: string;
  recipientType: "all" | "chapter" | "role" | "custom";
  subject: string;
  message: string;
  chapterId?: string;
  role?: string;
  customEmails?: string[];
  scheduledFor?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user is admin
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "administrator") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: NotificationRequest = await req.json();
    const {
      notificationType,
      recipientType,
      subject,
      message,
      chapterId,
      role,
      customEmails,
      scheduledFor,
    } = body;

    console.log("Processing notification:", {
      notificationType,
      recipientType,
    });

    // Get recipients based on type
    let recipients: { email: string; full_name: string }[] = [];

    if (recipientType === "custom" && customEmails) {
      recipients = customEmails.map((email) => ({ email, full_name: email }));
    } else {
      let query = supabaseClient.from("profiles").select("email, full_name");

      if (recipientType === "chapter" && chapterId) {
        query = query.eq("chapter_id", chapterId);
      } else if (recipientType === "role" && role) {
        query = query.eq("role", role);
      }

      const { data, error } = await query;
      if (error) throw error;
      recipients = data || [];
    }

    console.log(`Found ${recipients.length} recipients`);

    // If scheduled, just log to history and return
    if (scheduledFor) {
      const { error: insertError } = await supabaseClient
        .from("notifications_history")
        .insert({
          notification_type: notificationType,
          subject,
          message,
          recipient_type: recipientType,
          recipient_count: recipients.length,
          sent_by: user.id,
          scheduled_for: scheduledFor,
          status: "scheduled",
          metadata: { chapterId, role },
        });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({
          success: true,
          scheduled: true,
          recipientCount: recipients.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send emails in batches
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const batchSize = 50;
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      for (const recipient of batch) {
        try {
          const personalizedMessage = message.replace(
            /{name}/g,
            recipient.full_name || recipient.email
          );

          await resend.emails.send({
            from: "MELNET <onboarding@resend.dev>",
            to: [recipient.email],
            subject,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">${subject}</h2>
                <div style="white-space: pre-wrap;">${personalizedMessage}</div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
                <p style="color: #666; font-size: 12px;">
                  This notification was sent from MELNET PLANT System
                </p>
              </div>
            `,
          });
          successCount++;
        } catch (error) {
          failCount++;
          errors.push(`${recipient.email}: ${error.message}`);
          console.error(`Failed to send to ${recipient.email}:`, error);
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Sent ${successCount} emails, ${failCount} failed`);

    // Log to notifications_history
    const { error: insertError } = await supabaseClient
      .from("notifications_history")
      .insert({
        notification_type: notificationType,
        subject,
        message,
        recipient_type: recipientType,
        recipient_count: successCount,
        sent_by: user.id,
        status: "sent",
        metadata: {
          chapterId,
          role,
          successCount,
          failCount,
          errors: errors.slice(0, 10), // Store first 10 errors
        },
      });

    if (insertError) {
      console.error("Failed to log notification:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-bulk-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
