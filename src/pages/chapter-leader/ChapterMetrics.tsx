import React from 'react';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const ChapterMetrics = () => {
  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h2 className="text-2xl font-bold">PLANT Metrics Monitoring</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Chapter Metrics Overview</CardTitle>
            <CardDescription>Monitor PLANT metrics across your chapter</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Metrics monitoring interface will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterMetrics;