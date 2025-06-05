import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Validate token with GitHub API
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.users.getAuthenticated()

    return NextResponse.json({
      valid: true,
      user: data
    })
  } catch (error: any) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { valid: false, error: 'Invalid GitHub token' },
      { status: 401 }
    )
  }
}