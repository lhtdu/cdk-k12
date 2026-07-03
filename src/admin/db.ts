import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CDKKey, Workspace, AdminSession } from './types'
import { DEFAULT_WORKSPACE_ID } from './types'

interface CDKDB extends DBSchema {
  keys: {
    key: string
    value: CDKKey
    indexes: { 'by-status': string; 'by-createdAt': number }
  }
  workspaces: {
    key: string
    value: Workspace
    indexes: { 'by-isDefault': number }
  }
  session: {
    key: string
    value: AdminSession
  }
}

const DB_NAME = 'cdk-k12-db'
const DB_VERSION = 1

let _db: IDBPDatabase<CDKDB> | null = null
let _dbPromise: Promise<IDBPDatabase<CDKDB>> | null = null

export function getDB(): Promise<IDBPDatabase<CDKDB>> {
  if (_db) return Promise.resolve(_db)
  if (_dbPromise) return _dbPromise
  _dbPromise = openDB<CDKDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('keys')) {
        const keyStore = db.createObjectStore('keys', { keyPath: 'id' })
        keyStore.createIndex('by-status', 'status')
        keyStore.createIndex('by-createdAt', 'createdAt')
      }
      if (!db.objectStoreNames.contains('workspaces')) {
        const wsStore = db.createObjectStore('workspaces', { keyPath: 'id' })
        wsStore.createIndex('by-isDefault', 'isDefault')
      }
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session', { keyPath: 'key' })
      }
    },
  }).then(db => {
    _db = db
    return db
  }).catch(err => {
    _dbPromise = null
    throw err
  })
  return _dbPromise
}

// Kick off DB initialization early to avoid race conditions on F5
if (typeof window !== 'undefined') {
  getDB().catch(() => { /* ignore */ })
}

// ==================== CDK Keys ====================

export async function getCDKKeys(): Promise<CDKKey[]> {
  const db = await getDB()
  const all = await db.getAll('keys')
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function setCDKKeys(keys: CDKKey[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('keys', 'readwrite')
  await tx.store.clear()
  for (const k of keys) {
    await tx.store.put(k)
  }
  await tx.done
}

export async function addCDKKey(key: CDKKey): Promise<void> {
  const db = await getDB()
  await db.put('keys', key)
}

export async function updateCDKKey(id: string, updates: Partial<CDKKey>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('keys', id)
  if (existing) {
    await db.put('keys', { ...existing, ...updates })
  }
}

export async function deleteCDKKey(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('keys', id)
}

export async function getCDKKeyByKey(key: string): Promise<CDKKey | undefined> {
  const db = await getDB()
  const all = await db.getAll('keys')
  return all.find(k => k.key.toLowerCase() === key.toLowerCase())
}

export async function checkCDKKeyStatus(key: string): Promise<CDKKey | undefined> {
  return getCDKKeyByKey(key)
}

export async function markCDKKeyUsed(key: string, email: string): Promise<void> {
  const db = await getDB()
  const all = await db.getAll('keys')
  const idx = all.findIndex(k => k.key.toLowerCase() === key.toLowerCase())
  if (idx !== -1) {
    const record = all[idx]
    await db.put('keys', {
      ...record,
      status: 'used',
      activatedAt: Date.now(),
      activatedEmail: email,
    })
  }
}

// ==================== Workspaces ====================

export async function getWorkspaces(): Promise<Workspace[]> {
  const db = await getDB()
  const all = await db.getAll('workspaces')
  if (all.length === 0) {
    const defaultWs: Workspace = {
      id: crypto.randomUUID(),
      name: 'Default Workspace',
      workspaceId: DEFAULT_WORKSPACE_ID,
      isDefault: true,
      createdAt: Date.now(),
    }
    await db.put('workspaces', defaultWs)
    return [defaultWs]
  }
  return all
}

export async function setWorkspaces(workspaces: Workspace[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('workspaces', 'readwrite')
  await tx.store.clear()
  for (const w of workspaces) {
    await tx.store.put(w)
  }
  await tx.done
}

export async function addWorkspace(ws: Workspace): Promise<void> {
  const db = await getDB()
  await db.put('workspaces', ws)
}

export async function updateWorkspace(id: string, updates: Partial<Workspace>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('workspaces', id)
  if (existing) {
    await db.put('workspaces', { ...existing, ...updates })
  }
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await getDB()
  const all = await db.getAll('workspaces')
  const filtered = all.filter(w => w.id !== id)
  if (filtered.length === 0) {
    filtered.push({
      id: crypto.randomUUID(),
      name: 'Default Workspace',
      workspaceId: DEFAULT_WORKSPACE_ID,
      isDefault: true,
      createdAt: Date.now(),
    })
  }
  await setWorkspaces(filtered)
}

export async function getDefaultWorkspace(): Promise<Workspace | undefined> {
  const all = await getWorkspaces()
  return all.find(w => w.isDefault)
}

// ==================== Admin Session ====================

const SESSION_KEY = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function getAdminSession(): Promise<AdminSession> {
  try {
    const db = await getDB()
    const val = await db.get('session', SESSION_KEY)
    const session = (val as AdminSession | undefined) ?? null
    if (!session) {
      return { isLoggedIn: false, username: '', loginAt: 0 }
    }
    if (!session.isLoggedIn || !session.loginAt) {
      return { isLoggedIn: false, username: '', loginAt: 0 }
    }
    if (Date.now() - session.loginAt > SESSION_TTL_MS) {
      await clearAdminSession()
      return { isLoggedIn: false, username: '', loginAt: 0 }
    }
    return session
  } catch {
    return { isLoggedIn: false, username: '', loginAt: 0 }
  }
}

export async function setAdminSession(session: AdminSession): Promise<void> {
  const db = await getDB()
  await db.put('session', { ...session, key: SESSION_KEY } as any)
}

export async function clearAdminSession(): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('session', SESSION_KEY)
  } catch {
    /* noop */
  }
}