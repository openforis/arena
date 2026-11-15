import {
  NodeDefExpressionEvaluator as CoreNodeDefExpressionEvaluator,
  NodeDefExpressionValidator as CoreNodeDefExpressionValidator,
} from '@openforis/arena-core'
import type {
  NodeDef as ArenaNodeDef,
  NodeDefType,
  Survey as ArenaSurvey,
  ValidationResult as ArenaValidationResult,
} from '@openforis/arena-core'

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
  isContextParent = false,
  selfReferenceAllowed = false,
  includeAnalysis = false,
}: {
  survey: ArenaSurvey
  nodeDefCurrent: AnyNodeDef
  exprString: string
  isContextParent?: boolean
  selfReferenceAllowed?: boolean
  includeAnalysis?: boolean
}): Promise<ArenaValidationResult | null> => {
  // isContextParent is currently ignored by arena-core: the parent node def is always the context
  const { validationResult } = await new CoreNodeDefExpressionValidator().validate({
    expression: exprString,
    survey,
    nodeDefCurrent,
    isContextParent,
    selfReferenceAllowed,
    includeAnalysis,
  } as Parameters<CoreNodeDefExpressionValidator['validate']>[0])
  if (validationResult === null || validationResult.valid) return null

  return validationResult
}
