import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  FileText, 
  Download,
  Calendar,
  BarChart3,
  Users,
  Building,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  File
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/lib/services/adminService';
import { reportService } from '@/lib/services/reportService';
import { useEffect } from 'react';

type ReportType = 'metrics' | 'trades' | 'financial' | 'members' | 'chapters';
type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
type ReportFormat = 'excel' | 'pdf';

const ReportsManagement: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [reportConfig, setReportConfig] = useState({
    type: 'metrics' as ReportType,
    period: 'monthly' as ReportPeriod,
    format: 'excel' as ReportFormat,
    startDate: '',
    endDate: '',
    chapterId: ''
  });

  useEffect(() => {
    loadRecentReports();
  }, []);

  const loadRecentReports = async () => {
    try {
      const reports = await reportService.getRecentReports(5);
      setRecentReports(reports || []);
    } catch (error) {
      console.error('Error loading recent reports:', error);
    }
  };

  const reportTypes = [
    { 
      value: 'metrics', 
      label: 'PLANT Metrics Report', 
      description: 'Member metrics, growth trends, and performance analytics',
      icon: BarChart3
    },
    { 
      value: 'trades', 
      label: 'Trade Activity Report', 
      description: 'All trade transactions, referrals, and business exchanges',
      icon: TrendingUp
    },
    { 
      value: 'financial', 
      label: 'Financial Summary Report', 
      description: 'Revenue, payments, invoices, and financial analytics',
      icon: DollarSign
    },
    { 
      value: 'members', 
      label: 'Member Directory Report', 
      description: 'Complete member listings with business information',
      icon: Users
    },
    { 
      value: 'chapters', 
      label: 'Chapter Performance Report', 
      description: 'Chapter-by-chapter performance and comparisons',
      icon: Building
    }
  ];

  const reportPeriods = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom Date Range' }
  ];

  const generateReport = async () => {
    try {
      setGenerating(true);

      // Validate custom date range
      if (reportConfig.period === 'custom' && (!reportConfig.startDate || !reportConfig.endDate)) {
        toast.error('Please select both start and end dates for custom range');
        return;
      }

      // Calculate date range based on period
      let startDate: string;
      let endDate: string = new Date().toISOString().split('T')[0];

      if (reportConfig.period === 'custom') {
        startDate = reportConfig.startDate;
        endDate = reportConfig.endDate;
      } else {
        const now = new Date();
        switch (reportConfig.period) {
          case 'weekly':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
            break;
          case 'quarterly':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
            break;
          case 'yearly':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        }
      }

      // Generate the report
      const fileName = await reportService.generateAdminReport(
        reportConfig.type,
        new Date(startDate),
        new Date(endDate),
        reportConfig.format
      );

      // Log the action
      await adminService.logAdminAction('report_generated', {
        report_type: reportConfig.type,
        period: reportConfig.period,
        format: reportConfig.format,
        date_range: { startDate, endDate },
        file_name: fileName
      });
      
      toast.success(`Report "${fileName}" generated and downloaded successfully!`);
      
      // Reload recent reports
      await loadRecentReports();

    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const selectedReportType = reportTypes.find(type => type.value === reportConfig.type);
  const SelectedIcon = selectedReportType?.icon || FileText;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reports & Analytics
          </h3>
          <p className="text-muted-foreground">
            Generate comprehensive reports for system analysis and compliance
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excel Reports</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">64</div>
            <p className="text-xs text-muted-foreground">72% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDF Reports</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">28% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Reports</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Auto-generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
            <CardDescription>
              Configure and generate comprehensive system reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select
                value={reportConfig.type}
                onValueChange={(value: ReportType) => setReportConfig(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Time Period */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select
                value={reportConfig.period}
                onValueChange={(value: ReportPeriod) => setReportConfig(prev => ({ ...prev, period: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  {reportPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {reportConfig.period === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={reportConfig.startDate}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={reportConfig.endDate}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select
                value={reportConfig.format}
                onValueChange={(value: ReportFormat) => setReportConfig(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      PDF (.pdf)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generateReport} 
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SelectedIcon className="h-5 w-5" />
              Report Preview
            </CardTitle>
            <CardDescription>
              {selectedReportType?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Report Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{selectedReportType?.label}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period:</span>
                    <span className="capitalize">{reportConfig.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format:</span>
                    <span className="uppercase">{reportConfig.format}</span>
                  </div>
                  {reportConfig.period === 'custom' && reportConfig.startDate && reportConfig.endDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date Range:</span>
                      <span className="text-xs">
                        {reportConfig.startDate} to {reportConfig.endDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Estimated Content</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {reportConfig.type === 'metrics' && (
                    <>
                      <p>• Member PLANT metrics summary</p>
                      <p>• Growth trends and analytics</p>
                      <p>• Performance comparisons</p>
                      <p>• Top performers ranking</p>
                    </>
                  )}
                  {reportConfig.type === 'trades' && (
                    <>
                      <p>• All trade transactions</p>
                      <p>• Referral network analysis</p>
                      <p>• Business exchange summary</p>
                      <p>• Revenue generation breakdown</p>
                    </>
                  )}
                  {reportConfig.type === 'financial' && (
                    <>
                      <p>• Revenue and payment summary</p>
                      <p>• Invoice status overview</p>
                      <p>• Financial trends analysis</p>
                      <p>• Chapter-wise breakdowns</p>
                    </>
                  )}
                  {reportConfig.type === 'members' && (
                    <>
                      <p>• Complete member directory</p>
                      <p>• Business information</p>
                      <p>• Contact details</p>
                      <p>• Chapter assignments</p>
                    </>
                  )}
                  {reportConfig.type === 'chapters' && (
                    <>
                      <p>• Chapter performance metrics</p>
                      <p>• Member growth by chapter</p>
                      <p>• Revenue comparisons</p>
                      <p>• Leadership effectiveness</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Previously generated reports and downloads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No reports generated yet</p>
            ) : (
              recentReports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {report.format === 'excel' ? (
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  ) : (
                    <File className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(report.date).toLocaleDateString()} • {report.size}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsManagement;