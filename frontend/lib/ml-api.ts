/**
 * ML Inference API Client
 * Connects to the deployed ML API service
 */

import axios from 'axios'

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000'

// Validate ML API URL configuration
if (!process.env.NEXT_PUBLIC_ML_API_URL && typeof window !== 'undefined') {
  console.warn(
    '⚠️ NEXT_PUBLIC_ML_API_URL not configured. Using default:',
    ML_API_URL
  )
}

const apiClient = axios.create({
  baseURL: ML_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds for ML prediction
})

// Helper function to get detailed error message
const getErrorMessage = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    const data = error.response.data
    if (data?.error) {
      return `ML API error (${status}): ${data.error}`
    }
    return `ML API error (${status}): ${error.response.statusText || 'Unknown error'}`
  }

  if (error.request) {
    // Request made but no response received
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return `ML API timeout: The request took too long. Please check if the ML API is running at ${ML_API_URL}`
    }
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return `ML API connection failed: Unable to reach the ML API at ${ML_API_URL}. Please verify:
1. The ML API is deployed and running
2. The URL is correct: ${ML_API_URL}
3. CORS is properly configured on the ML API
4. Check browser console for CORS errors`
    }
    if (error.code === 'ERR_CONNECTION_REFUSED') {
      return `ML API connection refused: The ML API at ${ML_API_URL} is not accepting connections. Please ensure:
1. The ML API service is running
2. The URL and port are correct
3. For local development, start the ML API with: cd ml-api && python -m uvicorn main:app --reload`
    }
    return `ML API connection error: Unable to connect to ${ML_API_URL}. Error: ${error.message || 'Unknown network error'}`
  }

  // Error in request setup
  return `ML API request error: ${error.message || 'Unknown error'}`
}

// Types matching ML API
export interface TransactionInput {
  step?: number
  type: 'CASH_OUT' | 'TRANSFER' | 'CASH_IN' | 'PAYMENT' | 'DEBIT'
  amount: number
  nameOrig: string
  oldBalanceOrig: number
  newBalanceOrig: number
  nameDest: string
  oldBalanceDest: number
  newBalanceDest: number
}

export interface PredictionOptions {
  include_shap?: boolean
  include_llm_explanation?: boolean
  language?: 'en' | 'bn'
  topk?: number
}

export interface SHAPExplanation {
  feature: string
  value: number
  shap: number
  shap_abs: number
  rank: number
}

export interface PredictionResult {
  fraud_probability: number
  decision: 'pass' | 'warn' | 'block'
  risk_level: 'low' | 'medium' | 'high'
  confidence: number
}

export interface LLMExplanation {
  text: string
  language: string
}

export interface PredictResponse {
  transaction_id: string
  prediction: PredictionResult
  shap_explanations?: SHAPExplanation[]
  llm_explanation?: LLMExplanation
  processing_time_ms: number
  model_version: string
  timestamp: string
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  model_version: string
  shap_available: boolean
  llm_available: boolean
}

/**
 * Check ML API health
 */
export const checkHealth = async (): Promise<HealthResponse> => {
  try {
    const response = await apiClient.get<HealthResponse>('/health')
    return response.data
  } catch (error: any) {
    console.error('ML API health check failed:', {
      error,
      url: ML_API_URL,
      endpoint: '/health',
      code: error.code,
      message: error.message,
    })
    const errorMessage = getErrorMessage(error)
    throw new Error(errorMessage)
  }
}

/**
 * Predict fraud probability for a transaction
 */
export const predictFraud = async (
  transaction: TransactionInput,
  options: PredictionOptions = {}
): Promise<PredictResponse> => {
  try {
    const response = await apiClient.post<PredictResponse>('/predict', {
      transaction,
      options: {
        include_shap: true,
        include_llm_explanation: false,
        language: 'en',
        topk: 10,
        ...options,
      },
    })
    return response.data
  } catch (error: any) {
    console.error('ML API prediction failed:', {
      error,
      url: ML_API_URL,
      endpoint: '/predict',
      code: error.code,
      message: error.message,
      response: error.response?.data,
    })
    
    const errorMessage = getErrorMessage(error)
    throw new Error(errorMessage)
  }
}

/**
 * Batch predict multiple transactions
 */
export const batchPredict = async (
  transactions: TransactionInput[]
): Promise<any> => {
  try {
    const response = await apiClient.post('/predict/batch', {
      transactions,
      options: {
        include_shap: false,
        include_llm_explanation: false,
      },
    })
    return response.data
  } catch (error: any) {
    console.error('ML API batch prediction failed:', {
      error,
      url: ML_API_URL,
      endpoint: '/predict/batch',
      code: error.code,
      message: error.message,
    })
    const errorMessage = getErrorMessage(error)
    throw new Error(errorMessage)
  }
}

/**
 * Get model information
 */
export const getModelInfo = async () => {
  try {
    const response = await apiClient.get('/model/info')
    return response.data
  } catch (error: any) {
    console.error('Failed to get model info:', {
      error,
      url: ML_API_URL,
      endpoint: '/model/info',
      code: error.code,
      message: error.message,
    })
    const errorMessage = getErrorMessage(error)
    throw new Error(errorMessage)
  }
}

/**
 * Verify ML API configuration and connectivity
 * Useful for debugging connection issues
 */
export const verifyMLAPIConfig = () => {
  const config = {
    url: ML_API_URL,
    isConfigured: !!process.env.NEXT_PUBLIC_ML_API_URL,
    isLocalhost: ML_API_URL.includes('localhost') || ML_API_URL.includes('127.0.0.1'),
    isProduction: !ML_API_URL.includes('localhost') && !ML_API_URL.includes('127.0.0.1'),
  }
  
  console.log('🔍 ML API Configuration:', config)
  
  if (!config.isConfigured) {
    console.warn(
      '⚠️ NEXT_PUBLIC_ML_API_URL is not set. Using default:', 
      ML_API_URL,
      '\nTo fix: Add NEXT_PUBLIC_ML_API_URL to your .env.local file'
    )
  }
  
  return config
}

// Log configuration on module load (client-side only)
if (typeof window !== 'undefined') {
  verifyMLAPIConfig()
}

