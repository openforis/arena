import * as R from 'ramda'

export const stateKey = 'tableViews'
export const getState = R.prop(stateKey)

const keys = {
  offset: 'offset',
  limit: 'limit',
  count: 'count',
  list: 'list',
  module: 'module',
}

export const defaults = {
  [keys.offset]: 0,
  [keys.limit]: 15,
  [keys.count]: 0,
  [keys.list]: [],
}

// ====== Active module

export const assocModuleActive = module => R.assoc(keys.module, module)

export const getModuleActive = R.pipe(getState, R.prop(keys.module))

// ====== Module props

export const assocListUpdateProps = props => state => {
  const module = R.prop(keys.module, state)

  return {
    ...state,
    [module]: {
      ...state[module],
      ...props
    }
  }
}

export const getModuleProp = (module, prop, defaultValue = null) => R.pipe(
  getState,
  R.pathOr(defaultValue, [module, prop])
)

export const getLimit = module => getModuleProp(module, keys.limit, defaults[keys.limit])

export const getOffset = module => getModuleProp(module, keys.offset, defaults[keys.offset])

export const getCount = module => getModuleProp(module, keys.count, defaults[keys.count])

export const getList = module => getModuleProp(module, keys.list, defaults[keys.list])
