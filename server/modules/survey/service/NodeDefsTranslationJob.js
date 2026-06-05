import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as TranslationService from '@server/modules/ai/service/translationService'

const BATCH_SIZE = 20

/**
 * Splits an array into chunks of at most `size` elements.
 * @param {Array} array - Source array.
 * @param {number} size - Maximum chunk size.
 * @returns {Array[]} Array of chunks.
 */
const chunkArray = (array, size) => {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Builds the flat list of translatable items and an index mapping each item id back to its node def.
 * @param {Array} nodeDefs - Array of node definitions.
 * @param {string} defaultLang - Survey default language code.
 * @returns {{ items: Array, itemInfoById: object }} Items to translate and their metadata.
 */
const buildTranslationItems = (nodeDefs, defaultLang) => {
  const items = []
  const itemInfoById = {}

  for (const nodeDef of nodeDefs) {
    const uuid = NodeDef.getUuid(nodeDef)
    const defaultLabel = NodeDef.getLabels(nodeDef)[defaultLang]
    const defaultDesc = NodeDef.getDescription(defaultLang)(nodeDef)

    if (StringUtils.isNotBlank(defaultLabel)) {
      const id = `${uuid}_label`
      items.push({ id, text: defaultLabel, kind: 'nodeDefLabel' })
      itemInfoById[id] = { uuid, field: 'label' }
    }
    if (StringUtils.isNotBlank(defaultDesc)) {
      const id = `${uuid}_desc`
      items.push({ id, text: defaultDesc, kind: 'nodeDefDescription' })
      itemInfoById[id] = { uuid, field: 'description' }
    }
  }

  return { items, itemInfoById }
}

/**
 * Merges a batch of translation results into the accumulated aiByNodeDef map.
 * @param {Array} translations - Translations returned by the AI service for one batch.
 * @param {object} itemInfoById - Index built by buildTranslationItems.
 * @param {object} aiByNodeDef - Accumulator object (mutated in place).
 * @returns {void}
 */
const applyBatchResult = (translations, itemInfoById, aiByNodeDef) => {
  for (const { id, byLang } of translations) {
    const info = itemInfoById[id]
    if (!info) continue
    if (!aiByNodeDef[info.uuid]) {
      aiByNodeDef[info.uuid] = { aiLabels: {}, aiDescs: {} }
    }
    if (info.field === 'label') {
      aiByNodeDef[info.uuid].aiLabels = byLang
    } else {
      aiByNodeDef[info.uuid].aiDescs = byLang
    }
  }
}

/**
 * Background job that translates all node definition labels and descriptions
 * from the survey's default language into every other survey language using AI.
 *
 * The job result contains the AI suggestions alongside the existing translations
 * so the user can review and confirm them in the frontend modal.
 */
export default class NodeDefsTranslationJob extends Job {
  /**
   * Creates the job.
   * @param {object} params - Job params.
   * @param {object} params.user - Acting user.
   * @param {number} params.surveyId - Survey id.
   */
  constructor(params) {
    super(NodeDefsTranslationJob.type, params)
  }

  async execute() {
    const { surveyId, user } = this.context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true }, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const defaultLang = Survey.getDefaultLanguage(surveyInfo)
    const languages = Survey.getLanguages(surveyInfo)
    const otherLangs = languages.filter((l) => l !== defaultLang)

    if (otherLangs.length === 0) {
      this.setContext({ survey, defaultLang, languages, otherLangs, aiByNodeDef: {} })
      return
    }

    const nodeDefs = Survey.getNodeDefsArray(survey)
    const { items, itemInfoById } = buildTranslationItems(nodeDefs, defaultLang)

    const batches = chunkArray(items, BATCH_SIZE)
    this.total = batches.length

    const aiByNodeDef = {}

    for (const batch of batches) {
      if (this.isCanceled()) break

      const result = await TranslationService.translate({
        user,
        sourceLang: defaultLang,
        targetLangs: otherLangs,
        items: batch,
      })
      applyBatchResult(result.translations, itemInfoById, aiByNodeDef)
      this.incrementProcessedItems()
    }

    this.setContext({ survey, defaultLang, languages, otherLangs, aiByNodeDef })
  }

  async beforeSuccess() {
    const { survey, defaultLang, languages, otherLangs, aiByNodeDef } = this.context

    const nodeDefs = Survey.getNodeDefDescendantsAndSelf()(survey)

    const resultItems = nodeDefs.map((nd) => {
      const uuid = NodeDef.getUuid(nd)
      const path = Survey.getNodeDefPath({ nodeDef: nd })(survey)
      const ai = aiByNodeDef[uuid] || {}

      const existingLabelsByLang = {}
      const existingDescriptionsByLang = {}
      for (const lang of otherLangs) {
        existingLabelsByLang[lang] = NodeDef.getLabels(nd)[lang] || ''
        existingDescriptionsByLang[lang] = NodeDef.getDescription(lang)(nd) || ''
      }

      return {
        nodeDefUuid: uuid,
        path,
        defaultLangLabel: NodeDef.getLabels(nd)[defaultLang] || '',
        defaultLangDescription: NodeDef.getDescription(defaultLang)(nd) || '',
        existingLabelsByLang,
        existingDescriptionsByLang,
        aiLabelsByLang: ai.aiLabels || {},
        aiDescriptionsByLang: ai.aiDescs || {},
      }
    })

    this.setResult({ defaultLang, languages, otherLangs, items: resultItems })
  }
}

NodeDefsTranslationJob.type = 'NodeDefsTranslationJob'
