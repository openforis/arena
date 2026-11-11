import { getColValueProcessor } from '@common/model/db/tables/dataNodeDef/dataColProps'
import { nodeDefType } from '@core/survey/nodeDefType'

describe('dataColProps - time column value processor', () => {
  const nodeDef = { type: nodeDefType.time }

  it('writes the real seconds when present', () => {
    const valueFn = getColValueProcessor(nodeDef)({ nodeCol: { value: '14:30:45' } })
    expect(valueFn()).toBe('14:30:45')
  })

  it('writes :00 seconds when the value has none (legacy HH:mm data)', () => {
    const valueFn = getColValueProcessor(nodeDef)({ nodeCol: { value: '14:30' } })
    expect(valueFn()).toBe('14:30:00')
  })

  it('writes null for an invalid time value', () => {
    const valueFn = getColValueProcessor(nodeDef)({ nodeCol: { value: '25:99' } })
    expect(valueFn()).toBeNull()
  })
})
