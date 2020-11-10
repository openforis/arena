import * as R from 'ramda'

export const keysProps = {
  title: 'title',
}

// ====== READ
export const getPropsTitle = R.propOr('', keysProps.title)

// ====== UPDATE
export const assocPropsTitle = R.assoc(keysProps.title)
