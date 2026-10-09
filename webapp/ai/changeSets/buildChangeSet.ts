import * as Survey from '@core/survey/survey'
import { uuidv4 } from '@core/uuid'

import type { ChangeOperation, ChangeOperationDraft, ChangeSet } from './types'

/**
 * Creates a change set from operation drafts (ids and date injectable for tests).
 * @param {object} params - Parameters.
 * @param {ChangeOperationDraft[]} params.drafts - Operations without id, in proposal order.
 * @param {object} params.survey - Survey the change set is for.
 * @param {string} params.summary - The model's summary, shown on the card.
 * @param {Function} [params.now] - Clock.
 * @param {Function} [params.idFactory] - Id generator.
 * @returns {ChangeSet} The change set.
 */
export const buildChangeSet = ({
  drafts,
  survey,
  summary,
  now = () => new Date(),
  idFactory = uuidv4,
}: {
  drafts: ChangeOperationDraft[]
  survey: any
  summary: string
  now?: () => Date
  idFactory?: () => string
}): ChangeSet => {
  const id = idFactory()
  return {
    id,
    surveyId: Survey.getId(survey),
    summary,
    operations: drafts.map((draft) => ({ ...draft, id: idFactory() }) as ChangeOperation),
    createdAt: now().toISOString(),
  }
}
