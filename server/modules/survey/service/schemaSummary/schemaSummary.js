import { Objects, Surveys } from '@openforis/arena-core'

import { AiLimits } from '@common/ai/limits'
import { generateDataDictionaryDescriptions } from '@common/ai/tasks/dataDictionary'
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

import * as Log from '@server/log/log'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { createServerTextGenerator } from '@server/modules/ai/service/serverTextGenerator'

const logger = Log.getLogger('SchemaSummary')

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

const buildNodeDefItem = ({ survey, nodeDef, languages, defaultLang, cycle, includeAiDescriptions }) => {
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
  const aiFields = includeAiDescriptions
    ? {
        aiDescription: '',
        _isRoot: NodeDef.isRoot(nodeDef),
        _descriptionForAi: NodeDef.getDescription(defaultLang)(nodeDef) || '',
        _parentPath: getParentPath(nodeDef, survey),
      }
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
    required: String(NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))),
    unique: String(NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))),
    minCount: getValidationCountSummary({ nodeDef, countType: NodeDefValidations.keys.min }),
    maxCount: getValidationCountSummary({ nodeDef, countType: NodeDefValidations.keys.max }),
    validations: getValidationsSummary({ nodeDef }),
    ...validationMessagesByLang,
    cycle: String(NodeDef.getCycles(nodeDef).map(RecordCycle.getLabel)), // this is to show the user the value that they see into the UI -> https://github.com/openforis/arena/issues/1677
  }
}

const toAiNodeDefs = (items) =>
  items
    .filter((item) => !item._isRoot && !item._descriptionForAi?.trim())
    .map(({ uuid, name, type, _parentPath }) => ({ uuid, name, type, parentPath: _parentPath }))

/**
 * Asks the model for the descriptions missing in the items, one batch at a time.
 * @param {object} params - Parameters.
 * @param {(args: object) => Promise<string>} params.generateText - Text generator (see common/ai/llm).
 * @param {string} params.surveyName - Survey name.
 * @param {object[]} params.items - Schema summary items (updated in place with `aiDescription`).
 * @param {number} params.processed - Items processed so far (progress).
 * @param {number} params.total - Total items (progress).
 * @param {(progress: object) => void} [params.onProgress] - Progress callback.
 * @param {() => boolean} [params.stopIfFunction] - Returns true when the job is canceled.
 * @param {(batchSize: number) => void} [params.onBatchFailed] - Called with the batch size when a batch fails.
 * @returns {Promise<void>} Resolves when all batches have been processed.
 */
export const addAiDescriptions = async ({
  generateText,
  surveyName,
  items,
  processed,
  total,
  onProgress,
  stopIfFunction,
  onBatchFailed,
}) => {
  const nodeDefs = toAiNodeDefs(items)
  const { dataDictionaryBatchSize: batchSize, dataDictionaryMaxDescriptions: maxDescriptions } = AiLimits
  if (nodeDefs.length > maxDescriptions) {
    logger.warn(`schemaSummary: ${nodeDefs.length} node defs need AI descriptions; capping at ${maxDescriptions}`)
  }
  const capped = nodeDefs.slice(0, maxDescriptions)
  const itemByUuid = Object.fromEntries(items.map((item) => [item.uuid, item]))

  let processedCount = processed
  for (let start = 0; start < capped.length; start += batchSize) {
    if (stopIfFunction?.()) break
    const batch = capped.slice(start, start + batchSize)
    try {
      const { descriptions } = await generateDataDictionaryDescriptions({ generateText, surveyName, nodeDefs: batch })
      for (const { uuid, description } of descriptions) {
        if (itemByUuid[uuid]) itemByUuid[uuid].aiDescription = description
      }
    } catch (error) {
      logger.warn(`schemaSummary AI batch ${start / batchSize}: ${error?.message || error}`)
      onBatchFailed?.(batch.length)
    }
    processedCount += batch.length
    onProgress?.({ total, processed: processedCount })
  }
}

export const generateSchemaSummaryItems = async ({
  surveyId,
  cycle,
  user = null,
  includeAiDescriptions = false,
  onProgress = null,
  stopIfFunction = null,
  onAiBatchFailed = null,
}) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })
  const nodeDefs = extractSchemaSummaryNodeDefs(survey, cycle)

  const surveyInfo = Survey.getSurveyInfo(survey)
  const languages = Survey.getLanguages(surveyInfo)
  const defaultLang = Survey.getDefaultLanguage(surveyInfo) || languages[0] || 'en'
  const surveyName = Survey.getName(surveyInfo) || `survey-${surveyId}`

  const aiDescNeedingCount = includeAiDescriptions
    ? Math.min(
        nodeDefs.filter((nd) => !NodeDef.isRoot(nd) && !(NodeDef.getDescription(defaultLang)(nd) || '').trim()).length,
        AiLimits.dataDictionaryMaxDescriptions
      )
    : 0
  const total = nodeDefs.length + aiDescNeedingCount
  let processed = 0

  const items = []
  for (const nodeDef of nodeDefs) {
    if (stopIfFunction?.()) break
    items.push(buildNodeDefItem({ survey, nodeDef, languages, defaultLang, cycle, includeAiDescriptions }))
    processed += 1
    onProgress?.({ total, processed })
  }

  if (includeAiDescriptions) {
    await addAiDescriptions({
      generateText: createServerTextGenerator({ user, feature: 'dataDictionary' }),
      surveyName,
      items,
      processed,
      total,
      onProgress,
      stopIfFunction,
      onBatchFailed: onAiBatchFailed,
    })
  }

  return items.map(({ _isRoot, _descriptionForAi, _parentPath, ...rest }) => rest)
}

export const exportSchemaSummary = async ({
  surveyId,
  cycle,
  outputStream,
  fileFormat,
  user = null,
  includeAiDescriptions = false,
}) => {
  const items = await generateSchemaSummaryItems({ surveyId, cycle, user, includeAiDescriptions })
  await FlatDataWriter.writeItemsToStream({ items, options: { removeNewLines: false }, outputStream, fileFormat })
}
