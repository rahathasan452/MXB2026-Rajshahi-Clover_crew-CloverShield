/**
 * API Route: GET /api/users/receivers?senderId=...
 * Fetch distinct receivers (users) that have had transactions with a specific sender
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    if (!senderId) {
      return NextResponse.json(
        { error: 'senderId query parameter is required' },
        { status: 400 }
      )
    }

    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const search = searchParams.get('search') || ''

    // First, get all distinct receiver IDs from transactions table
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('receiver_id')
      .eq('sender_id', senderId)

    if (txError) {
      console.error('Error fetching transactions:', txError)
      return NextResponse.json(
        { error: 'Failed to fetch receivers', details: txError.message },
        { status: 500 }
      )
    }

    // Get distinct receiver IDs
    const distinctReceiverIds = Array.from(
      new Set((transactions || []).map((tx) => tx.receiver_id))
    )

    if (distinctReceiverIds.length === 0) {
      return NextResponse.json({
        receivers: [],
        senderId,
        total: 0,
        limit,
        offset,
      })
    }

    // Now fetch user details for these receiver IDs
    let query = supabase
      .from('users')
      .select('user_id, name_en, name_bn, provider, balance')
      .in('user_id', distinctReceiverIds)
      .order('name_en')

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `user_id.ilike.%${search}%,name_en.ilike.%${search}%,name_bn.ilike.%${search}%,provider.ilike.%${search}%`
      )
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch receivers', details: usersError.message },
        { status: 500 }
      )
    }

    // Format response
    let receivers = (users || []).map((user) => ({
      id: user.user_id,
      name: user.name_en,
      nameBn: user.name_bn,
      provider: user.provider,
      balance: user.balance,
    }))

    // Apply pagination after filtering
    const total = receivers.length
    receivers = receivers.slice(offset, offset + limit)

    return NextResponse.json({
      receivers,
      senderId,
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

