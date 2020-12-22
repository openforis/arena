export const extractInfoFromDate = ({ date, separator, format }) => {
  const dateSplitted = (date || '').split(separator)

  const extractorByFormat = {
    MMDDYYYY: ['month', 'day', 'year'],
    DDMMYYYY: ['day', 'month', 'year'],
    YYYYMMDD: ['year', 'month', 'day'],
  }

  const extractor = extractorByFormat[format]

  const dateExtracted = extractor.reduce(
    (extracted, key, idx) => ({ ...extracted, [key]: dateSplitted[idx] || '' }),
    {}
  )

  return { ...dateExtracted }
}

const padValue = ({ value, valueFromDate, pad }) => {
  let _value = value

  if ((value || '').startsWith('0') && value.length > 2) {
    _value = parseInt(value, 10)
  }

  return String(_value || (_value === '' ? _value : valueFromDate || '')).padStart(pad, '0')
}

export const buildDate = ({ date, day, month, year, separator, format }) => {
  const { day: dayFromDate, month: monthFromDate, year: yearFromDate } = extractInfoFromDate({
    date,
    separator,
    format,
  })

  const _day = padValue({ value: day, valueFromDate: dayFromDate, pad: 2 })
  const _month = padValue({
    value: month,
    valueFromDate: monthFromDate,
    pad: 2,
  })
  const _year = padValue({ value: year, valueFromDate: yearFromDate, pad: 4 })

  const builderByFormat = {
    MMDDYYYY: [_month, _day, _year],
    DDMMYYYY: [_day, _month, _year],
    YYYYMMDD: [_year, _month, _day],
  }
  const builder = builderByFormat[format]

  return ''.concat(builder[0], separator).concat(builder[1], separator).concat(builder[2])
}
