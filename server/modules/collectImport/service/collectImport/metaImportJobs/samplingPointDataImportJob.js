const R = require('ramda')

const CollectImportJobContext = require('../collectImportJobContext')
const Category = require('../../../../../../core/survey/category')
const CategoryItem = require('../../../../../../core/survey/categoryItem')
const Point = require('../../../../../../core/geo/point')

const CategoryManager = require('../../../../category/manager/categoryManager')
const CategoryImportJob = require('../../../../category/service/categoryImportJob')
const CategoryImportJobParams = require('../../../../category/service/categoryImportJobParams')

const keysExtra = {
  x: 'x',
  y: 'y',
  srs_id: 'srs_id',
}

const keysItem = {
  location: 'location'
}

const samplingPointDataZipEntryPath = 'sampling_design/sampling_design.csv'

class SamplingPointDataImportJob extends CategoryImportJob {

  constructor (params) {
    super({
      ...params,
      [CategoryImportJobParams.keys.categoryName]: SamplingPointDataImportJob.categoryName
    }, 'SamplingPointDataImportJob')
  }

  async shouldExecute () {
    //skip import if summary is not specified (csv file not found)
    return !!this.summary
  }

  async beforeSuccess () {
    //delete unused levels
    const levelIndexToDeleteFrom = this.levelIndexDeepest + 1
    const levelsUnusedCount = Category.getLevelsArray(this.category).length - levelIndexToDeleteFrom
    if (levelsUnusedCount > 0) {
      this.logDebug(`Deleting ${levelsUnusedCount} unused level(s) starting from index ${levelIndexToDeleteFrom}`)
      this.category = await CategoryManager.deleteLevelsFromIndex(this.user, this.surveyId, this.category, levelIndexToDeleteFrom, this.tx)
      this.logDebug(`${levelsUnusedCount} levels deleted`)
    }

    await super.beforeSuccess()
  }

  //start of overridden methods from CategoryImportJob
  async createReadStream () {
    const collectSurveyFileZip = CollectImportJobContext.getCollectSurveyFileZip(this.context)
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

SamplingPointDataImportJob.categoryName = 'sampling_point_data'

module.exports = SamplingPointDataImportJob