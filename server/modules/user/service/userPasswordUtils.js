import * as bcrypt from 'bcryptjs'
import * as passwordGenerator from 'generate-password'

export const generatePassword = () =>
  passwordGenerator.generate({
    length: 8,
    numbers: true,
    uppercase: true,
    strict: true,
  })

export const encryptPassword = passwordPlain => bcrypt.hashSync(passwordPlain)

export const comparePassword = bcrypt.compareSync
