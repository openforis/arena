const debounceTimeouts = {}
const throttleTimeouts = {}
const throttleLastRan = {}

export const cancelDebounce = (id) => {
  const timeoutId = debounceTimeouts[id]
  if (timeoutId) {
    clearTimeout(debounceTimeouts[id])
    delete debounceTimeouts[id]
  }
}

export const debounce = (func, id, delay = 500, immediate = false) => {
  return function (...args) {
    const context = this

    const onTimeout = function () {
      delete debounceTimeouts[id]
      if (!immediate) {
        func.apply(context, args)
      }
    }

    const callNow = immediate && !debounceTimeouts[id]
    cancelDebounce(id)
    debounceTimeouts[id] = setTimeout(onTimeout, delay)
    if (callNow) {
      func.apply(context, args)
    }
  }
}

export const throttle = (func, id, limit = 500) => {
  return function (...args) {
    const context = this

    const runFunction = () => {
      func.apply(context, args)
      throttleLastRan[id] = Date.now()

      delete throttleTimeouts[id]
    }

    const lastRun = throttleLastRan[id]
    if (lastRun) {
      clearTimeout(throttleTimeouts[id])

      const timeSinceLastRun = Date.now() - lastRun
      const nextRunTimeout = limit - timeSinceLastRun

      if (nextRunTimeout > 0) {
        throttleTimeouts[id] = setTimeout(() => {
          if (Date.now() - lastRun >= limit) {
            runFunction()
          }
        }, nextRunTimeout)
      } else {
        runFunction()
      }
    } else {
      runFunction()
    }
  }
}

export const cancelThrottle = (id) => {
  const timeout = throttleTimeouts[id]
  if (timeout) {
    clearTimeout(timeout)
    delete throttleTimeouts[id]
  }

  delete throttleLastRan[id]
}
