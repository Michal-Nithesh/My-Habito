/**
 * Repetitions API Service
 */
import apiClient from '@/lib/api';
import type { Repetition, RepetitionCreate } from '@/types';

export const repetitionsApi = {
  // Get all repetitions
  getAll: async (params?: {
    habit_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<Repetition[]> => {
    const response = await apiClient.get('/v1/repetitions', { params });
    return response.data;
  },

  // Get single repetition
  getById: async (id: string): Promise<Repetition> => {
    const response = await apiClient.get(`/v1/repetitions/${id}`);
    return response.data;
  },

  // Get today's repetition for a habit
  getTodayForHabit: async (habitId: string): Promise<Repetition | null> => {
    const response = await apiClient.get(`/v1/repetitions/habit/${habitId}/today`);
    return response.data;
  },

  // Create repetition
  create: async (repetition: RepetitionCreate): Promise<Repetition> => {
    const response = await apiClient.post('/v1/repetitions', repetition);
    return response.data;
  },

  // Update repetition
  update: async (
    id: string,
    repetition: Partial<RepetitionCreate>
  ): Promise<Repetition> => {
    const response = await apiClient.put(`/v1/repetitions/${id}`, repetition);
    return response.data;
  },

  // Delete repetition
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/repetitions/${id}`);
  },

  // Toggle today's check-in
  toggleToday: async (habitId: string): Promise<Repetition | null> => {
    const response = await apiClient.post(`/v1/repetitions/habit/${habitId}/toggle`);
    return response.data;
  },
};
