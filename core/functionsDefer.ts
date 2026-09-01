type TimeoutMap = Record<string, ReturnType<typeof setTimeout>>

const debounceTimeouts: TimeoutMap = {}
const throttleTimeouts: TimeoutMap = {}
const throttleLastRan: Record<string, number> = {}

export const cancelDebounce = (id: string): void => {
  const timeoutId = debounceTimeouts[id]
  if (timeoutId) {
    clearTimeout(debounceTimeouts[id])
    delete debounceTimeouts[id]
  }
}

export const debounce = <TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  id: string,
  delay = 500,
  immediate = false
) => {
  return function (this: unknown, ...args: TArgs): void {
    const onTimeout = (): void => {
      delete debounceTimeouts[id]
      if (!immediate) {
        func.apply(this, args)
      }
    }

    const callNow = immediate && !debounceTimeouts[id]
    cancelDebounce(id)
    debounceTimeouts[id] = setTimeout(onTimeout, delay)
    if (callNow) {
      func.apply(this, args)
    }
  }
}

export const throttle = <TArgs extends unknown[]>(func: (...args: TArgs) => void, id: string, limit = 500) => {
  return function (this: unknown, ...args: TArgs): void {
    const runFunction = (): void => {
      func.apply(this, args)
      throttleLastRan[id] = Date.now()
      delete throttleTimeouts[id]
    }

    const lastRun = throttleLastRan[id]
    const prevTimeout = throttleTimeouts[id]
    if (lastRun || prevTimeout) {
      if (prevTimeout) {
        clearTimeout(prevTimeout)
      }
      const timeSinceLastRun = Date.now() - lastRun
      const nextRunTimeout = limit - timeSinceLastRun
      if (nextRunTimeout > 0) {
        throttleTimeouts[id] = setTimeout(() => {
          runFunction()
        }, nextRunTimeout)
      } else {
        runFunction()
      }
    } else {
      runFunction()
    }
  }
}

export const cancelThrottle = (id: string): void => {
  const timeout = throttleTimeouts[id]
  if (timeout) {
    clearTimeout(timeout)
    delete throttleTimeouts[id]
  }

  delete throttleLastRan[id]
}
