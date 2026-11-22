import { Objects, Surveys, type ArenaSurvey, type ArenaAnyNodeDef } from '@openforis/arena-core'

import { AiLimits } from '@common/ai/limits'
import { SamplingNodeDefs } from '@common/analysis/samplingNodeDefs'

import { FileFormats } from '@core/fileFormats'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Taxonomy from '@core/survey/taxonomy'
import { RecordCycle } from '@core/record/recordCycle'
import * as ValidationResult from '@core/validation/validationResult'

import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { neutraliseSpreadsheetFormula, parseAiDescriptions } from './aiDescriptions'

type SchemaSummaryProgressCallback = (progress: { total: number; processed: number }) => void

const getParentPath = (nodeDef: ArenaAnyNodeDef, survey: ArenaSurvey) => {
  const parts = []
  let cur = Survey.getNodeDefParent(nodeDef)(survey)
  while (cur && !NodeDef.isRoot(cur)) {
    parts.unshift(String(NodeDef.getName(cur) || ''))
    cur = Survey.getNodeDefParent(cur)(survey)
  }
  return parts.join('/')
}

const getNodeDefPath = ({ survey, nodeDef }: { survey: ArenaSurvey; nodeDef: ArenaAnyNodeDef }) => {
  const pathParts = []
  Survey.visitAncestorsAndSelf(nodeDef, (ancestorDef) => pathParts.unshift(NodeDef.getName(ancestorDef)))(survey)
  return pathParts.join('.')
}

const getDefaultValuesSummary = ({ nodeDef }: { nodeDef: ArenaAnyNodeDef }) => {
  const defaultValues = NodeDef.getDefaultValues(nodeDef)
  return defaultValues.length > 0
    ? defaultValues.map((defaultValue) => NodeDefExpression.getExpression(defaultValue)).join('; ')
    : ''
}

const getDefaultValueApplyIf = ({ nodeDef }: { nodeDef: ArenaAnyNodeDef }) => {
  const defaultValues = NodeDef.getDefaultValues(nodeDef)
  return defaultValues.length > 0
    ? defaultValues.map((defaultValue) => NodeDefExpression.getApplyIf(defaultValue)).join('; ')
    : ''
}

const getExpressionsSummary = ({
  expressions,
  includeSeverity = false,
}: {
  expressions: any
  includeSeverity?: boolean
}) =>
  expressions
    .reduce((acc, expression) => {
      const { applyIf, expression: expr, severity = ValidationResult.severity.error } = expression
      const parts = []
      if (includeSeverity) {
        parts.push(`(${severity})`)
      }
      parts.push(`Expression: ${expr.trim()}`)
      if (applyIf) {
        parts.push(`- Apply if: ${applyIf.trim()}`)
      }
      acc.push(parts.join(' '))
      return acc
    }, [])
    .join('\n')

const getValidationsSummary = ({ nodeDef }: { nodeDef: ArenaAnyNodeDef }) => {
  const validations = NodeDef.getValidations(nodeDef)
  const expressions = NodeDefValidations.getExpressions(validations)
  return getExpressionsSummary({ expressions, includeSeverity: true })
}

// mirrors the 3 "Required" options in the node def editor: not required, always required, required if
const getRequiredSummary = ({ nodeDef }: { nodeDef: ArenaAnyNodeDef }) => {
  const validations = NodeDef.getValidations(nodeDef)
  if (NodeDefValidations.isRequiredIfDefined(validations)) return 'conditional'
  return String(NodeDefValidations.isRequired(validations))
}

const getRequiredIfSummary = ({ nodeDef }: { nodeDef: ArenaAnyNodeDef }) => {
  const validations = NodeDef.getValidations(nodeDef)
  return getExpressionsSummary({ expressions: NodeDefValidations.getRequiredIf(validations) })
}

const getValidationCountSummary = ({ nodeDef, countType }: { nodeDef: ArenaAnyNodeDef; countType: string }) => {
  const validations = NodeDef.getValidations(nodeDef)
  const count = NodeDefValidations.getCountProp(countType)(validations)
  if (Objects.isEmpty(count)) {
    return ''
  }
  if (Array.isArray(count)) {
    return getExpressionsSummary({ expressions: count })
  }
  return String(count)
}

const getRelevantIf = (nodeDef: ArenaAnyNodeDef) => {
  const relevantExpressions = NodeDef.getApplicable(nodeDef)
  return relevantExpressions.length > 0 ? NodeDefExpression.getExpression(relevantExpressions[0]) : ''
}

const getValidationMessages = ({ nodeDef, lang }: { nodeDef: ArenaAnyNodeDef; lang: string }) => {
  const validations = NodeDef.getValidations(nodeDef)
  const expressions = NodeDefValidations.getExpressions(validations)
  return expressions
    .reduce((acc, expression) => {
      const message = NodeDefExpression.getMessage(lang)(expression)
      if (message) {
        acc.push(message)
      }
      return acc
    }, [])
    .join('\n')
}

const getCategoryName = (survey: ArenaSurvey, nodeDef: ArenaAnyNodeDef) => {
  if (!NodeDef.isCode(nodeDef)) return ''

  const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
  if (!category) return ''
  const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  let levelNameSuffix = ''
  if (levelIndex > 0) {
    const level = Category.getLevelByIndex(levelIndex)(category)
    const levelName = CategoryLevel.getName(level)
    levelNameSuffix = `[${levelName}]`
  }
  const categoryName = Category.getName(category)
  return `${categoryName}${levelNameSuffix}`
}

const getTaxonomyName = (survey: ArenaSurvey, nodeDef: ArenaAnyNodeDef) => {
  if (!NodeDef.isTaxon(nodeDef)) return ''

  const taxonomy = Survey.getTaxonomyByUuid(NodeDef.getTaxonomyUuid(nodeDef))(survey)
  return Taxonomy.getName(taxonomy) || ''
}

const getParentCodeAttribute = (survey: ArenaSurvey, nodeDef: ArenaAnyNodeDef) => {
  if (!NodeDef.isCode(nodeDef)) return ''
  const parentCodeAttribute = Survey.getNodeDefParentCode(nodeDef)(survey)
  return parentCodeAttribute ? NodeDef.getName(parentCodeAttribute) : ''
}

const getCodeAttributeCategoryLevel = (survey: ArenaSurvey, nodeDef: ArenaAnyNodeDef) => {
  if (!NodeDef.isCode(nodeDef)) return ''
  const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  return String(categoryLevelIndex + 1)
}

const extractSchemaSummaryNodeDefs = (survey: ArenaSurvey, cycle: string) => {
  const nodeDefs = []
  Survey.visitDescendantsAndSelf({
    cycle,
    visitorFn: (nodeDef) => {
      if (
        // exclude "weight" node def created by the processing chain
        !(NodeDef.isAnalysis(nodeDef) && SamplingNodeDefs.isWeightNodeDef(nodeDef))
      ) {
        nodeDefs.push(nodeDef)
      }
    },
  })(survey)
  return nodeDefs
}

/**
 * Builds the schema summary row of a node def.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {object} params.nodeDef - Node def.
 * @param {string[]} params.languages - Survey languages.
 * @param {string} params.cycle - Cycle key.
 * @param {Record<string, string>|null} params.aiDescriptions - AI descriptions by uuid (null: no aiDescription column).
 * @param {string} params.fileFormat - csv or xlsx (formulas are neutralised for csv only).
 * @returns {object} The row.
 */
const buildNodeDefItem = ({
  survey,
  nodeDef,
  languages,
  cycle,
  aiDescriptions,
  fileFormat,
}: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  languages: string[]
  cycle: string
  aiDescriptions: Record<string, string> | null
  fileFormat: string
}) => {
  const { uuid, type } = nodeDef
  const name = NodeDef.getName(nodeDef)
  const enumerator = Surveys.isNodeDefEnumerator({ survey, nodeDef }) ? 'true' : ''
  const labelsByLang = languages.reduce(
    (acc, lang) => ({
      ...acc,
      [`label_${lang}`]: NodeDef.getLabel(nodeDef, lang, NodeDef.NodeDefLabelTypes.label, false),
    }),
    {}
  )
  const descriptionsByLang = languages.reduce(
    (acc, lang) => ({ ...acc, [`description_${lang}`]: NodeDef.getDescription(lang)(nodeDef) }),
    {}
  )
  const validationMessagesByLang = languages.reduce(
    (acc, lang) => ({ ...acc, [`validation_message_${lang}`]: getValidationMessages({ nodeDef, lang }) }),
    {}
  )
  // the descriptions are generated text. A csv cell is read as a formula by spreadsheet programs, so it is neutralised;
  // an xlsx cell is written as a string, where the added quote would show up in the text
  const aiDescription = aiDescriptions?.[uuid] ?? ''
  const aiFields = aiDescriptions
    ? { aiDescription: fileFormat === FileFormats.csv ? neutraliseSpreadsheetFormula(aiDescription) : aiDescription }
    : {}

  return {
    uuid,
    name,
    path: getNodeDefPath({ survey, nodeDef }),
    parentEntity: NodeDef.getName(Survey.getNodeDefParent(nodeDef)(survey)),
    ...labelsByLang,
    ...descriptionsByLang,
    ...aiFields,
    type,
    key: String(NodeDef.isKey(nodeDef)),
    categoryName: getCategoryName(survey, nodeDef),
    parentCode: getParentCodeAttribute(survey, nodeDef),
    categoryLevel: getCodeAttributeCategoryLevel(survey, nodeDef),
    enumerator,
    taxonomyName: getTaxonomyName(survey, nodeDef),
    multiple: String(NodeDef.isMultiple(nodeDef) || NodeDef.isRoot(nodeDef)),
    readOnly: String(NodeDef.isReadOnly(nodeDef)),
    fileType: NodeDef.isFile(nodeDef) ? NodeDef.getFileType(nodeDef) : '',
    maxFileSize: NodeDef.isFile(nodeDef) ? String(NodeDef.getMaxFileSize(nodeDef)) : '',
    hiddenInForm: String(NodeDef.isHidden(nodeDef)),
    hiddenInMobile: String(NodeDefLayout.isHiddenInMobile(cycle)(nodeDef)),
    hiddenInAnalyticalDashboard: String(NodeDef.isHiddenInReport(nodeDef)),
    includedInMultipleEntitySummary: String(NodeDefLayout.isIncludedInMultipleEntitySummary(cycle)(nodeDef)),
    allowOnlyDeviceCoordinate: String(NodeDef.isAllowOnlyDeviceCoordinate(nodeDef)),
    relevantIf: getRelevantIf(nodeDef),
    hiddenWhenNotRelevant: String(NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDef)),
    itemsFilter: NodeDef.getItemsFilter(nodeDef),
    defaultValue: getDefaultValuesSummary({ nodeDef }),
    defaultValueApplyIf: getDefaultValueApplyIf({ nodeDef }),
    defaultValueEvaluateOnce: String(NodeDef.isDefaultValueEvaluatedOneTime(nodeDef)),
    required: getRequiredSummary({ nodeDef }),
    requiredIf: getRequiredIfSummary({ nodeDef }),
    unique: String(NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))),
    minCount: getValidationCountSummary({ nodeDef, countType: NodeDefValidations.keys.min }),
    maxCount: getValidationCountSummary({ nodeDef, countType: NodeDefValidations.keys.max }),
    validations: getValidationsSummary({ nodeDef }),
    ...validationMessagesByLang,
    cycle: String(NodeDef.getCycles(nodeDef).map(RecordCycle.getLabel)), // this is to show the user the value that they see into the UI -> https://github.com/openforis/arena/issues/1677
  }
}

/**
 * Fetches the draft survey with its node defs (advanced props included).
 * @param {number|string} surveyId - Survey id.
 * @returns {Promise<object>} The survey.
 */
const fetchSurvey = (surveyId: number): Promise<ArenaSurvey> =>
  SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })

const DB_DEPS = { fetchSurvey }

/**
 * Returns the default language of the survey (first language, else en).
 * @param {object} surveyInfo - Survey info.
 * @returns {string} The language code.
 */
const getDefaultLang = (surveyInfo: ArenaSurvey): string =>
  Survey.getDefaultLanguage(surveyInfo) || Survey.getLanguages(surveyInfo)[0] || 'en'

/**
 * Returns the node defs of the schema summary that need an AI description: not the root, no description in the
 * default language; at most AiLimits.dataDictionaryMaxDescriptions. Only names, labels (default language, when not the
 * name), types and paths.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey with its node defs.
 * @param {string} params.cycle - Cycle key.
 * @returns {{surveyName: string, nodeDefs: {uuid: string, name: string, label?: string, type: string, parentPath: string}[]}} The items.
 */
export const getSchemaSummaryAiItems = ({ survey, cycle }: { survey: ArenaSurvey; cycle: string }) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const defaultLang = getDefaultLang(surveyInfo)
  const nodeDefs = extractSchemaSummaryNodeDefs(survey, cycle)
    .filter((nodeDef) => !NodeDef.isRoot(nodeDef) && !(NodeDef.getDescription(defaultLang)(nodeDef) || '').trim())
    .slice(0, AiLimits.dataDictionaryMaxDescriptions)
    .map((nodeDef) => {
      const name = NodeDef.getName(nodeDef)
      // the label explains abbreviated names (rp, dbh, …)
      const label = NodeDef.getLabels(nodeDef)[defaultLang]
      return {
        uuid: NodeDef.getUuid(nodeDef),
        name,
        ...(label && label !== name ? { label } : {}),
        type: NodeDef.getType(nodeDef),
        parentPath: getParentPath(nodeDef, survey),
      }
    })
  return { surveyName: Survey.getName(surveyInfo) || `survey-${Survey.getIdSurveyInfo(surveyInfo)}`, nodeDefs }
}

/**
 * Fetches the survey and returns its node defs that need an AI description (see getSchemaSummaryAiItems).
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {string} params.cycle - Cycle key.
 * @returns {Promise<object>} The items.
 */
export const fetchSchemaSummaryAiItems = async ({ surveyId, cycle }: { surveyId: number; cycle: string }) =>
  getSchemaSummaryAiItems({ survey: await fetchSurvey(surveyId), cycle })

/**
 * Builds the schema summary rows of a survey.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey with its node defs.
 * @param {string} params.cycle - Cycle key.
 * @param {Record<string, string>|null} [params.aiDescriptions] - AI descriptions by uuid (null: no aiDescription column).
 * @param {(progress: {total: number, processed: number}) => void} [params.onProgress] - Called with { total, processed }.
 * @param {() => boolean} [params.stopIfFunction] - Returns true when the job is canceled.
 * @param {string} [params.fileFormat] - csv or xlsx: the file the rows are written to (csv when not given, which is the
 * format that needs the formulas of the AI descriptions neutralised).
 * @returns {object[]} The rows.
 */
export const buildSchemaSummaryItems = ({
  survey,
  cycle,
  aiDescriptions = null,
  fileFormat = FileFormats.csv,
  onProgress = null,
  stopIfFunction = null,
}: {
  survey: ArenaSurvey
  cycle: string
  aiDescriptions?: Record<string, string> | null
  fileFormat?: string
  onProgress?: SchemaSummaryProgressCallback | null
  stopIfFunction?: (() => boolean) | null
}) => {
  const nodeDefs = extractSchemaSummaryNodeDefs(survey, cycle)
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey)) as string[]
  const total = nodeDefs.length
  const items = []
  for (const nodeDef of nodeDefs) {
    if (stopIfFunction?.()) break
    items.push(buildNodeDefItem({ survey, nodeDef, languages, cycle, aiDescriptions, fileFormat }))
    onProgress?.({ total, processed: items.length })
  }
  return items
}

/**
 * Fetches the survey (once) and builds its schema summary rows (see buildSchemaSummaryItems). The AI descriptions are
 * checked against the node defs of this survey.
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {string} params.cycle - Cycle key.
 * @param {Record<string, string>|null} [params.aiDescriptions] - AI descriptions by uuid (null: no aiDescription column).
 * @param {(progress: {total: number, processed: number}) => void} [params.onProgress] - Called with { total, processed }.
 * @param {() => boolean} [params.stopIfFunction] - Returns true when the job is canceled.
 * @param {string} [params.fileFormat] - csv or xlsx: the file the rows are written to.
 * @param {{fetchSurvey: (surveyId: number|string) => Promise<object>}} [deps] - The dependencies (tests).
 * @returns {Promise<any[]>} The rows.
 * @throws {SystemError} aiDescriptionsInvalid (400) when a description is for a node def that is not in the export.
 */
export const generateSchemaSummaryItems = async (
  {
    surveyId,
    cycle,
    aiDescriptions = null,
    onProgress = null,
    stopIfFunction = null,
    fileFormat = FileFormats.csv,
  }: {
    surveyId: number
    cycle: string
    aiDescriptions?: Record<string, string> | null
    onProgress?: SchemaSummaryProgressCallback | null
    stopIfFunction?: (() => boolean) | null
    fileFormat?: string
  },
  deps: { fetchSurvey: (surveyId: number) => Promise<ArenaSurvey> } = DB_DEPS
) => {
  const survey = await deps.fetchSurvey(surveyId)
  if (aiDescriptions) {
    const knownUuids = extractSchemaSummaryNodeDefs(survey, cycle).map(NodeDef.getUuid)
    parseAiDescriptions({ raw: aiDescriptions, knownUuids })
  }
  return buildSchemaSummaryItems({ survey, cycle, aiDescriptions, onProgress, stopIfFunction, fileFormat })
}

/**
 * Writes the schema summary (without AI descriptions) to the output stream (used by the R scripts' route).
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {string} params.cycle - Cycle key.
 * @param {object} params.outputStream - Output stream.
 * @param {string} params.fileFormat - csv or xlsx.
 * @returns {Promise<void>} Resolves when written.
 */
export const exportSchemaSummary = async ({
  surveyId,
  cycle,
  outputStream,
  fileFormat,
}: {
  surveyId: number
  cycle: string
  outputStream: any
  fileFormat: string
}) => {
  const items = await generateSchemaSummaryItems({ surveyId, cycle })
  await FlatDataWriter.writeItemsToStream({ items, options: { removeNewLines: false }, outputStream, fileFormat })
}
