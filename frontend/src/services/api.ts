import axios from 'axios'
import type { ApiResponse, PaginatedResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const apiClient = {
  get: <T>(url: string) => api.get<ApiResponse<T>>(url).then(res => res.data),
  post: <T>(url: string, data?: any) => api.post<ApiResponse<T>>(url, data).then(res => res.data),
  put: <T>(url: string, data?: any) => api.put<ApiResponse<T>>(url, data).then(res => res.data),
  delete: <T>(url: string) => api.delete<ApiResponse<T>>(url).then(res => res.data),
  getPaginated: <T>(url: string, params?: any) => 
    api.get<PaginatedResponse<T>>(url, { params }).then(res => res.data),
}
