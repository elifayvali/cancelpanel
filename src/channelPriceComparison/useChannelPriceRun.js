import { useCallback, useEffect, useRef, useState } from 'react'
import { cancelRun, getRun, startRun } from '../priceComparisonService'
import { clearCompletedRun } from './storage'

const POLL_MS = 2000

/**
 * @param {{
 *   isActive: boolean
 *   authHeader?: Record<string, string>
 *   onCancelled?: () => void
 *   onCompleted?: (run: object) => void
 * }} opts
 */
export function useChannelPriceRun({ isActive, authHeader, onCancelled, onCompleted }) {
  const [runId, setRunId] = useState(null)
  const [runState, setRunState] = useState(null)
  const [storeCountHint, setStoreCountHint] = useState(null)
  const [running, setRunning] = useState(false)
  const [failedMessage, setFailedMessage] = useState('')
  const [cancelNotice, setCancelNotice] = useState('')
  const pollRef = useRef(null)
  const runIdRef = useRef(null)
  const runningRef = useRef(false)

  useEffect(() => {
    runIdRef.current = runId
    runningRef.current = running
  }, [runId, running])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const resetRunUi = useCallback(() => {
    stopPolling()
    setRunId(null)
    setRunState(null)
    setStoreCountHint(null)
    setRunning(false)
    setFailedMessage('')
  }, [stopPolling])

  const doCancel = useCallback(
    async (silent) => {
      const id = runIdRef.current
      if (!id || !runningRef.current) return
      stopPolling()
      setRunning(false)
      try {
        await cancelRun(id, authHeader)
      } catch {
        /* ignore */
      }
      setRunId(null)
      setRunState(null)
      setStoreCountHint(null)
      if (!silent) {
        setCancelNotice('Karşılaştırma durduruldu. Sonuç tutulmadı.')
        onCancelled?.()
      }
    },
    [authHeader, onCancelled, stopPolling],
  )

  const pollOnce = useCallback(async () => {
    const id = runIdRef.current
    if (!id) return
    try {
      const data = await getRun(id, authHeader)
      setRunState(data)
      if (data.runStatus === 'COMPLETED') {
        stopPolling()
        setRunning(false)
        onCompleted?.(data)
      } else if (data.runStatus === 'FAILED') {
        stopPolling()
        setRunning(false)
        setFailedMessage(data.message || 'Karşılaştırma tamamlanamadı.')
      } else if (data.runStatus === 'CANCELLED' || data.runStatus === 'EXPIRED') {
        stopPolling()
        resetRunUi()
      }
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        clearCompletedRun()
        resetRunUi()
        return
      }
      stopPolling()
      setRunning(false)
      setFailedMessage(e.message || 'Karşılaştırma tamamlanamadı.')
    }
  }, [authHeader, onCompleted, resetRunUi, stopPolling])

  const beginCompare = useCallback(
    async (payload) => {
      setCancelNotice('')
      setFailedMessage('')
      clearCompletedRun()
      try {
        const start = await startRun(payload, authHeader)
        setRunId(start.runId)
        setStoreCountHint(start.storeCount)
        setRunning(true)
        setRunState({ runId: start.runId, runStatus: 'RUNNING', progress: { done: 0, total: start.storeCount } })
        stopPolling()
        pollRef.current = setInterval(() => {
          pollOnce()
        }, POLL_MS)
        await pollOnce()
      } catch (e) {
        setFailedMessage(e.message || 'Karşılaştırma başlatılamadı.')
        setRunning(false)
      }
    },
    [authHeader, pollOnce, stopPolling],
  )

  const handleStopCompare = useCallback(() => {
    doCancel(false)
  }, [doCancel])

  useEffect(() => {
    if (isActive || !running) return undefined
    const t = window.setTimeout(() => {
      doCancel(true)
    }, 0)
    return () => window.clearTimeout(t)
  }, [isActive, running, doCancel])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (runIdRef.current && runningRef.current) {
        cancelRun(runIdRef.current, authHeader)
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [authHeader])

  useEffect(() => () => stopPolling(), [stopPolling])

  const hydrateFromRun = useCallback((data) => {
    setRunId(data.runId)
    setRunState(data)
    setRunning(false)
    setStoreCountHint(null)
  }, [])

  return {
    runId,
    runState,
    storeCountHint,
    running,
    failedMessage,
    cancelNotice,
    setCancelNotice,
    beginCompare,
    handleStopCompare,
    resetRunUi,
    hydrateFromRun,
    setFailedMessage,
  }
}
