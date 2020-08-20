import 'dotenv/config'

import { openBrowser } from '../utils'

global.beforeAll(openBrowser)
