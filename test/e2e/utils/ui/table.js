import * as PromiseUtils from '@core/promiseUtils'

import { getElement, getElements } from '../api'

const selectors = {
  counts: () => '.counts',
}

export const expectTablePagination = async ({ from, to, total }) => {
  const counts = await getElement({ selector: selectors.counts() })
  const text = await counts.text()
  expect(text).toBe(`${from}-${to} of ${total}`)
}

export const getTableRowsAsObjects = async ({ rowSelector: selector, headers }) => {
  const rows = []
  const elements = await getElements({ selector })

  await PromiseUtils.each(elements, async (element) => {
    const text = await element.text()
    const textSplitted = text.split('\n')
    const row = headers.reduce(
      (rowObject, header, index) => ({ ...rowObject, [header]: textSplitted[index] || false }),
      {}
    )
    rows.push(row)
  })

  return { rows, elements }
}
