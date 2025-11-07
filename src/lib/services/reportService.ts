import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MetricEntry, MetricsSummary } from './metricsService';
import { TradeWithProfiles } from './tradesService';
import { Profile } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type ReportType = 'metrics' | 'trades' | 'financial' | 'members' | 'chapters';
type ReportPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';
type ReportFormat = 'excel' | 'pdf';

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
        trade.amount.toString(),
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
  },

  async generateAdminReport(
    reportType: ReportType,
    startDate: Date,
    endDate: Date,
    exportFormat: ReportFormat
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileName = `${reportType}_Report_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`;

    switch (reportType) {
      case 'metrics':
        await this.generateMetricsReport(startDate, endDate, exportFormat, fileName);
        break;
      case 'trades':
        await this.generateTradesReport(startDate, endDate, exportFormat, fileName);
        break;
      case 'financial':
        await this.generateFinancialReport(startDate, endDate, exportFormat, fileName);
        break;
      case 'members':
        await this.generateMembersReport(startDate, endDate, exportFormat, fileName);
        break;
      case 'chapters':
        await this.generateChaptersReport(startDate, endDate, exportFormat, fileName);
        break;
    }

    // Log to reports_history
    await supabase.from('reports_history').insert({
      report_type: reportType,
      report_period: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`,
      format: exportFormat,
      file_name: fileName,
      date_range: { start: startDate.toISOString(), end: endDate.toISOString() },
      generated_by: user.id
    });

    return fileName;
  },

  async generateMetricsReport(startDate: Date, endDate: Date, exportFormat: ReportFormat, fileName: string) {
    const { data: metrics, error } = await supabase
      .from('metrics')
      .select('*')
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    if (error) throw error;

    // Fetch related profiles and chapters separately
    const userIds = [...new Set(metrics?.map(m => m.user_id))];
    const chapterIds = [...new Set(metrics?.map(m => m.chapter_id))];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, business_name')
      .in('id', userIds);

    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, name')
      .in('id', chapterIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]));
    const chapterMap = new Map(chapters?.map(c => [c.id, c]));

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const totalByType = metrics?.reduce((acc, m) => {
      acc[m.metric_type] = (acc[m.metric_type] || 0) + Number(m.value);
      return acc;
    }, {} as Record<string, number>) || {};

    const summaryData = [
      ['PLANT Metrics Report'],
      ['Period:', `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
      ['Total Entries:', metrics?.length || 0],
      [],
      ['Metric Type', 'Total Value'],
      ...Object.entries(totalByType).map(([type, value]) => [type, value])
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // Detailed Metrics
    const detailedData = [
      ['Date', 'Member', 'Business', 'Chapter', 'Type', 'Value', 'Description']
    ];
    metrics?.forEach(m => {
      const profile = profileMap.get(m.user_id);
      const chapter = chapterMap.get(m.chapter_id);
      detailedData.push([
        m.date,
        profile?.full_name || 'N/A',
        profile?.business_name || 'N/A',
        chapter?.name || 'N/A',
        m.metric_type,
        m.value.toString(),
        m.description || ''
      ]);
    });
    const detailedWS = XLSX.utils.aoa_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, detailedWS, 'Detailed Metrics');

    XLSX.writeFile(wb, fileName);
  },

  async generateTradesReport(startDate: Date, endDate: Date, exportFormat: ReportFormat, fileName: string) {
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch related data
    const sourceIds = [...new Set(trades?.map(t => t.source_member_id).filter(Boolean))];
    const beneficiaryIds = [...new Set(trades?.map(t => t.beneficiary_member_id).filter(Boolean))];
    const chapterIds = [...new Set(trades?.map(t => t.chapter_id))];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, business_name')
      .in('id', [...sourceIds, ...beneficiaryIds] as string[]);

    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, name')
      .in('id', chapterIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]));
    const chapterMap = new Map(chapters?.map(c => [c.id, c]));

    const wb = XLSX.utils.book_new();

    // Summary
    const totalValue = trades?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const avgTransaction = trades?.length ? totalValue / trades.length : 0;
    const byStatus = trades?.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const summaryData = [
      ['PLANT Trades Report'],
      ['Period:', `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
      ['Total Trades:', trades?.length || 0],
      ['Total Value (KES):', totalValue.toLocaleString()],
      ['Average Transaction (KES):', avgTransaction.toFixed(2)],
      [],
      ['Status', 'Count'],
      ...Object.entries(byStatus).map(([status, count]) => [status, count])
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // All Trades
    const tradesData = [
      ['Date', 'Amount (KES)', 'Status', 'Source', 'Beneficiary', 'Chapter', 'Description', 'MPESA Ref']
    ];
    trades?.forEach(t => {
      const source = t.source_member_id ? profileMap.get(t.source_member_id) : null;
      const beneficiary = t.beneficiary_member_id ? profileMap.get(t.beneficiary_member_id) : null;
      const chapter = chapterMap.get(t.chapter_id);
      tradesData.push([
        format(new Date(t.created_at || ''), 'yyyy-MM-dd HH:mm'),
        t.amount.toString(),
        t.status,
        source?.full_name || 'N/A',
        beneficiary?.full_name || 'N/A',
        chapter?.name || 'N/A',
        t.description || '',
        t.mpesa_reference || ''
      ]);
    });
    const tradesWS = XLSX.utils.aoa_to_sheet(tradesData);
    XLSX.utils.book_append_sheet(wb, tradesWS, 'All Trades');

    XLSX.writeFile(wb, fileName);
  },

  async generateFinancialReport(startDate: Date, endDate: Date, exportFormat: ReportFormat, fileName: string) {
    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const wb = XLSX.utils.book_new();

    // Revenue Summary
    const totalRevenue = trades?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const paidInvoices = invoices?.filter(i => i.paid_at) || [];
    const pendingInvoices = invoices?.filter(i => !i.paid_at) || [];
    const paidAmount = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

    const summaryData = [
      ['PLANT Financial Report'],
      ['Period:', `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
      [],
      ['Total Trade Revenue (KES):', totalRevenue.toLocaleString()],
      ['Invoices Paid (KES):', paidAmount.toLocaleString()],
      ['Invoices Pending (KES):', pendingAmount.toLocaleString()],
      ['Total Invoices:', invoices?.length || 0],
      ['Paid Invoices:', paidInvoices.length],
      ['Pending Invoices:', pendingInvoices.length]
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    XLSX.writeFile(wb, fileName);
  },

  async generateMembersReport(startDate: Date, endDate: Date, exportFormat: ReportFormat, fileName: string) {
    const { data: members, error } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch chapters
    const chapterIds = [...new Set(members?.map(m => m.chapter_id).filter(Boolean))];
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, name')
      .in('id', chapterIds as string[]);

    const chapterMap = new Map(chapters?.map(c => [c.id, c]));

    const wb = XLSX.utils.book_new();

    // Summary
    const byRole = members?.reduce((acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const summaryData = [
      ['PLANT Members Report'],
      ['Period:', `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
      ['Total Members:', members?.length || 0],
      [],
      ['Role', 'Count'],
      ...Object.entries(byRole).map(([role, count]) => [role, count])
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // Directory
    const directoryData = [
      ['Name', 'Email', 'Phone', 'Business', 'Description', 'Chapter', 'Role', 'Join Date']
    ];
    members?.forEach(m => {
      const chapter = m.chapter_id ? chapterMap.get(m.chapter_id) : null;
      directoryData.push([
        m.full_name || '',
        m.email || '',
        m.phone || '',
        m.business_name || '',
        m.business_description || '',
        chapter?.name || 'N/A',
        m.role || '',
        format(new Date(m.created_at || ''), 'yyyy-MM-dd')
      ]);
    });
    const directoryWS = XLSX.utils.aoa_to_sheet(directoryData);
    XLSX.utils.book_append_sheet(wb, directoryWS, 'Directory');

    XLSX.writeFile(wb, fileName);
  },

  async generateChaptersReport(startDate: Date, endDate: Date, exportFormat: ReportFormat, fileName: string) {
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*');

    // Fetch leaders
    const leaderIds = [...new Set(chapters?.map(c => c.leader_id).filter(Boolean))];
    const { data: leaders } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', leaderIds as string[]);

    const leaderMap = new Map(leaders?.map(l => [l.id, l]));

    // Count members per chapter
    const { data: profiles } = await supabase
      .from('profiles')
      .select('chapter_id');

    const memberCounts = profiles?.reduce((acc, p) => {
      if (p.chapter_id) {
        acc[p.chapter_id] = (acc[p.chapter_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    const wb = XLSX.utils.book_new();

    // Overview
    const overviewData = [
      ['PLANT Chapters Report'],
      ['Generated:', format(new Date(), 'MMM dd, yyyy HH:mm')],
      ['Total Chapters:', chapters?.length || 0],
      [],
      ['Chapter', 'Leader', 'Members', 'Created']
    ];
    chapters?.forEach(c => {
      const leader = c.leader_id ? leaderMap.get(c.leader_id) : null;
      overviewData.push([
        c.name,
        leader?.full_name || 'N/A',
        memberCounts[c.id] || 0,
        format(new Date(c.created_at || ''), 'yyyy-MM-dd')
      ]);
    });
    const overviewWS = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, overviewWS, 'Overview');

    XLSX.writeFile(wb, fileName);
  },

  async getRecentReports(limit: number = 10) {
    const { data, error } = await supabase
      .from('reports_history')
      .select(`
        *,
        generated_by_profile:generated_by (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};