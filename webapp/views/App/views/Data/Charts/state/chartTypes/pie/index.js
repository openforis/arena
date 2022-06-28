import * as A from '@core/arena'

const pie = {
  selector: {
    title: 'Pie',
    onSelect:
      ({ spec, onUpdateSpec }) =>
      () => {
        const newSpec = {
          ...spec,
          layer: [
            {
              mark: {
                type: 'arc',
                innerRadius: 40,
                outerRadius: 60,
              },
            },
          ],
        }
        delete newSpec.encoding
        onUpdateSpec(A.stringify(newSpec))
      },
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
            type: 'input',
            onUpdateSpec:
              ({ spec, onUpdateSpec }) =>
              ({ dimension }) => {
                if (!dimension) {
                  const newSpec = {
                    ...spec,
                  }
                  delete newSpec.encoding.color
                  onUpdateSpec(A.stringify(newSpec))
                  return
                }

                const { name, type } = dimension

                const newSpec = {
                  ...spec,
                  encoding: {
                    ...(spec.encoding || {}),
                    color: {
                      field: name,
                      type,
                      legend: {
                        titleFontSize: 8,
                        labelFontSize: 5,
                      },

                      impute: {
                        value: 'NULL',
                      },
                    },
                  },
                }
                onUpdateSpec(A.stringify(newSpec))
              },
          },
          metric: {
            id: 'metric',
            title: 'Metric',
            subtitle: 'Select the measurement to group the data',
            type: 'input',
            onUpdateSpec:
              ({ spec, onUpdateSpec }) =>
              ({ dimension, aggregateOp = 'sum' }) => {
                if (!dimension) {
                  const newSpec = {
                    ...spec,
                  }
                  delete newSpec.encoding.theta
                  onUpdateSpec(A.stringify(newSpec))
                  return
                }

                const { name, type } = dimension

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
              },
          },
        },
        order: ['groupBy', 'metric'],
      },
    },
    order: ['query'],
  },
}

export default pie
