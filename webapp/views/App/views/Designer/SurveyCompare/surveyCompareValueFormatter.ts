// Formats the (normalized) values of a survey comparison like they are shown in the survey designer.

export interface FormattedLine {
  label?: string
  value?: string
  indent: number
  separator?: boolean
  code?: boolean
}

type Translate = (key: string, params?: Record<string, unknown>) => string

// i18n keys of the property labels used in the node def editor
const propLabelKeys: Record<string, string> = {
  applicable: 'nodeDefEdit.advancedProps.relevantIf',
  categoryUuid: 'nodeDefEdit.codeProps.category',
  codeShown: 'nodeDefEdit.codeProps.codeShown',
  columnsNo: 'surveyCompareView:props.columnsNo',
  cycles: 'surveyCompareView:props.cycles',
  defaultValueEvaluatedOneTime: 'nodeDefEdit.advancedProps.defaultValueEvaluatedOneTime',
  defaultValues: 'nodeDefEdit.advancedProps.defaultValues',
  descriptions: 'surveyCompareView:props.descriptions',
  editableIf: 'nodeDefEdit.advancedProps.editableIf',
  fileNameExpression: 'nodeDefEdit.fileProps.fileNameExpression',
  fileType: 'nodeDefEdit.fileProps.fileType',
  formula: 'nodeDefEdit.basicProps.formula',
  hidden: 'nodeDefEdit.advancedProps.hidden',
  hiddenInReport: 'nodeDefEdit.advancedProps.hiddenInReport',
  hiddenWhenNotRelevant: 'nodeDefEdit.advancedProps.hiddenWhenNotRelevant',
  includeSeconds: 'nodeDefEdit.timeProps.includeSeconds',
  itemExtraDef: 'surveyCompareView:props.itemExtraDef',
  itemsFilter: 'nodeDefEdit.advancedProps.itemsFilter',
  key: 'nodeDefEdit.basicProps.key',
  labels: 'surveyCompareView:props.labels',
  labelValue: 'nodeDefEdit.booleanProps.labelValue',
  layout: 'surveyCompareView:props.layout',
  levels: 'surveyCompareView:props.levels',
  mapMarkerColor: 'nodeDefEdit.coordinateProps.mapMarkerColor',
  maxFileSize: 'nodeDefEdit.fileProps.maxFileSize',
  maxNumberDecimalDigits: 'nodeDefEdit.decimalProps.maxNumberDecimalDigits',
  multiple: 'nodeDefEdit.basicProps.multiple',
  name: 'common.name',
  ownPage: 'nodeDefEdit.basicProps.ownPage',
  parent: 'surveyCompareView:props.parent',
  parentCodeDefUuid: 'nodeDefEdit.codeProps.parentCode',
  readOnly: 'nodeDefEdit.advancedProps.readOnly',
  renderType: 'nodeDefEdit.basicProps.displayAs',
  taxonomyUuid: 'common.taxonomy',
  textInputType: 'nodeDefEdit.textProps.textInputType',
  textTransform: 'nodeDefEdit.textProps.textTransform',
  type: 'common.type',
  unit: 'nodeDefEdit.numericProps.unit',
  validations: 'surveyCompareView:props.validations',
  visibleIf: 'nodeDefEdit.advancedProps.visibleIf',
}

// e.g. "hiddenInMobile" => "Hidden in mobile"
const humanize = (key: string): string => {
  const words = key.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export const getPropLabel = ({ t, key }: { t: Translate; key: string }): string => {
  const i18nKey = propLabelKeys[key]
  return i18nKey ? t(i18nKey) : humanize(key)
}

const isPlainObject = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isPrimitive = (value: unknown): boolean => value === null || typeof value !== 'object'

const isExpression = (value: unknown): boolean => isPlainObject(value) && ('expression' in value || 'applyIf' in value)

const langCodeRegex = /^[a-z]{2,3}$/

const isLabelsByLang = (value: unknown): boolean =>
  isPlainObject(value) &&
  Object.entries(value).every(([key, text]) => langCodeRegex.test(key) && typeof text === 'string')

const formatPrimitive = ({ t, value }: { t: Translate; value: unknown }): string => {
  if (value === true) return t('common.yes')
  if (value === false) return t('common.no')
  return String(value)
}

// the language code is omitted when the survey has only one language
const formatLabelsByLang = ({
  singleLang,
  value,
  indent,
}: {
  singleLang?: string
  value: Record<string, string>
  indent: number
}): FormattedLine[] => {
  const entries = Object.entries(value)
  if (singleLang && entries.length === 1 && entries[0][0] === singleLang) {
    return [{ value: entries[0][1], indent }]
  }
  return entries.map(([lang, text]) => ({ label: lang, value: text, indent }))
}

const formatExpression = ({
  t,
  singleLang,
  expression,
  indent,
}: {
  t: Translate
  singleLang?: string
  expression: any
  indent: number
}) => {
  const { expression: expr, applyIf, severity, messages } = expression
  const lines: FormattedLine[] = [{ label: t('nodeDefEdit.expressionsProp.expression'), value: expr ?? '', indent }]
  if (applyIf) lines.push({ label: t('nodeDefEdit.expressionsProp.applyIf'), value: applyIf, indent })
  if (severity) lines.push({ label: t('nodeDefEdit.expressionsProp.severity'), value: t(`common.${severity}`), indent })
  if (isPlainObject(messages)) {
    lines.push({ label: t('surveyCompareView:props.messages'), indent })
    lines.push(...formatLabelsByLang({ singleLang, value: messages, indent: indent + 1 }))
  }
  return lines
}

const formatExpressions = ({
  t,
  singleLang,
  expressions,
  indent,
}: {
  t: Translate
  singleLang?: string
  expressions: any[]
  indent: number
}) =>
  expressions.flatMap((expression, index) => [
    ...(index > 0 ? [{ separator: true, indent }] : []),
    ...formatExpression({ t, singleLang, expression, indent }),
  ])

const formatValidations = ({
  t,
  singleLang,
  value,
  indent,
}: {
  t: Translate
  singleLang?: string
  value: any
  indent: number
}): FormattedLine[] => {
  const { required, unique, count, expressions, ...others } = value
  const lines: FormattedLine[] = []
  if (required) lines.push({ value: t('common.required'), indent })
  if (unique) lines.push({ value: t('nodeDefEdit.unique.label'), indent })
  const { min, max } = count ?? {}
  for (const [labelKey, countValue] of [
    ['nodeDefEdit.validationsProps.minCount', min],
    ['nodeDefEdit.validationsProps.maxCount', max],
  ]) {
    if (countValue === undefined) continue
    if (Array.isArray(countValue)) {
      lines.push(
        { label: t(labelKey), indent },
        ...formatExpressions({ t, singleLang, expressions: countValue, indent: indent + 1 })
      )
    } else {
      lines.push({ label: t(labelKey), value: String(countValue), indent })
    }
  }
  if (Array.isArray(expressions)) {
    lines.push({ label: t('nodeDefEdit.validationsProps.expressions'), indent })
    lines.push(...formatExpressions({ t, singleLang, expressions, indent: indent + 1 }))
  }
  lines.push(...formatObject({ t, singleLang, value: others, indent }))
  return lines
}

const formatLayoutChildren = ({ t, layoutChildren, indent }) => {
  if (layoutChildren.every((child: unknown) => typeof child === 'string')) {
    return [{ label: t('surveyCompareView:props.columnsOrder'), value: layoutChildren.join(', '), indent }]
  }
  const sorted = [...layoutChildren].sort((childA, childB) => childA.y - childB.y || childA.x - childB.x)
  return [
    { label: t('surveyCompareView:props.formLayout'), indent },
    ...sorted.map(({ i, x = 0, y = 0, w = 1, h = 1 }) => ({
      label: i,
      value: t('surveyCompareView:props.gridPosition', { row: y + 1, column: x + 1, width: w, height: h }),
      indent: indent + 1,
    })),
  ]
}

const formatLayout = ({
  t,
  singleLang,
  value,
  indent,
}: {
  t: Translate
  singleLang?: string
  value: any
  indent: number
}): FormattedLine[] => {
  const { layoutChildren, indexChildren, ...others } = value
  const lines = formatObject({ t, singleLang, value: others, indent })
  if (Array.isArray(layoutChildren)) {
    lines.push(...formatLayoutChildren({ t, layoutChildren, indent }))
  }
  if (Array.isArray(indexChildren)) {
    lines.push({ label: t('surveyCompareView:props.pagesOrder'), value: indexChildren.join(', '), indent })
  }
  return lines
}

const formatArray = ({
  t,
  singleLang,
  value,
  indent,
}: {
  t: Translate
  singleLang?: string
  value: any[]
  indent: number
}): FormattedLine[] => {
  if (value.every(isExpression)) return formatExpressions({ t, singleLang, expressions: value, indent })
  if (value.every(isPrimitive)) {
    return [{ value: value.map((item) => formatPrimitive({ t, value: item })).join(', '), indent }]
  }
  return value.flatMap((item, index) => [
    ...(index > 0 ? [{ separator: true, indent }] : []),
    ...formatValue({ t, singleLang, value: item, indent }),
  ])
}

function formatObject({
  t,
  singleLang,
  value,
  indent,
}: {
  t: Translate
  singleLang?: string
  value: Record<string, any>
  indent: number
}) {
  const lines: FormattedLine[] = []
  for (const [childKey, childValue] of Object.entries(value)) {
    if (childValue === undefined || childValue === null) continue
    const label = getPropLabel({ t, key: childKey })
    if (isPrimitive(childValue)) {
      lines.push({ label, value: formatPrimitive({ t, value: childValue }), indent })
    } else {
      lines.push(
        { label, indent },
        ...formatValue({ t, singleLang, key: childKey, value: childValue, indent: indent + 1 })
      )
    }
  }
  return lines
}

/**
 * Formats a value of a survey comparison as a list of labelled lines.
 * @param {object} params - Parameters.
 * @param {Translate} params.t - Translation function.
 * @param {string} [params.singleLang] - The only language of the survey (if any): its code is not shown in labels.
 * @param {string} [params.key] - Key of the property the value belongs to.
 * @param {any} params.value - The value to format.
 * @param {number} [params.indent] - Indentation level.
 * @returns {FormattedLine[]} - The formatted lines (empty if the value is empty).
 */
export function formatValue({
  t,
  singleLang = undefined,
  key = undefined,
  value,
  indent = 0,
}: {
  t: Translate
  singleLang?: string
  key?: string
  value: any
  indent?: number
}): FormattedLine[] {
  if (value === undefined || value === null) return []
  if (key === 'cycles' && Array.isArray(value)) {
    return [{ value: value.map((cycle) => Number(cycle) + 1).join(', '), indent }]
  }
  if (isPrimitive(value)) return [{ value: formatPrimitive({ t, value }), indent }]
  if (Array.isArray(value)) return formatArray({ t, singleLang, value, indent })
  if (key === 'validations') return formatValidations({ t, singleLang, value, indent })
  if (key === 'layout') return formatLayout({ t, singleLang, value, indent })
  if (isLabelsByLang(value)) return formatLabelsByLang({ singleLang, value, indent })
  if (isExpression(value)) return formatExpression({ t, singleLang, expression: value, indent })
  return formatObject({ t, singleLang, value, indent })
}
