import * as R from 'ramda'

export const pathname = ({history}) =>
  R.path(['location', 'pathname'], history)