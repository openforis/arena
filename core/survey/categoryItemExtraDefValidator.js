import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'

import * as ObjectUtils from '@core/objectUtils'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

export const validateCategoryItemExtraDef = async ({ itemExtraDef, itemExtraDefsArray }) => {
  const extraDefName = itemExtraDef[CategoryItemExtraDef.keys.name]

  return Validator.validate(itemExtraDef, {
    [CategoryItemExtraDef.keys.name]: [
      Validator.validateRequired(Validation.messageKeys.nameRequired, { key: extraDefName }),
      Validator.validateName(Validation.messageKeys.categoryEdit.itemExtraPropNameInvalid, { key: extraDefName }),
      () => {
        const hasDuplicates = itemExtraDefsArray.some(
          (item, index) =>
            !ObjectUtils.isEqual(item)(itemExtraDef) && extraDefName === CategoryItemExtraDef.getName(item)
        )
        return hasDuplicates ? { key: Validation.messageKeys.nameDuplicate } : null
      },
    ],
    [CategoryItemExtraDef.keys.dataType]: [
      Validator.validateRequired(Validation.messageKeys.categoryEdit.itemExtraPropDataTypeRequired),
    ],
  })
}
