import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  TrendingUp,
  Eye,
  UserCheck,
  UserPlus,
  CheckSquare,
  Square,
  Filter,
  Calendar,
  DollarSign,
  BarChart3
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
  const [activityFilter, setActivityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [reminderDialog, setReminderDialog] = useState<{ open: boolean; members: ChapterMember[] }>({ open: false, members: [] });
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderType, setReminderType] = useState<'metrics' | 'payment'>('metrics');
  const [profileModal, setProfileModal] = useState<{ open: boolean; member?: ChapterMember }>({ open: false });
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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
    if (reminderDialog.members.length === 0) return;

    setBulkActionLoading(true);
    try {
      const promises = reminderDialog.members.map(member =>
        chapterLeaderService.sendMemberReminder(member.id, reminderType, reminderMessage)
      );
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        toast({
          title: "Reminders sent successfully",
          description: `${successCount} reminder(s) sent successfully`,
        });
        setReminderDialog({ open: false, members: [] });
        setReminderMessage('');
        setSelectedMembers(new Set());
      } else {
        toast({
          title: "Failed to send reminders",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: "Error sending reminders",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleMemberAction = async (memberId: string, action: 'activate' | 'deactivate' | 'resend_invite') => {
    try {
      let result;
      switch (action) {
        case 'activate':
          result = await chapterLeaderService.updateMemberStatus(memberId, 'active');
          break;
        case 'deactivate':
          result = await chapterLeaderService.updateMemberStatus(memberId, 'inactive');
          break;
        case 'resend_invite':
          result = await chapterLeaderService.resendMemberInvite(memberId);
          break;
      }

      if (result?.success) {
        toast({
          title: "Action completed",
          description: `Member ${action.replace('_', ' ')} successful`,
        });
        fetchMembers(); // Refresh the list
      } else {
        toast({
          title: "Action failed",
          description: result?.error || "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error ${action} member:`, error);
      toast({
        title: "Error",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'send_reminder') => {
    const selectedMembersList = members.filter(m => selectedMembers.has(m.id));
    
    if (selectedMembersList.length === 0) {
      toast({
        title: "No members selected",
        description: "Please select members first",
        variant: "destructive"
      });
      return;
    }

    if (action === 'send_reminder') {
      setReminderDialog({ open: true, members: selectedMembersList });
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedMembersList.map(member =>
        chapterLeaderService.updateMemberStatus(member.id, action === 'activate' ? 'active' : 'inactive')
      );
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r?.success).length;
      
      if (successCount > 0) {
        toast({
          title: "Bulk action completed",
          description: `${successCount} member(s) ${action}d successfully`,
        });
        setSelectedMembers(new Set());
        fetchMembers();
      }
    } catch (error) {
      console.error('Error with bulk action:', error);
      toast({
        title: "Bulk action failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMembers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
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

    let matchesActivity = true;
    if (activityFilter !== 'all' && member.lastActivity) {
      const daysSinceActivity = Math.floor((Date.now() - new Date(member.lastActivity).getTime()) / (1000 * 60 * 60 * 24));
      switch (activityFilter) {
        case 'week':
          matchesActivity = daysSinceActivity <= 7;
          break;
        case 'month':
          matchesActivity = daysSinceActivity <= 30;
          break;
        case 'inactive_30':
          matchesActivity = daysSinceActivity > 30;
          break;
      }
    } else if (activityFilter !== 'all' && !member.lastActivity) {
      matchesActivity = activityFilter === 'inactive_30';
    }

    return matchesSearch && matchesStatus && matchesActivity;
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
            <Button 
              variant="outline"
              onClick={() => handleBulkAction('send_reminder')}
              disabled={selectedMembers.size === 0 || bulkActionLoading}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Reminder ({selectedMembers.size})
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleBulkAction('activate')}
              disabled={selectedMembers.size === 0 || bulkActionLoading}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Activate ({selectedMembers.size})
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleBulkAction('deactivate')}
              disabled={selectedMembers.size === 0 || bulkActionLoading}
            >
              <UserX className="mr-2 h-4 w-4" />
              Deactivate ({selectedMembers.size})
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
            <div className="space-y-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activity</SelectItem>
                    <SelectItem value="week">Active this week</SelectItem>
                    <SelectItem value="month">Active this month</SelectItem>
                    <SelectItem value="inactive_30">Inactive 30+ days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedMembers.size > 0 && (
                <div className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg border">
                  <span className="text-sm font-medium text-primary">
                    {selectedMembers.size} member(s) selected
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedMembers(new Set())}
                    className="text-primary hover:text-primary/80"
                  >
                    Clear selection
                  </Button>
                </div>
              )}
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all members"
                        />
                      </TableHead>
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
                      <TableRow key={member.id} className={selectedMembers.has(member.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedMembers.has(member.id)}
                            onCheckedChange={() => toggleMemberSelection(member.id)}
                            aria-label={`Select ${member.full_name}`}
                          />
                        </TableCell>
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
                                onClick={() => setProfileModal({ open: true, member })}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setReminderDialog({ open: true, members: [member] })}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Reminder
                              </DropdownMenuItem>
                              {member.isInactive ? (
                                <DropdownMenuItem
                                  onClick={() => handleMemberAction(member.id, 'activate')}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate Member
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleMemberAction(member.id, 'deactivate')}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate Member
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleMemberAction(member.id, 'resend_invite')}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Resend Invite
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

        {/* Member Profile Modal */}
        <Dialog open={profileModal.open} onOpenChange={(open) => setProfileModal({ open })}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl">Member Profile</DialogTitle>
              <DialogDescription>
                Detailed information for {profileModal.member?.full_name}
              </DialogDescription>
            </DialogHeader>
            {profileModal.member && (
              <ScrollArea className="max-h-[60vh] pr-4">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics History</TabsTrigger>
                    <TabsTrigger value="trades">Trade History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                          <p className="text-sm">{profileModal.member.full_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p className="text-sm">{profileModal.member.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-sm">{profileModal.member.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Role</label>
                          <Badge variant="outline">{profileModal.member.role}</Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                          <p className="text-sm">{profileModal.member.business_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                          <p className="text-sm">
                            {new Date(profileModal.member.created_at).toLocaleDateString('en-KE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                          <p className="text-sm">{formatLastActivity(profileModal.member.lastActivity)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          {profileModal.member.isInactive ? (
                            <Badge variant="outline" className="text-warning border-warning">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-success border-success">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="metrics" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { label: 'Participation', value: profileModal.member.metrics?.participation || 0, icon: Users },
                        { label: 'Learning', value: profileModal.member.metrics?.learning || 0, icon: BarChart3 },
                        { label: 'Activity', value: profileModal.member.metrics?.activity || 0, icon: TrendingUp },
                        { label: 'Networking', value: profileModal.member.metrics?.networking || 0, icon: Users },
                        { label: 'Trade', value: profileModal.member.metrics?.trade || 0, icon: DollarSign }
                      ].map((metric) => (
                        <Card key={metric.label} className="p-3">
                          <div className="flex items-center gap-2">
                            <metric.icon className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">{metric.label}</p>
                              <p className="text-lg font-bold text-primary">{metric.value}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div className="text-center py-6 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p>Detailed metrics history coming soon</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="trades" className="space-y-4">
                    <div className="text-center py-6 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p>Trade history coming soon</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* Reminder Dialog */}
        <Dialog open={reminderDialog.open} onOpenChange={(open) => setReminderDialog({ open, members: [] })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Reminder</DialogTitle>
              <DialogDescription>
                {reminderDialog.members.length === 1 
                  ? `Send a reminder to ${reminderDialog.members[0]?.full_name}`
                  : `Send a reminder to ${reminderDialog.members.length} selected members`
                }
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
              <Button variant="outline" onClick={() => setReminderDialog({ open: false, members: [] })}>
                Cancel
              </Button>
              <Button onClick={handleSendReminder} disabled={bulkActionLoading}>
                {bulkActionLoading ? 'Sending...' : 'Send Reminder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterMembers;