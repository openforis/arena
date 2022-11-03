import { ExtraPropDef } from '@core/survey/extraPropDef'

import * as ObjectUtils from '@core/objectUtils'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

export const validateExtraPropDef = async ({ extraPropDef, extraPropDefsArray }) => {
  const extraDefName = extraPropDef[ExtraPropDef.keys.name]

  return Validator.validate(extraPropDef, {
    [ExtraPropDef.keys.name]: [
      Validator.validateRequired(Validation.messageKeys.nameRequired, { key: extraDefName }),
      Validator.validateName(Validation.messageKeys.extraPropEdit.nameInvalid, { key: extraDefName }),
      () => {
        const hasDuplicates = extraPropDefsArray.some(
          (item) => !ObjectUtils.isEqual(item)(extraPropDef) && extraDefName === ExtraPropDef.getName(item)
        )
        return hasDuplicates ? { key: Validation.messageKeys.nameDuplicate } : null
      },
    ],
    [ExtraPropDef.keys.dataType]: [Validator.validateRequired(Validation.messageKeys.extraPropEdit.dataTypeRequired)],
  })
}
