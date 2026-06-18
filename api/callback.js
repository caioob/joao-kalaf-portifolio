const TOKEN_URL = 'https://github.com/login/oauth/access_token'

export default async function handler(req, res) {
  const { code } = new URL(req.url, `https://${req.headers.host}`).searchParams
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!code || !clientId || !clientSecret) {
    res.statusCode = 400
    res.end('Missing code or server configuration')
    return
  }

  const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${
    req.headers.host
  }/api/callback`

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })

  const data = await tokenRes.json()
  const token = data.access_token

  if (!token) {
    res.statusCode = 401
    res.end('GitHub token exchange failed')
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`<!DOCTYPE html>
<html>
<head><title>Authorizing...</title></head>
<body>
<script>
(function() {
  function receiveMessage(e) {
    if (e.origin !== window.location.origin) return
    if (e.data === 'authorizing') {
      window.opener.postMessage(
        { type: 'netlify-cms', token: '${token}' },
        e.origin
      )
      window.removeEventListener('message', receiveMessage)
      window.close()
    }
  }
  window.addEventListener('message', receiveMessage)
  window.opener.postMessage('authorizing', '*')
})()
</script>
</body>
</html>`)
}
