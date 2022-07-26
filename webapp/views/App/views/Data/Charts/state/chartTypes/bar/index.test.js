import { configToSpec } from '../../hooks/useChartSpec'

const inputConfig = {
  'query.metric': {
    blockPath: 'query.metric',
    value: [{ key: '4fb36dff-53d2-47d4-a8b7-81cd3ae5a49e' }, { key: '163336f3-f48c-434b-99e3-5d1732df1108' }],
  },
  'query.metric.aggregation': {
    blockPath: 'query.metric.aggregation',
    value: [
      { value: 'average', label: 'Avg', name: 'avg', type: 'aggregation', key: 'b75324b6-a771-464c-93e9-f584e29afbf2' },
      { value: 'average', label: 'Avg', name: 'avg', type: 'aggregation', key: '7a347e44-e25f-4a06-bca6-f584e29afbf2' },
    ],
  },
  'query.metric.column': {
    blockPath: 'query.metric.column',
    value: [
      { name: 'tree_dbh', value: 'tree_dbh', label: 'Dbh [cm]', type: 'temporal' },
      { name: 'tree_diameter_pom', value: 'tree_diameter_pom', label: 'POM [m]', type: 'temporal' },
    ],
  },
}

yarn test webapp/App/Views/Data/Charts
const expectedSchema = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  spec: {
    mark: {
      type: 'bar',
    },
    encoding: {
      y: {
        field: {
          repeat: 'layer',
        },
        type: 'quantitative',
        aggregate: 'average',
        title: 'tree_dbh_tree_diameter_pom',
      },
      color: {
        datum: {
          repeat: 'layer',
        },
        title: 'tree_dbh_tree_diameter_pom',
      },
      xOffset: {
        datum: {
          repeat: 'layer',
        },
      },
      x: {
        field: 'tree_segment_label',
        type: 'nominal',
        impute: {
          value: 'NULL',
        },
      },
    },
  },
  config: {
    mark: {
      invalid: null,
    },
  },
  repeat: {
    layer: ['tree_dbh', 'tree_diameter_pom'],
  },
  transform: [
    {
      calculate: 'datum.tree_segment_label',
      as: 'tree_segment_label',
    },
  ],
}
describe('Test spec', () => {
  beforeAll(async () => {}, 10000)

  it(`test aggregation`, () => {
    const config = { type: 'bar' }
    const spec = configToSpec({ config, configItemsByPath: inputConfig })
    expect().toBe(expectedSchema)
  })
})
