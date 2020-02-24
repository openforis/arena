import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

export const keys = {
  email: 'email',
  groupUuid: 'groupUuid',
}

export const getEmail = R.propOr('', keys.email)
export const getGroupUuid = R.prop(keys.groupUuid)
export const getValidation = Validation.getValidation

export const assocProp = R.assoc
export const assocValidation = Validation.assocValidation
