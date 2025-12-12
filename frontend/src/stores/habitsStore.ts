/**
 * Habits Store
 */
import { create } from 'zustand';
import { habitsApi } from '@/services/habits';
import type { Habit, HabitCreate } from '@/types';
import toast from 'react-hot-toast';

interface HabitsState {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  fetchHabits: (archived?: boolean) => Promise<void>;
  createHabit: (habit: HabitCreate) => Promise<Habit>;
  updateHabit: (id: string, habit: Partial<HabitCreate>) => Promise<Habit>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  unarchiveHabit: (id: string) => Promise<void>;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  loading: false,
  error: null,

  fetchHabits: async (archived = false) => {
    set({ loading: true, error: null });
    try {
      const habits = await habitsApi.getAll(archived);
      set({ habits, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false, habits: [] });
    }
  },

  createHabit: async (habit: HabitCreate) => {
    set({ loading: true, error: null });
    try {
      const newHabit = await habitsApi.create(habit);
      set((state) => ({
        habits: [...state.habits, newHabit],
        loading: false,
      }));
      toast.success('Habit created successfully');
      return newHabit;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      toast.error('Failed to create habit');
      throw error;
    }
  },

  updateHabit: async (id: string, habit: Partial<HabitCreate>) => {
    set({ loading: true, error: null });
    try {
      const updatedHabit = await habitsApi.update(id, habit);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? updatedHabit : h)),
        loading: false,
      }));
      toast.success('Habit updated successfully');
      return updatedHabit;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      toast.error('Failed to update habit');
      throw error;
    }
  },

  deleteHabit: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await habitsApi.delete(id);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
        loading: false,
      }));
      toast.success('Habit deleted successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      toast.error('Failed to delete habit');
      throw error;
    }
  },

  archiveHabit: async (id: string) => {
    try {
      const archivedHabit = await habitsApi.archive(id);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? archivedHabit : h)),
      }));
      toast.success('Habit archived');
    } catch (error: any) {
      toast.error('Failed to archive habit');
      throw error;
    }
  },

  unarchiveHabit: async (id: string) => {
    try {
      const unarchivedHabit = await habitsApi.unarchive(id);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? unarchivedHabit : h)),
      }));
      toast.success('Habit restored');
    } catch (error: any) {
      toast.error('Failed to restore habit');
      throw error;
    }
  },
}));
