export const runDelayed = (callback, key, delay = 500) => {
  callback.meta = {
    debounce: {
      time: delay,
      key
    }
  }
  return callback
}