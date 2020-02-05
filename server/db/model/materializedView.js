import * as R from 'ramda'

const keys = {
  viewName: 'viewName',
}

export const getViewName = R.prop(keys.viewName)
