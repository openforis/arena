import * as Validation from '@core/validation/validation'
import { validateExtraPropDef } from './extraPropDefValidator'

import { ExtraPropDef } from './extraPropDef'

const updateOrDeleteExtraDef = async ({ extraPropDefs, propName, extraPropDef, deleted = false }) => {
  const extraPropDefsArray = ExtraPropDef.extraDefsToArray(extraPropDefs)
  const itemExtraDefsArrayUpdated = [...extraPropDefsArray]
  const oldItemIndex = itemExtraDefsArrayUpdated.findIndex((item) => ExtraPropDef.getName(item) === propName)

  if (deleted) {
    // remove old item
    delete itemExtraDefsArrayUpdated[oldItemIndex]
  } else {
    if (oldItemIndex < 0) {
      // add new extra def item
      itemExtraDefsArrayUpdated.push(extraPropDef)
    } else {
      // update existing item
      itemExtraDefsArrayUpdated[oldItemIndex] = extraPropDef
    }
    const validation = await validateExtraPropDef({
      extraPropDef,
      extraPropDefsArray: itemExtraDefsArrayUpdated,
    })
    if (!Validation.isValid(validation)) {
      throw new Error('Invalid item extra def')
    }
  }
  // prepare itemExtraDefs for storage
  // - remove unnecessary information (uuid, name)
  // - index stored object by extra def name
  return itemExtraDefsArrayUpdated.reduce((acc, item, index) => {
    const name = ExtraPropDef.getName(item)
    const dataType = ExtraPropDef.getDataType(item)
    acc[name] = ExtraPropDef.newItem({ dataType, index })
    return acc
  }, {})
}

export const ExtraPropDefsUpdater = {
  updateOrDeleteExtraDef,
}
