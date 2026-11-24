import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { buildCategoryItemFeature } from '@server/modules/category/manager/categoryGeoPackageFeatureBuilder'

const buildCategory = (extraDefs) => Category.assocItemExtraDef(extraDefs)(Category.newCategory())

describe('categoryGeoPackageFeatureBuilder', () => {
  it('builds a Point feature from a valid location value', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
    })
    const row = {
      code: '001',
      label_en: 'Site 1',
      description_en: '',
      location: 'SRID=EPSG:4326;POINT(12.5 41.9)',
    }
    const feature = buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })

    expect(feature).toEqual({
      type: 'Feature',
      properties: { code: '001', label_en: 'Site 1', description_en: '' },
      geometry: { type: 'Point', coordinates: [12.5, 41.9] },
    })
  })

  it('returns null when location is missing', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
    })
    const row = { code: '001', label_en: 'Site 1', description_en: '', location: null }

    expect(buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })).toBeNull()
  })

  it('returns null when location is not a parseable point', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
    })
    const row = { code: '001', label_en: 'Site 1', description_en: '', location: 'not a point' }

    expect(buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })).toBeNull()
  })

  it('flattens a second geometryPoint extra prop into _x/_y/_srs attributes', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
      alt_location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 1 }),
    })
    const row = {
      code: '001',
      label_en: 'Site 1',
      description_en: '',
      location: 'SRID=EPSG:4326;POINT(12.5 41.9)',
      alt_location: 'SRID=EPSG:4326;POINT(13.0 42.0)',
    }
    const feature = buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })

    expect(feature.properties).toEqual({
      code: '001',
      label_en: 'Site 1',
      description_en: '',
      alt_location_x: 13,
      alt_location_y: 42,
      alt_location_srs: '4326',
    })
  })

  it('carries other (non-geometry) extra props through as plain attributes', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
      notes: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text, index: 1 }),
    })
    const row = {
      code: '001',
      label_en: 'Site 1',
      description_en: '',
      location: 'SRID=EPSG:4326;POINT(12.5 41.9)',
      notes: 'hello',
    }
    const feature = buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })

    expect(feature.properties.notes).toBe('hello')
  })
})
