import { createClient } from '@supabase/supabase-js'

// Values are injected from .env.local by the assistant runner
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY

let SUPABASE_URL_FINAL = SUPABASE_URL
let SUPABASE_KEY_FINAL = SUPABASE_KEY

if (!SUPABASE_URL_FINAL || !SUPABASE_KEY_FINAL) {
  // try to read local .env.local file
  try {
    const fs = await import('fs')
    const path = './.env.local'
    if (fs.existsSync(path)) {
      const raw = fs.readFileSync(path, 'utf8')
      raw.split(/\r?\n/).forEach(line => {
        const m = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+)\s*$/)
        if (m && !SUPABASE_URL_FINAL) SUPABASE_URL_FINAL = m[1].trim()
        const n = line.match(/^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.+)\s*$/)
        if (n && !SUPABASE_KEY_FINAL) SUPABASE_KEY_FINAL = n[1].trim()
      })
    }
  } catch (e) {
    // ignore
  }
}

if (!SUPABASE_URL_FINAL || !SUPABASE_KEY_FINAL) {
  console.error(JSON.stringify({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_KEY in env or .env.local' }))
  process.exit(2)
}

const supabase = createClient(SUPABASE_URL_FINAL, SUPABASE_KEY_FINAL)

function scrub(obj) {
  if (!obj) return obj
  const out = JSON.parse(JSON.stringify(obj))
  // Remove or redact common PII keys
  if (out.email) delete out.email
  if (out.inviteCode) out.inviteCode = 'REDACTED'
  // redact any string that looks like an email inside values
  const walk = (v) => {
    if (v && typeof v === 'string') {
      if (v.includes('@')) return '[REDACTED_EMAIL]'
      return v
    }
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      Object.keys(v).forEach(k => { v[k] = walk(v[k]) })
      return v
    }
    return v
  }
  return walk(out)
}

async function run() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) {
      console.error(JSON.stringify({ ok: false, error: error.message }))
      process.exit(1)
    }

    const rows = (data || []).map(r => ({ id: r.id, name: r.name, timestamp: r.timestamp, user_id: r.user_id, props: scrub(r.props) }))
    console.log(JSON.stringify({ ok: true, count: rows.length, rows }, null, 2))
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e.message }))
    process.exit(1)
  }
}

run()
