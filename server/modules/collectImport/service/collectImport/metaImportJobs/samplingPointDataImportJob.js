import * as R from 'ramda'

import { PointFactory, Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as CollectImportJobContext from '../collectImportJobContext'

import * as CategoryManager from '../../../../category/manager/categoryManager'
import CategoryImportJob, { CategoryImportInternalJob } from '../../../../category/service/categoryImportJob'
import * as CategoryImportJobParams from '../../../../category/service/categoryImportJobParams'

const keysExtra = {
  x: 'x',
  y: 'y',
  // eslint-disable-next-line camelcase
  srs_id: 'srs_id',
}

const keysItem = {
  location: 'location',
}

const samplingPointDataZipEntryPath = 'sampling_design/sampling_design.csv'

class SamplingPointDataImportInternalJob extends CategoryImportInternalJob {
  constructor(params) {
    super(
      {
        ...params,
        [CategoryImportJobParams.keys.categoryName]: Survey.samplingPointDataCategoryName,
      },
      'SamplingPointDataImportInternalJob'
    )
  }

  async logCategoryImportActivity() {
    // Do not log category import activity for sampling point data category
    return this // avoids eslint complain
  }

  async shouldExecute() {
    // Skip import if summary is not specified (csv file not found)
    return Boolean(this.summary)
  }

  async beforeSuccess() {
    // Delete empty levels
    this.logDebug('Deleting empty level(s)')
    const levelsCount = Category.getLevelsArray(this.category).length
    this.category = await CategoryManager.deleteLevelsEmptyByCategory(this.user, this.surveyId, this.category, this.tx)
    this.logDebug(`${levelsCount - Category.getLevelsArray(this.category).length} level(s) deleted`)

    await super.beforeSuccess()
  }

  // Start of overridden methods from CategoryImportJob
  async createReadStream() {
    const collectSurveyFileZip = CollectImportJobContext.getCollectSurveyFileZip(this.context)
    return collectSurveyFileZip.getEntryStream(samplingPointDataZipEntryPath)
  }

  async getOrCreateSummary() {
    const stream = await this.createReadStream()
    const { survey } = this
    const surveyInfo = Survey.getSurveyInfo(survey)
    const defaultLang = Survey.getDefaultLanguage(surveyInfo)
    return stream
      ? CategoryManager.createImportSummaryFromStream({
          stream,
          defaultLang,
          codeColumnPattern: /(level\d+)_code/,
          ignoreLabelsAndDescriptions: true,
        })
      : null
  }

  extractItemExtraDef() {
    const itemExtraDef = super.extractItemExtraDef()
    const itemExtraDefUpdated = Object.entries(itemExtraDef).reduce((acc, [key, extraDef]) => {
      if (!Object.keys(keysExtra).includes(key)) {
        acc[key] = { ...extraDef, [ExtraPropDef.keys.index]: Object.values(acc).length }
      }
      return acc
    }, {})
    itemExtraDefUpdated[keysItem.location] = ExtraPropDef.newItem({
      dataType: ExtraPropDef.dataTypes.geometryPoint,
      index: Object.values(itemExtraDefUpdated).length,
    })
    return itemExtraDefUpdated
  }

  extractItemExtraProps(extra) {
    const { srs_id: srs, x, y } = extra

    const point = PointFactory.createInstance({ srs, x, y })

    const extraUpdated = {
      ...R.omit(R.keys(keysExtra))(extra),
      [keysItem.location]: Points.toString(point),
    }

    return super.extractItemExtraProps(extraUpdated)
  }

  // End of overridden methods from CategoryImportJob

  // overridden from Job
  async beforeEnd() {
    const { survey } = this.context

    await super.beforeEnd()

    const surveyUpdated = Survey.assocCategory(this.category)(survey)

    const contextUpdated = CollectImportJobContext.assocSurvey(surveyUpdated)(this.context)

    this.setContext(contextUpdated)
  }
}

export default class SamplingPointDataImportJob extends CategoryImportJob {
  constructor(params) {
    super(params, 'SamplingPointDataImportJob', SamplingPointDataImportInternalJob)
  }
}
