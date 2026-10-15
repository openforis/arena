import { Objects, Surveys } from '@openforis/arena-core'

import { AiLimits } from '@common/ai/limits'
import { SamplingNodeDefs } from '@common/analysis/samplingNodeDefs'

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

const getParentPath = (nodeDef, survey) => {
  const parts = []
  let cur = Survey.getNodeDefParent(nodeDef)(survey)
  while (cur && !NodeDef.isRoot(cur)) {
    parts.unshift(String(NodeDef.getName(cur) || ''))
    cur = Survey.getNodeDefParent(cur)(survey)
  }
  return parts.join('/')
}

const getNodeDefPath = ({ survey, nodeDef }) => {
  const pathParts = []
  Survey.visitAncestorsAndSelf(nodeDef, (ancestorDef) => pathParts.unshift(NodeDef.getName(ancestorDef)))(survey)
  return pathParts.join('.')
}

const getDefaultValuesSummary = ({ nodeDef }) => {
  const defaultValues = NodeDef.getDefaultValues(nodeDef)
  return defaultValues.length > 0
    ? defaultValues.map((defaultValue) => NodeDefExpression.getExpression(defaultValue)).join('; ')
    : ''
}

const getDefaultValueApplyIf = ({ nodeDef }) => {
  const defaultValues = NodeDef.getDefaultValues(nodeDef)
  return defaultValues.length > 0
    ? defaultValues.map((defaultValue) => NodeDefExpression.getApplyIf(defaultValue)).join('; ')
    : ''
}

const getExpressionsSummary = ({ expressions, includeSeverity = false }) =>
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

const getValidationsSummary = ({ nodeDef }) => {
  const validations = NodeDef.getValidations(nodeDef)
  const expressions = NodeDefValidations.getExpressions(validations)
  return getExpressionsSummary({ expressions, includeSeverity: true })
}

const getValidationCountSummary = ({ nodeDef, countType }) => {
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

const getRelevantIf = (nodeDef) => {
  const relevantExpressions = NodeDef.getApplicable(nodeDef)
  return relevantExpressions.length > 0 ? NodeDefExpression.getExpression(relevantExpressions[0]) : ''
}

const getValidationMessages = ({ nodeDef, lang }) => {
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

const getCategoryName = (survey, nodeDef) => {
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

const getTaxonomyName = (survey, nodeDef) => {
  if (!NodeDef.isTaxon(nodeDef)) return ''

  const taxonomy = Survey.getTaxonomyByUuid(NodeDef.getTaxonomyUuid(nodeDef))(survey)
  return Taxonomy.getName(taxonomy) || ''
}

const getParentCodeAttribute = (survey, nodeDef) => {
  if (!NodeDef.isCode(nodeDef)) return ''
  const parentCodeAttribute = Survey.getNodeDefParentCode(nodeDef)(survey)
  return parentCodeAttribute ? NodeDef.getName(parentCodeAttribute) : ''
}

const getCodeAttributeCategoryLevel = (survey, nodeDef) => {
  if (!NodeDef.isCode(nodeDef)) return ''
  const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  return String(categoryLevelIndex + 1)
}

const extractSchemaSummaryNodeDefs = (survey, cycle) => {
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
 * @returns {object} The row.
 */
const buildNodeDefItem = ({ survey, nodeDef, languages, cycle, aiDescriptions }) => {
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
  // the descriptions are generated text opened in spreadsheet programs: no formulas
  const aiFields = aiDescriptions ? { aiDescription: neutraliseSpreadsheetFormula(aiDescriptions[uuid] ?? '') } : {}

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
    required: String(NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))),
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
const fetchSurvey = (surveyId) =>
  SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })

/**
 * Returns the default language of the survey (first language, else en).
 * @param {object} surveyInfo - Survey info.
 * @returns {string} The language code.
 */
const getDefaultLang = (surveyInfo) =>
  Survey.getDefaultLanguage(surveyInfo) || Survey.getLanguages(surveyInfo)[0] || 'en'

/**
 * Returns the node defs of the schema summary that need an AI description: not the root, no description in the
 * default language; at most AiLimits.dataDictionaryMaxDescriptions. Only names, types and paths.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey with its node defs.
 * @param {string} params.cycle - Cycle key.
 * @returns {{surveyName: string, nodeDefs: {uuid: string, name: string, type: string, parentPath: string}[]}} The items.
 */
export const getSchemaSummaryAiItems = ({ survey, cycle }) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const defaultLang = getDefaultLang(surveyInfo)
  const nodeDefs = extractSchemaSummaryNodeDefs(survey, cycle)
    .filter((nodeDef) => !NodeDef.isRoot(nodeDef) && !(NodeDef.getDescription(defaultLang)(nodeDef) || '').trim())
    .slice(0, AiLimits.dataDictionaryMaxDescriptions)
    .map((nodeDef) => ({
      uuid: NodeDef.getUuid(nodeDef),
      name: NodeDef.getName(nodeDef),
      type: NodeDef.getType(nodeDef),
      parentPath: getParentPath(nodeDef, survey),
    }))
  return { surveyName: Survey.getName(surveyInfo) || `survey-${Survey.getIdSurveyInfo(surveyInfo)}`, nodeDefs }
}

/**
 * Fetches the survey and returns its node defs that need an AI description (see getSchemaSummaryAiItems).
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {string} params.cycle - Cycle key.
 * @returns {Promise<object>} The items.
 */
export const fetchSchemaSummaryAiItems = async ({ surveyId, cycle }) =>
  getSchemaSummaryAiItems({ survey: await fetchSurvey(surveyId), cycle })

/**
 * Builds the schema summary rows of a survey.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey with its node defs.
 * @param {string} params.cycle - Cycle key.
 * @param {Record<string, string>|null} [params.aiDescriptions] - AI descriptions by uuid (null: no aiDescription column).
 * @param {(progress: {total: number, processed: number}) => void} [params.onProgress] - Called with { total, processed }.
 * @param {() => boolean} [params.stopIfFunction] - Returns true when the job is canceled.
 * @returns {object[]} The rows.
 */
export const buildSchemaSummaryItems = ({
  survey,
  cycle,
  aiDescriptions = null,
  onProgress = null,
  stopIfFunction = null,
}) => {
  const nodeDefs = extractSchemaSummaryNodeDefs(survey, cycle)
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey))
  const total = nodeDefs.length
  const items = []
  for (const nodeDef of nodeDefs) {
    if (stopIfFunction?.()) break
    items.push(buildNodeDefItem({ survey, nodeDef, languages, cycle, aiDescriptions }))
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
 * @param {{fetchSurvey: (surveyId: number|string) => Promise<object>}} [deps] - The dependencies (tests).
 * @returns {Promise<object[]>} The rows.
 * @throws {SystemError} aiDescriptionsInvalid (400) when a description is for a node def that is not in the export.
 */
export const generateSchemaSummaryItems = async (
  { surveyId, cycle, aiDescriptions = null, onProgress = null, stopIfFunction = null },
  deps = { fetchSurvey }
) => {
  const survey = await deps.fetchSurvey(surveyId)
  if (aiDescriptions) {
    const knownUuids = extractSchemaSummaryNodeDefs(survey, cycle).map(NodeDef.getUuid)
    parseAiDescriptions({ raw: aiDescriptions, knownUuids })
  }
  return buildSchemaSummaryItems({ survey, cycle, aiDescriptions, onProgress, stopIfFunction })
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
export const exportSchemaSummary = async ({ surveyId, cycle, outputStream, fileFormat }) => {
  const items = await generateSchemaSummaryItems({ surveyId, cycle })
  await FlatDataWriter.writeItemsToStream({ items, options: { removeNewLines: false }, outputStream, fileFormat })
}
