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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Habit, Repetition } from '@/types';
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  partial: {
    label: 'Partial',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  skipped: {
    label: 'Skipped',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  failed: {
    label: 'Failed',
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

interface HabitCheckInDialogProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    habit_id: string;
    status: 'completed' | 'skipped' | 'failed' | 'partial';
    value: number;
    completion_time?: string;
    notes?: string;
  }) => Promise<void>;
  existingRepetition?: Repetition;
}

export function HabitCheckInDialog({
  habit,
  open,
  onOpenChange,
  onSubmit,
  existingRepetition,
}: HabitCheckInDialogProps) {
  const [status, setStatus] = useState<'completed' | 'skipped' | 'failed' | 'partial'>(
    existingRepetition?.status || 'completed'
  );
  const [value, setValue] = useState(existingRepetition?.value || 1);
  const [completionTime, setCompletionTime] = useState(existingRepetition?.completion_time || '');
  const [notes, setNotes] = useState(existingRepetition?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habit) return;

    setLoading(true);
    try {
      await onSubmit({
        habit_id: habit.id,
        status,
        value: status === 'partial' ? value : 1,
        completion_time: completionTime || undefined,
        notes: notes || undefined,
      });
      onOpenChange(false);
      toast.success(`Habit logged as ${STATUS_CONFIG[status].label}`);
    } catch (error) {
      console.error('Failed to log habit:', error);
      toast.error('Failed to log habit');
    } finally {
      setLoading(false);
    }
  };

  if (!habit) return null;

  const isNumerical = habit.habit_type === 'numerical';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Check In: {habit.name}</DialogTitle>
          <DialogDescription>
            {habit.question || `How did your "${habit.name}" habit go today?`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">How did it go?</Label>
            <RadioGroup value={status} onValueChange={(v: any) => setStatus(v)}>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                  // Hide partial status for non-numerical habits
                  if (key === 'partial' && !isNumerical) return null;
                  
                  return (
                    <label
                      key={key}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        status === key ? config.borderColor + ' ' + config.bgColor : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={key} className="hidden" />
                      <div className={config.color}>{config.icon}</div>
                      <span className="font-medium text-sm">{config.label}</span>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Value Input for Partial Habits */}
          {status === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="value">
                {habit.unit ? `${habit.unit} completed` : 'Amount completed'}
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="value"
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1"
                />
                {habit.unit && <span className="text-sm text-gray-500">{habit.unit}</span>}
              </div>
              {habit.target_value && (
                <p className="text-xs text-gray-500">
                  Target: {habit.target_value} {habit.unit}
                </p>
              )}
            </div>
          )}

          {/* Completion Time */}
          <div className="space-y-2">
            <Label htmlFor="completion-time" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Time of completion (optional)</span>
            </Label>
            <Input
              id="completion-time"
              type="time"
              value={completionTime}
              onChange={(e) => setCompletionTime(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this check-in..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20"
            />
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
            <Button
              type="submit"
              disabled={loading}
              className={`${
                STATUS_CONFIG[status].color.replace('text-', 'bg-').replace('500', '600') ||
                'bg-blue-600'
              }`}
            >
              {loading ? 'Saving...' : `Log as ${STATUS_CONFIG[status].label}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
