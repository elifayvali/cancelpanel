import { CHANNEL_LABELS } from './channelLabels'

const STORAGE_KEY = 'cancelpanel-close-reason-events'
const MIN_PERSIST_COUNT = 500

/**
 * @typedef {{
 *   date: string,
 *   channelIndex: number,
 *   reason: string,
 *   equipmentId: string,
 *   closedBy?: string,
 *   closedAt?: string
 * }} CloseReasonEvent
 */

/** @returns {CloseReasonEvent[]} */
export function loadCloseReasonEventsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return sanitizeEvents(parsed)
    }
    if (parsed && parsed.v === 2 && Array.isArray(parsed.rows)) {
      return sanitizeEvents(
        parsed.rows.map((r) => ({
          date: r?.[0],
          channelIndex: r?.[1],
          reason: r?.[2],
          equipmentId: r?.[3],
          closedBy: r?.[4],
          closedAt: r?.[5],
        })),
      )
    }
    return []
  } catch {
    return []
  }
}

function sanitizeEvents(events) {
  return events.filter(
    (e) =>
      e &&
      typeof e.date === 'string' &&
      typeof e.channelIndex === 'number' &&
      e.channelIndex >= 1 &&
      e.channelIndex <= CHANNEL_LABELS.length &&
      typeof e.reason === 'string' &&
      e.reason.trim() !== '' &&
      typeof e.equipmentId === 'string' &&
      e.equipmentId.trim() !== '',
  )
}

function toCompactRows(events) {
  return events.map((e) => [
    e.date,
    e.channelIndex,
    e.reason,
    e.equipmentId,
    e.closedBy || '',
    e.closedAt || '',
  ])
}

function persistRows(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, rows }))
}

/** @param {CloseReasonEvent[]} events */
export function saveCloseReasonEventsToStorage(events) {
  const validEvents = sanitizeEvents(events)
  const sorted = [...validEvents].sort((a, b) => String(b.date).localeCompare(String(a.date), 'tr'))
  let rows = toCompactRows(sorted)

  try {
    persistRows(rows)
    return
  } catch {
    // Quota doluysa en güncel kayıtlardan başlayarak küçültüp tekrar deneriz.
  }

  while (rows.length > MIN_PERSIST_COUNT) {
    rows = rows.slice(0, Math.floor(rows.length * 0.75))
    try {
      persistRows(rows)
      return
    } catch {
      // bir sonraki iterasyonda daha da küçülteceğiz
    }
  }

  // Son çare: tamamen boşaltıp az sayıda kayıt dene.
  localStorage.removeItem(STORAGE_KEY)
  try {
    persistRows(rows.slice(0, Math.min(rows.length, MIN_PERSIST_COUNT)))
  } catch {
    // Kalıcı kaydedilemese bile oturum içi veri kullanılmaya devam eder.
  }
}

export function clearCloseReasonEventsStorage() {
  localStorage.removeItem(STORAGE_KEY)
}
