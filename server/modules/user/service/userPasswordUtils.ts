import * as bcrypt from 'bcryptjs'

export const encryptPassword = (passwordPlain: any) => bcrypt.hashSync(passwordPlain)

export const comparePassword = bcrypt.compareSync
