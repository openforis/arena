import { Points } from '@openforis/arena-core'
import type { SRSIndex } from '@openforis/arena-core'
import type { Feature } from 'geojson'

import * as Category from '@core/survey/category'
import { ExtraPropDef as ExtraPropDefUntyped } from '@core/survey/extraPropDef'
import { CategoryExportFile } from '@core/survey/categoryExportFile'
import { parsePoint } from '@core/survey/categoryItemPointParser'

// extraPropDef.js's getName/getDataType are point-free Ramda compositions (e.g. A.prop(...)),
// which allowJs's lightweight JS inference (checkJs is off project-wide) can't resolve to real
// function types - it falls back to {}, making ExtraPropDef.getName(...) look "not callable"
const ExtraPropDef: any = ExtraPropDefUntyped

const locationExtraPropName = Category.locationItemExtraDefName

/**
 * Builds a GeoJSON Point feature (geometry reprojected to EPSG:4326) from one row of the
 * category export query result, or returns null if the row has no valid 'location' value.
 */
export const buildCategoryItemFeature = ({
  category,
  row,
  languages,
  srsIndex,
}: {
  category: Record<string, any>
  row: Record<string, any>
  languages: string[]
  srsIndex: SRSIndex
}): Feature | null => {
  const point = parsePoint(row[locationExtraPropName])
  if (!point) return null

  const pointLatLong = Points.toLatLong(point, srsIndex)
  if (!pointLatLong) return null

  const properties: Record<string, any> = { code: row.code }
  languages.forEach((language) => {
    properties[`label_${language}`] = row[`label_${language}`] ?? null
    properties[`description_${language}`] = row[`description_${language}`] ?? null
  })

  const extraDefs = Category.getItemExtraDefsArray(category).filter(
    (extraDef: any) => ExtraPropDef.getName(extraDef) !== locationExtraPropName
  )
  extraDefs.forEach((extraDef: any) => {
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
