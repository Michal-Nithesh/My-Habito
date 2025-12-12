/**
 * Habit Card Component
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiCircle, FiMoreVertical } from 'react-icons/fi';
import { CheckCircle2, Ruler, Clock } from 'lucide-react';
import type { Habit } from '@/types';
import { HABIT_COLORS } from '@/types';
import { repetitionsApi } from '@/services/repetitions';
import toast from 'react-hot-toast';

interface HabitCardProps {
  habit: Habit;
  onToggle?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

const habitTypeIcons = {
  boolean: <CheckCircle2 className="w-4 h-4" />,
  numerical: <Ruler className="w-4 h-4" />,
  duration: <Clock className="w-4 h-4" />,
};

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggle, onDelete, onArchive }) => {
  const [checked, setChecked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const habitColor = HABIT_COLORS[habit.color] || HABIT_COLORS[8];

  // Check if completed today
  React.useEffect(() => {
    const checkToday = async () => {
      try {
        const rep = await repetitionsApi.getTodayForHabit(habit.id);
        setChecked(!!rep);
      } catch (error) {
        console.error('Failed to check status:', error);
      }
    };
    checkToday();
  }, [habit.id]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      await repetitionsApi.toggleToday(habit.id);
      setChecked(!checked);
      onToggle?.();
      toast.success(checked ? 'Check-in removed' : 'Habit completed!');
    } catch (error) {
      toast.error('Failed to update habit');
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyText = () => {
    if (habit.freq_num === 1 && habit.freq_den === 1) return 'Daily';
    if (habit.freq_num === 1 && habit.freq_den === 7) return 'Weekly';
    if (habit.freq_den === 7) return `${habit.freq_num}x per week`;
    if (habit.freq_den === 30) return `${habit.freq_num}x per month`;
    return `${habit.freq_num} per ${habit.freq_den} days`;
  };

  const getHabitTypeLabel = () => {
    if (habit.habit_type === 'boolean') return 'Yes/No';
    if (habit.habit_type === 'numerical') return `${habit.unit || 'amount'} (${habit.target_type === 'at_least' ? '≥' : '≤'} ${habit.target_value})`;
    return `${habit.target_value} min`;
  };

  return (
    <Link to={`/habit/${habit.id}`}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 group"
        style={{ borderLeft: `5px solid ${habitColor}` }}
      >
        <div className="p-4 space-y-3">
          {/* Header: Name + Menu */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {habit.name}
              </h3>
              {habit.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                  {habit.description}
                </p>
              )}
            </div>
            
            <div className="relative ml-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiMoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Metadata: Type + Frequency */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-muted-foreground">
              {habitTypeIcons[habit.habit_type as keyof typeof habitTypeIcons]}
              <span>{getHabitTypeLabel()}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-muted-foreground">
              📅 {getFrequencyText()}
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {checked ? '✓ Completed today' : 'Not completed yet'}
            </div>
            <button
              onClick={handleToggle}
              disabled={loading}
              className="transition-transform hover:scale-110 disabled:opacity-50"
            >
              {checked ? (
                <FiCheckCircle
                  className="w-7 h-7"
                  style={{ color: habitColor }}
                />
              ) : (
                <FiCircle className="w-7 h-7 text-gray-300 dark:text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HabitCard;
