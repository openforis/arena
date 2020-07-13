import { initTestContext, destroyTestContext } from './testContext'

global.beforeAll(async () => {
  await initTestContext()
})

global.afterAll(async () => {
  await destroyTestContext()
})
