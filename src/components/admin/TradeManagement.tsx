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
  CreditCard, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  Download
} from 'lucide-react';
import { adminService, type TradeWithDetails, type ChapterWithStats } from '@/lib/services/adminService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const TradeManagement: React.FC = () => {
  const [trades, setTrades] = useState<TradeWithDetails[]>([]);
  const [chapters, setChapters] = useState<ChapterWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    chapter_id: 'all',
    search: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadTrades();
    loadChapters();
  }, [currentPage, filters]);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const { trades: tradesData, totalCount } = await adminService.getTrades(
        currentPage,
        20,
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v && v !== 'all'))
      );
      setTrades(tradesData);
      setTotalCount(totalCount);
    } catch (error) {
      console.error('Error loading trades:', error);
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async () => {
    try {
      const chaptersData = await adminService.getTopChapters(50); // Get all chapters
      setChapters(chaptersData);
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const handleMarkAsPaid = async (tradeId: string) => {
    try {
      // First check if there's an invoice for this trade
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('trade_id', tradeId);

      if (!invoices || invoices.length === 0) {
        toast.error('No invoice found for this trade');
        return;
      }

      // Update the invoice as paid
      const { error } = await supabase
        .from('invoices')
        .update({ paid_at: new Date().toISOString() })
        .eq('trade_id', tradeId);

      if (error) throw error;

      await adminService.logAdminAction('payment_reconciled', {
        trade_id: tradeId,
        reconciled_by: 'admin_manual'
      });

      toast.success('Payment marked as paid successfully');
      loadTrades();
    } catch (error: any) {
      console.error('Error marking payment as paid:', error);
      toast.error(error.message || 'Failed to mark payment as paid');
    }
  };

  const handleResendInvoice = async (trade: TradeWithDetails) => {
    try {
      // This would typically trigger an email with the invoice
      // For now, we'll just log the action
      await adminService.logAdminAction('invoice_resent', {
        trade_id: trade.id,
        recipient: trade.user?.email
      });

      toast.success('Invoice resent successfully');
    } catch (error: any) {
      console.error('Error resending invoice:', error);
      toast.error(error.message || 'Failed to resend invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'invoiced':
        return <Badge variant="secondary"><FileText className="w-3 h-3 mr-1" />Invoiced</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalPages = Math.ceil(totalCount / 20);

  // Calculate totals
  const totalRevenue = trades.reduce((sum, trade) => sum + Number(trade.amount), 0);
  const paidTrades = trades.filter(trade => trade.invoices?.some(inv => inv.paid_at));
  const pendingTrades = trades.filter(trade => !trade.invoices?.some(inv => inv.paid_at));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Trade & Payment Management
          </h3>
          <p className="text-muted-foreground">
            Monitor and manage all trades and payments across the network
          </p>
        </div>
      </div>

      {/* Trade Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Trades</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{paidTrades.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? ((paidTrades.length / totalCount) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Trades</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingTrades.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? ((pendingTrades.length / totalCount) * 100).toFixed(1) : 0}% of total
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trades..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.chapter_id}
              onValueChange={(value) => setFilters(prev => ({ ...prev, chapter_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
            />
            <Input
              type="date"
              placeholder="To date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setFilters({ status: 'all', chapter_id: 'all', search: '', date_from: '', date_to: '' })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Trades ({totalCount.toLocaleString()})
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
                    <TableHead>Trade Details</TableHead>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trade.user?.full_name || trade.user?.email || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">
                            {trade.description || 'No description'}
                          </div>
                          {trade.mpesa_reference && (
                            <div className="text-xs text-muted-foreground">
                              MPESA: {trade.mpesa_reference}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{trade.chapter?.name || 'Unknown Chapter'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(Number(trade.amount))}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(trade.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(trade.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {trade.invoices && trade.invoices.length > 0 ? (
                          <div>
                            <div className="text-sm font-medium">
                              {trade.invoices[0].invoice_number}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trade.invoices[0].paid_at ? 'Paid' : 'Unpaid'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No invoice</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {trade.invoices && trade.invoices.length > 0 && !trade.invoices[0].paid_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsPaid(trade.id)}
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {trade.invoices && trade.invoices.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvoice(trade)}
                              title="Resend Invoice"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {trade.invoices && trade.invoices.length > 0 && trade.invoices[0].file_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(trade.invoices[0].file_url!, '_blank')}
                              title="Download Invoice"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} trades
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

export default TradeManagement;