import { formatTimeKeyValue } from '@webapp/views/App/views/Data/Records/recordKeyValuesExtractor'
import { formatTimeSummaryValue } from '@server/modules/record/service/recordService'

describe('time formatting for record keys and record summary export', () => {
  it('formatTimeKeyValue truncates to HH:mm when includeSeconds is not set', () => {
    const nodeDef = { props: {} }
    expect(formatTimeKeyValue({ value: '14:30:45', nodeDef })).toBe('14:30')
  })

  it('formatTimeKeyValue keeps HH:mm:ss when includeSeconds is true', () => {
    const nodeDef = { props: { includeSeconds: true } }
    expect(formatTimeKeyValue({ value: '14:30:45', nodeDef })).toBe('14:30:45')
  })

  it('formatTimeSummaryValue truncates to HH:mm when includeSeconds is not set', () => {
    const nodeDef = { props: {} }
    expect(formatTimeSummaryValue({ value: '14:30:45', nodeDef })).toBe('14:30')
  })

  it('formatTimeSummaryValue keeps HH:mm:ss when includeSeconds is true', () => {
    const nodeDef = { props: { includeSeconds: true } }
    expect(formatTimeSummaryValue({ value: '14:30:45', nodeDef })).toBe('14:30:45')
  })
})
