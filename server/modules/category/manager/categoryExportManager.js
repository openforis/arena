import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import { db } from '@server/db/db'
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as CategoryRepository from '../repository/categoryRepository'
import { Objects, Points } from '@openforis/arena-core'

const categoryItemExportTransformer =
  ({ category }) =>
  (obj) => {
    const extraDefs = Category.getItemExtraDefsArray(category)
    extraDefs.forEach((extraDef) => {
      if (ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.geometryPoint) {
        // split geometry point into separate columns
        const extraDefName = ExtraPropDef.getName(extraDef)
        const geometryPoint = obj[extraDefName]
        if (!Objects.isEmpty(geometryPoint)) {
          const point = Points.parse(geometryPoint)
          delete obj[extraDefName]
          obj[extraDefName + '_x'] = point.x
          obj[extraDefName + '_y'] = point.y
          obj[extraDefName + '_srs'] = point.srs
        }
      }
    })
    return obj
  }

export const exportCategoryToStream = async ({ survey, categoryUuid, draft, outputStream }, client = db) => {
  const surveyId = Survey.getId(survey)
  const category = await CategoryRepository.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })

  // get survey languages
  const languages = Survey.getLanguages(survey)

  const { stream: categoryStream, headers } = CategoryRepository.generateCategoryExportStreamAndHeaders({
    surveyId,
    category,
    languages,
  })

  return client.stream(categoryStream, (dbStream) => {
    const csvTransform = CSVWriter.transformJsonToCsv({
      fields: headers,
      options: { objectTransformer: categoryItemExportTransformer({ category }) },
    })
    dbStream.pipe(csvTransform).pipe(outputStream)
  })
}
