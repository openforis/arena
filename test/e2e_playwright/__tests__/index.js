import login from '../src/tests/login'
import surveyCreate from '../src/tests/surveyCreate'
import surveyEditInfo from '../src/tests/surveyEditInfo'
import surveyDelete from '../src/tests/surveyDelete'

beforeAll(async () => {
  await page.goto('http://localhost:9090')
})

describe('E2E Tests', () => {
  login()
  surveyCreate()
  surveyEditInfo()
  surveyDelete()
})
