import { Objects, Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { CategoryExportFile } from '@core/survey/categoryExportFile'
import { FileFormats } from '@core/fileFormats'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as CategoryRepository from '../repository/categoryRepository'

const levelPositionField = 'level'

const parsePoint = (geometryPoint) => {
  if (Objects.isEmpty(geometryPoint)) return null
  const point = Points.parse(geometryPoint)
  if (point) return point
  try {
    return JSON.parse(geometryPoint)
  } catch (error) {
    return null
  }
}

const transformGeometryPointExtraProperty = ({ extraDef, obj }) => {
  // split geometry point into separate columns
  const extraDefName = ExtraPropDef.getName(extraDef)
  const geometryPoint = obj[extraDefName]
  const point = parsePoint(geometryPoint)
  delete obj[extraDefName]
  if (point) {
    obj[extraDefName + '_x'] = point.x
    obj[extraDefName + '_y'] = point.y
    obj[extraDefName + '_srs'] = point.srs
  }
}

const categoryItemExportTransformer =
  ({ category, language = null, includeLevelPosition = false }) =>
  (obj) => {
    const extraDefs = Category.getItemExtraDefsArray(category)
    extraDefs.forEach((extraDef) => {
      if (ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.geometryPoint) {
        transformGeometryPointExtraProperty({ extraDef, obj })
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
  if (includeSingleCode && !flat) {
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
    fileFormat = FileFormats.csv,
  },
  client = db
) => {
  const surveyId = Survey.getId(survey)
  const category = await CategoryRepository.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const includeCumulativeArea = Category.isReportingData(category) && includeReportingDataCumulativeArea

  // get survey languages
  const languages = Survey.getLanguages(survey)

  const queryStream = CategoryRepository.generateCategoryExportStream({
    surveyId,
    category,
    languages,
    includeCumulativeArea,
  })

  const fields = getCategoryExportHeaders({
    category,
    languages,
    language,
    includeUuid,
    includeSingleCode,
    includeCodeJoint,
    includeLevelPosition,
    includeCumulativeArea,
  })

  return DbUtils.stream({
    client,
    queryStream,
    processor: async (dbStream) =>
      FlatDataWriter.writeItemsStreamToStream({
        stream: dbStream,
        outputStream,
        fields,
        options: { objectTransformer: categoryItemExportTransformer({ category, language, includeLevelPosition }) },
        fileFormat,
      }),
  })
}
