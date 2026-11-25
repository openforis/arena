import type { ArenaValidation } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import { ExtraPropDef, ExtraPropDefItem } from '@core/survey/extraPropDef'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

export const validateExtraPropDef = async ({
  extraPropDef,
  extraPropDefsArray,
}: {
  extraPropDef: ExtraPropDefItem
  extraPropDefsArray: ExtraPropDefItem[]
}): Promise<ArenaValidation> => {
  const extraDefName = ExtraPropDef.getName(extraPropDef)

  return Validator.validate(extraPropDef, {
    [ExtraPropDef.keys.name]: [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
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
