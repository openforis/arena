import type { Express } from 'express'

import * as messageApi from './messageApi'

export const init = (app: Express): void => {
  messageApi.init(app)
}
