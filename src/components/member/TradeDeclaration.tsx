import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DollarSign, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { tradesService } from '@/lib/services/tradesService';
import { toast } from '@/hooks/use-toast';

const tradeSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  source_member_id: z.string().optional(),
  beneficiary_member_id: z.string().optional()
});

type TradeFormData = z.infer<typeof tradeSchema>;

interface TradeDeclarationProps {
  onTradeAdded?: () => void;
}

const TradeDeclaration: React.FC<TradeDeclarationProps> = ({ onTradeAdded }) => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [chapterMembers, setChapterMembers] = useState<any[]>([]);

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      amount: 0,
      description: '',
      source_member_id: '',
      beneficiary_member_id: ''
    }
  });

  useEffect(() => {
    const loadChapterMembers = async () => {
      if (!profile?.chapter_id) return;

      const { data, error } = await tradesService.getChapterMembers(profile.chapter_id);
      if (!error && data) {
        // Filter out current user
        const otherMembers = data.filter(member => member.id !== profile.id);
        setChapterMembers(otherMembers);
      }
    };

    loadChapterMembers();
  }, [profile]);

  const onSubmit = async (data: TradeFormData) => {
    if (!profile?.id || !profile?.chapter_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Profile information is missing. Please refresh and try again."
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await tradesService.createTrade({
        user_id: profile.id,
        chapter_id: profile.chapter_id,
        amount: data.amount,
        description: data.description,
        source_member_id: data.source_member_id || null,
        beneficiary_member_id: data.beneficiary_member_id || null,
        status: 'pending'
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to declare trade. Please try again."
        });
        return;
      }

      form.reset({
        amount: 0,
        description: '',
        source_member_id: '',
        beneficiary_member_id: ''
      });

      onTradeAdded?.();
      toast({
        title: "Success",
        description: "Trade declared successfully! Payment processing will begin shortly."
      });

      // TODO: Trigger MPESA STK Push here
      // This would typically call an edge function for payment processing
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Declare Trade
        </CardTitle>
        <CardDescription>
          Record a business transaction and initiate payment processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (KES)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Enter amount in KES"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the business transaction, products/services exchanged..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source_member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Member (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {chapterMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{member.full_name}</div>
                                {member.business_name && (
                                  <div className="text-xs text-muted-foreground">{member.business_name}</div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficiary_member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary Member (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select beneficiary" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {chapterMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{member.full_name}</div>
                                {member.business_name && (
                                  <div className="text-xs text-muted-foreground">{member.business_name}</div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Payment Process</h4>
              <p className="text-sm text-muted-foreground">
                After declaring this trade, you will receive an MPESA STK push to complete payment. 
                If payment is not completed within 5 minutes, an invoice will be generated and sent to your email.
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Declaring Trade...' : 'Declare Trade & Initiate Payment'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TradeDeclaration;