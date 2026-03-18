import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET watchlist
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || 'anonymous'
  
  try {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase error:', error)
      // Return empty array if table doesn't exist yet
      return NextResponse.json([])
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Watchlist GET error:', error)
    return NextResponse.json([])
  }
}

// POST add to watchlist
export async function POST(request: NextRequest) {
  try {
    const { symbol, name, userId = 'anonymous' } = await request.json()
    
    if (!symbol || !name) {
      return NextResponse.json({ error: 'Symbol ve name gerekli' }, { status: 400 })
    }
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
      .single()
    
    if (existing) {
      return NextResponse.json({ error: 'Hisse zaten izleme listenizde' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('watchlist')
      .insert([{
        symbol: symbol.toUpperCase(),
        name,
        user_id: userId
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Eklenemedi' }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Watchlist POST error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

// DELETE from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const userId = searchParams.get('userId') || 'anonymous'
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol gerekli' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
    
    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Silindi' })
  } catch (error) {
    console.error('Watchlist DELETE error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}
