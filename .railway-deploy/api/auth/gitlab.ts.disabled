export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITLAB_CLIENT_ID,
        client_secret: process.env.GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GITLAB_REDIRECT_URI || 'https://assistente-juridico-p.vercel.app/api/auth/callback/gitlab',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('GitLab token exchange failed:', await tokenResponse.text())
      return Response.json({ error: 'Failed to exchange code for token' }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return Response.json({ error: 'No access token received' }, { status: 400 })
    }

    // Get user info
    const userResponse = await fetch('https://gitlab.com/api/v4/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!userResponse.ok) {
      console.error('GitLab user fetch failed:', await userResponse.text())
      return Response.json({ error: 'Failed to fetch user data' }, { status: 400 })
    }

    const userData = await userResponse.json()

    // Get user email (might be private)
    let email = userData.email
    if (!email) {
      const emailsResponse = await fetch('https://gitlab.com/api/v4/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      })

      if (emailsResponse.ok) {
        const emails = await emailsResponse.json()
        const primaryEmail = emails.find((e: { primary: boolean; email: string }) => e.primary)
        email = primaryEmail?.email || emails[0]?.email
      }
    }

    // Return user data
    const user = {
      id: userData.id.toString(),
      login: userData.username,
      email: email || '',
      name: userData.name || userData.username,
      avatar_url: userData.avatar_url,
    }

    return Response.json(user)
  } catch (error) {
    console.error('GitLab auth error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}