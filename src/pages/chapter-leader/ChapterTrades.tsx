import React from 'react';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const ChapterTrades = () => {
  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Trade & Payment Oversight</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES 2.4M</div>
              <p className="text-xs text-muted-foreground">+18% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">Payment completion</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Chapter Trades</CardTitle>
            <CardDescription>Monitor and manage trade declarations from chapter members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { member: 'Sarah Kimani', amount: 125000, description: 'Web design services', status: 'paid', date: '2024-01-15' },
                { member: 'John Mwangi', amount: 85000, description: 'Marketing consultation', status: 'pending', date: '2024-01-14' },
                { member: 'Grace Wanjiku', amount: 200000, description: 'Catering services', status: 'invoiced', date: '2024-01-13' },
                { member: 'David Ochieng', amount: 45000, description: 'IT support services', status: 'paid', date: '2024-01-12' },
                { member: 'Mary Nyong', amount: 160000, description: 'Training workshop', status: 'pending', date: '2024-01-11' }
              ].map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{trade.member}</p>
                        <p className="text-sm text-muted-foreground">{trade.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right mr-6">
                    <p className="font-medium">KES {trade.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{trade.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {trade.status === 'paid' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                        Paid
                      </span>
                    )}
                    {trade.status === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                        Pending
                      </span>
                    )}
                    {trade.status === 'invoiced' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
                        Invoiced
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  All trade declarations from your chapter members are displayed here. Monitor payment status 
                  and ensure compliance with PLANT metrics tracking requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterTrades;