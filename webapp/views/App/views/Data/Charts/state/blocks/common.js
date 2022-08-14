export const blockTypes = {
  input: 'input',
  checkbox: 'checkbox',
  slider: 'slider',
  select: 'select',
  metric: 'metric',
}

export const valuesToCalculations = (values = []) => {
  const datumValues = values.map((val) => `datum.${val.value}`)
  return {
    calculate: `${datumValues.join("+','+")}`,
    as: `${values.map((val) => val.name).join('_')}`,
  }
}
