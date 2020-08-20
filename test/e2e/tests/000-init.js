import 'dotenv/config'

import { openBrowser } from '../utils/api'

global.beforeAll(openBrowser)
