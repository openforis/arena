const bar = {
  selector: {
    title: 'Bar',
  },
  baseSpec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    spec: {
      mark: { type: 'bar' },
    },
    config: {
      mark: {
        invalid: null,
      },
    },
  },
  builderBlocks: {
    blocks: {
      query: {
        title: 'Query',
        subtitle: 'Config of the query for the bar chart',
        type: 'container',
        blocks: {
          groupBy: {
            id: 'groupBy',
            title: 'Group by',
            subtitle: 'Select the dimension to group the data',
            type: 'select',
            optionsParams: { filter: ['nominal', 'temporal'] },
            isMulti: true,
            valuesToSpec: ({ value = [], spec = {} }) => {
              const transform = {
                calculate: `${value.map((val) => `datum.${val.value}`).join("+','+")}`,
                as: `${value.map((val) => val.name).join('_')}`,
              }

              const x = {
                field: transform.as,
                type: 'nominal',
                impute: {
                  value: 'NULL',
                },
              }

              const newSpec = {
                ...spec,
                transform: [transform],
                spec: {
                  ...(spec.spec || {}),
                  encoding: {
                    ...(spec.spec.encoding || {}),
                    x: x,
                  },
                },
              }

              return newSpec
            },
          },

          metric: {
            id: 'metric',
            title: 'Metric',
            subtitle: 'Select the measurement to group the data',
            type: 'metric',
            isMulti: false,
            labelBuilder: (values) => {
              const aggregation = values['query.metric.aggregation']['value'].map(({ label }) => label)
              const column = values['query.metric.column']['value'].map(({ label }) => label)

              return `${aggregation}(${column})`
            },
            blocks: {
              column: {
                id: 'column',
                title: 'Column',
                type: 'select',
              },
              aggregation: {
                id: 'aggregation',
                title: 'Aggregation',
                type: 'select',
                options: [
                  { value: 'sum', label: 'Sum', name: 'sum', type: 'aggregation' },
                  { value: 'average', label: 'Avg', name: 'avg', type: 'aggregation' },
                ],
                optionsParams: { showIcons: false },
              },
            },
            order: ['column', 'aggregation'],
            valuesToSpec: ({ value = [], spec = {} }) => {
              value = value[0]
              const metrics = value['column'].map((val) => val.value)
              const transform = {
                calculate: `${value['column'].map((val) => `datum.${val.value}`).join("+','+")}`,
                as: `${value['column'].map((val) => val.name).join('_')}`,
              }

              // TODO: Improve the way out of the aggregation
              const ag = value['aggregation'][0]['value']

              const repeat = {
                layer: metrics,
              }
              const y = {
                field: { repeat: 'layer' },
                type: 'quantitative',
                aggregate: ag,
                title: transform.as,
              }

              const color = {
                datum: {
                  repeat: 'layer',
                },
                title: transform.as,
              }

              const xOffset = {
                datum: {
                  repeat: 'layer',
                },
              }

              const newSpec = {
                ...spec,
                repeat: repeat,
                spec: {
                  ...(spec.spec || {}),
                  encoding: {
                    ...(spec.spec.encoding || {}),
                    y: y,
                    color: color,
                    xOffset: xOffset,
                  },
                },
              }

              return newSpec
            },
          },
        },
        order: ['groupBy', 'metric'],
      },
      other: {
        title: 'Other',
        subtitle: 'hello world',
        type: 'container',
        blocks: {
          size: {
            id: 'size',
            title: 'Size',
            subtitle: 'Select with local options',
            type: 'select',
            options: [
              { value: 1, label: 1, name: 'hello', type: 'nominal' },
              { value: 10, label: 100, name: 'hello', type: 'nominal' },
            ],
            optionsParams: { showIcons: false },
            isMulti: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              return spec
            },
          },
        },
        order: ['size'],
      },
    },
    order: ['query', 'other'],
  },
}

export default bar
