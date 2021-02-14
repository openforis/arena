import login from '../src/login'
import surveyCreate from '../src/surveyCreate'
import surveyDelete from '../src/surveyDelete'

beforeAll(async () => {
  await page.goto('http://localhost:9090')
})

describe('E2E Tests', () => {
  login()
  surveyCreate()
  surveyDelete()
})
