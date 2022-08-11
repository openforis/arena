import { TitleBlock, ShowTitleBlock } from '../../blocks'

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
                    ...(spec.spec?.encoding || {}),
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
                  { value: 'count', label: 'Count', name: 'count', type: 'aggregation' },
                  { value: 'variance', label: 'Variance', name: 'variance', type: 'aggregation' },
                  { value: 'median', label: 'Median', name: 'median', type: 'aggregation' },
                  { value: 'min', label: 'Min', name: 'min', type: 'aggregation' },
                  { value: 'max', label: 'Max', name: 'max', type: 'aggregation' },
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

              const metrics = columnValues?.map((val) => val.value)
              const transform = {
                calculate: `${columnValues?.map((val) => `datum.${val.value}`).join("+','+")}`,
                as: `${columnValues.map((val) => val.name).join('_')}`,
              }

              // TODO: Improve the way out of the aggregation
              const ag = aggregationValues?.[0]?.value

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
          'show-title': ShowTitleBlock(),
          title: TitleBlock(),
          legend: {
            id: 'legend',
            title: 'Show Legend',
            subtitle: '',
            label: 'show legend',
            type: 'checkbox',
            defaultValue: true,
            valuesToSpec: ({ value = [], spec = {} }) => {
              let legend = true
              if (!value) {
                legend = null
              }

              const newSpec = {
                ...spec,
                spec: {
                  ...(spec.spec || {}),
                  encoding: {
                    ...(spec.spec?.encoding || {}),
                    color: {
                      ...(spec.spec?.encoding?.color || {}),
                      legend: legend,
                    },
                  },
                },
              }
              return newSpec
            },
          },
          labelFontSize: {
            id: 'labelFontSize',
            title: 'labelFontSize',
            subtitle: '',
            type: 'slider',
            params: { min: 1, max: 25, default: 11, step: 1, unit: 'px' },
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                spec: {
                  ...(spec.spec || {}),
                  encoding: {
                    ...(spec.spec?.encoding || {}),
                    y: {
                      ...spec.spec?.encoding?.y,
                      axis: {
                        labelFontSize: value,
                      },
                    },
                    x: {
                      ...spec.spec?.encoding?.x,
                      axis: {
                        labelFontSize: value,
                      },
                    },
                  },
                },
              }

              return newSpec
            },
          },
          xTitle: {
            id: 'xTitle',
            title: 'X axis Title',
            subtitle: 'write the x axis title',
            type: 'input',
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                spec: {
                  ...(spec.spec || {}),
                  encoding: {
                    ...(spec.spec?.encoding || {}),
                    x: {
                      ...spec.spec?.encoding?.x,
                      title: value,
                    },
                  },
                },
              }
              return newSpec
            },
          },
          yTitle: {
            id: 'yTitle',
            title: 'Y axis Title',
            subtitle: 'write the y axis title',
            type: 'input',
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                spec: {
                  ...(spec.spec || {}),
                  encoding: {
                    ...(spec.spec?.encoding || {}),
                    y: {
                      ...spec.spec?.encoding?.y,
                      title: value,
                    },
                  },
                },
              }
              return newSpec
            },
          },
          maxHeight: {
            id: 'maxHeight',
            title: 'Max Height of the bars',
            subtitle: 'clip the bars to the number input',
            type: 'input',
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                spec: {
                  ...(spec.spec || {}),
                  mark: {
                    ...(spec.spec?.mark || {}),
                    clip: true,
                  },
                  encoding: {
                    ...(spec.spec?.encoding || {}),
                    y: {
                      ...spec.spec?.encoding?.y,
                      scale: { domainMax: value },
                    },
                  },
                },
              }
              return newSpec
            },
          },
          stack: {
            id: 'stack',
            title: 'Stack bars',
            subtitle: '',
            label: 'stack bars',
            type: 'checkbox',
            defaultValue: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              if (value) {
                const newSpec = {
                  ...spec,
                  spec: {
                    ...(spec.spec || {}),
                    encoding: {
                      ...(spec.spec?.encoding || {}),
                      y: {
                        ...(spec.spec?.encoding?.y || {}),
                        stack: 'normalize',
                      },
                      xOffset: null,
                    },
                  },
                }
                return newSpec
              }
              return spec
            },
          },
          switchHorizontal: {
            id: 'horizontal',
            title: 'Make chart Horizontal',
            subtitle: '',
            label: 'make horizontal',
            type: 'checkbox',
            defaultValue: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              if (value) {
                const newSpec = {
                  ...spec,
                  spec: {
                    ...(spec.spec || {}),
                    encoding: {
                      ...(spec.spec?.encoding || {}),
                      y: spec.spec?.encoding?.x,
                      x: spec.spec?.encoding?.y,
                      yOffset: spec.spec?.encoding?.xOffset,
                      xOffset: null,
                    },
                  },
                }
                return newSpec
              }
              return spec
            },
          },
        },

        order: [
          'show-title',
          'title',
          'legend',
          'labelFontSize',
          'xTitle',
          'yTitle',
          'maxHeight',
          'stack',
          'switchHorizontal',
        ],
      },
    },
    order: ['query', 'other'],
  },
}

export default bar
