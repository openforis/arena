import {
  NodeDefExpressionEvaluator as CoreNodeDefExpressionEvaluator,
  NodeDefExpressionValidator as CoreNodeDefExpressionValidator,
} from '@openforis/arena-core'
import type { ArenaNodeDef, NodeDefType, ArenaSurvey, ArenaValidationResult } from '@openforis/arena-core'

type AnyNodeDef = ArenaNodeDef<NodeDefType>

type FindReferencedNodeDefLastParams = {
  survey: ArenaSurvey
  nodeDef: AnyNodeDef
  exprString: string
  isContextParent?: boolean
  selfReferenceAllowed?: boolean
}

export const findReferencedNodeDefLast = ({
  survey,
  nodeDef,
  exprString,
  isContextParent = true,
  selfReferenceAllowed = true,
}: FindReferencedNodeDefLastParams): Promise<AnyNodeDef | null> => {
  return new CoreNodeDefExpressionEvaluator().evalExpression({
    survey,
    nodeDef,
    expression: exprString,
    isContextParent,
    selfReferenceAllowed,
  })
}

export const validate = async ({
  survey,
  nodeDefCurrent,
  exprString,
  selfReferenceAllowed = false,
  includeAnalysis = false,
}: {
  survey: ArenaSurvey
  nodeDefCurrent: AnyNodeDef
  exprString: string
  selfReferenceAllowed?: boolean
  includeAnalysis?: boolean
}): Promise<ArenaValidationResult | null> => {
  // the context ($context) is the parent entity (the root entity for itself), as when evaluating record expressions
  const { validationResult } = await new CoreNodeDefExpressionValidator().validate({
    expression: exprString,
    survey,
    nodeDefCurrent,
    selfReferenceAllowed,
    includeAnalysis,
  })
  if (validationResult === null || validationResult.valid) return null

  return validationResult
}
