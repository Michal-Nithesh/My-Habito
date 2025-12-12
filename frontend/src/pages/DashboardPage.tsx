import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, CheckCircle2, Circle, TrendingUp, Target, MoreVertical, Trash2, Archive } from "lucide-react"
import { useHabitsStore } from "@/stores/habitsStore"
import { CreateHabitDialog } from "@/components/CreateHabitDialog"
import { repetitionsApi } from "@/services/repetitions"
import toast from "react-hot-toast"

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      await fetchHabits()
      await fetchTodayCompletions()
    }
    loadData()
  }, [fetchHabits])

  const fetchTodayCompletions = async () => {
    try {
      const repetitions = await repetitionsApi.getAll({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      })
      const completedHabitIds = new Set(repetitions.map(r => r.habit_id))
      setTodayCompletions(completedHabitIds)
    } catch (error) {
      console.error("Failed to fetch today's completions:", error)
    }
  }

  const handleToggle = async (habitId: string) => {
    setTogglingHabit(habitId)
    try {
      await repetitionsApi.toggleToday(habitId)
      
      // Update local state
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

  const completedToday = todayCompletions.size
  const longestStreak = 0 // TODO: Calculate from streaks data

  return (
    <div className="min-h-screen bg-background">
      {/* Create Habit Dialog */}
      <CreateHabitDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-[#16A34A]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Habits</p>
                  <p className="text-3xl font-bold text-foreground">{habits.length}</p>
                </div>
                <Target className="w-10 h-10 text-[#16A34A]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#3B82F6]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed Today</p>
                  <p className="text-3xl font-bold text-foreground">
                    {completedToday}/{habits.length}
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-[#3B82F6]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#8B5CF6]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Longest Streak</p>
                  <p className="text-3xl font-bold text-foreground">{longestStreak} days</p>
                </div>
                <TrendingUp className="w-10 h-10 text-[#8B5CF6]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">My Habits</h2>
            <p className="text-muted-foreground">Track your daily habits and build consistency</p>
          </div>

          <Button 
            className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-habito hover:shadow-habito-lg transition-all"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Habit
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A]"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && habits.length === 0 && (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-[#16A34A]/10 rounded-full flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-[#16A34A]" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No habits yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Start building better habits today! Click the "New Habit" button to create your first habit.
              </p>
              <Button 
                className="bg-[#16A34A] hover:bg-[#15803D] text-white"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Habit
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Habits Grid */}
        {!loading && habits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => {
              const habitColor = colorPalette[habit.color % colorPalette.length] || '#16A34A'
              const isCompleted = todayCompletions.has(habit.id)
              
              return (
                <Card
                  key={habit.id}
                  className="hover:shadow-habito transition-shadow"
                  style={{ borderLeft: `4px solid ${habitColor}` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{habit.name}</h3>
                        {habit.description && <p className="text-sm text-muted-foreground truncate">{habit.description}</p>}
                      </div>

                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(habit.id)}
                          disabled={togglingHabit === habit.id}
                          className="transition-transform hover:scale-110 disabled:opacity-50"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
                          ) : (
                            <Circle className="w-8 h-8 text-muted-foreground" />
                          )}
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === habit.id ? null : habit.id)}
                            className="p-1 hover:bg-muted rounded-md transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                          </button>

                          {openMenuId === habit.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-10">
                              <button
                                onClick={() => handleArchive(habit.id)}
                                disabled={archivingId === habit.id}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors disabled:opacity-50"
                              >
                                <Archive className="w-4 h-4" />
                                Archive Habit
                              </button>
                              <button
                                onClick={() => handleDelete(habit.id)}
                                disabled={deletingId === habit.id}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2 transition-colors disabled:opacity-50 border-t border-border"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Habit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">0</span> day streak
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
