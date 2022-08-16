import { configToSpec } from '../../../hooks/useChartSpec'

import config from './cases/0001'

const inputConfig = config[1]

const expectedSchema = config[2]

describe('Test spec', () => {
  beforeAll(async () => {}, 10000)

  it(`test aggregation`, () => {
    const config = { type: 'bar' }
    const spec = configToSpec({ config, configItemsByPath: inputConfig })
    expect(spec).toStrictEqual(expectedSchema)
  })
})
