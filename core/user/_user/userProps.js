import * as R from 'ramda'

export const keysProps = {
  props: 'props',
  title: 'title',
  // This key is used in Dropdown itemKey //2020
  itemKey: 'itemKey',
}

// ====== READ
export const getTitle = R.pipe(R.prop(keysProps.props), R.propOr('', keysProps.title))

// ====== UPDATE
export const assocTitle = R.assoc(keysProps.title)
