import type { Writable } from 'stream'
import type { ArenaCategory, ArenaSurvey } from '@openforis/arena-core'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef, type ExtraPropDefItem } from '@core/survey/extraPropDef'
import { CategoryExportFile } from '@core/survey/categoryExportFile'
import { FileFormats } from '@core/fileFormats'
import { parsePoint } from '@core/survey/categoryItemPointParser'

import { db, DbClient } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as CategoryRepository from '../repository/categoryRepository'

const levelPositionField = 'level'

const transformGeometryPointExtraProperty = ({
  extraDef,
  obj,
}: {
  extraDef: ExtraPropDefItem
  obj: Record<string, unknown>
}) => {
  // split geometry point into separate columns
  const extraDefName = ExtraPropDef.getName(extraDef)
  const geometryPoint = obj[extraDefName]
  const point = parsePoint(geometryPoint as string | null | undefined)
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
}: {
  category: ArenaCategory
  languages?: string[]
  language?: string
  includeUuid?: boolean
  includeSingleCode?: boolean
  includeCodeJoint?: boolean
  includeLevelPosition?: boolean
  includeCumulativeArea?: boolean
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
  headers.push(
    ...languages.map((language) => CategoryExportFile.getLabelHeader({ language })),
    ...languages.map((language) => CategoryExportFile.getDescriptionHeader({ language })),
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
    draft = true,
    language = null,
    includeUuid = false,
    includeSingleCode = false,
    includeCodeJoint = false,
    includeLevelPosition = false,
    includeReportingDataCumulativeArea = false,
    outputStream,
    fileFormat = FileFormats.csv,
  }: {
    survey: ArenaSurvey
    categoryUuid: string
    draft?: boolean
    language?: string
    includeUuid?: boolean
    includeSingleCode?: boolean
    includeCodeJoint?: boolean
    includeLevelPosition?: boolean
    includeReportingDataCumulativeArea?: boolean
    outputStream: Writable
    fileFormat?: string
  },
  client: DbClient = db
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
    draft,
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
    processor: (dbStream) =>
      FlatDataWriter.writeItemsStreamToStream({
        stream: dbStream,
        outputStream,
        fields,
        options: { objectTransformer: categoryItemExportTransformer({ category, language, includeLevelPosition }) },
        fileFormat,
      }),
  })
}
