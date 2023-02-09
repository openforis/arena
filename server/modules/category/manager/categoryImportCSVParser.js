import * as R from 'ramda'

import { Objects, PointFactory, Points, SystemError } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Srs from '@core/geo/srs'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import * as CSVReader from '@server/utils/file/csvReader'

const _checkSrs = ({ survey, srs, columnName }) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveySrss = Survey.getSRS(surveyInfo)
  if (!surveySrss.find((surveySrs) => Srs.getCode(surveySrs) === srs)) {
    throw new SystemError(Validation.messageKeys.categoryImport.srsNotDefined, { columnName, srs })
  }
}

const _getItemValue = ({ survey, item, row }) => {
  // single column
  const itemColumns = CategoryImportSummary.getItemColumns(item)
  if (itemColumns.length === 1) {
    const itemColumn = itemColumns[0]
    const itemValue = row[itemColumn]
    if (
      CategoryImportSummary.isItemExtra(item) &&
      CategoryImportSummary.getItemDataType(item) === ExtraPropDef.dataTypes.geometryPoint
    ) {
      const point = Points.parse(itemValue)
      _checkSrs({ survey, srs: point.srs, columnName: itemColumn })
    }
    return itemValue
  }

  // multiple columns
  if (
    CategoryImportSummary.isItemExtra(item) &&
    CategoryImportSummary.getItemDataType(item) === ExtraPropDef.dataTypes.geometryPoint
  ) {
    const itemKey = CategoryImportSummary.getItemKey(item)
    const x = row[itemKey + '_x']
    const y = row[itemKey + '_y']
    let srs = row[itemKey + '_srs']
    if (!Objects.isEmpty(x) && !Objects.isEmpty(y) && !Objects.isEmpty(srs)) {
      srs = StringUtils.removePrefix('EPSG:')(srs)
      _checkSrs({ survey, srs, columnName: itemKey + '_srs' })
      return Points.toString(PointFactory.createInstance({ x, y, srs }))
    }
  }
  return null
}

export const createRowsReaderFromStream = async ({ stream, survey, summary, onRowItem, onTotalChange }) => {
  const items = CategoryImportSummary.getItems(summary)

  return CSVReader.createReaderFromStream(
    stream,
    null,
    async (row) => {
      try {
        const codes = []
        const extra = {}
        const labelsByLang = {}
        const descriptionsByLang = {}

        items.forEach((item) => {
          const itemValue = _getItemValue({ survey, item, row })
          const itemKey = CategoryImportSummary.getItemKey(item)

          if (CategoryImportSummary.isItemCode(item)) {
            codes.push(itemValue)
          }
          if (Objects.isEmpty(itemValue)) {
            return
          }
          if (CategoryImportSummary.isItemExtra(item)) {
            extra[itemKey] = itemValue
          } else {
            // Label or description
            const lang = CategoryImportSummary.getItemLang(item)

            if (CategoryImportSummary.isItemLabel(item)) {
              labelsByLang[lang] = itemValue
            } else if (CategoryImportSummary.isItemDescription(item)) {
              descriptionsByLang[lang] = itemValue
            }
          }
        })

        // Determine level
        const levelIndex = R.findLastIndex(StringUtils.isNotBlank)(codes)

        await onRowItem({
          levelIndex,
          codes: codes.slice(0, levelIndex + 1),
          labelsByLang,
          descriptionsByLang,
          extra,
        })
      } catch (error) {
        await onRowItem({ error })
      }
    },
    onTotalChange
  )
}
