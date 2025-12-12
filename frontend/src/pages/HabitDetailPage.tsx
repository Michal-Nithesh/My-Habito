import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { StreakCard } from '@/components/analytics/StreakCard';
import { CompletionRateCard } from '@/components/analytics/CompletionRateCard';
import { TrendAnalysisCard } from '@/components/analytics/TrendAnalysisCard';
import { WeeklyChartCard } from '@/components/analytics/WeeklyChartCard';
import { MonthlyChartCard } from '@/components/analytics/MonthlyChartCard';
import { DonutChartCard } from '@/components/analytics/DonutChartCard';
import { ReminderDialog } from '@/components/ReminderDialog';
import { useHabitsStore } from '@/stores/habitsStore';
import { DetailedHabitStatistics, Repetition, Reminder, ReminderCreate } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Archive,
  Trash2,
  CheckCircle2,
  Bell,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits, fetchHabits } = useHabitsStore();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DetailedHabitStatistics | null>(null);
  const [recentRepetitions, setRecentRepetitions] = useState<Repetition[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  const habit = habits.find((h) => h.id === id);

  useEffect(() => {
    if (!id) return;
    fetchDetailedData();
  }, [id]);

  const fetchDetailedData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const statsResponse = await api.get<DetailedHabitStatistics>(
        `/statistics/habit/${id}/detailed`
      );
      setStatistics(statsResponse.data);

      const repsResponse = await api.get<Repetition[]>(`/habits/${id}/repetitions`, {
        params: { limit: 30 },
      });
      setRecentRepetitions(repsResponse.data);

      const remindersResponse = await api.get<Reminder[]>(`/reminders/habit/${id}`);
      setReminders(remindersResponse.data);
    } catch (error) {
      console.error('Failed to fetch habit details:', error);
      toast.error('Failed to load habit details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (data: ReminderCreate) => {
    try {
      const response = await api.post<Reminder>('/reminders', data);
      setReminders([...reminders, response.data]);
      toast.success('Reminder added successfully');
    } catch (error) {
      console.error('Failed to create reminder:', error);
      toast.error('Failed to add reminder');
      throw error;
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await api.delete(`/reminders/${reminderId}`);
      setReminders(reminders.filter((r) => r.id !== reminderId));
      toast.success('Reminder deleted');
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      toast.error('Failed to delete reminder');
    }
  };

  const handleToggleReminder = async (reminder: Reminder) => {
    try {
      const response = await api.patch<Reminder>(`/reminders/${reminder.id}`, {
        is_enabled: !reminder.is_enabled,
      });
      setReminders(reminders.map((r) => (r.id === reminder.id ? response.data : r)));
      toast.success(response.data.is_enabled ? 'Reminder enabled' : 'Reminder disabled');
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
      toast.error('Failed to update reminder');
    }
  };

  const getDayNames = (daysOfWeek: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selected = days.filter((_, i) => (daysOfWeek & (1 << i)) !== 0);
    if (selected.length === 7) return 'Every day';
    if (selected.length === 5 && !(daysOfWeek & 1) && !(daysOfWeek & 64)) return 'Weekdays';
    if (selected.length === 2 && (daysOfWeek & 1) && (daysOfWeek & 64)) return 'Weekends';
    return selected.join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!habit || !statistics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground">Habit not found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusCounts = recentRepetitions.reduce(
    (acc, rep) => {
      acc[rep.status] = (acc[rep.status] || 0) + 1;
      return acc;
    },
    { completed: 0, partial: 0, skipped: 0, failed: 0 } as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{habit.name}</h1>
              {habit.description && (
                <p className="text-muted-foreground">{habit.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{habit.freq_num}x per {habit.freq_den} days</span>
                </div>
                {habit.target_value && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Target: {habit.target_value} {habit.unit}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StreakCard
              currentStreak={statistics.current_streak}
              bestStreak={statistics.best_streak}
              showBreakAlert={true}
            />
            <CompletionRateCard
              completionPercentage={statistics.completion_rate}
              completedDays={statistics.total_repetitions}
              totalDays={statistics.total_days_tracked}
              heatmapData={statistics.calendar_heatmap}
            />
            {statistics.trend_data && (
              <TrendAnalysisCard trendData={statistics.trend_data} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyChartCard data={statistics.weekly_data} />
            <MonthlyChartCard data={statistics.monthly_data} />
          </div>

          {recentRepetitions.length > 0 && (
            <DonutChartCard
              completed={statusCounts.completed}
              partial={statusCounts.partial}
              skipped={statusCounts.skipped}
              failed={statusCounts.failed}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentRepetitions.length > 0 ? (
                <div className="space-y-3">
                  {recentRepetitions.slice(0, 10).map((rep) => (
                    <div
                      key={rep.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            rep.status === 'completed'
                              ? 'bg-green-500'
                              : rep.status === 'partial'
                              ? 'bg-yellow-500'
                              : rep.status === 'skipped'
                              ? 'bg-gray-400'
                              : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <div className="font-medium">
                            {format(new Date(rep.date), 'MMM dd, yyyy')}
                          </div>
                          {rep.notes && (
                            <div className="text-sm text-muted-foreground">{rep.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {rep.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No history yet. Start tracking this habit!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Reminders
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setReminderDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reminders.length > 0 ? (
                <div className="space-y-3">
                  {reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(`2000-01-01T${reminder.reminder_time}`), 'h:mm a')}
                          </span>
                          {reminder.is_smart && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Smart
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 ml-7">
                          {getDayNames(reminder.days_of_week)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={reminder.is_enabled ? 'default' : 'outline'}
                          onClick={() => handleToggleReminder(reminder)}
                        >
                          {reminder.is_enabled ? 'Enabled' : 'Disabled'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteReminder(reminder.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No reminders set. Add a reminder to stay on track!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <ReminderDialog
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          onSubmit={handleAddReminder}
          habitId={id!}
          habitName={habit.name}
        />
      </main>
    </div>
  );
}
