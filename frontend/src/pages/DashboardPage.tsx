import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, CheckCircle2, Circle, TrendingUp, Target, MoreVertical, Trash2, Archive, ChevronLeft, ChevronRight } from "lucide-react"
import { useHabitsStore } from "@/stores/habitsStore"
import { CreateHabitDialog } from "@/components/CreateHabitDialog"
import { HabitCheckInDialog } from "@/components/HabitCheckInDialog"
import { repetitionsApi } from "@/services/repetitions"
import { Habit, Repetition } from "@/types"
import toast from "react-hot-toast"
import { format, subDays, isToday } from "date-fns"

// Color palette mapping (index to hex color)
const colorPalette = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#64748B', '#78716C', '#57534E'
];

export default function DashboardPage() {
  const { habits, loading, fetchHabits, deleteHabit, archiveHabit } = useHabitsStore()
  const [todayCompletions, setTodayCompletions] = useState<Set<string>>(new Set())
  const [allRepetitions, setAllRepetitions] = useState<Repetition[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false)
  const [selectedHabitForCheckIn, setSelectedHabitForCheckIn] = useState<Habit | null>(null)
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [dateOffset, setDateOffset] = useState(0)
  
  // Generate array of 10 dates starting from dateOffset
  const getDatesArray = () => {
    const dates = []
    for (let i = 9; i >= 0; i--) {
      dates.push(subDays(new Date(), i + Math.abs(dateOffset)))
    }
    return dates
  }

  const displayDates = getDatesArray()

  useEffect(() => {
    const loadData = async () => {
      await fetchHabits()
      await fetchRepetitionsForDates()
    }
    loadData()
  }, [fetchHabits, dateOffset])

  const fetchRepetitionsForDates = async () => {
    try {
      const startDate = displayDates[0]
      const endDate = displayDates[displayDates.length - 1]
      
      const repetitions = await repetitionsApi.getAll({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      })
      setAllRepetitions(repetitions)

      // Update today completions
      const todayReps = repetitions.filter(r => isToday(new Date(r.date)))
      const completedHabitIds = new Set(todayReps.filter(r => r.status === 'completed').map(r => r.habit_id))
      setTodayCompletions(completedHabitIds)
    } catch (error) {
      console.error("Failed to fetch repetitions:", error)
    }
  }

  // Get repetition for a specific habit and date
  const getRepetitionForDate = (habitId: string, date: Date) => {
    return allRepetitions.find(
      r => r.habit_id === habitId && 
      format(new Date(r.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
  }

  // Get status display for a repetition
  const getStatusDisplay = (rep: Repetition | undefined, habit: Habit) => {
    if (!rep) return { icon: '—', color: 'text-gray-300' }
    
    if (rep.status === 'completed') {
      if (habit.habit_type === 'numerical' && rep.value) {
        return { icon: rep.value.toString(), color: 'text-green-600 font-bold' }
      }
      return { icon: '✓', color: 'text-green-600 font-bold' }
    } else if (rep.status === 'skipped') {
      return { icon: '✗', color: 'text-gray-400' }
    } else if (rep.status === 'failed') {
      return { icon: '✗', color: 'text-red-500' }
    } else if (rep.status === 'partial') {
      if (habit.habit_type === 'numerical' && rep.value) {
        return { icon: rep.value.toString(), color: 'text-yellow-600 font-bold' }
      }
      return { icon: '◐', color: 'text-yellow-600' }
    }
    
    return { icon: '—', color: 'text-gray-300' }
  }

  const handleToggle = async (habitId: string) => {
    setTogglingHabit(habitId)
    try {
      await repetitionsApi.toggleToday(habitId)
      
      const newCompletions = new Set(todayCompletions)
      if (newCompletions.has(habitId)) {
        newCompletions.delete(habitId)
        toast.success("Habit unmarked")
      } else {
        newCompletions.add(habitId)
        toast.success("Great! Habit completed for today")
      }
      setTodayCompletions(newCompletions)
    } catch (error: any) {
      console.error("Error toggling habit:", error)
      toast.error("Failed to update habit completion")
    } finally {
      setTogglingHabit(null)
    }
  }

  const handleDelete = async (habitId: string) => {
    if (!window.confirm("Are you sure you want to delete this habit? This action cannot be undone.")) {
      return
    }
    
    setDeletingId(habitId)
    try {
      await deleteHabit(habitId)
    } catch (error) {
      console.error("Error deleting habit:", error)
    } finally {
      setDeletingId(null)
      setOpenMenuId(null)
    }
  }

  const handleArchive = async (habitId: string) => {
    setArchivingId(habitId)
    try {
      await archiveHabit(habitId)
      setOpenMenuId(null)
    } catch (error) {
      console.error("Error archiving habit:", error)
    } finally {
      setArchivingId(null)
    }
  }

  const handleOpenCheckIn = (habit: Habit) => {
    setSelectedHabitForCheckIn(habit)
    setCheckInDialogOpen(true)
  }

  const handleCheckInSubmit = async (data: {
    habit_id: string
    status: 'completed' | 'skipped' | 'failed' | 'partial'
    value: number
    completion_time?: string
    notes?: string
  }) => {
    try {
      await repetitionsApi.create({
        habit_id: data.habit_id,
        status: data.status,
        value: data.value,
        completion_time: data.completion_time,
        notes: data.notes,
      })
      await fetchRepetitionsForDates()
    } catch (error) {
      console.error("Error submitting check-in:", error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Create Habit Dialog */}
      <CreateHabitDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Check-In Dialog */}
      <HabitCheckInDialog
        habit={selectedHabitForCheckIn}
        open={checkInDialogOpen}
        onOpenChange={setCheckInDialogOpen}
        onSubmit={handleCheckInSubmit}
      />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Habits</h1>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
                title="Sort"
              >
                ⬍
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
                title="Menu"
              >
                ⋯
              </Button>
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-md"
                onClick={() => setCreateDialogOpen(true)}
                title="Add new habit"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-green-500 bg-white shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Habits</p>
                  <p className="text-3xl font-bold text-gray-900">{habits.length}</p>
                </div>
                <Target className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-white shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed Today</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {todayCompletions.size}/{habits.length}
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-white shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Longest Streak</p>
                  <p className="text-3xl font-bold text-gray-900">0 days</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Navigation */}
        {!loading && habits.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateOffset(dateOffset + 1)}
              className="border-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">
              {format(displayDates[0], 'MMM d')} – {format(displayDates[displayDates.length - 1], 'MMM d, yyyy')}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateOffset(Math.max(0, dateOffset - 1))}
              disabled={dateOffset === 0}
              className="border-gray-300"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Date Row */}
        {!loading && habits.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {displayDates.map((date) => (
                <div
                  key={format(date, 'yyyy-MM-dd')}
                  className={`flex flex-col items-center justify-center min-w-[70px] p-3 rounded-lg transition-all ${
                    isToday(date)
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-semibold tracking-wide opacity-80">
                    {format(date, 'EEE').toUpperCase()}
                  </div>
                  <div className="text-lg font-bold mt-1">{format(date, 'd')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && habits.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No habits yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Start building better habits today! Click the "+" button to create your first habit.
              </p>
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Habit
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Habits List - Loop Tracker Style */}
        {!loading && habits.length > 0 && (
          <div className="space-y-3">
            {habits.map((habit) => {
              const habitColor = colorPalette[habit.color % colorPalette.length] || '#3B82F6'
              const isCompleted = todayCompletions.has(habit.id)
              
              return (
                <div
                  key={habit.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Habit Status Circle */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleToggle(habit.id)}
                        disabled={togglingHabit === habit.id}
                        className="transition-transform hover:scale-110 disabled:opacity-50"
                        title={isCompleted ? "Mark incomplete" : "Mark complete"}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-10 h-10" style={{ color: habitColor }} />
                        ) : (
                          <Circle className="w-10 h-10 text-gray-300" />
                        )}
                      </button>
                    </div>

                    {/* Habit Info and Status Row */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{habit.name}</h3>
                          {habit.description && (
                            <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                          )}
                        </div>
                        
                        {/* Menu Button */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === habit.id ? null : habit.id)}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>

                          {openMenuId === habit.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                              <button
                                onClick={() => handleOpenCheckIn(habit)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-600 font-medium transition-colors"
                              >
                                Log Entry
                              </button>
                              <button
                                onClick={() => handleArchive(habit.id)}
                                disabled={archivingId === habit.id}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50 border-t border-gray-200"
                              >
                                <Archive className="w-4 h-4" />
                                Archive
                              </button>
                              <button
                                onClick={() => handleDelete(habit.id)}
                                disabled={deletingId === habit.id}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors disabled:opacity-50 border-t border-gray-200"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Daily Status Row */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {displayDates.map((date) => {
                          const rep = getRepetitionForDate(habit.id, date)
                          const { icon, color } = getStatusDisplay(rep, habit)
                          
                          return (
                            <button
                              key={format(date, 'yyyy-MM-dd')}
                              onClick={() => handleOpenCheckIn(habit)}
                              className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-sm font-semibold transition-all border ${
                                rep?.status === 'completed'
                                  ? 'bg-green-50 border-green-300'
                                  : rep?.status === 'skipped' || rep?.status === 'failed'
                                  ? 'bg-gray-50 border-gray-300'
                                  : rep?.status === 'partial'
                                  ? 'bg-yellow-50 border-yellow-300'
                                  : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                              } ${color}`}
                              title={`${format(date, 'MMM d')}: ${rep?.notes || 'No entry'}`}
                            >
                              {icon}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
