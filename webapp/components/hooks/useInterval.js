import { useEffect } from 'react'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Hook to be used when an async effect must be executed with a certain interval
 */
export default (effect, duration = 1000) => {
  let run = true

  const stop = () => {
    run = false
  }

  // Used to avoid the ESLint error: no-unmodified-loop-condition
  const isRunning = () => run

  useEffect(() => {
    ;(async () => {
      const start = async () => {
        while (isRunning()) {
          await effect()
          await sleep(duration)
        }
      }

      start()
    })()

    return stop
  }, [])

  return [stop]
}
