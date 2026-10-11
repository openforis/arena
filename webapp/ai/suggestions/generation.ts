/**
 * Survey generation of the suggestion detectors: a run is bound to one user, survey, cycle and defs load. Any change
 * ends the generation, aborting its signal (timers and server requests of detectors listen to it).
 */
export type SuggestionGeneration = {
  id: number // increases on every new generation
  userUuid: string
  surveyId: number
  cycle: string
  draft: boolean // the loaded defs are the draft
  canEditSurvey: boolean
  signal: AbortSignal // aborted when the generation ends
}

export type SuggestionGenerationInput = {
  userUuid: string
  surveyId: number
  cycle: string
  draft: boolean
  canEditSurvey: boolean
  // survey/defs/load count: a reload is a new generation
  loadCount: number
}

export type GenerationTracker = {
  next: (input: SuggestionGenerationInput | null) => SuggestionGeneration | null
  end: () => void
}

/**
 * Returns the generation input, or null when there is no generation (no user, survey or cycle, defs not fetched).
 * @param {object} raw - Values from the stores.
 * @param {string|null} raw.userUuid - Logged-in user.
 * @param {number|null} raw.surveyId - Active survey.
 * @param {string|null} raw.cycle - Current cycle.
 * @param {boolean} raw.fetched - The defs are fetched.
 * @param {boolean} raw.draft - The fetched defs are the draft.
 * @param {boolean} raw.canEditSurvey - The user can edit the survey.
 * @param {number} raw.loadCount - Defs load count.
 * @returns {SuggestionGenerationInput|null} The input.
 */
export const toGenerationInput = ({
  userUuid,
  surveyId,
  cycle,
  fetched,
  draft,
  canEditSurvey,
  loadCount,
}: {
  userUuid: string | null
  surveyId: number | null
  cycle: string | null
  fetched: boolean
  draft: boolean
  canEditSurvey: boolean
  loadCount: number
}): SuggestionGenerationInput | null => {
  if (!userUuid || typeof surveyId !== 'number' || typeof cycle !== 'string' || !fetched) return null
  return { userUuid, surveyId, cycle, draft, canEditSurvey, loadCount }
}

/**
 * Creates the generation tracker of the suggestions host.
 * @returns {GenerationTracker} The tracker: next(input) returns the current generation, end() ends it.
 */
export const createGenerationTracker = (): GenerationTracker => {
  let lastId = 0
  let current: { key: string; generation: SuggestionGeneration; controller: AbortController } | null = null

  /**
   * Ends the current generation.
   * @returns {void}
   */
  const end = (): void => {
    current?.controller.abort()
    current = null
  }

  return {
    next: (input) => {
      if (!input) {
        end()
        return null
      }
      const { userUuid, surveyId, cycle, draft, canEditSurvey, loadCount } = input
      const key = JSON.stringify([userUuid, surveyId, cycle, draft, canEditSurvey, loadCount])
      if (current?.key === key) return current.generation
      end()
      lastId += 1
      const controller = new AbortController()
      const generation = { id: lastId, userUuid, surveyId, cycle, draft, canEditSurvey, signal: controller.signal }
      current = { key, generation, controller }
      return generation
    },
    end,
  }
}
