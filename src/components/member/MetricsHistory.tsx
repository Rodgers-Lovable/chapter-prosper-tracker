import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  GraduationCap,
  Activity,
  Network,
  DollarSign,
  History,
  Filter,
} from "lucide-react";
import { MetricEntry, MetricType } from "@/lib/services/metricsService";
import { format } from "date-fns";

interface MetricsHistoryProps {
  metrics: MetricEntry[];
  isLoading?: boolean;
}

const metricTypeConfig = {
  participation: {
    icon: Users,
    color: "text-participation",
    label: "Participation",
  },
  learning: { icon: GraduationCap, color: "text-learning", label: "Learning" },
  activity: { icon: Activity, color: "text-activity", label: "Activity" },
  networking: { icon: Network, color: "text-networking", label: "Networking" },
  trade: { icon: DollarSign, color: "text-trade", label: "Trade" },
};

const MetricsHistory: React.FC<MetricsHistoryProps> = ({
  metrics,
  isLoading,
}) => {
  const [filterType, setFilterType] = useState<MetricType | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "value" | "type">("date");

  const filteredMetrics = React.useMemo(() => {
    let filtered =
      filterType === "all"
        ? metrics
        : metrics.filter((metric) => metric.metric_type === filterType);

    // Sort metrics
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "value":
          return Number(b.value) - Number(a.value);
        case "type":
          return a.metric_type.localeCompare(b.metric_type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [metrics, filterType, sortBy]);

  const getMetricIcon = (type: MetricType) => {
    const config = metricTypeConfig[type];
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Metrics History
          </CardTitle>
          <CardDescription>Loading metrics history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Metrics History
            </CardTitle>
            <CardDescription>
              All your submitted PLANT metrics ({filteredMetrics.length}{" "}
              entries)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={filterType}
              onValueChange={(value) =>
                setFilterType(value as MetricType | "all")
              }
            >
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(metricTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <config.icon className={`h-4 w-4 ${config.color}`} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "date" | "value" | "type")
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="value">By Value</SelectItem>
                <SelectItem value="type">By Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredMetrics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No metrics found.</p>
            <p className="text-sm">
              {filterType === "all"
                ? "Start adding metrics to see your history!"
                : `No ${
                    metricTypeConfig[filterType as MetricType]?.label
                  } metrics found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell>
                      {format(new Date(metric.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 w-fit"
                      >
                        {getMetricIcon(metric.metric_type)}
                        {metricTypeConfig[metric.metric_type].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {metric.metric_type === "trade"
                        ? `KES ${Number(metric.value).toLocaleString()}`
                        : Number(metric.value).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={metric.description}>
                        {metric.description || "No description"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricsHistory;
