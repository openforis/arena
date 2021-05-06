import * as chainApi from './chainApi'
import * as chainNodeDefApi from './chainNodeDefApi'
import * as entitiesApi from './entitiesApi'
import * as rChainApi from './rChainApi'

export const init = (app) => {
  chainApi.init(app)
  chainNodeDefApi.init(app)
  entitiesApi.init(app)
  rChainApi.init(app)
}
