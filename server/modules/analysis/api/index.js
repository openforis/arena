import * as chainApi from './chainApi'
import * as rChainApi from './rChainApi'

export const init = (app) => {
  chainApi.init(app)
  rChainApi.init(app)
}
