import * as bcrypt from 'bcryptjs'

export const encryptPassword = (passwordPlain: string) => bcrypt.hashSync(passwordPlain)

export const comparePassword = bcrypt.compareSync
