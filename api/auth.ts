import type { VercelRequest, VercelResponse } from '@vercel/node'

// Admin auth endpoint — credentials live ONLY in env vars.
// Set these in Vercel → Project → Settings → Environment Variables:
//   ADMIN_USERNAME        (e.g. "tandu05")
//   ADMIN_PASSWORD_HASH   (sha256 hex of the password)
//   ADMIN_TOKEN           (random secret the client receives after login)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Constant-time-ish comparison to avoid trivial timing leaks
function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v)
    return res.status(204).end()
  }
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v)

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const expectedUser = process.env.ADMIN_USERNAME
  const expectedHash = process.env.ADMIN_PASSWORD_HASH
  const token = process.env.ADMIN_TOKEN

  if (!expectedUser || !expectedHash || !token) {
    return res.status(500).json({
      ok: false,
      error: 'Server is missing admin env vars (ADMIN_USERNAME / ADMIN_PASSWORD_HASH / ADMIN_TOKEN)',
    })
  }

  const { username, password } = (req.body || {}) as { username?: string; password?: string }
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing username or password' })
  }

  const userOk = safeEq(username.trim(), expectedUser)
  const hashOk = safeEq(await sha256Hex(password), expectedHash.toLowerCase())

  if (!userOk || !hashOk) {
    // Same delay either way to reduce username-enumeration signal
    await new Promise(r => setTimeout(r, 250))
    return res.status(401).json({ ok: false, error: 'Invalid credentials' })
  }

  return res.status(200).json({ ok: true, token })
}