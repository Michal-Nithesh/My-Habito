import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StreakCard } from '@/components/analytics/StreakCard';
import { CompletionRateCard } from '@/components/analytics/CompletionRateCard';
import { TrendAnalysisCard } from '@/components/analytics/TrendAnalysisCard';
import { WeeklyChartCard } from '@/components/analytics/WeeklyChartCard';
import { MonthlyChartCard } from '@/components/analytics/MonthlyChartCard';
import { DonutChartCard } from '@/components/analytics/DonutChartCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useHabitsStore } from '@/stores/habitsStore';
import { DetailedHabitStatistics, OverviewStatistics } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { BarChart3, TrendingUp, Target, Activity } from 'lucide-react';

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState<OverviewStatistics | null>(null);
  const [habitStats, setHabitStats] = useState<DetailedHabitStatistics[]>([]);
  const { habits } = useHabitsStore();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Fetch overview statistics
      const overviewResponse = await api.get<OverviewStatistics>('/statistics/overview');
      setOverviewStats(overviewResponse.data);

      // Fetch detailed statistics for each active habit
      const activeHabits = habits.filter((h) => !h.archived);
      const statsPromises = activeHabits.slice(0, 5).map((habit) =>
        api
          .get<DetailedHabitStatistics>(`/statistics/habit/${habit.id}/detailed`)
          .then((res) => res.data)
          .catch(() => null)
      );

      const stats = await Promise.all(statsPromises);
      setHabitStats(stats.filter((s) => s !== null) as DetailedHabitStatistics[]);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Calculate aggregate stats from all habits
  const aggregateStats = habitStats.reduce(
    (acc, stat) => {
      acc.totalCompletions += stat.total_repetitions;
      acc.avgCompletionRate += stat.completion_rate;
      acc.maxStreak = Math.max(acc.maxStreak, stat.current_streak);
      acc.bestStreak = Math.max(acc.bestStreak, stat.best_streak);
      
      // Count status distribution from habit data
      // Note: You might need to add this data to the API response
      return acc;
    },
    {
      totalCompletions: 0,
      avgCompletionRate: 0,
      maxStreak: 0,
      bestStreak: 0,
    }
  );

  if (habitStats.length > 0) {
    aggregateStats.avgCompletionRate /= habitStats.length;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Statistics & Analytics</h2>
          <p className="text-muted-foreground">
            Track your progress, analyze trends, and celebrate your achievements
          </p>
        </div>

        {/* Overview Cards */}
        {overviewStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.active_habits}</div>
                <p className="text-xs text-muted-foreground">
                  {overviewStats.archived_habits} archived
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.total_repetitions}</div>
                <p className="text-xs text-muted-foreground">
                  {overviewStats.total_repetitions_today} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.longest_streak}</div>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregateStats.avgCompletionRate.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">across all habits</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Individual Habit Statistics */}
        {habitStats.length > 0 ? (
          habitStats.map((stat) => (
            <div key={stat.habit_id} className="mb-12">
              <h3 className="text-2xl font-bold mb-6">{stat.habit_name}</h3>

              {/* Streaks, Completion Rate, and Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <StreakCard
                  currentStreak={stat.current_streak}
                  bestStreak={stat.best_streak}
                  showBreakAlert={true}
                />
                <CompletionRateCard
                  completionPercentage={stat.completion_rate}
                  completedDays={stat.total_repetitions}
                  totalDays={stat.total_days_tracked}
                  heatmapData={stat.calendar_heatmap}
                />
                {stat.trend_data && <TrendAnalysisCard trendData={stat.trend_data} />}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <WeeklyChartCard data={stat.weekly_data} />
                <MonthlyChartCard data={stat.monthly_data} />
              </div>

              {/* Status Distribution
              <DonutChartCard
                completed={80}
                partial={10}
                skipped={5}
                failed={5}
              /> */}
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No statistics available yet. Start tracking your habits to see insights!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

