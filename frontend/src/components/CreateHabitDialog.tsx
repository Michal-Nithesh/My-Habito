import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Ruler, Clock, Plus, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { useHabitsStore } from "@/stores/habitsStore"
import type { HabitCreate, TargetType } from "@/types"

interface CreateHabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Color palette matching Loop Habit Tracker
const colorPalette = [
  { index: 0, color: '#EF4444', name: 'Red' },
  { index: 1, color: '#F97316', name: 'Orange' },
  { index: 2, color: '#F59E0B', name: 'Amber' },
  { index: 3, color: '#EAB308', name: 'Yellow' },
  { index: 4, color: '#84CC16', name: 'Lime' },
  { index: 5, color: '#22C55E', name: 'Green' },
  { index: 6, color: '#10B981', name: 'Emerald' },
  { index: 7, color: '#14B8A6', name: 'Teal' },
  { index: 8, color: '#06B6D4', name: 'Cyan' },
  { index: 9, color: '#0EA5E9', name: 'Sky' },
  { index: 10, color: '#3B82F6', name: 'Blue' },
  { index: 11, color: '#6366F1', name: 'Indigo' },
  { index: 12, color: '#8B5CF6', name: 'Violet' },
  { index: 13, color: '#A855F7', name: 'Purple' },
  { index: 14, color: '#D946EF', name: 'Fuchsia' },
  { index: 15, color: '#EC4899', name: 'Pink' },
  { index: 16, color: '#F43F5E', name: 'Rose' },
  { index: 17, color: '#64748B', name: 'Slate' },
  { index: 18, color: '#78716C', name: 'Stone' },
  { index: 19, color: '#57534E', name: 'Neutral' },
];

// Habit categories
const habitCategories = [
  { value: 'health', label: 'Health & Fitness', examples: 'workouts, yoga, steps, running, stretching' },
  { value: 'mental', label: 'Mind & Mental Wellness', examples: 'meditation, journaling, gratitude, affirmations' },
  { value: 'productivity', label: 'Productivity & Work', examples: 'deep work, task completion, planning, coding' },
  { value: 'learning', label: 'Learning & Growth', examples: 'reading, courses, language learning' },
  { value: 'lifestyle', label: 'Lifestyle & Routine', examples: 'wake-up time, sleep schedule, skincare, hydration' },
  { value: 'finance', label: 'Finance & Budgeting', examples: 'savings, budgeting, expense tracking' },
  { value: 'nutrition', label: 'Nutrition & Diet', examples: 'healthy eating, meal prep, water intake' },
  { value: 'personal', label: 'Personal Development', examples: 'hobbies, creativity, writing, goal-setting' },
  { value: 'social', label: 'Relationships & Social', examples: 'family time, friendships, calls, community' },
  { value: 'spirituality', label: 'Spirituality & Mindfulness', examples: 'prayer, gratitude, breathing exercises' },
]

const habitTypeOptions = [
  { value: 'boolean' as const, label: 'Yes/No', icon: CheckCircle2, color: '#16A34A' },
  { value: 'numerical' as const, label: 'Measurable', icon: Ruler, color: '#3B82F6' },
  { value: 'duration' as const, label: 'Duration', icon: Clock, color: '#F59E0B' },
]

export function CreateHabitDialog({ open, onOpenChange }: CreateHabitDialogProps) {
  const { createHabit } = useHabitsStore()
  const [habitType, setHabitType] = useState<"boolean" | "numerical" | "duration">("boolean")
  const [category, setCategory] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    question: "",
    description: "",
    targetValue: "1",
    targetType: "at_least" as TargetType,
    unit: "",
    freqNum: "1",
    freqDen: "1",
    color: 8, // Default to cyan
  })
  const [reminders, setReminders] = useState<string[]>([])
  const [reminderTime, setReminderTime] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const addReminder = () => {
    if (reminderTime.trim()) {
      setReminders([...reminders, reminderTime])
      setReminderTime("")
    }
  }

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Habit name cannot be blank")
      return
    }

    if ((habitType === "numerical" || habitType === "duration") && !formData.targetValue) {
      toast.error("Target value is required for this habit type")
      return
    }

    setSubmitting(true)

    try {
      const habitData: HabitCreate = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        question: formData.question.trim() || undefined,
        habit_type: habitType,
        target_value: (habitType === "numerical" || habitType === "duration") ? parseFloat(formData.targetValue) : undefined,
        target_type: (habitType === "numerical" || habitType === "duration") ? formData.targetType : undefined,
        unit: (habitType === "numerical" || habitType === "duration") && formData.unit ? formData.unit.trim() : undefined,
        freq_num: parseInt(formData.freqNum),
        freq_den: parseInt(formData.freqDen),
        weekday_schedule: 127, // All days enabled by default
        color: formData.color,
        position: 0,
        archived: false,
      }

      await createHabit(habitData)
      toast.success("Habit created successfully!")
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      console.error("Error creating habit:", error)
      let errorMessage = "Failed to create habit. Please try again."
      
      if (error.response?.status === 401) {
        errorMessage = "Not authenticated. Please log in again."
      } else if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((e: any) => e.msg).join(', ')
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setHabitType("boolean")
    setCategory("")
    setFormData({
      name: "",
      question: "",
      description: "",
      targetValue: "1",
      targetType: "at_least",
      unit: "",
      freqNum: "1",
      freqDen: "1",
      color: 8,
    })
    setReminders([])
    setReminderTime("")
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  const selectedColor = colorPalette.find(c => c.index === formData.color)?.color || '#06B6D4'
  const frequencyText = formData.freqNum === "1" && formData.freqDen === "1" ? "Every day" :
                       formData.freqNum === "1" && formData.freqDen === "7" ? "Once per week" :
                       formData.freqDen === "7" ? `${formData.freqNum} times per week` :
                       formData.freqDen === "30" ? `${formData.freqNum} times per month` : ""

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Habit</DialogTitle>
          <DialogDescription>
            Build a better you, one habit at a time
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION: Habit Type Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h3 className="text-lg font-semibold">Habit Type</h3>
            </div>
            
            <RadioGroup value={habitType} onValueChange={(value) => setHabitType(value as any)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {habitTypeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <label
                    key={option.value}
                    className="flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md"
                    style={{
                      borderColor: habitType === option.value ? option.color : '#e5e7eb',
                      backgroundColor: habitType === option.value ? `${option.color}15` : 'transparent',
                    }}
                  >
                    <RadioGroupItem value={option.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="w-5 h-5" style={{ color: option.color }} />
                        <span className="font-semibold">{option.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {option.value === 'boolean' && 'e.g., Did you exercise?'}
                        {option.value === 'numerical' && 'e.g., Pages read: 20'}
                        {option.value === 'duration' && 'e.g., Meditate for 20 min'}
                      </p>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>
          </div>

          {/* SECTION: Habit Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h3 className="text-lg font-semibold">Habit Details</h3>
            </div>

            <div className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold">
                  Habit Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Exercise, Read, Meditation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-base"
                  required
                />
              </div>

              {/* Question Field - Auto-generated but editable */}
              <div className="space-y-2">
                <Label htmlFor="question" className="font-semibold">
                  Question (Auto-generated, editable)
                </Label>
                <Input
                  id="question"
                  placeholder="e.g., Did you exercise today?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  This appears in your reminders
                </p>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category" className="font-semibold">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="text-base">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {habitCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div>
                          <div className="font-medium">{cat.label}</div>
                          <div className="text-xs text-muted-foreground">{cat.examples}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Picker */}
              <div className="space-y-3">
                <Label className="font-semibold">Color</Label>
                <div className="grid grid-cols-10 gap-2">
                  {colorPalette.map((colorItem) => (
                    <button
                      key={colorItem.index}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: colorItem.index })}
                      className={`w-10 h-10 rounded-full transition-all hover:scale-110 ${
                        formData.color === colorItem.index
                          ? "ring-2 ring-offset-2 ring-foreground scale-110"
                          : ""
                      }`}
                      style={{ backgroundColor: colorItem.color }}
                      title={colorItem.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Target (Only for Measurable & Duration) */}
          {(habitType === "numerical" || habitType === "duration") && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold">
                  {habitType === "numerical" ? "Target Value" : "Duration Goal"}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Target Value */}
                <div className="space-y-2">
                  <Label htmlFor="targetValue" className="font-semibold">
                    {habitType === "numerical" ? "Amount" : "Minutes"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="targetValue"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 30"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    className="text-base"
                    required
                  />
                </div>

                {/* Unit (Optional for Numerical) */}
                {habitType === "numerical" && (
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="font-semibold">
                      Unit (optional)
                    </Label>
                    <Input
                      id="unit"
                      placeholder="e.g., pages, km, minutes"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="text-base"
                    />
                  </div>
                )}

                {/* Target Type */}
                <div className="space-y-2">
                  <Label htmlFor="targetType" className="font-semibold">
                    Target Rule
                  </Label>
                  <Select
                    value={formData.targetType}
                    onValueChange={(value) => setFormData({ ...formData, targetType: value as TargetType })}
                  >
                    <SelectTrigger id="targetType" className="text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="at_least">At least (≥)</SelectItem>
                      <SelectItem value="at_most">At most (≤)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Schedule */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h3 className="text-lg font-semibold">Schedule</h3>
            </div>

            <div className="space-y-4">
              {/* Frequency */}
              <div className="space-y-2">
                <Label className="font-semibold">How often?</Label>
                <div className="flex items-center space-x-2 gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.freqNum}
                    onChange={(e) => setFormData({ ...formData, freqNum: e.target.value })}
                    className="w-20 text-base"
                  />
                  <span className="text-muted-foreground">times per</span>
                  <Select
                    value={formData.freqDen}
                    onValueChange={(value) => setFormData({ ...formData, freqDen: value })}
                  >
                    <SelectTrigger className="w-40 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Day</SelectItem>
                      <SelectItem value="7">Week</SelectItem>
                      <SelectItem value="30">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {frequencyText && (
                  <p className="text-sm text-muted-foreground">
                    {frequencyText}
                  </p>
                )}
              </div>

              {/* Notes/Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">
                  Notes (optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes or context about this habit..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="text-base resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* SECTION: Reminders */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h3 className="text-lg font-semibold">Reminders (optional)</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 gap-2">
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="text-base flex-1"
                  placeholder="Set reminder time"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addReminder}
                  disabled={!reminderTime}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {reminders.length > 0 && (
                <div className="space-y-2">
                  {reminders.map((reminder, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm font-medium">{reminder}</span>
                      <button
                        type="button"
                        onClick={() => removeReminder(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION: Preview */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold text-sm">Preview</h3>
            <div
              className="p-4 rounded-lg text-white space-y-2 border-2"
              style={{ backgroundColor: selectedColor, borderColor: selectedColor }}
            >
              <div className="text-sm opacity-80">
                {habitTypeOptions.find(o => o.value === habitType)?.label}
              </div>
              <div className="text-lg font-bold truncate">
                {formData.name || "Your Habit"}
              </div>
              <div className="text-xs opacity-75">
                {frequencyText || "Configure frequency"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
