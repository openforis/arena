import { useCallback, useEffect, useRef, useState } from 'react'

import { isAiAbortError } from '@webapp/ai/workflows'

type StreamCallbacks = {
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: unknown) => void
}

type Params = {
  // starts the stream and returns its cancel function; a new identity restarts the stream
  start: (callbacks: StreamCallbacks) => () => void
  // called when the user closes the first-use dialog instead of answering it
  onClose: () => void
  enabled?: boolean
}

/**
 * Runs a streamed AI text request and keeps its text, done flag and error; Retry starts it again.
 * @param {Params} params - The stream starter, the close handler and whether to run.
 * @returns {object} The text, done flag, error, retry handler and cancel function.
 */
export const useAiTextStream = ({ start, onClose, enabled = true }: Params) => {
  const cancelRef = useRef<(() => void) | null>(null)
  // the latest onClose at call time: a new callback identity must not restart the stream
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<any>(null)
  const [attempt, setAttempt] = useState(0)
  const onRetry = useCallback(() => setAttempt((count) => count + 1), [])

  useEffect(() => {
    if (!enabled) return undefined
    // the stream subscription below is the external system this effect synchronizes with
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText('')
    setDone(false)
    setError(null)
    cancelRef.current = start({
      onChunk: (chunk) => setText((prev) => prev + chunk),
      onDone: () => setDone(true),
      onError: (err) => {
        if (isAiAbortError(err)) {
          // the user closed the first-use dialog
          onCloseRef.current()
          return
        }
        setError(err)
        setDone(true)
      },
    })
    return () => {
      cancelRef.current?.()
    }
  }, [start, enabled, attempt])

  const cancel = useCallback(() => cancelRef.current?.(), [])

  return { text, done, error, onRetry, cancel }
}
