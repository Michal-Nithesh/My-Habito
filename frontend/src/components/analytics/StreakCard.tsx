import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingUp, Award } from 'lucide-react';

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
  showBreakAlert?: boolean;
}

export function StreakCard({ currentStreak, bestStreak, showBreakAlert }: StreakCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Streak Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Current Streak */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Current Streak</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">
              {currentStreak}
              <span className="text-sm font-normal text-muted-foreground ml-2">days</span>
            </div>
            {showBreakAlert && currentStreak === 0 && (
              <p className="text-xs text-red-500">⚠️ Streak broken! Start again today.</p>
            )}
          </div>

          {/* Best Streak */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>Longest Streak</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {bestStreak}
              <span className="text-sm font-normal text-muted-foreground ml-2">days</span>
            </div>
            {currentStreak === bestStreak && currentStreak > 0 && (
              <p className="text-xs text-green-600">🎉 New record!</p>
            )}
          </div>
        </div>

        {/* Visual representation */}
        <div className="mt-6">
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(currentStreak, 30) }).map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                style={{ opacity: 1 - (i / 30) * 0.5 }}
              />
            ))}
          </div>
          {currentStreak > 30 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Showing last 30 days of {currentStreak} day streak
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
