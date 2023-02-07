import * as R from 'ramda'

import { Objects, PointFactory, Points } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import * as CSVReader from '@server/utils/file/csvReader'

const _getItemValue = ({ item, row }) => {
  const itemColumns = CategoryImportSummary.getItemColumns(item)
  if (itemColumns.length === 1) return row[itemColumns[0]]

  if (
    CategoryImportSummary.isItemExtra(item) &&
    CategoryImportSummary.getItemDataType(item) === ExtraPropDef.dataTypes.geometryPoint
  ) {
    const itemKey = CategoryImportSummary.getItemKey(item)
    const x = row[itemKey + '_x']
    const y = row[itemKey + '_y']
    const srs = row[itemKey + '_srs']
    return Points.toString(PointFactory.createInstance({ x, y, srs }))
  }
  return null
}

export const createRowsReaderFromStream = async (stream, summary, onRowItem, onTotalChange) => {
  const items = CategoryImportSummary.getItems(summary)

  return CSVReader.createReaderFromStream(
    stream,
    null,
    async (row) => {
      const codes = []
      const extra = {}
      const labelsByLang = {}
      const descriptionsByLang = {}

      items.forEach((item) => {
        const itemValue = _getItemValue({ item, row })
        const itemKey = CategoryImportSummary.getItemKey(item)

        if (CategoryImportSummary.isItemCode(item)) {
          codes.push(itemValue)
        } else if (!Objects.isEmpty(itemValue)) {
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
    },
    onTotalChange
  )
}
