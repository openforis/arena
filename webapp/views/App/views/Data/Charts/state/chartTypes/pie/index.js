const pie = {
  selector: {
    title: 'Pie',
  },
  baseSpec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    layer: [
      {
        mark: { type: 'arc', innerRadius: 40, outerRadius: 80 },
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
                  { value: 'average', label: 'Avgerage', name: 'avg', type: 'aggregation' },
                  { value: 'count', label: 'Count', name: 'count', type: 'aggregation' },
                  { value: 'variance', label: 'Variance', name: 'variance', type: 'aggregation' },
                  { value: 'median', label: 'Median', name: 'median', type: 'aggregation' },
                  { value: 'min', label: 'Minimum', name: 'min', type: 'aggregation' },
                  { value: 'max', label: 'Maximum', name: 'max', type: 'aggregation' },
                ],
                optionsParams: { showIcons: false },
              },
            },
            order: ['column', 'aggregation'],
            valuesToSpec: ({ value = [], spec = {}, key, configItemsByPath }) => {
              const columnValues = configItemsByPath[`${key}.column`]?.value
              const aggregationValues = configItemsByPath[`${key}.aggregation`]?.value

              const transform = {
                calculate: `${columnValues?.map((val) => `datum.${val.value}`).join("+','+")}`,
                as: `${columnValues?.map((val) => val.name).join('_')}`,
              }

              // TODO: Improve the way out of the aggregation
              const ag = aggregationValues?.[0]?.value

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
        title: 'Custom Chart',
        subtitle: 'Custom configuration of the chart',
        type: 'container',
        blocks: {
          'show-title': {
            id: 'show-title',
            title: 'Show title',
            subtitle: '',
            label: 'show title',
            type: 'checkbox',
            defaultValue: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              return spec
            },
          },
          title: {
            id: 'title',
            title: 'Chart Title',
            subtitle: 'write the chart title',
            hideIf: [['other.show-title', false]],
            type: 'input',
            valuesToSpec: ({ value = [], spec = {}, configItemsByPath }) => {
              console.log('title value', configItemsByPath?.['other.show-title']?.value)
              console.log('conf', configItemsByPath)
              if (configItemsByPath?.['other.show-title']?.value) {
                const newSpec = {
                  ...spec,
                  title: value,
                }
                return newSpec
              }
              return spec
            },
          },
          legend: {
            id: 'legend',
            title: 'Show Legend',
            subtitle: '',
            label: 'show legend',
            type: 'checkbox',
            defaultValue: true,
            valuesToSpec: ({ value = [], spec = {} }) => {
              let legend = {
                titleFontSize: 8,
                labelFontSize: 5,
              }

              if (!value) {
                legend = false
              }

              const newSpec = {
                ...spec,
                encoding: {
                  ...(spec.encoding || {}),
                  color: {
                    ...(spec.encoding?.color || {}),
                    legend: legend,
                  },
                },
              }
              return newSpec
            },
          },
          'donut-radio': {
            id: 'donut-radio',
            title: 'Radio',
            subtitle: '',
            type: 'slider',
            params: { min: 0, max: 80, step: 1, default: 40, unit: 'px' },
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                layer: [
                  {
                    mark: {
                      ...(spec.layer[0].mark || {}),
                      innerRadius: value,
                    },
                  },
                ],
              }
              return newSpec
            },
          },
        },
        order: ['show-title', 'title', 'legend', 'donut-radio'],
      },
    },
    order: ['query', 'other'],
  },
}

export default pie
