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
}

export default pie
