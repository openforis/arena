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
              console.log('metric', values)
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
                  { value: 'average', label: 'Avg', name: 'avg', type: 'aggregation' },
                ],
                optionsParams: { showIcons: false },
              },
            },
            order: ['column', 'aggregation'],
            valuesToSpec: ({ value = [], spec = {}, key, configItemsByPath }) => {
              /*
              {
                'item': {value: []},
                'item.column': {value: [{value:'a', type: 'sum'}, {value, type}]}
                'item.aggregation': {value: [{value, type}, {value, type}]}
              }*/
              // ====>
              /*{
                ...spec,
                
              }*/

              // const value =

              const columnValues = configItemsByPath[`${key}.column`]?.value
              const aggregationValues = configItemsByPath[`${key}.aggregation`]?.value
              console.log('columnValues', columnValues)

              // console.log('value', value)
              // value = value[0]

              const metrics = columnValues.map((val) => val.value)
              const transform = {
                calculate: `${columnValues.map((val) => `datum.${val.value}`).join("+','+")}`,
                as: `${columnValues.map((val) => val.name).join('_')}`,
              }

              // TODO: Improve the way out of the aggregation
              const ag = aggregationValues[0].value

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
                    ...(spec.spec?.encoding || {}),
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
        title: 'Custom Chart',
        subtitle: 'Custom configuration of the chart',
        type: 'container',
        blocks: {
          size: {
            id: 'legend',
            title: 'Show Legend',
            subtitle: 'Select wheter to show the Legend or not',
            type: 'select',
            options: [
              { value: 1, label: 'Yes', name: 'Yes', type: 'nominal' },
              { value: 0, label: 'No', name: 'No', type: 'nominal' },
            ],
            optionsParams: { showIcons: false },
            isMulti: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              const val = value.map((val) => val.value)
              let legend = true
              console.log('VALUES LEGEND', val)

              if (val == 0) {
                legend = null
              }

              console.log('LEGEND', legend)

              const newSpec = {
                ...spec,
                spec: {
                  ...(spec.spec || {}),
                  encoding: {
                    ...(spec.spec?.encoding || {}),
                    color: {
                      ...(spec.spec.encoding?.color || {}),
                      legend: legend,
                    },
                  },
                },
              }
              return newSpec
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
