/**
 * Daily budget of the Arena default provider: every call is charged to the user before it reaches the provider,
 * so the key of the instance cannot be drained by one account.
 */
import { ENV } from '@core/processUtils'
import SystemError from '@core/systemError'

import * as AiUsageRepository from '@server/modules/ai/repository/aiUsageRepository'

const TOO_MANY_REQUESTS = 429

export type DailyBudgetLimits = { calls: number; chars: number }

export type DailyBudgetCharger = (params: { userUuid: string; chars: number }) => Promise<void>

/**
 * Returns the UTC day of a date, as stored in the usage of the user.
 * @param {Date} date - The date.
 * @returns {string} The day, YYYY-MM-DD.
 */
export const getUtcDay = (date: Date): string => date.toISOString().slice(0, 10)

// 0, a negative number or anything that is not a number means unlimited
const toLimit = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0)

/**
 * Builds the function that charges one call to the daily budget of a user.
 * @param {object} [params] - Parameters (injectable for tests).
 * @param {DailyBudgetLimits} [params.limits] - Calls and characters per day (default: the environment).
 * @param {object} [params.repository] - Usage repository.
 * @param {() => Date} [params.now] - Clock.
 * @returns {DailyBudgetCharger} The charger; it throws aiDailyBudgetExceeded (429) when a limit would be exceeded.
 */
export const createDailyBudgetCharger = ({
  limits = { calls: ENV.aiDefaultDailyCallLimit, chars: ENV.aiDefaultDailyCharLimit },
  repository = AiUsageRepository,
  now = () => new Date(),
}: {
  limits?: DailyBudgetLimits
  repository?: Pick<typeof AiUsageRepository, 'chargeAiUsage'>
  now?: () => Date
} = {}): DailyBudgetCharger => {
  const callLimit = toLimit(limits.calls)
  const charLimit = toLimit(limits.chars)
  return async ({ userUuid, chars }) => {
    if (callLimit === 0 && charLimit === 0) return
    const usage = await repository.chargeAiUsage({ userUuid, day: getUtcDay(now()), chars, callLimit, charLimit })
    if (!usage) throw new SystemError('aiDailyBudgetExceeded', {}, TOO_MANY_REQUESTS)
  }
}
