import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MetricEntry, MetricsSummary } from "@/lib/services/metricsService";
import { TradeWithProfiles } from "@/lib/services/tradesService";
import { reportService } from "@/lib/services/reportService";
import { toast } from "@/hooks/use-toast";

interface ReportsPanelProps {
  metrics: MetricEntry[];
  trades: TradeWithProfiles[];
  summary: MetricsSummary;
  chartRef?: React.RefObject<HTMLDivElement>;
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({
  metrics,
  trades,
  summary,
  chartRef,
}) => {
  const { profile } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"excel" | "pdf">("excel");

  const handleExport = async () => {
    if (!profile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Profile not loaded. Please refresh and try again.",
      });
      return;
    }

    setIsExporting(true);
    try {
      if (exportType === "excel") {
        await reportService.exportToExcel(profile, metrics, trades, summary);
        toast({
          title: "Success",
          description: "Excel report downloaded successfully!",
        });
      } else {
        const chartElement = chartRef?.current;
        await reportService.exportToPDF(
          profile,
          summary,
          chartElement || undefined
        );
        toast({
          title: "Success",
          description: "PDF report downloaded successfully!",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getTotalMetrics = () => {
    return Object.values(summary).reduce((total, value) => total + value, 0);
  };

  const getTotalTrades = () => {
    return trades.reduce((total, trade) => total + trade.amount, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Export Reports
        </CardTitle>
        <CardDescription>
          Download comprehensive reports of your PLANT metrics and trades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{metrics.length}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {getTotalMetrics().toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{trades.length}</div>
            <div className="text-sm text-muted-foreground">Total Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              KES {getTotalTrades().toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Trade Value</div>
          </div>
        </div>

        {/* Export Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select
              value={exportType}
              onValueChange={(value) => setExportType(value as "excel" | "pdf")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel Report (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Summary (.pdf)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting || metrics.length === 0}
            className="min-w-32"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>

        {/* Report Info */}
        <div className="text-sm text-muted-foreground space-y-2">
          {exportType === "excel" ? (
            <div>
              <p>
                <strong>Excel Report includes:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Summary sheet with total metrics by category</li>
                <li>Detailed metrics history with dates and descriptions</li>
                <li>Complete trades log with payment status</li>
                <li>Member and business information</li>
              </ul>
            </div>
          ) : (
            <div>
              <p>
                <strong>PDF Report includes:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Summary of total metrics by category</li>
                <li>Visual chart of metrics trend (if available)</li>
                <li>Member and business information</li>
                <li>Report generation date</li>
              </ul>
            </div>
          )}
        </div>

        {metrics.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No data available for export.</p>
            <p className="text-sm">Add some metrics to generate reports!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportsPanel;
