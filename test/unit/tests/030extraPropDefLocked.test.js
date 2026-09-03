import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Category from '@core/survey/category'
import { ExtraPropDefsUpdater } from '@core/survey/extraPropDefsUpdater'

describe('ExtraPropDef locked flag', () => {
  it('newItem defaults locked to false', () => {
    const item = ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text })
    expect(ExtraPropDef.isLocked(item)).toBe(false)
  })

  it('newItem stores locked when true', () => {
    const item = ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, locked: true })
    expect(ExtraPropDef.isLocked(item)).toBe(true)
  })

  it('Category.isExtraPropDefReadOnly is true only for a locked extra def', () => {
    const category = Category.newCategory()
    const lockedDef = {
      ...ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, locked: true }),
      name: 'location',
    }
    const unlockedDef = {
      ...ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text, locked: false }),
      name: 'notes',
    }
    expect(Category.isExtraPropDefReadOnly(lockedDef)(category)).toBe(true)
    expect(Category.isExtraPropDefReadOnly(unlockedDef)(category)).toBe(false)
  })

  it('updateOrDeleteExtraDef preserves the locked flag of defs it is not editing', async () => {
    const extraPropDefs = {
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
      notes: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text, index: 1, locked: false }),
    }
    // simulate renaming the unrelated 'notes' prop
    const updated = await ExtraPropDefsUpdater.updateOrDeleteExtraDef({
      extraPropDefs,
      propName: 'notes',
      extraPropDef: { name: 'notes_renamed', dataType: ExtraPropDef.dataTypes.text },
    })
    expect(ExtraPropDef.isLocked(updated.location)).toBe(true)
  })

  it('backward-compatibility: pre-existing unlocked area extra-prop-def on reportingData category is still read-only', () => {
    const reportingDataCategory = Category.assocProp({
      key: Category.keysProps.reportingData,
      value: true,
    })(Category.newCategory())
    // Simulate pre-existing data: area prop-def without locked field (missing field defaults to false via isLocked)
    const unlockedAreaDef = {
      ...ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.number }),
      name: Category.reportingDataItemExtraDefKeys.area,
    }
    expect(Category.isExtraPropDefReadOnly(unlockedAreaDef)(reportingDataCategory)).toBe(true)
  })

  it('hasLocationExtraProp / isLocationExtraPropLocked are false for a category with no location extra prop', () => {
    const category = Category.newCategory()
    expect(Category.hasLocationExtraProp(category)).toBe(false)
    expect(Category.isLocationExtraPropLocked(category)).toBe(false)
  })

  it('isLocationExtraPropLocked is true only while the location extra prop is actually locked', () => {
    const categoryWithLockedLocation = Category.assocItemExtraDef({
      [Category.locationItemExtraDefName]: ExtraPropDef.newItem({
        dataType: ExtraPropDef.dataTypes.geometryPoint,
        locked: true,
      }),
    })(Category.newCategory())
    expect(Category.hasLocationExtraProp(categoryWithLockedLocation)).toBe(true)
    expect(Category.isLocationExtraPropLocked(categoryWithLockedLocation)).toBe(true)

    // simulates the effect of "convert to simple category": the location extra prop is unlocked,
    // not deleted, so hasLocationExtraProp stays true but isLocationExtraPropLocked must flip to
    // false - a menu item gated on hasLocationExtraProp alone would incorrectly keep offering
    // "convert to simple category" again after the category was already converted
    const categoryWithUnlockedLocation = Category.assocItemExtraDef({
      [Category.locationItemExtraDefName]: ExtraPropDef.newItem({
        dataType: ExtraPropDef.dataTypes.geometryPoint,
        locked: false,
      }),
    })(Category.newCategory())
    expect(Category.hasLocationExtraProp(categoryWithUnlockedLocation)).toBe(true)
    expect(Category.isLocationExtraPropLocked(categoryWithUnlockedLocation)).toBe(false)
  })

  it('the location extra prop is always read-only on a sampling point data category, even if not persisted as locked', () => {
    const unlockedLocationDef = {
      ...ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, locked: false }),
      name: Category.locationItemExtraDefName,
    }
    const samplingPointDataCategory = Category.assocProp({
      key: Category.keysProps.name,
      value: 'sampling_point_data',
    })(Category.newCategory())
    expect(Category.isExtraPropDefReadOnly(unlockedLocationDef)(samplingPointDataCategory)).toBe(true)

    // a same-named unlocked prop on a regular category stays editable
    const regularCategory = Category.newCategory()
    expect(Category.isExtraPropDefReadOnly(unlockedLocationDef)(regularCategory)).toBe(false)
  })
})
