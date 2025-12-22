/**
 * ML Inference API Client
 * Connects to the deployed ML API service
 */

import axios from 'axios'

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: ML_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds for ML prediction
})

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
  } catch (error) {
    console.error('ML API health check failed:', error)
    throw error
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
    console.error('ML API prediction failed:', error)
    if (error.response) {
      throw new Error(error.response.data?.error || 'Prediction failed')
    }
    throw new Error('Failed to connect to ML API')
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
    console.error('ML API batch prediction failed:', error)
    throw error
  }
}

/**
 * Get model information
 */
export const getModelInfo = async () => {
  try {
    const response = await apiClient.get('/model/info')
    return response.data
  } catch (error) {
    console.error('Failed to get model info:', error)
    throw error
  }
}

