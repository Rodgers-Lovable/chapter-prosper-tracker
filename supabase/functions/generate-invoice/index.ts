import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import jsPDF from 'npm:jspdf@3.0.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceRequest {
  tradeId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tradeId }: InvoiceRequest = await req.json();

    console.log('Generating invoice for trade:', tradeId);

    // Fetch trade details with user information
    const { data: trade, error: tradeError } = await supabaseClient
      .from('trades')
      .select(`
        *,
        user:profiles!trades_user_id_fkey(full_name, email, business_name, phone),
        chapter:chapters(name)
      `)
      .eq('id', tradeId)
      .single();

    if (tradeError || !trade) {
      throw new Error('Trade not found');
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('trade_id', tradeId)
      .maybeSingle();

    if (existingInvoice) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Invoice already exists',
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoice_number
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}`;
    
    // Create PDF invoice
    const pdfBytes = await generateInvoicePDF({
      invoiceNumber,
      trade,
      user: trade.user,
      chapter: trade.chapter
    });

    // Upload PDF to Supabase Storage (in production)
    // For now, we'll create a base64 representation
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
    const fileName = `invoices/${invoiceNumber}.pdf`;
    
    // In production, upload to storage:
    // const { data: uploadData, error: uploadError } = await supabaseClient.storage
    //   .from('invoices')
    //   .upload(fileName, pdfBytes, {
    //     contentType: 'application/pdf',
    //     cacheControl: '3600',
    //   });

    // For now, we'll store a placeholder URL
    const fileUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/invoices/${fileName}`;

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .insert({
        trade_id: tradeId,
        invoice_number: invoiceNumber,
        amount: trade.amount,
        file_url: fileUrl,
        issued_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invoiceError) {
      throw invoiceError;
    }

    // Update trade status to invoiced
    await supabaseClient
      .from('trades')
      .update({ 
        status: 'invoiced',
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId);

    console.log('Invoice generated successfully:', invoiceNumber);

    return new Response(JSON.stringify({
      success: true,
      message: 'Invoice generated successfully',
      invoiceId: invoice.id,
      invoiceNumber: invoiceNumber,
      fileUrl: fileUrl,
      pdfBase64: pdfBase64 // For immediate download
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateInvoicePDF(data: any): Promise<Uint8Array> {
  const { invoiceNumber, trade, user, chapter } = data;
  
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text('PLANT METRICS TRACKER', 20, 30);
  pdf.setFontSize(16);
  pdf.text('TRADE INVOICE', 20, 45);
  
  // Invoice details
  pdf.setFontSize(12);
  pdf.text(`Invoice Number: ${invoiceNumber}`, 20, 65);
  pdf.text(`Date: ${new Date(trade.created_at).toLocaleDateString()}`, 20, 75);
  pdf.text(`Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 20, 85);
  
  // Bill to
  pdf.setFontSize(14);
  pdf.text('Bill To:', 20, 105);
  pdf.setFontSize(12);
  pdf.text(user.full_name || 'N/A', 20, 120);
  pdf.text(user.business_name || '', 20, 130);
  pdf.text(user.email || '', 20, 140);
  pdf.text(user.phone || '', 20, 150);
  pdf.text(`Chapter: ${chapter?.name || 'N/A'}`, 20, 160);
  
  // Trade details
  pdf.setFontSize(14);
  pdf.text('Trade Details:', 20, 185);
  pdf.setFontSize(12);
  pdf.text(`Amount: KES ${Number(trade.amount).toLocaleString()}`, 20, 200);
  pdf.text(`Description: ${trade.description || 'Trade declaration'}`, 20, 210);
  
  // Payment instructions
  pdf.setFontSize(14);
  pdf.text('Payment Instructions:', 20, 235);
  pdf.setFontSize(10);
  pdf.text('1. Use the MPESA STK Push sent to your phone', 20, 250);
  pdf.text('2. Or pay manually to Paybill: 522533, Account: PLANT', 20, 260);
  pdf.text('3. Use this invoice number as reference', 20, 270);
  
  // Footer
  pdf.setFontSize(8);
  pdf.text('This is a system-generated invoice for PLANT Metrics trade declaration.', 20, 285);
  pdf.text('Payment is required within 30 days of issue date.', 20, 295);
  
  // Convert to bytes
  const pdfString = pdf.output('datauristring');
  const base64Data = pdfString.split(',')[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}