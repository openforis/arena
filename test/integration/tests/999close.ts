import { destroyTestContext } from '../config/context'

global.afterAll(destroyTestContext)
