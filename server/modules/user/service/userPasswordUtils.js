import * as bcrypt from 'bcryptjs'

export const encryptPassword = (passwordPlain) => bcrypt.hashSync(passwordPlain)

export const comparePassword = bcrypt.compareSync
