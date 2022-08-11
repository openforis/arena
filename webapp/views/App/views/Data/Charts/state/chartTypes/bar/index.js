import {
  TitleBlock,
  ShowTitleBlock,
  ShowLegendBlock,
  SwitchHorizontalBlock,
  LabelFontSizeBlock,
  AxisTitleBlock,
  MaxHeightBlock,
} from '../../blocks'

const valuesToCalculations = (values = []) => {
  const datumValues = values.map((val) => `datum.${val.value}`)
  return {
    calculate: `${datumValues.join("+','+")}`,
    as: `${values.map((val) => val.name).join('_')}`,
  }
}

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
              const transform = valuesToCalculations(value)

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
              const metrics = columnValues.map((val) => val.value)
              const transform = valuesToCalculations(columnValues)

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
          'show-legend': ShowLegendBlock(),
          labelFontSize: LabelFontSizeBlock(),
          xTitle: AxisTitleBlock({ id: 'xTitle', axisKey: 'x' }),
          yTitle: AxisTitleBlock({ id: 'yTitle', axisKey: 'y' }),

          maxHeight: MaxHeightBlock(),
          stack: {
            id: 'stack',
            title: 'Stack bars',
            subtitle: '',
            label: 'stack bars',
            type: 'checkbox',
            defaultValue: false,
            valuesToSpec: ({ value = [], spec = {}, configItemsByPath }) => {
              const axisKey = configItemsByPath?.['other.switchHorizontal']?.value ? 'x' : 'y'
              if (value) {
                const newSpec = {
                  ...spec,
                  spec: {
                    ...(spec.spec || {}),
                    encoding: {
                      ...(spec.spec?.encoding || {}),
                      [axisKey]: {
                        ...(spec.spec?.encoding?.[axisKey] || {}),
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
          switchHorizontal: SwitchHorizontalBlock(),
        },

        order: [
          'show-title',
          'title',
          'show-legend',
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
