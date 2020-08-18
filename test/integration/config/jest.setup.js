import { db } from '../../../server/db/db'

const { initTestContext, destroyTestContext } = require('./context')

global.beforeAll(async () => {
  await initTestContext()
})

global.afterAll(async (done) => {
  await destroyTestContext()
  await db.$pool.end()
  done()
})
