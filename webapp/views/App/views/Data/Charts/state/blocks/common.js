export const blockTypes = {
  input: 'input',
  checkbox: 'checkbox',
  slider: 'slider',
  select: 'select',
  metric: 'metric',
}

export const valuesToCalculations = (values = [], join = '_') => {
  const datumValues = values.map((val) => `datum.${val.value}`)
  return {
    calculate: `${datumValues.join("+','+")}`,
    as: `${values.map((val) => val.name).join(join)}`,
    key: `${values.map((val) => val.source_uuid).join(join)}`,
  }
}

export const valuesToSpec =
  (field) =>
  ({ value = [], spec = {} }) => {
    const newSpec = {
      ...spec,
      chart: {
        ...spec.chart,
        [field]: value,
      },
    }
    return newSpec
  }

export const sliderBlock = (id, title, defaultVal) => ({
  id,
  title,
  subtitle: '',
  type: 'slider',
  params: { min: 0, max: 80, step: 1, default: defaultVal, unit: 'px' },
  valuesToSpec: valuesToSpec(id),
})
