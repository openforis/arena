import { parseActivityLogFetchParams } from '@server/modules/activityLog/api/activityLogParams'

describe('parseActivityLogFetchParams', () => {
  test('defaults', () => {
    expect(parseActivityLogFetchParams({})).toEqual({ idGreaterThan: null, idLessThan: null, limit: 30 })
  })

  test('coerces numeric strings', () => {
    expect(parseActivityLogFetchParams({ idGreaterThan: '12', limit: '1000' })).toEqual({
      idGreaterThan: 12,
      idLessThan: null,
      limit: 1000,
    })
  })

  test.each([
    [{ idGreaterThan: '1 OR 1=1' }],
    [{ idLessThan: '5; DROP TABLE x' }],
    [{ idGreaterThan: '-1' }],
    [{ limit: '1001' }],
    [{ limit: '0' }],
    [{ limit: 'ALL' }],
    [{ idLessThan: '9'.repeat(400) }],
  ])('rejects %p', (params) => {
    expect(() => parseActivityLogFetchParams(params)).toThrow()
  })

  test('throws a 400 SystemError with the appErrors key', () => {
    expect(() => parseActivityLogFetchParams({ limit: '0' })).toThrow(
      expect.objectContaining({ key: 'appErrors:invalidParams', statusCode: 400 })
    )
  })

  test('treats empty strings as missing', () => {
    expect(parseActivityLogFetchParams({ idGreaterThan: '', limit: '' })).toEqual({
      idGreaterThan: null,
      idLessThan: null,
      limit: 30,
    })
  })
})
