import * as Category from '@core/survey/category'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

export const validateCategoryItemExtraDef = async ({ itemExtraDef, itemExtraDefsArray }) => {
  const extraDefName = itemExtraDef[Category.keysItemExtraDef.name]

  return Validator.validate(itemExtraDef, {
    [Category.keysItemExtraDef.name]: [
      Validator.validateRequired(Validation.messageKeys.nameRequired, { key: extraDefName }),
      Validator.validateName(Validation.messageKeys.categoryEdit.itemExtraPropNameInvalid, { key: extraDefName }),
      // Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(itemExtraDefsArray),
    ],
    [Category.keysItemExtraDef.dataType]: [
      Validator.validateRequired(Validation.messageKeys.categoryEdit.itemExtraPropDataTypeRequired),
    ],
  })
}
