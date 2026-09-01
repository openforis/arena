import * as Validation from '@core/validation/validation'

import { Objects } from '@openforis/arena-core'

const validPasswordRegExp = new RegExp(/^\S+$/)
const passwordStrengthRegExp = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d).{8,}$/)

const validatePassword = (propName: string, item: Record<string, unknown>) => {
  const password = item[propName] as string
  if (Objects.isEmpty(password)) {
    return null
  }
  if (!validPasswordRegExp.test(password)) {
    return { key: Validation.messageKeys.user.passwordInvalid }
  }
  if (!passwordStrengthRegExp.test(password)) {
    return { key: Validation.messageKeys.user.passwordUnsafe }
  }
  return null
}

export const UserPasswordValidator = {
  validatePassword,
}
