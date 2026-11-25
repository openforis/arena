import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  id: ObjectUtils.keys.id,
  props: ObjectUtils.keys.props,
  resolved: 'resolved',
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
} as const

export const propKeys = {
  expressionType: 'expressionType',
  expression: 'expression',
  applyIf: 'applyIf',
  messages: 'messages',
} as const

export const exprTypes = {
  applicable: 'applicable',
  codeParent: 'codeParent',
  defaultValue: 'defaultValue',
  requiredIf: 'requiredIf',
  validationRuleError: 'validationRuleError',
  validationRuleWarning: 'validationRuleWarning',
} as const

export interface CollectImportReportItemProps {
  expressionType: string
  expression: string | null
  applyIf: string | null
  messages: Record<string, string>
}

export interface CollectImportReportItem {
  id?: number
  nodeDefUuid: string
  props: CollectImportReportItemProps
  resolved: boolean
}

export const newReportItem = ({
  nodeDefUuid,
  expressionType,
  expression = null,
  applyIf = null,
  messages = {},
  resolved = false,
}: {
  nodeDefUuid: string
  expressionType: string
  expression?: string | null
  applyIf?: string | null
  messages?: Record<string, string>
  resolved?: boolean
}): CollectImportReportItem => ({
  [keys.nodeDefUuid]: nodeDefUuid,
  [keys.props]: {
    [propKeys.expressionType]: expressionType,
    [propKeys.expression]: expression,
    [propKeys.applyIf]: applyIf,
    [propKeys.messages]: messages,
  },
  [keys.resolved]: resolved,
})

type ItemGetter<T> = (item: CollectImportReportItem) => T

export const { getId } = ObjectUtils
export const isResolved: ItemGetter<boolean> = A.propOr(false, keys.resolved)
export const getNodeDefUuid: ItemGetter<string> = A.prop(keys.nodeDefUuid)
export const getProps: ItemGetter<CollectImportReportItemProps> = A.prop(keys.props)

export const getExpressionType: ItemGetter<string> = ObjectUtils.getProp(propKeys.expressionType)
export const getExpression: ItemGetter<string> = ObjectUtils.getProp(propKeys.expression, '')
export const getApplyIf: ItemGetter<string> = ObjectUtils.getProp(propKeys.applyIf, '')
export const getMessages: ItemGetter<Record<string, string> | ''> = ObjectUtils.getProp(propKeys.messages, '')
