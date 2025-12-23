/**
 * API Route: GET /api/test-dataset/senders
 * Fetch distinct sample of senders (nameOrig) from test_dataset table
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
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch distinct senders using SQL DISTINCT
    // Note: Supabase doesn't support DISTINCT directly in select, so we'll fetch all and deduplicate
    const { data, error } = await supabase
      .from('test_dataset')
      .select('nameOrig')
      .order('nameOrig')

    if (error) {
      console.error('Error fetching senders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch senders', details: error.message },
        { status: 500 }
      )
    }

    // Get distinct senders and apply pagination
    const distinctSenders = Array.from(
      new Set(data?.map((row) => row.nameOrig) || [])
    )
      .slice(offset, offset + limit)

    // Get total count of distinct senders
    const totalDistinct = new Set(data?.map((row) => row.nameOrig) || []).size

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

