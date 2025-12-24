/**
 * API Route: GET /api/users/senders
 * Fetch senders (users) from users table with search capability
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const search = searchParams.get('search') || ''

    // Build query
    let query = supabase
      .from('users')
      .select('user_id, name_en, name_bn, provider, balance')
      .order('name_en')

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `user_id.ilike.%${search}%,name_en.ilike.%${search}%,name_bn.ilike.%${search}%,provider.ilike.%${search}%`
      )
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching senders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch senders', details: error.message },
        { status: 500 }
      )
    }

    // Format response
    const senders = (data || []).map((user) => ({
      id: user.user_id,
      name: user.name_en,
      nameBn: user.name_bn,
      provider: user.provider,
      balance: user.balance,
    }))

    return NextResponse.json({
      senders,
      total: count || senders.length,
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

