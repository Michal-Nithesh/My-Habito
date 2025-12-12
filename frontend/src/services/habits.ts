/**
 * Habits API Service
 */
import apiClient from '@/lib/api';
import type { Habit, HabitCreate, HabitWithStats } from '@/types';

export const habitsApi = {
  // Get all habits
  getAll: async (archived = false): Promise<Habit[]> => {
    const response = await apiClient.get('/v1/habits', {
      params: { archived },
    });
    return response.data;
  },

  // Get single habit
  getById: async (id: string): Promise<Habit> => {
    const response = await apiClient.get(`/v1/habits/${id}`);
    return response.data;
  },

  // Get habit with statistics
  getWithStats: async (id: string): Promise<HabitWithStats> => {
    const response = await apiClient.get(`/v1/habits/${id}/with-stats`);
    return response.data;
  },

  // Create habit
  create: async (habit: HabitCreate): Promise<Habit> => {
    const response = await apiClient.post('/v1/habits', habit);
    return response.data;
  },

  // Update habit
  update: async (id: string, habit: Partial<HabitCreate>): Promise<Habit> => {
    const response = await apiClient.put(`/v1/habits/${id}`, habit);
    return response.data;
  },

  // Delete habit
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/habits/${id}`);
  },

  // Archive habit
  archive: async (id: string): Promise<Habit> => {
    const response = await apiClient.post(`/v1/habits/${id}/archive`);
    return response.data;
  },

  // Unarchive habit
  unarchive: async (id: string): Promise<Habit> => {
    const response = await apiClient.post(`/v1/habits/${id}/unarchive`);
    return response.data;
  },
};
