import * as R from 'ramda'

export const keysProps = {
  props: 'props',
  title: 'title',
  // This key is used in Dropdown itemKey //2020
  itemKey: 'itemKey',
}

// ====== READ
export const getPropsTitle = R.pipe(R.prop(keysProps.props), R.propOr('', keysProps.title))

// ====== UPDATE
export const assocPropsTitle = R.assoc(keysProps.title)
