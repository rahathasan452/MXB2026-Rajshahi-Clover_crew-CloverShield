/**
 * API Route: GET /api/test-dataset/senders
 * Fetch distinct sample of senders (nameOrig) from test_dataset table
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
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const search = searchParams.get('search') || ''

    // Fetch distinct senders using SQL DISTINCT
    // Note: Supabase doesn't support DISTINCT directly in select, so we'll fetch all and deduplicate
    let query = supabase
      .from('test_dataset')
      .select('nameOrig')
      .order('nameOrig')

    // Apply search filter if provided
    if (search) {
      query = query.ilike('nameOrig', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching senders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch senders', details: error.message },
        { status: 500 }
      )
    }

    // Get distinct senders and apply pagination
    let distinctSenders = Array.from(
      new Set(data?.map((row) => row.nameOrig) || [])
    )

    const totalDistinct = distinctSenders.length
    
    // Apply pagination after deduplication
    distinctSenders = distinctSenders.slice(offset, offset + limit)

    return NextResponse.json({
      senders: distinctSenders,
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

