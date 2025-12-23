/**
 * API Route: GET /api/test-dataset/receivers?senderId=...
 * Fetch distinct receivers (nameDest) for a specific sender from test_dataset
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
    const senderId = searchParams.get('senderId')

    if (!senderId) {
      return NextResponse.json(
        { error: 'senderId query parameter is required' },
        { status: 400 }
      )
    }

    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch all receivers for this sender
    const { data, error } = await supabase
      .from('test_dataset')
      .select('nameDest')
      .eq('nameOrig', senderId)
      .order('nameDest')

    if (error) {
      console.error('Error fetching receivers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch receivers', details: error.message },
        { status: 500 }
      )
    }

    // Get distinct receivers and apply pagination
    const distinctReceivers = Array.from(
      new Set(data?.map((row) => row.nameDest) || [])
    ).slice(offset, offset + limit)

    // Get total count of distinct receivers for this sender
    const totalDistinct = new Set(data?.map((row) => row.nameDest) || []).size

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

