// Lightweight analytics for demo: logs events to localStorage and console.
import { getSupabase } from './supabase'

const STORAGE_KEY = 'audrey_analytics_events'
let events = []

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    events = raw ? JSON.parse(raw) : []
  } catch (e) {
    events = []
  }
}

const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch (e) {}
}

// Simple scrub to avoid sending PII: remove email fields if present
const scrubProps = (props = {}) => {
  const p = { ...props }
  if (p.email) delete p.email
  if (p.inviteCode) p.inviteCode = 'REDACTED'
  return p
}

async function trySendToSupabase(entry) {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData && userData.user ? userData.user.id : null
    const payload = {
      id: entry.id,
      user_id: userId,
      name: entry.name,
      timestamp: entry.timestamp,
      props: entry.props
    }
    await supabase.from('events').insert(payload)
  } catch (e) {
    // ignore failures (network, missing table, permissions) for demo
  }
}

export function logEvent(name, props = {}) {
  if (!events.length) load()
  const entry = {
    id: `ev_${Date.now()}_${Math.floor(Math.random()*1000)}`,
    name,
    timestamp: new Date().toISOString(),
    props: scrubProps(props),
  }
  events.push(entry)
  save()
  // console-friendly output
  try { console.log('[analytics]', entry.name, entry.props) } catch (e) {}
  // Fire-and-forget supabase send
  try { trySendToSupabase(entry) } catch (e) {}
}

export function getEvents() {
  if (!events.length) load()
  return events.slice()
}

export function clearEvents() {
  events = []
  try { localStorage.removeItem(STORAGE_KEY) } catch (e) {}
}

export default { logEvent, getEvents, clearEvents }
