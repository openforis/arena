import { singleFlight } from '@webapp/app/singleFlight'

describe('singleFlight', () => {
  test('concurrent calls share one run and one result; a later call runs again', async () => {
    let runs = 0
    const shared = singleFlight(async () => {
      runs += 1
      await new Promise((resolve) => setTimeout(resolve, 5))
      return runs
    })
    const results = await Promise.all([shared(), shared(), shared()])
    expect(results).toEqual([1, 1, 1])
    expect(await shared()).toBe(2)
  })

  test('a rejection reaches every caller and does not block the next run', async () => {
    let runs = 0
    const shared = singleFlight(async () => {
      runs += 1
      if (runs === 1) throw new Error('boom')
      return 'ok'
    })
    const settled = await Promise.allSettled([shared(), shared()])
    expect(settled.map((r) => r.status)).toEqual(['rejected', 'rejected'])
    expect(await shared()).toBe('ok')
  })
})
