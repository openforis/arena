const name = 'NAME'

const inputConfig = {
  'query.groupBy': {
    blockPath: 'query.groupBy',
    value: [{ value: 'tree_segment_label', label: 'tree_segment_label', name: 'tree_segment_label' }],
  },
  'query.metric': {
    blockPath: 'query.metric',
    value: [{ key: '4fb36dff-53d2-47d4-a8b7-81cd3ae5a49e' }],
  },
  'query.metric.aggregation': {
    blockPath: 'query.metric.aggregation',
    value: [
      {
        value: 'average',
        label: 'Avg',
        name: 'avg',
        type: 'aggregation',
        key: 'b75324b6-a771-464c-93e9-f584e29afbf2',
        parentKey: '4fb36dff-53d2-47d4-a8b7-81cd3ae5a49e',
      },
    ],
  },
  'query.metric.column': {
    blockPath: 'query.metric.column',
    value: [
      {
        name: 'tree_dbh',
        value: 'tree_dbh',
        label: 'Dbh [cm]',
        type: 'temporal',
        key: 'b75324b6-a771-464c-93e9-f584e29afbf2',
        parentKey: '4fb36dff-53d2-47d4-a8b7-81cd3ae5a49e',
      },
    ],
  },
}

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
        title: 'tree_dbh',
      },
      color: {
        datum: {
          repeat: 'layer',
        },
        title: 'tree_dbh',
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
    layer: ['tree_dbh'],
  },
  transform: [
    {
      calculate: 'datum.tree_segment_label',
      as: 'tree_segment_label',
    },
  ],
}

const config = [name, inputConfig, expectedSchema]
export default config
