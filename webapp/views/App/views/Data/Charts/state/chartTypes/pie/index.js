import * as A from '@core/arena'

const pie = {
  selector: {
    title: 'Pie',
  },
  baseSpec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    layer: [
      {
        mark: { type: 'arc', innerRadius: 40, outerRadius: 60 },
      },
    ],
  },
  builderBlocks: {
    blocks: {
      query: {
        title: 'Query',
        subtitle: 'Here we config the query of the pie',
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

              const color = {
                field: transform.as,
                type: 'nominal',
                legend: {
                  titleFontSize: 8,
                  labelFontSize: 5,
                },

                impute: {
                  value: 'NULL',
                },
              }

              const newSpec = {
                ...spec,
                transform: [transform],
                encoding: {
                  ...(spec.encoding || {}),
                  color,
                },
              }

              return newSpec
            },
          },

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
          metric: {
            id: 'metric',
            title: 'Metric',
            subtitle: 'Select the measurement to group the data',
            type: 'metric',
            labelBuilder: (values) => {
              const aggregation = values.aggregation.map(({ label }) => label)
              const column = values.column.map(({ label }) => label)

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
                  { value: 'avg', label: 'Avg', name: 'avg', type: 'aggregation' },
                ],
                optionsParams: { showIcons: false },
              },
            },
            order: ['column', 'aggregation'],
            valuesToSpec: ({ value = [], spec = {} }) => {
              /*
                if (!dimension) {
                  const newSpec = {
                    ...spec,
                  }
                  delete newSpec.encoding.theta
                  onUpdateSpec(A.stringify(newSpec))
                  return
                }

                const { name, type } = dimension
                const { aggregateOp = 'sum' } = params

                const newSpec = {
                  ...spec,
                  encoding: {
                    ...(spec.encoding || {}),
                    theta: {
                      field: name,
                      type,
                      aggregate: aggregateOp,
                      impute: {
                        value: 'NULL',
                      },
                      stack: true,
                    },
                  },
                }
                onUpdateSpec(A.stringify(newSpec))
                */
              return spec
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

export default pie
