export const integer = () => ({
  decimalScale: 0,
  maxLength: 16,
})

export const decimal = ({ decimalScale = 2 } = {}) => ({
  ...(Number.isNaN(decimalScale) ? {} : { decimalScale }),
  decimalSeparator: '.',
  maxLength: 16,
})

const _limit = ({ value, max, min = '00' }) => {
  let valueUpdated = value
  if (value.length === 1 && value[0] > max[0]) {
    valueUpdated = `0${value}`
  }

  if (valueUpdated.length === 2) {
    if (Number(valueUpdated) === 0) {
      return min
    }
    if (valueUpdated > max) {
      // this can happen when user pastes a number
      return max
    }
  }

  return valueUpdated
}

const _dateFormat = (value) => {
  const date = _limit({ value: value.substring(0, 2), max: '31', min: '01' })
  const month = _limit({ value: value.substring(2, 4), max: '12', min: '01' })
  const year = value.substring(4, 8)

  const parts = [date]
  if (month.length) {
    parts.push(month)
  }
  if (year.length) {
    parts.push(year)
  }
  return parts.join('/')
}

const _timeFormat = (value) => {
  const hour = _limit({ value: value.substring(0, 2), max: '23' })
  const minute = _limit({ value: value.substring(2, 4), max: '59' })

  const parts = [hour]
  if (minute.length) {
    parts.push(minute)
  }
  return parts.join(':')
}

export const date = () => ({
  format: _dateFormat,
  placeholder: 'DD/MM/YYYY',
})

export const time = () => ({
  format: _timeFormat,
  placeholder: 'HH:MM',
})
