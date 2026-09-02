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
})
