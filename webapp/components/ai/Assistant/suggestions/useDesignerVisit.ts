/**
 * Follows the designer visits: leaving the designer, or a new generation, notifies `designerLeft` with the saved node
 * defs created during the visit.
 */
import { useEffect, useRef } from 'react'

import { type DesignerVisit, nextDesignerVisit } from '@webapp/ai/suggestions/designerVisit'
import type { SuggestionGeneration } from '@webapp/ai/suggestions/generation'
import { notifySuggestionEvent } from '@webapp/ai/suggestions/suggestionEvents'

/**
 * Tracks the visit and notifies its end.
 * @param {object} params - Parameters.
 * @param {SuggestionGeneration|null} params.generation - Current generation.
 * @param {object|null} params.survey - Survey of the generation (null without one).
 * @param {string|null} params.module - App module.
 * @returns {void}
 */
export const useDesignerVisit = ({
  generation,
  survey,
  module,
}: {
  generation: SuggestionGeneration | null
  survey: any | null
  module: string | null
}): void => {
  const visitRef = useRef<DesignerVisit | null>(null)

  useEffect(() => {
    const { visit, leftUuids } = nextDesignerVisit(visitRef.current, { module, generation, survey })
    visitRef.current = visit
    // a visit without new entries has nothing to report
    if (leftUuids && leftUuids.length > 0) notifySuggestionEvent({ type: 'designerLeft', newNodeDefUuids: leftUuids })
  }, [generation, module, survey])
}
