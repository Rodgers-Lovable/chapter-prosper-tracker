import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  FileDown,
  Printer
} from 'lucide-react';
import { chapterLeaderService, ChapterStats } from '@/lib/services/chapterLeaderService';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

const ChapterReports = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<ChapterStats | null>(null);
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    const fetchChapterStats = async () => {
      if (!profile?.chapter_id) return;

      setLoading(true);
      try {
        const result = await chapterLeaderService.getChapterStats(profile.chapter_id);
        if (result.error) {
          throw new Error(result.error);
        }
        setStats(result.data);
      } catch (error) {
        console.error('Error fetching chapter stats:', error);
        toast({
          title: "Error loading chapter data",
          description: "Please try refreshing the page",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChapterStats();
  }, [profile?.chapter_id, toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDateRange = () => {
    switch (reportType) {
      case 'monthly':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
          label: format(selectedDate, 'MMMM yyyy')
        };
      case 'quarterly':
        const quarter = Math.floor(selectedDate.getMonth() / 3);
        const quarterStart = new Date(selectedDate.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(selectedDate.getFullYear(), (quarter + 1) * 3, 0);
        return {
          start: quarterStart,
          end: quarterEnd,
          label: `Q${quarter + 1} ${selectedDate.getFullYear()}`
        };
      case 'annual':
        return {
          start: new Date(selectedDate.getFullYear(), 0, 1),
          end: new Date(selectedDate.getFullYear(), 11, 31),
          label: selectedDate.getFullYear().toString()
        };
      default:
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
          label: format(selectedDate, 'MMMM yyyy')
        };
    }
  };

  const handleGenerateReport = async () => {
    if (!profile?.chapter_id) return;

    setGenerating(true);
    try {
      const dateRange = getDateRange();
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Report generated successfully",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report for ${dateRange.label} has been generated`,
        variant: "default"
      });

      // Here you would typically trigger a download
      // For now, we'll just show a success message
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error generating report",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <ChapterLeaderLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
      </ChapterLeaderLayout>
    );
  }

  const dateRange = getDateRange();

  const reportTypes = [
    {
      id: 'monthly' as const,
      name: 'Monthly Report',
      description: 'Detailed month-by-month analysis',
      icon: CalendarIcon
    },
    {
      id: 'quarterly' as const,
      name: 'Quarterly Report',
      description: 'Quarterly performance summary',
      icon: BarChart3
    },
    {
      id: 'annual' as const,
      name: 'Annual Report',
      description: 'Comprehensive yearly overview',
      icon: TrendingUp
    }
  ];

  const reportSections = [
    {
      title: 'Chapter Overview',
      description: 'Member count, growth metrics, and participation rates',
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'PLANT Metrics Analysis',
      description: 'Detailed breakdown of Participation, Learning, Activity, Networking, and Trade metrics',
      icon: BarChart3,
      color: 'text-learning'
    },
    {
      title: 'Financial Summary',
      description: 'Trade values, payment status, and revenue analysis',
      icon: DollarSign,
      color: 'text-trade'
    },
    {
      title: 'Member Performance',
      description: 'Individual member rankings and achievement highlights',
      icon: TrendingUp,
      color: 'text-success'
    }
  ];

  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Chapter Reports
            </h1>
            <p className="text-muted-foreground">
              Generate comprehensive reports for your chapter
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {dateRange.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>
                  Choose the type and period for your chapter report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Type Grid */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Report Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = reportType === type.id;
                      
                      return (
                        <Button
                          key={type.id}
                          variant={isSelected ? "default" : "outline"}
                          className="h-auto p-4 flex flex-col gap-2"
                          onClick={() => setReportType(type.id)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{type.name}</span>
                          <span className="text-xs opacity-70">
                            {type.description}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Date Selection and Format */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time Period</label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.label}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(date);
                              setDatePickerOpen(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Export Format</label>
                    <Select value={reportFormat} onValueChange={(value: 'pdf' | 'excel') => setReportFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileDown className="h-4 w-4" />
                            PDF Document
                          </div>
                        </SelectItem>
                        <SelectItem value="excel">
                          <div className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Excel Spreadsheet
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Sections Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Report Contents</CardTitle>
                <CardDescription>
                  Your report will include the following sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportSections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                        <Icon className={`h-5 w-5 mt-0.5 ${section.color}`} />
                        <div className="flex-1">
                          <h4 className="font-medium">{section.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <LoadingSpinner />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Chapter Statistics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Current Chapter Stats</CardTitle>
              <CardDescription>
                Latest metrics that will be included in your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Members</span>
                  <span className="font-medium">{stats?.totalMembers || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Participation Rate</span>
                  <span className="font-medium">{stats?.avgParticipation || 0}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Learning Hours</span>
                  <span className="font-medium">{stats?.totalLearningHours || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Chapter Revenue</span>
                  <span className="font-medium">{formatCurrency(stats?.totalRevenue || 0)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Monthly Growth</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Members</span>
                    <span className={stats?.monthlyGrowth.members && stats.monthlyGrowth.members > 0 ? 'text-success' : 'text-muted-foreground'}>
                      {stats?.monthlyGrowth.members > 0 ? '+' : ''}{stats?.monthlyGrowth.members || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className={stats?.monthlyGrowth.revenue && stats.monthlyGrowth.revenue > 0 ? 'text-success' : 'text-muted-foreground'}>
                      {stats?.monthlyGrowth.revenue > 0 ? '+' : ''}{formatCurrency(stats?.monthlyGrowth.revenue || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Report Options</CardTitle>
            <CardDescription>
              Common report configurations for different needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => {
                  setReportType('monthly');
                  setSelectedDate(subMonths(new Date(), 1));
                  setReportFormat('pdf');
                }}
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">Last Month Summary</span>
                <span className="text-xs text-muted-foreground">
                  Previous month's performance report
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => {
                  setReportType('quarterly');
                  setSelectedDate(new Date());
                  setReportFormat('excel');
                }}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Current Quarter</span>
                <span className="text-xs text-muted-foreground">
                  Detailed quarterly analysis
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => {
                  setReportType('annual');
                  setSelectedDate(new Date(new Date().getFullYear() - 1, 0, 1));
                  setReportFormat('pdf');
                }}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Annual Review</span>
                <span className="text-xs text-muted-foreground">
                  Complete year-end report
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterReports;