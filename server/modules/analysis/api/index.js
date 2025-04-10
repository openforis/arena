import * as chainApi from './chainApi'
import * as rChainApi from './rChainApi'
import * as rExecutorApi from './rExecutorApi'
import * as rChainResultApi from './rChainResultApi'

export const init = (app) => {
  chainApi.init(app)
  rChainApi.init(app)
  rExecutorApi.init(app)
  rChainResultApi.init(app)
}
