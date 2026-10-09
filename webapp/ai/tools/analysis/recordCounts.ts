import { z } from 'zod'

import * as RecordStep from '@core/record/recordStep'

import type { AiTool } from '@webapp/ai/tools/types'

import type { AnalysisApi } from './analysisApi'
import { canViewCurrentSurvey, fitListToBudget, getAnalysisContext, toolError } from './toolResults'

export const dayRangeMaxDays = 366
export const monthRangeMaxDays = 3660

const dayMs = 24 * 60 * 60 * 1000
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const countOverTimeInputSchema = z.object({
  from: isoDate.describe('First day, YYYY-MM-DD'),
  to: isoDate.describe('Last day, YYYY-MM-DD'),
  groupBy: z.enum(['day', 'month']).describe('Count per day (at most 366 days) or per month'),
})

type CountOverTimeInput = z.infer<typeof countOverTimeInputSchema>
type PeriodCount = { period: string; count: number }
type EmptyInput = Record<string, never>

/**
 * Parses an ISO day (YYYY-MM-DD) as UTC midnight.
 * @param {string} value - The day.
 * @returns {number} The time in ms, NaN when the day does not exist.
 */
const parseIsoDay = (value: string): number => {
  const time = Date.parse(`${value}T00:00:00Z`)
  // some engines roll 2024-02-31 over to March: check the round trip
  return !Number.isNaN(time) && new Date(time).toISOString().startsWith(value) ? time : Number.NaN
}

/**
 * Checks the requested range.
 * @param {CountOverTimeInput} input - Tool input.
 * @returns {object|null} The error result, or null when the range is valid.
 */
const checkRange = ({ from, to, groupBy }: CountOverTimeInput) => {
  const days = (parseIsoDay(to) - parseIsoDay(from)) / dayMs
  if (Number.isNaN(days) || days < 0) return toolError('invalidRange', '"from" and "to" must be valid days, from <= to')
  const maxDays = groupBy === 'day' ? dayRangeMaxDays : monthRangeMaxDays
  if (days > maxDays) {
    return toolError(
      'rangeTooLong',
      `At most ${maxDays} days with groupBy=${groupBy}; shorten the range or group by month`
    )
  }
  return null
}

/**
 * Sums the daily counts per month.
 * @param {PeriodCount[]} days - Counts per day.
 * @returns {PeriodCount[]} Counts per month, sorted.
 */
const sumByMonth = (days: PeriodCount[]): PeriodCount[] => {
  const byMonth = new Map<string, number>()
  for (const { period, count } of days) {
    const month = period.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + count)
  }
  return [...byMonth.entries()]
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([period, count]) => ({ period, count }))
}

/**
 * Turns a timeout into a result the model can act on; other errors are re-thrown.
 * @param {any} error - The error.
 * @returns {object} The error result.
 */
const handleCountError = (error: any) => {
  if (error?.key === 'queryTimeout') {
    return toolError('queryTimeout', 'The count took too long. Try a shorter date range.')
  }
  throw error
}

/**
 * Creates records_countByStep and records_countOverTime.
 * @param {object} params - Parameters.
 * @param {AnalysisApi} params.api - Analysis API.
 * @returns {AiTool[]} The two tools.
 */
export const createRecordCountTools = ({ api }: { api: AnalysisApi }): AiTool<any, unknown>[] => {
  const common: Pick<AiTool<any>, 'area' | 'dataClass' | 'effect' | 'requires'> = {
    area: ['analysis'],
    dataClass: 'data',
    effect: 'read',
    requires: canViewCurrentSurvey,
  }

  const countByStepTool: AiTool<EmptyInput, unknown> = {
    ...common,
    name: 'records_countByStep',
    description: 'Counts the records of the current cycle by step (entry, cleansing, analysis).',
    inputSchema: z.object({}),
    /**
     * Counts the records by step.
     * @param {EmptyInput} _input - Tool input (none).
     * @param {object} ctx - Tool context.
     * @returns {Promise<object>} The counts, or an error result.
     */
    execute: async (_input, ctx) => {
      const { surveyId, cycle } = getAnalysisContext(ctx)
      try {
        const counts = (await api.fetchRecordsCountByStep({ surveyId, cycle, signal: ctx.signal })) ?? {}
        const steps = RecordStep.steps.map(({ id, name }) => ({ step: name, count: Number(counts[id] ?? 0) }))
        return { cycle, steps, total: steps.reduce((sum, { count }) => sum + count, 0) }
      } catch (error) {
        return handleCountError(error)
      }
    },
  }

  const countOverTimeTool: AiTool<CountOverTimeInput, unknown> = {
    ...common,
    name: 'records_countOverTime',
    description: 'Counts the records created per day or per month in a date range (current cycle).',
    inputSchema: countOverTimeInputSchema,
    /**
     * Counts the records created per day or month.
     * @param {CountOverTimeInput} input - Tool input.
     * @param {object} ctx - Tool context.
     * @returns {Promise<object>} The counts, or an error result.
     */
    execute: async (input, ctx) => {
      const rangeError = checkRange(input)
      if (rangeError) return rangeError
      const { surveyId, cycle } = getAnalysisContext(ctx)
      const { from, to, groupBy } = input
      try {
        const rows = (await api.fetchRecordsCountByDay({ surveyId, cycle, from, to, signal: ctx.signal })) ?? []
        const days = rows.map(({ date, count }) => ({ period: String(date).slice(0, 10), count: Number(count) }))
        const counts = groupBy === 'day' ? days : sumByMonth(days)
        const total = days.reduce((sum, { count }) => sum + count, 0)
        return fitListToBudget({ from, to, groupBy, counts, total }, 'counts')
      } catch (error) {
        return handleCountError(error)
      }
    },
  }

  return [countByStepTool, countOverTimeTool]
}
