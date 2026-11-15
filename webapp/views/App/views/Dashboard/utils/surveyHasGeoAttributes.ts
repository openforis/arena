import type { NodeDef as ArenaNodeDef, NodeDefType, Survey as ArenaSurvey } from '@openforis/arena-core'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

/**
 * Checks whether the survey has at least one geo (polygon) attribute to show on the map.
 *
 * @param {unknown} survey - The survey.
 * @returns {boolean} True if at least one node def is of type geo.
 */
export const surveyHasGeoAttributes = (survey: ArenaSurvey): boolean => {
  const nodeDefs: ArenaNodeDef<NodeDefType>[] = Survey.getNodeDefsArray(survey) ?? []
  for (const nodeDef of nodeDefs) {
    if (NodeDef.isGeo(nodeDef)) {
      return true
    }
  }
  return false
}
