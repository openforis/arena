const handleGeneratorNext = async (generator) => {
  // result => { done: [Boolean], value: [Object] }
  const { done, value } = generator.next()
  const result = await value

  if (done) {
    return result
  }

  return handleGeneratorNext(generator)
}

/**
 * Transforms the generator passed as input parameter to a Promise that gets resolved when the generator finishes
 *
 * A useful application is when an array of promises must be resolved in order
 */
export const resolveGenerator = handleGeneratorNext
