import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

export const validateCategoryItemExtraDef = async ({ itemExtraDef, itemExtraDefsArray }) => {
  const extraDefName = itemExtraDef[CategoryItemExtraDef.keys.name]

  return Validator.validate(itemExtraDef, {
    [CategoryItemExtraDef.keys.name]: [
      Validator.validateRequired(Validation.messageKeys.nameRequired, { key: extraDefName }),
      Validator.validateName(Validation.messageKeys.categoryEdit.itemExtraPropNameInvalid, { key: extraDefName }),
      // Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(itemExtraDefsArray),
    ],
    [CategoryItemExtraDef.keys.dataType]: [
      Validator.validateRequired(Validation.messageKeys.categoryEdit.itemExtraPropDataTypeRequired),
    ],
  })
}
