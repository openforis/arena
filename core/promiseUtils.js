const handleGeneratorNext = (results) => async (generator) => {
  // result => { done: [Boolean], value: [Object] }
  const { done, value } = generator.next()

  if (done) {
    return results
  }

  results.push(await value)

  return handleGeneratorNext(results)(generator)
}

/**
 * Transforms the generator passed as input parameter to a Promise that gets resolved when the generator finishes.
 *
 * A useful application is when an array of promises must be resolved in order.
 */
export const resolveGenerator = handleGeneratorNext([])

/**
 * Given an Iterable, iterates serially over all the values in it, executing the given callback on each element.
 * If the callback returns a Promise, it is awaited before continuing to the next iteration.
 *
 * @param {Iterable} iterable - The iterable to iterate.
 * @param {Function} callback - The callback function to invoke on each element of the iterable.
 * @param {Function} stopIfFn - If specified, stops the loop if the call to that function returns true.
 * @returns {Promise<*>} - The returned Promise.
 */
export const each = async (iterable, callback, stopIfFn = null) => {
  function* generator() {
    for (let i = 0; i < iterable.length; i += 1) {
      const item = iterable[i]
      if (stopIfFn && stopIfFn(item)) {
        return
      }
      yield callback(item, i)
    }
  }

  return resolveGenerator(generator())
}
