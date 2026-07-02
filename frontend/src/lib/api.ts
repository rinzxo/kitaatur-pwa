import axios from 'axios'
import { createClient } from '@/lib/supabase/client'

// Supabase client instance untuk keperluan autentikasi di frontend
export const supabase = createClient()

// Axios API client instance untuk interaksi ke Express Backend
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
})

// Request interceptor untuk menyematkan JWT Token secara otomatis
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
