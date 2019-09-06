const R = require('ramda')

const CategoryItem = require('../../../../../../common/survey/categoryItem')
const CategoryImportSummary = require('../../../../../../common/survey/categoryImportSummary')

const CategoryService = require('../../../../category/service/categoryService')
const CategoryImportJob = require('../../../../category/service/categoryImportJob')
const CategoryImportJobParams = require('../../../../category/service/categoryImportJobParams')

const keys = {
  categoryName: 'sampling_point_data'
}

const keysExtra = {
  x: 'x',
  y: 'y',
  srs_id: 'srs_id',
}

const keysItem = {
  location: 'location'
}

class SamplingPointDataImportJob extends CategoryImportJob {

  constructor (params) {
    super({
      ...params,
      [CategoryImportJobParams.keys.categoryName]: keys.categoryName
    }, 'SamplingPointDataImportJob')
  }

  //extends the method of the superclass
  async getOrCreateSummary () {
    const filePath = '/home/ricci/Downloads/sampling_points.csv' //TODO
    return await CategoryService.createImportSummary(filePath)
  }

  extractItemExtraDef () {
    return R.pipe(
      R.omit(R.keys(keysExtra)),
      R.assoc(keysItem.location, {
        [CategoryItem.keysExtraDef.dataType]: CategoryImportSummary.columnDataTypes.geometryPoint
      })
    )(super.extractItemExtraDef())
  }

  extractItemProps (codeLevel, levelName, labelsByLevel, descriptionsByLevel, extra) {
    const { srs_id, x, y } = extra

    const extraUpdated = {
      ...R.omit(R.keys(keysExtra))(extra),
      [keysItem.location]: `SRID=${srs_id};POINT(${x} ${y})`
    }

    return super.extractItemProps(codeLevel, labelsByLevel, levelName, descriptionsByLevel, extraUpdated)
  }
}

module.exports = SamplingPointDataImportJob