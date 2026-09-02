import { Points } from '@openforis/arena-core'

import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { CategoryExportFile } from '@core/survey/categoryExportFile'

import { parsePoint } from './categoryExportManager'

const locationExtraPropName = 'location'

/**
 * Builds a GeoJSON Point feature (geometry reprojected to EPSG:4326) from one row of the
 * category export query result, or returns null if the row has no valid 'location' value.
 * @param {!object} params - The parameters object.
 * @param {!object} params.category - The category the row belongs to.
 * @param {!object} params.row - One row from CategoryExportRepository.generateCategoryExportStream.
 * @param {!string[]} params.languages - Survey languages, used to pick label_<lang>/description_<lang> columns.
 * @param {!object} params.srsIndex - Survey SRS index, as returned by Survey.getSRSIndex.
 * @returns {object|null} A GeoJSON Feature, or null if the row has no valid location.
 */
export const buildCategoryItemFeature = ({ category, row, languages, srsIndex }) => {
  const point = parsePoint(row[locationExtraPropName])
  if (!point) return null

  const pointLatLong = Points.toLatLong(point, srsIndex)
  if (!pointLatLong) return null

  const properties = { code: row.code }
  languages.forEach((language) => {
    properties[`label_${language}`] = row[`label_${language}`] ?? null
    properties[`description_${language}`] = row[`description_${language}`] ?? null
  })

  const extraDefs = Category.getItemExtraDefsArray(category).filter(
    (extraDef) => ExtraPropDef.getName(extraDef) !== locationExtraPropName
  )
  extraDefs.forEach((extraDef) => {
    const extraDefName = ExtraPropDef.getName(extraDef)
    if (ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.geometryPoint) {
      const otherPoint = parsePoint(row[extraDefName])
      const [xHeader, yHeader, srsHeader] = CategoryExportFile.getExtraPropHeaders({ extraPropDef: extraDef })
      properties[xHeader] = otherPoint?.x ?? null
      properties[yHeader] = otherPoint?.y ?? null
      properties[srsHeader] = otherPoint?.srs ?? null
    } else {
      properties[extraDefName] = row[extraDefName] ?? null
    }
  })

  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Point', coordinates: [pointLatLong.x, pointLatLong.y] },
  }
}
