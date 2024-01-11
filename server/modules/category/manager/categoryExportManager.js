import { Objects, Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { CategoryExportFile } from '@core/survey/categoryExportFile'

import { db } from '@server/db/db'
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as CategoryRepository from '../repository/categoryRepository'

const levelPositionField = 'level'

const categoryItemExportTransformer =
  ({ category, language = null, includeLevelPosition = false }) =>
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
    if (language) {
      obj.label = obj[`label_${language}`]
      obj.description = obj[`description_${language}`]
    }
    if (includeLevelPosition) {
      obj[levelPositionField] = obj['level_index'] + 1
    }
    return obj
  }

const getCategoryExportHeaders = ({
  category,
  languages = [],
  language = null,
  includeUuid = false,
  includeSingleCode = false,
  includeCodeJoint = false,
  includeLevelPosition = false,
  includeCumulativeArea = false,
}) => {
  const levels = Category.getLevelsArray(category)
  const flat = levels.length === 1
  const headers = []
  if (includeUuid) {
    headers.push('uuid')
  }
  if (includeSingleCode) {
    headers.push('code')
  }
  if (includeCodeJoint) {
    headers.push(CategoryRepository.codeJointField)
  }
  if (includeLevelPosition) {
    headers.push(levelPositionField)
  }
  headers.push(...levels.map((level) => CategoryExportFile.getLevelCodeHeader({ level, flat })))
  if (language) {
    headers.push('label', 'description')
  }
  headers.push(...languages.map((language) => CategoryExportFile.getLabelHeader({ language })))
  headers.push(...languages.map((language) => CategoryExportFile.getDescriptionHeader({ language })))
  headers.push(
    ...Category.getItemExtraDefsArray(category).flatMap((extraPropDef) =>
      CategoryExportFile.getExtraPropHeaders({ extraPropDef })
    )
  )
  if (includeCumulativeArea) {
    headers.push(CategoryRepository.cumulativeAreaField)
  }
  return headers
}

export const exportCategoryToStream = async (
  {
    survey,
    categoryUuid,
    draft,
    language = null,
    includeUuid = false,
    includeSingleCode = false,
    includeCodeJoint = false,
    includeLevelPosition = false,
    includeReportingDataCumulativeArea = false,
    outputStream,
  },
  client = db
) => {
  const surveyId = Survey.getId(survey)
  const category = await CategoryRepository.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const includeCumulativeArea = Category.isReportingData(category) && includeReportingDataCumulativeArea

  // get survey languages
  const languages = Survey.getLanguages(survey)

  const categoryStream = CategoryRepository.generateCategoryExportStream({
    surveyId,
    category,
    languages,
    includeCumulativeArea,
  })

  const headers = getCategoryExportHeaders({
    category,
    languages,
    language,
    includeUuid,
    includeSingleCode,
    includeCodeJoint,
    includeLevelPosition,
    includeCumulativeArea,
  })

  return client.stream(categoryStream, (dbStream) => {
    const csvTransform = CSVWriter.transformJsonToCsv({
      fields: headers,
      options: { objectTransformer: categoryItemExportTransformer({ category, language, includeLevelPosition }) },
    })
    dbStream.pipe(csvTransform).pipe(outputStream)
  })
}
