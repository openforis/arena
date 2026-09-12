import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as DateUtils from '@core/dateUtils'

describe('time node def: includeSeconds', () => {
  it('NodeDef.isSecondsIncluded is false when the prop is not set', () => {
    const nodeDef = { props: {} }
    expect(NodeDef.isSecondsIncluded(nodeDef)).toBe(false)
  })

  it('NodeDef.isSecondsIncluded is true when the prop is true', () => {
    const nodeDef = { props: { [NodeDef.propKeys.includeSeconds]: true } }
    expect(NodeDef.isSecondsIncluded(nodeDef)).toBe(true)
  })

  it('Node.getTimeSeconds reads the third part of an HH:mm:ss value', () => {
    const node = { value: '14:30:45' }
    expect(Node.getTimeSeconds(node)).toBe(45)
  })

  it('Node.getTimeSeconds defaults to 0 for an HH:mm value', () => {
    const node = { value: '14:30' }
    expect(Node.getTimeSeconds(node)).toBe(0)
  })
})

describe('DateUtils time-with-seconds helpers', () => {
  it('exposes formats.timeWithSeconds', () => {
    expect(DateUtils.formats.timeWithSeconds).toBe('HH:mm:ss')
  })

  it('getTimeFormat returns timeStorage when includeSeconds is not set', () => {
    expect(DateUtils.getTimeFormat(false)).toBe(DateUtils.formats.timeStorage)
  })

  it('getTimeFormat returns timeWithSeconds when includeSeconds is true', () => {
    expect(DateUtils.getTimeFormat(true)).toBe(DateUtils.formats.timeWithSeconds)
  })

  it('formatTime with 2 args keeps existing HH:mm behavior', () => {
    expect(DateUtils.formatTime(9, 5)).toBe('09:05')
  })

  it('formatTime with 3 args includes seconds', () => {
    expect(DateUtils.formatTime(9, 5, 3)).toBe('09:05:03')
  })

  it('isValidTime with 2 args keeps existing behavior', () => {
    expect(DateUtils.isValidTime(14, 30)).toBe(true)
    expect(DateUtils.isValidTime(24, 30)).toBe(false)
  })

  it('isValidTime with 3 args also validates seconds range', () => {
    expect(DateUtils.isValidTime(14, 30, 45)).toBe(true)
    expect(DateUtils.isValidTime(14, 30, 60)).toBe(false)
  })
})
