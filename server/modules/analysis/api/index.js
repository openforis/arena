import * as chainApi from './chainApi'
import * as rChainApi from './rChainApi'
import * as rExecutorApi from './rExecutorApi'

export const init = (app) => {
  chainApi.init(app)
  rChainApi.init(app)
  rExecutorApi.init(app)
}
