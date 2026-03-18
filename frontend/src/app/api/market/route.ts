import { NextResponse } from 'next/server'

export async function GET() {
  // Mock market summary
  const xu100Base = 9876.54
  const xu030Base = 10234.56
  
  const xu100Change = Math.round((Math.random() - 0.5) * 400 * 100) / 100
  const xu030Change = Math.round((Math.random() - 0.5) * 500 * 100) / 100
  
  return NextResponse.json({
    xu100: {
      name: 'BIST 100',
      value: Math.round((xu100Base + xu100Change) * 100) / 100,
      change: xu100Change,
      change_percent: Math.round((xu100Change / xu100Base) * 10000) / 100
    },
    xu030: {
      name: 'BIST 30',
      value: Math.round((xu030Base + xu030Change) * 100) / 100,
      change: xu030Change,
      change_percent: Math.round((xu030Change / xu030Base) * 10000) / 100
    },
    timestamp: new Date().toISOString()
  })
}
