import { supabase } from './supabase'

/**
 * Audit Action Types for Frontend
 */
export type AuditActionType = 
  | 'LOGIN' 
  | 'LOGOUT'
  | 'REPORT_DOWNLOADED' 
  | 'SAR_GENERATED'
  | 'USER_SEARCH' 
  | 'GRAPH_EXPLORED'
  | 'SANDBOX_RUN'
  | 'NAVIGATED_TO_AUDIT'

/**
 * Audit Log Utility for Frontend
 * Calls the log_activity RPC in Supabase
 */
export const logAudit = async (
  actionType: AuditActionType,
  message: string,
  resourceType?: string,
  resourceId?: string,
  metadata: Record<string, any> = {}
) => {
  try {
    // Add client-side context to metadata
    const enrichedMetadata = {
      ...metadata,
      client_timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'server-side'
    }

    const { data, error } = await supabase.rpc('log_activity', {
      p_action_type: actionType,
      p_message: message,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_metadata: enrichedMetadata
    })

    if (error) {
      console.error('Audit Log failed:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.error('Critical failure in logAudit:', err)
    return null
  }
}
