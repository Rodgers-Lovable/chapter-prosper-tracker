import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Search,
  Mail,
  UserX,
  MoreHorizontal,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { chapterLeaderService, ChapterMember } from '@/lib/services/chapterLeaderService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ChapterMembers = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<ChapterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [reminderDialog, setReminderDialog] = useState<{ open: boolean; member?: ChapterMember }>({ open: false });
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderType, setReminderType] = useState<'metrics' | 'payment'>('metrics');

  const pageSize = 20;

  useEffect(() => {
    fetchMembers();
  }, [profile?.chapter_id, currentPage]);

  const fetchMembers = async () => {
    if (!profile?.chapter_id) return;

    setLoading(true);
    try {
      const result = await chapterLeaderService.getChapterMembers(
        profile.chapter_id,
        currentPage,
        pageSize
      );

      if (result.error) {
        console.error('Error fetching members:', result.error);
        toast({
          title: "Error fetching members",
          description: "Please try refreshing the page",
          variant: "destructive"
        });
      } else {
        setMembers(result.data || []);
        setTotalCount(result.totalCount);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error loading members",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!reminderDialog.member) return;

    try {
      const result = await chapterLeaderService.sendMemberReminder(
        reminderDialog.member.id,
        reminderType,
        reminderMessage
      );

      if (result.success) {
        toast({
          title: "Reminder sent successfully",
          description: `Reminder sent to ${reminderDialog.member.full_name}`,
        });
        setReminderDialog({ open: false });
        setReminderMessage('');
      } else {
        toast({
          title: "Failed to send reminder",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error sending reminder",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'M';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return 'Never';
    
    const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && !member.isInactive) ||
      (statusFilter === 'inactive' && member.isInactive);

    return matchesSearch && matchesStatus;
  });

  const inactiveCount = members.filter(m => m.isInactive).length;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Chapter Members
            </h2>
            <p className="text-muted-foreground">
              Manage and monitor your chapter members
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Bulk Reminder
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">
                Active chapter members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Members</CardTitle>
              <UserX className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{inactiveCount}</div>
              <p className="text-xs text-muted-foreground">
                No activity in 14+ days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {totalCount > 0 ? Math.round(((totalCount - inactiveCount) / totalCount) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Members active this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Member Directory</CardTitle>
            <CardDescription>
              Search and filter chapter members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name, business, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Members Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Metrics Score</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.full_name || 'No name'}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.business_name || 'Not specified'}</div>
                            <div className="text-sm text-muted-foreground">{member.phone || 'No phone'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{member.email}</div>
                            {member.phone && <div className="text-muted-foreground">{member.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{member.metrics?.total || 0}</div>
                            <div className="text-xs text-muted-foreground">
                              P:{member.metrics?.participation || 0} L:{member.metrics?.learning || 0} 
                              A:{member.metrics?.activity || 0} N:{member.metrics?.networking || 0} 
                              T:{member.metrics?.trade || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatLastActivity(member.lastActivity)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.isInactive ? (
                            <Badge variant="outline" className="text-warning border-warning">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-success border-success">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setReminderDialog({ open: true, member })}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Reminder
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredMembers.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No members found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'No members in this chapter yet'
                      }
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} members
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Reminder Dialog */}
        <Dialog open={reminderDialog.open} onOpenChange={(open) => setReminderDialog({ open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Reminder</DialogTitle>
              <DialogDescription>
                Send a reminder to {reminderDialog.member?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reminder Type</label>
                <Select value={reminderType} onValueChange={(value) => setReminderType(value as 'metrics' | 'payment')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metrics">PLANT Metrics Submission</SelectItem>
                    <SelectItem value="payment">Payment Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter your reminder message..."
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReminderDialog({ open: false })}>
                Cancel
              </Button>
              <Button onClick={handleSendReminder} disabled={!reminderMessage.trim()}>
                Send Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterMembers;