import * as R from 'ramda'

const keys = {
  name: 'name',
  password: 'password',
}

export const getName = R.prop(keys.name)
export const getPassword = R.prop(keys.password)
