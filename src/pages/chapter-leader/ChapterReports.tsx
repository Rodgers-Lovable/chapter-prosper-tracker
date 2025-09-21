import React from 'react';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import ReportsPanel from '@/components/member/ReportsPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

const ChapterReports = () => {
  const { profile } = useAuth();

  const generateChapterReport = async () => {
    if (!profile?.chapter_id) {
      toast.error('Chapter information not available');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-chapter-report', {
        body: {
          chapterId: profile.chapter_id,
          period: 'monthly',
          format: 'excel'
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Chapter report generated successfully!');
      console.log('Report generated:', data);
    } catch (error) {
      console.error('Error generating chapter report:', error);
      toast.error('Failed to generate chapter report');
    }
  };

  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Chapter Reports</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Generate Chapter Report</CardTitle>
            <CardDescription>
              Generate comprehensive reports for your chapter's performance, metrics, and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Monthly Chapter Report</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete overview of chapter metrics, member activity, and financial summary
                  </p>
                  <Button onClick={generateChapterReport} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Member Performance Report</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Individual member metrics, rankings, and contribution analysis
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Financial Report</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Trade declarations, payments, and revenue analysis for the chapter
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Report Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Comprehensive PLANT metrics tracking and analysis</li>
                  <li>• Member performance rankings and trends</li>
                  <li>• Trade activity and financial summaries</li>
                  <li>• Monthly growth statistics and comparisons</li>
                  <li>• Exportable in Excel and PDF formats</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterReports;