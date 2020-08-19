import 'dotenv/config'

import { openBrowser } from '../utils/browser'

global.beforeAll(openBrowser)
