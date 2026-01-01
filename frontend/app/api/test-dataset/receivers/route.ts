/**
 * API Route: GET /api/test-dataset/receivers?senderId=...
 * Fetch distinct receivers (nameDest) for a specific sender from test_dataset
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

    // Fetch all receivers for this sender
    let query = supabase
      .from('test_dataset')
      .select('nameDest')
      .eq('nameOrig', senderId)
      .order('nameDest')

    // Apply search filter if provided
    if (search) {
      query = query.ilike('nameDest', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching receivers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch receivers', details: error.message },
        { status: 500 }
      )
    }

    // Get distinct receivers and apply pagination
    let distinctReceivers = Array.from(
      new Set(data?.map((row) => row.nameDest) || [])
    )

    const totalDistinct = distinctReceivers.length
    
    // Apply pagination after deduplication
    distinctReceivers = distinctReceivers.slice(offset, offset + limit)

    return NextResponse.json({
      receivers: distinctReceivers,
      senderId,
      total: totalDistinct,
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

