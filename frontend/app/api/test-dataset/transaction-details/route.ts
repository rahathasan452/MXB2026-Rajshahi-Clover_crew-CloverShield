/**
 * API Route: GET /api/test-dataset/transaction-details?senderId=...&receiverId=...
 * Fetch the most recent transaction details between sender and receiver
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const senderId = searchParams.get('senderId')
    const receiverId = searchParams.get('receiverId')

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Both senderId and receiverId query parameters are required' },
        { status: 400 }
      )
    }

    // Fetch the most recent transaction between sender and receiver
    const { data, error } = await supabase
      .from('test_dataset')
      .select('*')
      .eq('nameOrig', senderId)
      .eq('nameDest', receiverId)
      .order('step', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json(
          { error: 'No transaction found between these sender and receiver' },
          { status: 404 }
        )
      }
      console.error('Error fetching transaction details:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transaction details', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No transaction found between these sender and receiver' },
        { status: 404 }
      )
    }

    // Return transaction details in a format suitable for form auto-fill
    return NextResponse.json({
      transaction: {
        step: data.step,
        type: data.type,
        amount: parseFloat(data.amount),
        nameOrig: data.nameOrig,
        oldBalanceOrig: parseFloat(data.oldBalanceOrig),
        newBalanceOrig: parseFloat(data.newBalanceOrig),
        nameDest: data.nameDest,
        oldBalanceDest: parseFloat(data.oldBalanceDest),
        newBalanceDest: parseFloat(data.newBalanceDest),
        isFlaggedFraud: data.isFlaggedFraud,
      },
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

