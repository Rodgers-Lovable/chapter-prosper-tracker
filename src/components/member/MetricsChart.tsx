import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { MetricEntry } from '@/lib/services/metricsService';
import { format, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface MetricsChartProps {
  metrics: MetricEntry[];
  chartType: 'line' | 'bar';
  onChartTypeChange: (type: 'line' | 'bar') => void;
}

const MetricsChart: React.FC<MetricsChartProps> = ({ 
  metrics, 
  chartType, 
  onChartTypeChange 
}) => {
  // Process metrics data for chart
  const processChartData = () => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const monthStart = startOfMonth(month);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const monthMetrics = metrics.filter(metric => {
        const metricDate = new Date(metric.date);
        return metricDate >= monthStart && metricDate <= monthEnd;
      });

      const aggregated = {
        month: format(month, 'MMM yyyy'),
        participation: 0,
        learning: 0,
        activity: 0,
        networking: 0,
        trade: 0
      };

      monthMetrics.forEach(metric => {
        aggregated[metric.metric_type] += Number(metric.value);
      });

      return aggregated;
    });
  };

  const chartData = processChartData();

  const metricColors = {
    participation: 'hsl(226, 81%, 25%)', // Navy Blue
    learning: 'hsl(226, 81%, 35%)', // Lighter Navy
    activity: 'hsl(43, 74%, 52%)', // Golden Yellow
    networking: 'hsl(43, 74%, 65%)', // Orange Tint
    trade: 'hsl(210, 100%, 20%)' // Dark Navy
  };

  return (
    <Card className="shadow-md border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-navy-blue">
              <TrendingUp className="h-5 w-5 text-primary" />
              Metrics Trend
            </CardTitle>
            <CardDescription>
              Your PLANT metrics performance over the last 6 months
            </CardDescription>
          </div>
          <Select value={chartType} onValueChange={onChartTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="participation" 
                  stroke={metricColors.participation} 
                  strokeWidth={2}
                  name="Participation"
                />
                <Line 
                  type="monotone" 
                  dataKey="learning" 
                  stroke={metricColors.learning} 
                  strokeWidth={2}
                  name="Learning"
                />
                <Line 
                  type="monotone" 
                  dataKey="activity" 
                  stroke={metricColors.activity} 
                  strokeWidth={2}
                  name="Activity"
                />
                <Line 
                  type="monotone" 
                  dataKey="networking" 
                  stroke={metricColors.networking} 
                  strokeWidth={2}
                  name="Networking"
                />
                <Line 
                  type="monotone" 
                  dataKey="trade" 
                  stroke={metricColors.trade} 
                  strokeWidth={2}
                  name="Trade"
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="participation" fill={metricColors.participation} name="Participation" />
                <Bar dataKey="learning" fill={metricColors.learning} name="Learning" />
                <Bar dataKey="activity" fill={metricColors.activity} name="Activity" />
                <Bar dataKey="networking" fill={metricColors.networking} name="Networking" />
                <Bar dataKey="trade" fill={metricColors.trade} name="Trade" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsChart;