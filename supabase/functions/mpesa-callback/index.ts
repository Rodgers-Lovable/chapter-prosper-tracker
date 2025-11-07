import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MpesaCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

serve(async (req) => {
  // Handle all methods including OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: MpesaCallbackPayload = await req.json();
    const callback = payload.Body.stkCallback;

    console.log("MPESA Callback received:", JSON.stringify(callback, null, 2));

    // Extract payment details
    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDescription = callback.ResultDesc;

    let mpesaReceiptNumber = null;
    let amount = null;
    let phoneNumber = null;
    let transactionDate = null;

    // If payment was successful, extract metadata
    if (resultCode === 0 && callback.CallbackMetadata) {
      const metadata = callback.CallbackMetadata.Item;

      mpesaReceiptNumber = metadata.find(
        (item) => item.Name === "MpesaReceiptNumber"
      )?.Value as string;
      amount = metadata.find((item) => item.Name === "Amount")?.Value as number;
      phoneNumber = metadata.find((item) => item.Name === "PhoneNumber")
        ?.Value as string;
      transactionDate = metadata.find((item) => item.Name === "TransactionDate")
        ?.Value as string;
    }

    // Find the payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*, invoice:invoices(*)")
      .eq("mpesa_checkout_request_id", checkoutRequestId)
      .single();

    if (paymentError || !payment) {
      console.error("Payment record not found:", paymentError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment record not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update payment status
    const paymentStatus = resultCode === 0 ? "success" : "failed";

    const { error: updatePaymentError } = await supabaseClient
      .from("payments")
      .update({
        status: paymentStatus,
        result_code: resultCode,
        result_description: resultDescription,
        mpesa_receipt_number: mpesaReceiptNumber,
        amount: amount || payment.amount,
        phone_number: phoneNumber || payment.phone_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      console.error("Error updating payment:", updatePaymentError);
      throw updatePaymentError;
    }

    // If payment was successful, update invoice and trade status
    if (resultCode === 0) {
      // Update invoice status
      const { error: invoiceUpdateError } = await supabaseClient
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.invoice_id);

      if (invoiceUpdateError) {
        console.error("Error updating invoice:", invoiceUpdateError);
      }

      // Update trade status
      const { error: tradeUpdateError } = await supabaseClient
        .from("trades")
        .update({
          status: "completed",
          mpesa_reference: mpesaReceiptNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.invoice.trade_id);

      if (tradeUpdateError) {
        console.error("Error updating trade:", tradeUpdateError);
      }

      // Get user details for notification
      const { data: trade } = await supabaseClient
        .from("trades")
        .select(
          `
          *,
          user:profiles!trades_user_id_fkey(full_name, email, business_name)
        `
        )
        .eq("id", payment.invoice.trade_id)
        .single();

      // Send payment confirmation notification
      if (trade?.user?.email) {
        try {
          await supabaseClient.functions.invoke("send-notifications", {
            body: {
              type: "payment_confirmation",
              recipients: [trade.user.email],
              data: {
                memberName: trade.user.full_name || trade.user.email,
                invoiceNumber: payment.invoice.invoice_number,
                amount: amount || payment.amount,
                mpesaReference: mpesaReceiptNumber,
                paymentDate: new Date(
                  transactionDate || Date.now()
                ).toLocaleDateString(),
              },
            },
          });
        } catch (notificationError) {
          console.error(
            "Error sending payment confirmation notification:",
            notificationError
          );
        }
      }

      console.log(
        `Payment successful for CheckoutRequestID: ${checkoutRequestId}, Receipt: ${mpesaReceiptNumber}`
      );
    } else {
      console.log(
        `Payment failed for CheckoutRequestID: ${checkoutRequestId}, Reason: ${resultDescription}`
      );
    }

    // Log the transaction
    await supabaseClient.from("audit_logs").insert({
      action: "mpesa_callback_processed",
      table_name: "payments",
      new_values: {
        checkout_request_id: checkoutRequestId,
        result_code: resultCode,
        result_description: resultDescription,
        mpesa_receipt: mpesaReceiptNumber,
        status: paymentStatus,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Callback processed successfully",
        resultCode: resultCode,
        status: paymentStatus,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing MPESA callback:", error);
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
