/**
 * API client for Habito backend
 */
import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const { data, error: refreshError } = await supabase.auth.refreshSession();

      if (!refreshError && data.session) {
        // Retry the request with new token
        error.config.headers.Authorization = `Bearer ${data.session.access_token}`;
        return apiClient.request(error.config);
      }

      // Refresh failed, redirect to login
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
