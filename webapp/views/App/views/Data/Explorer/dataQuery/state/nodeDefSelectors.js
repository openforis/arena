import * as R from 'ramda'

import { getState } from './read'
import { keys } from './keys'

export const isNodeDefSelectorsVisible = R.pipe(getState, R.propOr(true, keys.showNodeDefSelectors))

export const assocShowNodeDefSelectors = R.assoc(keys.showNodeDefSelectors)
