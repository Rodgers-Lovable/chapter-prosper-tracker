import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  tradeId: string;
  phoneNumber: string;
  amount: number;
}

interface MPESASTKResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
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

    const { tradeId, phoneNumber, amount }: PaymentRequest = await req.json();

    console.log("Processing payment for trade:", tradeId, "Amount:", amount);

    // First, verify the trade exists and is pending
    const { data: trade, error: tradeError } = await supabaseClient
      .from("trades")
      .select("*")
      .eq("id", tradeId)
      .eq("status", "pending")
      .single();

    if (tradeError || !trade) {
      throw new Error("Trade not found or not in pending status");
    }

    // In a real implementation, this would call the MPESA API
    // For now, we simulate the STK push request
    const mpesaResponse = await simulateMPESASTKPush(phoneNumber, amount);

    if (mpesaResponse.ResponseCode === "0") {
      // Update trade with MPESA reference
      const { error: updateError } = await supabaseClient
        .from("trades")
        .update({
          mpesa_reference: mpesaResponse.CheckoutRequestID,
          status: "invoiced", // Will be updated to 'paid' when callback confirms payment
          updated_at: new Date().toISOString(),
        })
        .eq("id", tradeId);

      if (updateError) {
        throw updateError;
      }

      // Log the payment initiation
      console.log(
        "MPESA STK Push initiated successfully:",
        mpesaResponse.CheckoutRequestID
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "MPESA STK Push sent successfully",
          checkoutRequestId: mpesaResponse.CheckoutRequestID,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      throw new Error(
        `MPESA request failed: ${mpesaResponse.ResponseDescription}`
      );
    }
  } catch (error) {
    console.error("Error processing payment:", error);
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

// Simulate MPESA STK Push for development/testing
async function simulateMPESASTKPush(
  phoneNumber: string,
  amount: number
): Promise<MPESASTKResponse> {
  // In production, this would be a real MPESA API call
  const businessShortCode = Deno.env.get("MPESA_SHORTCODE") || "174379";
  const passkey =
    Deno.env.get("MPESA_PASSKEY") ||
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

  console.log(
    "Simulating MPESA STK Push for phone:",
    phoneNumber,
    "Amount:",
    amount
  );

  // Simulate successful response
  return {
    ResponseCode: "0",
    ResponseDescription: "Success. Request accepted for processing",
    MerchantRequestID: `MR${Date.now()}`,
    CheckoutRequestID: `ws_CO_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`,
  };

  // In production, use actual MPESA API:
  /*
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = btoa(businessShortCode + passkey + timestamp);
  
  const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getMPESAToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: businessShortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
      AccountReference: `PLANT_${tradeId}`,
      TransactionDesc: 'PLANT Metrics Trade Payment'
    })
  });
  
  return await response.json();
  */
}

// In production, implement MPESA token retrieval
async function getMPESAToken(): Promise<string> {
  // Implement MPESA OAuth token retrieval
  return "sandbox_token";
}
