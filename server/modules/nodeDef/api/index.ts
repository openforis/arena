import type { Router } from 'express'

import * as entitiesApi from './entitiesApi'
import * as nodeDefApi from './nodeDefApi'

export const init = (app: Router) => {
  entitiesApi.init(app)
  nodeDefApi.init(app)
}
