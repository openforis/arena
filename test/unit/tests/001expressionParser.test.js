import * as Expression from '@core/expressionParser/expression'

import * as DateUtils from '@core/dateUtils'

const _datesEqualCompareFn = (result, resultExpected) =>
  result !== null &&
  DateUtils.convertDate({
    dateStr: result,
    formatFrom: DateUtils.formats.datetimeDefault,
    formatTo: DateUtils.formats.dateISO,
  }) ===
    DateUtils.convertDate({
      dateStr: resultExpected,
      formatFrom: DateUtils.formats.datetimeDefault,
      formatTo: DateUtils.formats.dateISO,
    })

/**
 * Query test objects.
 * Every query object has the following properties:
 * - q: the expression
 * - r: the expected result
 * - c (optional): the comparison function (e.g. (item1, item2) => item1 === item2) if not specified, comparison with equals will be performed.
 */
const queries = [
  { q: '1 + 1', r: 2 },
  { q: '3 * 8 - 4', r: 20 },
  { q: 'pow(2,3) + 1', r: 9 },
  { q: 'pow(2,3) + 1 > 10', r: false },
  { q: 'pow(2,3) + 1 > 10 - 8', r: true },
  { q: '16 / pow(2, 3) - 2', r: 0 },
  { q: '16 / (pow(2, 3) - 2)', r: 2.6666666666666665 },
  { q: '16 / (pow(2, 3) - 2) == 2.6666666666666665', r: true },
  { q: '3 ** 9', r: 19683 },
  { q: 'ln(2)', r: 0.6931471805599453 },
  { q: 'log10(10)', r: 1 },
  { q: 'log10(100) == 2', r: true },
  { q: 'now()', r: DateUtils.nowFormatDefault(), c: _datesEqualCompareFn },
  { q: `isEmpty('test')`, r: false },
  { q: `isEmpty('')`, r: true },
  { q: 'isEmpty(1)', r: false },
  { q: 'isEmpty(0)', r: false },
]

describe('ExpressionParser test', () => {
  queries.forEach((query) => {
    test(query.q, () => {
      const { q: expression, r: result, c: comparisonFn } = query

      const res = Expression.evalString(expression)
      if (comparisonFn) {
        const comparisonResult = comparisonFn(res, result)
        expect(comparisonResult).toBeTruthy()
      } else {
        expect(result).toEqual(res)
      }
    })
  })
})
