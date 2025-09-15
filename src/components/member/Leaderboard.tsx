import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  business_name: string;
  total: number;
  metrics: {
    participation: number;
    learning: number;
    activity: number;
    networking: number;
    trade: number;
  };
}

interface LeaderboardProps {
  data: LeaderboardEntry[];
  currentUserId: string;
  isLoading?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  data, 
  currentUserId, 
  isLoading 
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Chapter Leaderboard
          </CardTitle>
          <CardDescription>Loading leaderboard...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="w-16 h-6 bg-muted rounded" />
              </div>
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
          <TrendingUp className="h-5 w-5" />
          Chapter Leaderboard
        </CardTitle>
        <CardDescription>
          Top performers in your chapter this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No metrics data available yet.</p>
            <p className="text-sm">Start adding metrics to see the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 10).map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  entry.user_id === currentUserId
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/20 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>

                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10">
                    {getInitials(entry.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {entry.full_name}
                      {entry.user_id === currentUserId && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          You
                        </Badge>
                      )}
                    </p>
                  </div>
                  {entry.business_name && (
                    <p className="text-sm text-muted-foreground truncate">
                      {entry.business_name}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg">
                    {entry.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Points
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;