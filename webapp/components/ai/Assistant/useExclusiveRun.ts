import { useCallback, useRef, useState } from 'react'

export type ExclusiveRun = {
  running: boolean
  // runs the action unless another one runs; resolves when it ends
  run: (action: () => Promise<void> | void) => Promise<void>
}

/**
 * Runs one action at a time (Apply, Discard): a second call while one runs does nothing.
 * @returns {ExclusiveRun} Whether an action runs, and the function that starts one.
 */
export const useExclusiveRun = (): ExclusiveRun => {
  const [running, setRunning] = useState(false)
  // set before the re-render, so two quick clicks can't both start an action
  const runningRef = useRef(false)

  const run = useCallback(async (action: () => Promise<void> | void): Promise<void> => {
    if (runningRef.current) return
    runningRef.current = true
    setRunning(true)
    try {
      await action()
    } finally {
      runningRef.current = false
      setRunning(false)
    }
  }, [])

  return { running, run }
}
