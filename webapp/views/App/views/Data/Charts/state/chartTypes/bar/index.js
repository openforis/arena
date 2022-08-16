import {
  TitleBlock,
  ShowTitleBlock,
  ShowLegendBlock,
  SwitchHorizontalBlock,
  LabelFontSizeBlock,
  AxisTitleBlock,
  MaxHeightBlock,
  GroupByBlock,
  MetricBlock,
} from '../../blocks'

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
          groupBy: GroupByBlock(),
          metric: MetricBlock(),
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
