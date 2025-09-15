import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Mail, 
  Send,
  Users,
  Building,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/lib/services/adminService';

type NotificationType = 'reminder' | 'announcement' | 'recognition' | 'invoice' | 'system';
type RecipientType = 'all' | 'chapter' | 'role' | 'custom';

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: NotificationType;
}

const NotificationManagement: React.FC = () => {
  const [sending, setSending] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState({
    type: 'reminder' as NotificationType,
    recipientType: 'all' as RecipientType,
    subject: '',
    message: '',
    chapterId: '',
    role: '',
    customRecipients: '',
    scheduleDate: '',
    scheduleTime: ''
  });

  const notificationTypes = [
    { 
      value: 'reminder', 
      label: 'Reminder', 
      description: 'PLANT metric submissions, unpaid invoices, etc.',
      icon: Clock
    },
    { 
      value: 'announcement', 
      label: 'Announcement', 
      description: 'System updates, new features, important news',
      icon: Mail
    },
    { 
      value: 'recognition', 
      label: 'Recognition', 
      description: 'Top performer awards, milestone achievements',
      icon: CheckCircle
    },
    { 
      value: 'invoice', 
      label: 'Invoice Notification', 
      description: 'Payment reminders and invoice updates',
      icon: AlertCircle
    },
    { 
      value: 'system', 
      label: 'System Alert', 
      description: 'Maintenance notifications, urgent updates',
      icon: AlertCircle
    }
  ];

  const templates: NotificationTemplate[] = [
    {
      id: '1',
      name: 'Monthly PLANT Reminder',
      subject: 'Monthly PLANT Metrics Due - Submit by [DATE]',
      body: `Dear [NAME],

This is a friendly reminder that your monthly PLANT metrics are due for submission.

Please log into your dashboard and submit your metrics by [DATE] to maintain your active status in the chapter.

Your participation helps us track the growth and success of our business networking community.

Best regards,
The PLANT Team`,
      type: 'reminder'
    },
    {
      id: '2',
      name: 'Invoice Payment Reminder',
      subject: 'Payment Reminder: Invoice [INVOICE_NUMBER]',
      body: `Dear [NAME],

This is a reminder that invoice [INVOICE_NUMBER] for [AMOUNT] is currently unpaid.

Please settle this invoice at your earliest convenience to maintain your good standing in the chapter.

You can view and download your invoice from your dashboard.

Thank you for your prompt attention to this matter.

Best regards,
The PLANT Team`,
      type: 'invoice'
    },
    {
      id: '3',
      name: 'Top Performer Recognition',
      subject: 'Congratulations! You\'re This Month\'s Top Performer',
      body: `Dear [NAME],

Congratulations! We're delighted to announce that you've been recognized as this month's top performer in [CHAPTER_NAME].

Your outstanding contribution of [AMOUNT] in business referrals demonstrates the true spirit of our networking community.

Keep up the excellent work!

Best regards,
The PLANT Team`,
      type: 'recognition'
    }
  ];

  const sendNotification = async () => {
    try {
      setSending(true);

      // Validate required fields
      if (!notificationConfig.subject.trim() || !notificationConfig.message.trim()) {
        toast.error('Please provide both subject and message');
        return;
      }

      // Calculate recipient count (mock calculation)
      let recipientCount = 0;
      switch (notificationConfig.recipientType) {
        case 'all':
          recipientCount = 1248; // Total members from dashboard
          break;
        case 'chapter':
          recipientCount = 42; // Mock chapter size
          break;
        case 'role':
          recipientCount = notificationConfig.role === 'chapter_leader' ? 15 : 1233;
          break;
        case 'custom':
          recipientCount = notificationConfig.customRecipients.split(',').length;
          break;
      }

      // Log the notification
      await adminService.logAdminAction('notification_sent', {
        type: notificationConfig.type,
        recipient_type: notificationConfig.recipientType,
        recipient_count: recipientCount,
        subject: notificationConfig.subject,
        scheduled: !!notificationConfig.scheduleDate
      });

      // Simulate sending delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (notificationConfig.scheduleDate) {
        toast.success(`Notification scheduled for ${notificationConfig.scheduleDate} at ${notificationConfig.scheduleTime || '09:00'}`);
      } else {
        toast.success(`Notification sent successfully to ${recipientCount.toLocaleString()} recipients`);
      }

      // Reset form
      setNotificationConfig({
        type: 'reminder',
        recipientType: 'all',
        subject: '',
        message: '',
        chapterId: '',
        role: '',
        customRecipients: '',
        scheduleDate: '',
        scheduleTime: ''
      });

    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const useTemplate = (template: NotificationTemplate) => {
    setNotificationConfig(prev => ({
      ...prev,
      type: template.type,
      subject: template.subject,
      message: template.body
    }));
  };

  const selectedType = notificationTypes.find(type => type.value === notificationConfig.type);
  const SelectedIcon = selectedType?.icon || Mail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notification Management
          </h3>
          <p className="text-muted-foreground">
            Send bulk notifications and manage communication with members
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent This Month</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">84.2%</div>
            <p className="text-xs text-muted-foreground">Above industry average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">8</div>
            <p className="text-xs text-muted-foreground">Pending delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Composer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SelectedIcon className="h-5 w-5" />
              Compose Notification
            </CardTitle>
            <CardDescription>
              Create and send notifications to members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notification Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Type</label>
              <Select
                value={notificationConfig.type}
                onValueChange={(value: NotificationType) => setNotificationConfig(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div>{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipients</label>
              <Select
                value={notificationConfig.recipientType}
                onValueChange={(value: RecipientType) => setNotificationConfig(prev => ({ ...prev, recipientType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Members (1,248)
                    </div>
                  </SelectItem>
                  <SelectItem value="chapter">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Specific Chapter
                    </div>
                  </SelectItem>
                  <SelectItem value="role">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      By Role
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Custom List
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional recipient options */}
            {notificationConfig.recipientType === 'role' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={notificationConfig.role}
                  onValueChange={(value) => setNotificationConfig(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Members (1,233)</SelectItem>
                    <SelectItem value="chapter_leader">Chapter Leaders (15)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {notificationConfig.recipientType === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Addresses</label>
                <Textarea
                  placeholder="Enter email addresses separated by commas"
                  value={notificationConfig.customRecipients}
                  onChange={(e) => setNotificationConfig(prev => ({ ...prev, customRecipients: e.target.value }))}
                />
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Enter email subject"
                value={notificationConfig.subject}
                onChange={(e) => setNotificationConfig(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Enter your message here..."
                value={notificationConfig.message}
                onChange={(e) => setNotificationConfig(prev => ({ ...prev, message: e.target.value }))}
                rows={8}
              />
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="schedule"
                  checked={!!notificationConfig.scheduleDate}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setNotificationConfig(prev => ({ ...prev, scheduleDate: '', scheduleTime: '' }));
                    }
                  }}
                />
                <label htmlFor="schedule" className="text-sm font-medium">
                  Schedule for later
                </label>
              </div>

              {notificationConfig.scheduleDate !== '' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={notificationConfig.scheduleDate}
                      onChange={(e) => setNotificationConfig(prev => ({ 
                        ...prev, 
                        scheduleDate: e.target.value,
                        scheduleTime: prev.scheduleTime || '09:00'
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      type="time"
                      value={notificationConfig.scheduleTime}
                      onChange={(e) => setNotificationConfig(prev => ({ ...prev, scheduleTime: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendNotification} 
              disabled={sending || !notificationConfig.subject.trim() || !notificationConfig.message.trim()}
              className="w-full"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {notificationConfig.scheduleDate ? 'Schedule Notification' : 'Send Notification'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Message Templates</CardTitle>
            <CardDescription>
              Pre-built templates for common notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.body.substring(0, 100)}...
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => useTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationManagement;