const handleGeneratorNext =
  (results: unknown[]) =>
  async (generator: Generator<Promise<unknown> | unknown, void, unknown>): Promise<unknown[]> => {
    const { done, value } = generator.next()

    if (done) {
      return results
    }

    results.push(await value)

    return handleGeneratorNext(results)(generator)
  }

export const resolveGenerator = handleGeneratorNext([])

export const each = async <T>(
  iterable: T[],
  callback: (item: T, index: number) => Promise<unknown> | unknown,
  stopIfFn: ((item: T) => boolean) | null = null
): Promise<unknown[]> => {
  function* generator(): Generator<Promise<unknown> | unknown, void, unknown> {
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

export const waitFor = (seconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
