import { ShowTitleBlock, TitleBlock, ShowLegendBlock, GroupByBlock, MetricBlock } from '../../blocks'
import { valuesToCalculations } from '../../blocks/common'

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
          groupBy: GroupByBlock({
            valuesToSpec: ({ value = [], spec = {} }) => {
              const transform = valuesToCalculations(value)

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
          }),
          metric: MetricBlock({
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
          }),
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
          'show-legend': ShowLegendBlock({
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
          }),
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
        order: ['show-title', 'title', 'show-legend', 'donut-radio'],
      },
    },
    order: ['query', 'other'],
  },
}

export default pie
