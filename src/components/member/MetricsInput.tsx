import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  Users,
  GraduationCap,
  Activity,
  Network,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { metricsService, MetricType } from "@/lib/services/metricsService";
import { toast } from "@/hooks/use-toast";

const metricSchema = z.object({
  metric_type: z.enum([
    "participation",
    "learning",
    "activity",
    "networking",
    "trade",
  ]),
  value: z.number().min(0, "Value must be positive"),
  description: z.string().optional(),
  date: z.date(),
});

type MetricFormData = z.infer<typeof metricSchema>;

interface MetricsInputProps {
  onMetricAdded?: () => void;
}

const metricTypeOptions = [
  {
    value: "participation" as MetricType,
    label: "Participation",
    icon: Users,
    description: "Attendance, punctuality, consistency",
    placeholder: "e.g., Attended weekly meeting (score 1-10)",
  },
  {
    value: "learning" as MetricType,
    label: "Learning",
    icon: GraduationCap,
    description: "Study hours, mentorship, training",
    placeholder: "e.g., Completed 2 hours of training",
  },
  {
    value: "activity" as MetricType,
    label: "Activity",
    icon: Activity,
    description: "Referrals given/received, chapter involvement",
    placeholder: "e.g., Gave 3 referrals this week",
  },
  {
    value: "networking" as MetricType,
    label: "Networking",
    icon: Network,
    description: "Meetings, partnerships created",
    placeholder: "e.g., Had 5 one-on-one meetings",
  },
  {
    value: "trade" as MetricType,
    label: "Trade",
    icon: DollarSign,
    description: "Deals closed, value of transactions",
    placeholder: "e.g., Closed deals worth KES 50,000",
  },
];

const MetricsInput: React.FC<MetricsInputProps> = ({ onMetricAdded }) => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MetricFormData>({
    resolver: zodResolver(metricSchema),
    defaultValues: {
      metric_type: "participation",
      value: 0,
      description: "",
      date: new Date(),
    },
  });

  const selectedMetricType = form.watch("metric_type");
  const selectedMetric = metricTypeOptions.find(
    (option) => option.value === selectedMetricType
  );

  const onSubmit = async (data: MetricFormData) => {
    if (!profile?.id || !profile?.chapter_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Profile information is missing. Please refresh and try again.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await metricsService.addMetric({
        user_id: profile.id,
        chapter_id: profile.chapter_id,
        metric_type: data.metric_type,
        value: data.value,
        description: data.description,
        date: format(data.date, "yyyy-MM-dd"),
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add metric. Please try again.",
        });
        return;
      }

      form.reset({
        metric_type: "participation",
        value: 0,
        description: "",
        date: new Date(),
      });

      onMetricAdded?.();
      toast({
        title: "Success",
        description: "Metric added successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {selectedMetric && <selectedMetric.icon className="h-5 w-5" />}
          Add PLANT Metrics
        </CardTitle>
        <CardDescription>
          Record your business networking activities and achievements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="metric_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metric Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a metric type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {metricTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">
                                  {option.label}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter numeric value"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedMetric?.value === "trade"
                      ? "Enter amount in KES"
                      : "Enter a numeric value (hours, count, score, etc.)"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        selectedMetric?.placeholder ||
                        "Add details about this metric..."
                      }
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2020-01-01")
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Adding..." : "Add Metric"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MetricsInput;
