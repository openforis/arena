import type { AiDataClass } from '@common/ai/features'

/**
 * What the survey AI policy (step B) decides on: which survey, which kind of data leaves the browser and
 * where the model is hosted.
 */
export type AiPolicyCheck = { surveyId: number | null; dataClass: AiDataClass; hostingClass: string | null }

/**
 * Throws when the survey AI policy refuses the call. Step A has no policy yet: every call is allowed.
 * @param {AiPolicyCheck} _check - The call to check.
 * @returns {Promise<void>} Resolves when allowed.
 */
export const assertPolicyAllows = async (_check: AiPolicyCheck): Promise<void> => {}
