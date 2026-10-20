import { NodeValues } from '@core/record/nodeValues'
import { nodeDefType } from '@core/survey/nodeDefType'

describe('NodeValues.isValueEqual - time', () => {
  const nodeDef = { type: nodeDefType.time }

  it('treats "14:30" and "14:30:00" as equal', () => {
    expect(NodeValues.isValueEqual({ nodeDef, value: '14:30', valueSearch: '14:30:00' })).toBe(true)
  })

  it('treats "14:30:00" and "14:30:45" as different', () => {
    expect(NodeValues.isValueEqual({ nodeDef, value: '14:30:00', valueSearch: '14:30:45' })).toBe(false)
  })

  it('still treats two identical HH:mm values as equal', () => {
    expect(NodeValues.isValueEqual({ nodeDef, value: '09:15', valueSearch: '09:15' })).toBe(true)
  })
})
