const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'

export default function handler(req, res) {
  const clientId = (process.env.GITHUB_CLIENT_ID || '').trim()
  if (!clientId) {
    res.statusCode = 500
    res.end('Missing GITHUB_CLIENT_ID env var')
    return
  }

  const url = new URL(req.url, `https://${req.headers.host}`)
  const site = url.searchParams.get('site') || ''

  const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${
    req.headers.host
  }/api/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo',
    state: site,
  })

  res.writeHead(302, { Location: `${AUTHORIZE_URL}?${params}` })
  res.end()
}
