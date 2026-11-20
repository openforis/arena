import type { Router } from 'express'

import * as messageApi from './messageApi'

export const init = (app: Router): void => {
  messageApi.init(app)
}
