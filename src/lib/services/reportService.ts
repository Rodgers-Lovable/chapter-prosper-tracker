import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MetricEntry, MetricsSummary } from './metricsService';
import { TradeWithProfiles } from './tradesService';
import { Profile } from '@/lib/auth';

export const reportService = {
  async exportToExcel(
    profile: Profile,
    metrics: MetricEntry[],
    trades: TradeWithProfiles[],
    summary: MetricsSummary
  ): Promise<void> {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['PLANT Metrics Summary'],
      ['Member:', profile.full_name || 'N/A'],
      ['Business:', profile.business_name || 'N/A'],
      ['Chapter ID:', profile.chapter_id || 'N/A'],
      ['Report Date:', new Date().toLocaleDateString()],
      [],
      ['Metric Type', 'Total Value'],
      ['Participation', summary.participation.toString()],
      ['Learning', summary.learning.toString()],
      ['Activity', summary.activity.toString()],
      ['Networking', summary.networking.toString()],
      ['Trade', summary.trade.toString()]
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // Metrics sheet
    const metricsData = [
      ['Date', 'Type', 'Value', 'Description']
    ];
    metrics.forEach(metric => {
      metricsData.push([
        metric.date,
        metric.metric_type,
        metric.value.toString(),
        metric.description || ''
      ]);
    });
    const metricsWS = XLSX.utils.aoa_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, metricsWS, 'Metrics');

    // Trades sheet
    const tradesData = [
      ['Date', 'Amount (KES)', 'Status', 'Description', 'Source', 'Beneficiary', 'MPESA Ref']
    ];
    trades.forEach(trade => {
      tradesData.push([
        new Date(trade.created_at || '').toLocaleDateString(),
        trade.amount,
        trade.status,
        trade.description || '',
        trade.source_member?.full_name || 'N/A',
        trade.beneficiary_member?.full_name || 'N/A',
        trade.mpesa_reference || ''
      ]);
    });
    const tradesWS = XLSX.utils.aoa_to_sheet(tradesData);
    XLSX.utils.book_append_sheet(wb, tradesWS, 'Trades');

    // Download
    const fileName = `PLANT_Report_${profile.full_name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  async exportToPDF(
    profile: Profile,
    summary: MetricsSummary,
    chartElement?: HTMLElement
  ): Promise<void> {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('PLANT Metrics Report', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Member: ${profile.full_name || 'N/A'}`, 20, 50);
    pdf.text(`Business: ${profile.business_name || 'N/A'}`, 20, 60);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
    
    // Summary
    pdf.setFontSize(16);
    pdf.text('Metrics Summary', 20, 90);
    
    pdf.setFontSize(12);
    let yPos = 110;
    const metrics = [
      ['Participation', summary.participation],
      ['Learning', summary.learning],
      ['Activity', summary.activity],
      ['Networking', summary.networking],
      ['Trade', summary.trade]
    ];
    
    metrics.forEach(([type, value]) => {
      pdf.text(`${type}: ${value}`, 20, yPos);
      yPos += 10;
    });
    
    // Add chart if provided
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement);
        const imgData = canvas.toDataURL('image/png');
        pdf.addPage();
        pdf.text('Metrics Chart', 20, 30);
        pdf.addImage(imgData, 'PNG', 20, 40, 170, 100);
      } catch (error) {
        console.error('Error adding chart to PDF:', error);
      }
    }
    
    // Download
    const fileName = `PLANT_Report_${profile.full_name}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }
};