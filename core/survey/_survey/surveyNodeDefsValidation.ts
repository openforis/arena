import type { ArenaNodeDef, NodeDefType, ArenaSurvey, ArenaValidation } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '../nodeDef'

const keys = {
  nodeDefsValidation: 'nodeDefsValidation',
} as const

export const getNodeDefsValidation = (survey: ArenaSurvey): ArenaValidation =>
  A.propOr({}, keys.nodeDefsValidation)(survey) as ArenaValidation

export const assocNodeDefsValidation =
  (nodeDefsValidation: ArenaValidation) =>
  (survey: ArenaSurvey): ArenaSurvey =>
    A.assoc(keys.nodeDefsValidation, nodeDefsValidation, survey)

export const getNodeDefValidation =
  (nodeDef: ArenaNodeDef<NodeDefType>) =>
  (survey: ArenaSurvey): ArenaValidation =>
    Validation.getFieldValidation(NodeDef.getUuid(nodeDef))(getNodeDefsValidation(survey))
