import * as Validation from '@core/validation/validation'

const validPasswordRegExp = new RegExp(/^\S+$/)
const passwordStrengthRegExp = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d).{8,}$/)

const validatePassword = (propName, item) => {
  const password = item[propName]

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
