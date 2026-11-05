import { ClusterBus } from '@openforis/arena-server'

import * as Expression from '@core/expressionParser/expression'
import * as SurveyCycle from '@core/survey/surveyCycle'
import * as Validation from '@core/validation/validation'
import { validateCycles } from '@core/survey/_surveyValidator/surveyCyclesValidator'

import * as JobManager from '@server/job/jobManager'

describe('Survey cycles validation', () => {
  const getErrorKeys = (validation: Parameters<typeof Validation.getErrors>[0]) =>
    (Validation.getErrors(validation) as { key: string }[]).map((error) => error.key)

  test('no cycles is not valid', async () => {
    const validation = await validateCycles({})
    expect(Validation.isValid(validation)).toBe(false)
    expect(getErrorKeys(validation)).toEqual([Validation.messageKeys.surveyInfoEdit.cyclesRequired])
  })

  test('more cycles than the maximum is not valid', async () => {
    const cycles = Object.fromEntries(Array.from({ length: 11 }, (_, index) => [String(index), SurveyCycle.newCycle()]))
    const validation = await validateCycles(cycles)
    expect(Validation.isValid(validation)).toBe(false)
    expect(getErrorKeys(validation)).toEqual([Validation.messageKeys.surveyInfoEdit.cyclesExceedingMax])
  })
})

describe('Expression SQL mode', () => {
  test.each([
    [`species = 'ORANGE'`, `species == 'ORANGE'`],
    [`a = 'a=b' AND b = 'AND OR'`, `a == 'a=b' && b == 'AND OR'`],
    [`a >= 1 OR b != "x OR y"`, `a >= 1 || b != "x OR y"`],
    [`ORDER = 1`, `ORDER == 1`],
  ])('fromString(%p) keeps quoted values unchanged', (sqlString, jsString) => {
    expect(Expression.fromString(sqlString, Expression.modes.sql)).toEqual(Expression.fromString(jsString))
  })

  test('toString keeps quoted values unchanged', () => {
    const expr = Expression.fromString(`a == 'x && y == z'`)
    expect(Expression.toString(expr, Expression.modes.sql)).toBe(`a = 'x && y == z'`)
  })

  test('toJsString converts SQL operators to JavaScript ones', () => {
    expect(Expression.toJsString(`plot_remarks = 'Gardening'`, Expression.modes.sql)).toBe(
      `plot_remarks == 'Gardening'`
    )
    expect(Expression.toJsString(`a = 1`)).toBe(`a = 1`)
  })
})

describe('JobManager cancel across server processes', () => {
  let publishSpy: jest.SpyInstance

  beforeEach(() => {
    publishSpy = jest.spyOn(ClusterBus, 'publish').mockResolvedValue(undefined)
  })

  afterEach(() => {
    publishSpy.mockRestore()
  })

  test('canceling the jobs of a user is relayed to the other processes', async () => {
    await JobManager.cancelActiveJobByUserUuid('user-1')
    expect(publishSpy).toHaveBeenCalledTimes(1)
    const event = publishSpy.mock.calls[0][0]
    expect(event).toMatchObject({ targetType: 'jobQueue', message: { userUuid: 'user-1' } })
    // the event is delivered back to the publishing process too: it must be ignored there
    expect(() => JobManager._handleClusterEventForTest(event)).not.toThrow()
  })

  test('canceling a job by uuid is relayed to the other processes', async () => {
    await JobManager.cancelJobByUuid('job-1')
    expect(publishSpy).toHaveBeenCalledTimes(1)
    expect(publishSpy.mock.calls[0][0]).toMatchObject({
      targetType: 'jobQueue',
      message: { jobUuid: 'job-1', canceledByAdmin: true },
    })
  })
})
