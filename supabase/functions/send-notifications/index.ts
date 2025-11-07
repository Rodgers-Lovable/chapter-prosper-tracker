import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type:
    | "invoice"
    | "reminder"
    | "payment_confirmation"
    | "chapter_announcement";
  recipients: string[]; // email addresses
  data: any; // notification-specific data
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, recipients, data }: NotificationRequest = await req.json();

    console.log(
      `Sending ${type} notification to ${recipients.length} recipients`
    );

    let emailTemplate;
    let subject;

    switch (type) {
      case "invoice":
        subject = `PLANT Invoice ${data.invoiceNumber} - Payment Required`;
        emailTemplate = generateInvoiceEmail(data);
        break;
      case "reminder":
        subject = "PLANT Metrics Reminder - Update Your Progress";
        emailTemplate = generateReminderEmail(data);
        break;
      case "payment_confirmation":
        subject = "PLANT Payment Confirmation - Thank You";
        emailTemplate = generatePaymentConfirmationEmail(data);
        break;
      case "chapter_announcement":
        subject = data.subject || "PLANT Chapter Announcement";
        emailTemplate = generateChapterAnnouncementEmail(data);
        break;
      default:
        throw new Error("Invalid notification type");
    }

    // Log emails (placeholder - implement actual email sending via your preferred service)
    const emailPromises = recipients.map(async (email) => {
      try {
        // TODO: Implement actual email sending service
        console.log(`Sending ${type} email to ${email}`);
        console.log(`Subject: ${subject}`);

        // Simulate successful send
        return {
          email,
          success: true,
          messageId: `sim_${Date.now()}_${Math.random()}`,
        };
      } catch (error) {
        console.error(`Exception sending email to ${email}:`, error);
        return { email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // Log notification activity
    await supabaseClient.from("audit_logs").insert({
      action: "notification_sent",
      table_name: "notifications",
      new_values: {
        type,
        recipients_count: recipients.length,
        successful_count: successful,
        failed_count: failed,
      },
    });

    console.log(
      `Notification batch completed: ${successful} successful, ${failed} failed`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent: ${successful} successful, ${failed} failed`,
        results: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending notifications:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateInvoiceEmail(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">PLANT Metrics Trade Invoice</h2>
      <p>Dear ${data.memberName},</p>
      <p>Your trade declaration has been processed and an invoice has been generated.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Invoice Details</h3>
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Amount:</strong> KES ${Number(
          data.amount
        ).toLocaleString()}</p>
        <p><strong>Trade Description:</strong> ${data.description}</p>
        <p><strong>Due Date:</strong> ${data.dueDate}</p>
      </div>
      
      <h3>Payment Options</h3>
      <ol>
        <li>Use the MPESA STK Push sent to your phone</li>
        <li>Pay manually via MPESA Paybill: 522533, Account: PLANT</li>
        <li>Use invoice number ${data.invoiceNumber} as reference</li>
      </ol>
      
      <p style="margin-top: 30px;">Thank you for your participation in PLANT Metrics!</p>
      <p>Best regards,<br>PLANT Metrics Team</p>
    </div>
  `;
}

function generateReminderEmail(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">PLANT Metrics Reminder</h2>
      <p>Dear ${data.memberName},</p>
      <p>This is a friendly reminder to update your PLANT metrics for this ${
        data.period
      }.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Your Current Progress</h3>
        <p><strong>Participation:</strong> ${
          data.currentMetrics?.participation || 0
        }</p>
        <p><strong>Learning:</strong> ${data.currentMetrics?.learning || 0}</p>
        <p><strong>Activity:</strong> ${data.currentMetrics?.activity || 0}</p>
        <p><strong>Networking:</strong> ${
          data.currentMetrics?.networking || 0
        }</p>
        <p><strong>Trade:</strong> ${data.currentMetrics?.trade || 0}</p>
      </div>
      
      <p>Don't forget to log your business activities and track your networking progress!</p>
      <p><a href="${
        data.dashboardUrl
      }" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Update Metrics Now</a></p>
      
      <p style="margin-top: 30px;">Keep growing your business network!</p>
      <p>Best regards,<br>PLANT Metrics Team</p>
    </div>
  `;
}

function generatePaymentConfirmationEmail(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Payment Confirmed!</h2>
      <p>Dear ${data.memberName},</p>
      <p>Your payment has been successfully processed. Thank you!</p>
      
      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Payment Details</h3>
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Amount Paid:</strong> KES ${Number(
          data.amount
        ).toLocaleString()}</p>
        <p><strong>MPESA Reference:</strong> ${data.mpesaReference}</p>
        <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
      </div>
      
      <p>Your trade declaration is now complete and has been recorded in the system.</p>
      <p>You can view your transaction history in your dashboard.</p>
      
      <p style="margin-top: 30px;">Thank you for your business!</p>
      <p>Best regards,<br>PLANT Metrics Team</p>
    </div>
  `;
}

function generateChapterAnnouncementEmail(data: any): String {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Chapter Announcement</h2>
      <p>Dear Chapter Members,</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>${data.title}</h3>
        <div>${data.content}</div>
      </div>
      
      <p>From: ${data.senderName} (Chapter Leader)</p>
      <p>Date: ${new Date().toLocaleDateString()}</p>
      
      <p style="margin-top: 30px;">Best regards,<br>${
        data.chapterName
      } Chapter</p>
    </div>
  `;
}
