import axios from 'axios'
import { getUserFriendlyError, logError } from '../utils/errorHandler'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 30000, // 30 seconds timeout
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        logError(error, 'Request Interceptor')
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        logError(error, 'Response Interceptor')
        
        // Handle 401 - Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        
        // Enhance error with user-friendly message
        if (error.response) {
            error.userMessage = getUserFriendlyError(error)
        } else if (error.request) {
            error.userMessage = 'Network error. Please check your connection.'
        } else {
            error.userMessage = 'An unexpected error occurred.'
        }
        
        return Promise.reject(error)
    }
)

export const authService = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials)
        return response.data
    },

    validateToken: async () => {
        const response = await api.get('/auth/validate')
        return response.data
    }
}

export default api
