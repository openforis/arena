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

              const transform = {
                calculate: `${value['column'].map((val) => `datum.${val.value}`).join("+','+")}`,
                as: `${value['column'].map((val) => val.name).join('_')}`,
              }

              // TODO: Improve the way out of the aggregation
              const ag = value['aggregation'][0]['value']
              const theta = {
                field: transform.as,
                type: 'quantitative',
                aggregate: ag,
                impute: {
                  value: 'NULL',
                },
                stack: true,
              }

              const newSpec = {
                ...spec,
                encoding: {
                  ...(spec.encoding || {}),
                  theta: theta,
                },
              }
              return newSpec
            },
          },
        },
        order: ['groupBy', 'metric'],
      },
      other: {
        title: 'Chart Config',
        subtitle: 'Configuration of the chart',
        type: 'container',
        blocks: {
          legend: {
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
              let legend = {
                titleFontSize: 8,
                labelFontSize: 5,
              }

              if (val == 0) {
                legend = false
              }

              const newSpec = {
                ...spec,
                encoding: {
                  ...(spec.encoding || {}),
                  color: {
                    // TODO: Fix this to work even when no encoding is defined.
                    ...(spec.encoding.color || {}),
                    legend: legend,
                  },
                },
              }

              return newSpec
            },
          },
          donut: {
            id: 'donut',
            title: 'Inner Radius',
            subtitle: 'Select the inner radius value (From donut to pie)',
            type: 'select',
            options: [
              { value: 0, label: 0, name: 'inner_0' },
              { value: 20, label: 20, name: 'inner_20' },
              { value: 40, label: 40, name: 'inner_40' },
            ],
            optionsParams: { showIcons: false },
            isMulti: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              const val = value.map((val) => val.value)

              const newSpec = {
                ...spec,
                layer: [
                  {
                    mark: {
                      ...(spec.layer[0].mark || {}),
                      innerRadius: val[0],
                    },
                  },
                ],
              }
              return newSpec
            },
          },
        },
        order: ['legend', 'donut'],
      },
    },
    order: ['query', 'other'],
  },
}

export default pie
