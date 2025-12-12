import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Reminder, ReminderCreate } from '@/types';
import { Bell, Clock, Calendar } from 'lucide-react';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReminderCreate) => Promise<void>;
  habitId: string;
  habitName: string;
  existingReminder?: Reminder;
}

const DAYS_OF_WEEK = [
  { name: 'Sun', value: 1 },
  { name: 'Mon', value: 2 },
  { name: 'Tue', value: 4 },
  { name: 'Wed', value: 8 },
  { name: 'Thu', value: 16 },
  { name: 'Fri', value: 32 },
  { name: 'Sat', value: 64 },
];

export function ReminderDialog({
  open,
  onOpenChange,
  onSubmit,
  habitId,
  habitName,
  existingReminder,
}: ReminderDialogProps) {
  const [reminderTime, setReminderTime] = useState(
    existingReminder?.reminder_time || '09:00'
  );
  const [daysOfWeek, setDaysOfWeek] = useState(existingReminder?.days_of_week || 127);
  const [message, setMessage] = useState(existingReminder?.message || '');
  const [isSmart, setIsSmart] = useState(existingReminder?.is_smart || false);
  const [loading, setLoading] = useState(false);

  const toggleDay = (dayValue: number) => {
    setDaysOfWeek((prev) => prev ^ dayValue);
  };

  const isDaySelected = (dayValue: number) => {
    return (daysOfWeek & dayValue) !== 0;
  };

  const selectAllDays = () => setDaysOfWeek(127);
  const selectWeekdays = () => setDaysOfWeek(62); // Mon-Fri
  const selectWeekends = () => setDaysOfWeek(65); // Sat-Sun

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        habit_id: habitId,
        reminder_time: reminderTime,
        days_of_week: daysOfWeek,
        message: message || undefined,
        is_smart: isSmart,
        is_enabled: true,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {existingReminder ? 'Edit Reminder' : 'Add Reminder'}
          </DialogTitle>
          <DialogDescription>
            Set a reminder for "{habitName}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reminder Time */}
          <div className="space-y-2">
            <Label htmlFor="reminder-time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Reminder Time
            </Label>
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              required
            />
          </div>

          {/* Days of Week */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Days of Week
            </Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-2 rounded-lg border-2 font-medium text-sm transition-colors ${
                    isDaySelected(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {day.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllDays}
                className="text-blue-600 hover:underline"
              >
                All Days
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={selectWeekdays}
                className="text-blue-600 hover:underline"
              >
                Weekdays
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={selectWeekends}
                className="text-blue-600 hover:underline"
              >
                Weekends
              </button>
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a custom reminder message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          {/* Smart Reminder */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="smart-reminder"
              checked={isSmart}
              onChange={(e) => setIsSmart(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="smart-reminder" className="cursor-pointer">
              Smart Reminder (only notify if not completed)
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : existingReminder ? 'Update' : 'Add Reminder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
