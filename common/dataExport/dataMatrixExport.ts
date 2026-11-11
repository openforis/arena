import type { NodeDef as ArenaNodeDef, NodeDefType, Survey as ArenaSurvey } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

type DataMatrixAttributeDefsParams = {
  survey: ArenaSurvey
  cycle: string
  entityDef: ArenaNodeDef<NodeDefType>
}

/**
 * Returns the attribute definitions of an entity that can be used as rows or values of a data matrix.
 * @param {DataMatrixAttributeDefsParams} params - The survey, the cycle and the entity definition.
 * @returns {ArenaNodeDef<NodeDefType>[]} - The attribute definitions, sorted as in the survey form.
 */
export const getDataMatrixAttributeDefs = ({
  survey,
  cycle,
  entityDef,
}: DataMatrixAttributeDefsParams): ArenaNodeDef<NodeDefType>[] =>
  Survey.getNodeDefDescendantAttributesInSingleEntities({ nodeDef: entityDef, cycle, sorted: true })(survey).filter(
    (nodeDef: ArenaNodeDef<NodeDefType>) => !NodeDef.isCoordinate(nodeDef) && !NodeDef.isFile(nodeDef)
  )
