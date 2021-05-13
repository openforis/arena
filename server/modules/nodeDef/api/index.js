import * as entitiesApi from './entitiesApi'
import * as nodeDefApi from './nodeDefApi'

export const init = (app) => {
  entitiesApi.init(app)
  nodeDefApi.init(app)
}
