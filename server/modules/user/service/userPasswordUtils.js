import * as bcrypt from 'bcrypt'
import * as passwordGenerator from 'generate-password'

export const generatePassword = () =>
  passwordGenerator.generate({
    length: 8,
    numbers: true,
    uppercase: true,
    strict: true,
  })

export const encryptPassword = passwordPlain =>
  new Promise((resolve, reject) =>
    bcrypt.hash(passwordPlain, 10, (error, hash) => (error ? reject(error) : resolve(hash))),
  )

export const comparePassword = bcrypt.compare
