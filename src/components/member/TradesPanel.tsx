import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { TradeWithProfiles } from '@/lib/services/tradesService';
import { format } from 'date-fns';

interface TradesPanelProps {
  trades: TradeWithProfiles[];
  isLoading?: boolean;
  onViewInvoice?: (tradeId: string) => void;
  onRetryPayment?: (tradeId: string) => void;
}

const TradesPanel: React.FC<TradesPanelProps> = ({ 
  trades, 
  isLoading, 
  onViewInvoice, 
  onRetryPayment 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'invoiced':
        return <FileText className="h-4 w-4 text-info" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'invoiced':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Trades & Transactions
          </CardTitle>
          <CardDescription>Loading trades...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
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
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Trades & Transactions
        </CardTitle>
        <CardDescription>
          Your declared trades and their payment status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trades declared yet.</p>
            <p className="text-sm">Start by declaring your first trade!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      {format(new Date(trade.created_at || ''), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-mono">
                      KES {trade.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusVariant(trade.status)} 
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(trade.status)}
                        {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={trade.description}>
                        {trade.description || 'No description'}
                      </div>
                      {trade.source_member && (
                        <div className="text-xs text-muted-foreground">
                          From: {trade.source_member.full_name}
                        </div>
                      )}
                      {trade.beneficiary_member && (
                        <div className="text-xs text-muted-foreground">
                          To: {trade.beneficiary_member.full_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {trade.status === 'invoiced' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewInvoice?.(trade.id!)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Invoice
                          </Button>
                        )}
                        {trade.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRetryPayment?.(trade.id!)}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        )}
                        {trade.mpesa_reference && (
                          <div className="text-xs text-muted-foreground">
                            Ref: {trade.mpesa_reference}
                          </div>
                        )}
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

export default TradesPanel;