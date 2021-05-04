import * as chainApi from './chainApi'
import * as chainNodeDefApi from './chainNodeDefApi'
import * as rChainApi from './rChainApi'

export const init = (app) => {
  chainApi.init(app)
  chainNodeDefApi.init(app)
  rChainApi.init(app)
}
