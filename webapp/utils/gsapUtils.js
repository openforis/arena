import * as R from 'ramda'

export const kill = (tl) => () => {
  if (!R.isNil(tl)) {
    tl.kill()
    tl = null
  }
}
