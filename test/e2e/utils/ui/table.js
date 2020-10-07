import { getElement } from '../api'

const selectors = {
  counts: () => '.counts',
}

export const expectTablePagination = async ({ from, to, total }) => {
  const counts = await getElement({ selector: selectors.counts() })
  const text = await counts.text()
  expect(text).toBe(`${from}-${to} of ${total}`)
}
