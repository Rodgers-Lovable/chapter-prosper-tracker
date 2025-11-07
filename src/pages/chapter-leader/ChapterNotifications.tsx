import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import ChapterLeaderLayout from "@/components/chapter-leader/ChapterLeaderLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Send,
  Users,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
} from "lucide-react";
import {
  chapterLeaderService,
  ChapterMember,
} from "@/lib/services/chapterLeaderService";

const ChapterNotifications = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState<ChapterMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState<
    "metrics" | "payment" | "general"
  >("metrics");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Predefined notification templates
  const notificationTemplates = {
    metrics: {
      subject: "PLANT Metrics Submission Reminder",
      message:
        "Hi {name},\n\nThis is a friendly reminder to submit your PLANT metrics for this month. Your participation helps our chapter track growth and success.\n\nPlease log in to submit your metrics at your earliest convenience.\n\nBest regards,\nChapter Leadership",
    },
    payment: {
      subject: "Payment Reminder - Outstanding Invoice",
      message:
        "Hi {name},\n\nWe hope this message finds you well. This is a reminder that you have an outstanding invoice that requires attention.\n\nPlease review your account and process the payment at your earliest convenience.\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\nChapter Leadership",
    },
    general: {
      subject: "Chapter Update",
      message:
        "Hi {name},\n\nWe wanted to share some important updates with our chapter members.\n\n[Your message here]\n\nThank you for your continued participation and support.\n\nBest regards,\nChapter Leadership",
    },
  };

  useEffect(() => {
    const fetchMembers = async () => {
      if (!profile?.chapter_id) return;

      setLoading(true);
      try {
        const result = await chapterLeaderService.getChapterMembers(
          profile.chapter_id
        );
        if (result.error) {
          throw new Error(result.error);
        }
        setMembers(result.data || []);
      } catch (error) {
        console.error("Error fetching members:", error);
        toast({
          title: "Error loading members",
          description: "Please try refreshing the page",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [profile?.chapter_id, toast]);

  // Load template when notification type changes
  useEffect(() => {
    const template = notificationTemplates[notificationType];
    setSubject(template.subject);
    setMessage(template.message);
  }, [notificationType]);

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map((member) => member.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSendNotifications = async () => {
    if (selectedMembers.length === 0) {
      toast({
        title: "No recipients selected",
        description:
          "Please select at least one member to send notifications to",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Send notifications to selected members
      for (const memberId of selectedMembers) {
        await chapterLeaderService.sendMemberReminder(
          memberId,
          notificationType,
          message
        );
      }

      toast({
        title: "Notifications sent successfully",
        description: `${selectedMembers.length} notification(s) sent to chapter members`,
        variant: "default",
      });

      // Reset form
      setSelectedMembers([]);
      const template = notificationTemplates[notificationType];
      setSubject(template.subject);
      setMessage(template.message);
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Error sending notifications",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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

  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Chapter Notifications
            </h1>
            <p className="text-muted-foreground">
              Send reminders and updates to your chapter members
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {members.length} Members
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notification Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notification Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Choose the type of notification and customize the message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-type">Notification Type</Label>
                  <Select
                    value={notificationType}
                    onValueChange={(value: "metrics" | "payment" | "general") =>
                      setNotificationType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metrics">
                        Metrics Submission Reminder
                      </SelectItem>
                      <SelectItem value="payment">Payment Reminder</SelectItem>
                      <SelectItem value="general">
                        General Chapter Update
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter notification subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{name}"} to personalize with member names
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Send Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleSendNotifications}
                  disabled={sending || selectedMembers.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <LoadingSpinner />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send to {selectedMembers.length} Member
                      {selectedMembers.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Member Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Recipients
              </CardTitle>
              <CardDescription>
                Choose which members will receive the notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedMembers.length === members.length &&
                    members.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Select All ({members.length})
                </Label>
              </div>

              {/* Member List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) =>
                        handleMemberToggle(member.id, checked as boolean)
                      }
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {member.lastActivity &&
                      new Date(member.lastActivity).getTime() <
                        Date.now() - 30 * 24 * 60 * 60 * 1000 && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                  </div>
                ))}
              </div>

              {members.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common notification scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => {
                  // Select inactive members (no activity in 30 days)
                  const inactiveMembers = members.filter(
                    (member) =>
                      !member.lastActivity ||
                      new Date(member.lastActivity).getTime() <
                        Date.now() - 30 * 24 * 60 * 60 * 1000
                  );
                  setSelectedMembers(inactiveMembers.map((m) => m.id));
                  setNotificationType("metrics");
                }}
              >
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Remind Inactive Members
                </span>
                <span className="text-xs text-muted-foreground">
                  Select members with no recent activity
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => {
                  setSelectedMembers(members.map((m) => m.id));
                  setNotificationType("general");
                }}
              >
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Chapter Announcement
                </span>
                <span className="text-xs text-muted-foreground">
                  Send update to all members
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => {
                  // You could select members with pending payments here
                  setNotificationType("payment");
                }}
              >
                <Mail className="h-5 w-5" />
                <span className="text-sm font-medium">Payment Reminders</span>
                <span className="text-xs text-muted-foreground">
                  Send payment reminder notifications
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterNotifications;
