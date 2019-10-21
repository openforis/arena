import * as R from 'ramda'

import CollectImportJobContext from '../collectImportJobContext'
import Category from '../../../../../../core/survey/category'
import CategoryItem from '../../../../../../core/survey/categoryItem'
import Point from '../../../../../../core/geo/point'

import CategoryManager from '../../../../category/manager/categoryManager'
import CategoryImportJob from '../../../../category/service/categoryImportJob'
import CategoryImportJobParams from '../../../../category/service/categoryImportJobParams'

const keysExtra = {
  x: 'x',
  y: 'y',
  srs_id: 'srs_id',
}

const keysItem = {
  location: 'location'
}

const samplingPointDataZipEntryPath = 'sampling_design/sampling_design.csv'

export default class SamplingPointDataImportJob extends CategoryImportJob {
  static categoryName: string = 'sampling_point_data'
  static type: string = 'SamplingPointDataImportJob'

  constructor (params?) {
    super({
      ...params,
      [CategoryImportJobParams.keys.categoryName]: SamplingPointDataImportJob.categoryName
    }, SamplingPointDataImportJob.type)
  }

  async shouldExecute () {
    //skip import if summary is not specified (csv file not found)
    return !!this.summary
  }

  async beforeSuccess () {
    //delete empty levels
    this.logDebug(`Deleting empty level(s)`)
    const levelsCount = Category.getLevelsArray(this.category).length
    this.category = await CategoryManager.deleteLevelsEmptyByCategory(this.user, this.surveyId, this.category, this.tx)
    this.logDebug(`${levelsCount - Category.getLevelsArray(this.category).length} level(s) deleted`)

    await super.beforeSuccess()
  }

  //start of overridden methods from CategoryImportJob
  async createReadStream () {
    const collectSurveyFileZip = CollectImportJobContext.getCollectSurveyFileZip(this.context) as any
    return await collectSurveyFileZip.getEntryStream(samplingPointDataZipEntryPath)
  }

  async getOrCreateSummary () {
    const stream = await this.createReadStream()
    return stream ? await CategoryManager.createImportSummaryFromStream(stream) : null
  }

  extractItemExtraDef () {
    return R.pipe(
      R.omit(R.keys(keysExtra)),
      R.assoc(keysItem.location, {
        [CategoryItem.keysExtraDef.dataType]: Category.itemExtraDefDataTypes.geometryPoint
      })
    )(super.extractItemExtraDef())
  }

  extractItemExtraProps (extra) {
    const { srs_id, x, y } = extra

    const extraUpdated = {
      ...R.omit(R.keys(keysExtra))(extra),
      [keysItem.location]: Point.newPoint(srs_id, x, y)
    }

    return super.extractItemExtraProps(extraUpdated)
  }

  //end of overridden methods from CategoryImportJob

  //overridden from Job
  async beforeEnd () {
    await super.beforeEnd()
    //assoc imported category to context categories (to be used by NodeDefsImportJob)
    this.setContext(CollectImportJobContext.assocCategory(this.category)(this.context))
  }
}
