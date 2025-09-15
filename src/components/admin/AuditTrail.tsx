import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Shield, 
  Search, 
  Filter,
  Eye,
  User,
  Building,
  CreditCard,
  FileText,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  table_name: string | null;
  user_id: string | null;
  created_at: string;
  new_values: any;
  old_values: any;
  record_id: string | null;
}

const AuditTrail: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const { logs, totalCount } = await adminService.getAuditLogs(currentPage, 20);
      setAuditLogs(logs);
      setTotalCount(totalCount);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="h-4 w-4" />;
    if (action.includes('chapter')) return <Building className="h-4 w-4" />;
    if (action.includes('trade') || action.includes('payment')) return <CreditCard className="h-4 w-4" />;
    if (action.includes('report')) return <FileText className="h-4 w-4" />;
    if (action.includes('settings')) return <Settings className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getActionBadge = (action: string) => {
    if (action.includes('created')) return <Badge className="bg-success text-success-foreground">Created</Badge>;
    if (action.includes('updated')) return <Badge variant="secondary">Updated</Badge>;
    if (action.includes('deleted')) return <Badge variant="destructive">Deleted</Badge>;
    if (action.includes('login')) return <Badge variant="outline">Login</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  const getSeverityLevel = (action: string) => {
    if (action.includes('deleted') || action.includes('password_reset')) return 'high';
    if (action.includes('updated') || action.includes('created')) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const formatActionDescription = (log: AuditLog) => {
    switch (log.action) {
      case 'user_created':
        return 'New user account created';
      case 'user_updated':
        return 'User profile updated';
      case 'user_deleted':
        return 'User account deleted';
      case 'chapter_created':
        return 'New chapter created';
      case 'chapter_updated':
        return 'Chapter information updated';
      case 'chapter_deleted':
        return 'Chapter deleted';
      case 'trade_created':
        return 'New trade declared';
      case 'payment_reconciled':
        return 'Payment manually reconciled';
      case 'invoice_resent':
        return 'Invoice resent to member';
      case 'report_generated':
        return 'System report generated';
      case 'password_reset_sent':
        return 'Password reset email sent';
      default:
        return log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatActionDescription(log).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === '' || log.action.includes(actionFilter);
    
    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Trail
          </h3>
          <p className="text-muted-foreground">
            Complete log of all administrative actions and system changes
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {filteredLogs.filter(log => getSeverityLevel(log.action) === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Actions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLogs.filter(log => 
                new Date(log.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Since midnight</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredLogs.filter(log => log.user_id).map(log => log.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique users</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={setActionFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                <SelectItem value="user">User Actions</SelectItem>
                <SelectItem value="chapter">Chapter Actions</SelectItem>
                <SelectItem value="trade">Trade Actions</SelectItem>
                <SelectItem value="payment">Payment Actions</SelectItem>
                <SelectItem value="report">Report Actions</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setActionFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Logs ({totalCount.toLocaleString()})
          </CardTitle>
          <CardDescription>
            Page {currentPage} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const severity = getSeverityLevel(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            {getActionBadge(log.action)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatActionDescription(log)}</div>
                            {log.table_name && (
                              <div className="text-sm text-muted-foreground">
                                Table: {log.table_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'secondary' : 'outline'}
                            className={getSeverityColor(severity)}
                          >
                            {severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">
                              {new Date(log.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(log.new_values || log.old_values) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                console.log('Audit log details:', {
                                  action: log.action,
                                  new_values: log.new_values,
                                  old_values: log.old_values,
                                  record_id: log.record_id
                                });
                                toast.info('Audit log details logged to console');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTrail;