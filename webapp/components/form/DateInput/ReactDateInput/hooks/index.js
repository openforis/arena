import { useState, useEffect, useRef } from 'react'

import { extractInfoFromDate, validatorsByKey } from '../utils'

export const useUpdateEffect = (effect, dependencies = []) => {
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
    } else {
      effect()
    }
  }, dependencies)
}

export const handleChangeInput = ({ dateKey, setValue, setError, onChange, date, format, separator, itemIndex }) => (
  e
) => {
  const { value } = e.target
  const { isValid, newValue } = validatorsByKey[dateKey]({
    date,
    format,
    separator,
    value,
  })
  setError(false)

  if (isValid && (newValue || newValue === '')) {
    onChange({ [dateKey]: newValue, itemIndex })
    setValue(newValue)
  } else {
    setError(true)
  }
}

export const useInput = ({
  labels,
  placeholders,
  dateKey,
  date,
  onChange,
  format,
  separator,
  isFocused,
  itemIndex,
}) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const handleChange = handleChangeInput({
    dateKey,
    setValue,
    setError,
    onChange,
    date,
    format,
    separator,
    itemIndex,
  })

  useUpdateEffect(() => {
    const dateInfo = extractInfoFromDate({
      date,
      separator,
      format,
    })
    const _value = dateInfo[dateKey]

    if (parseInt(_value, 10) !== parseInt(value, 10) || isFocused || _value !== value) {
      setValue(_value)
    }
  }, [date])

  useEffect(() => {
    const dateInfo = extractInfoFromDate({
      date,
      separator,
      format,
    })
    const _value = dateInfo[dateKey]
    setValue(_value)
  }, [])

  return {
    label: labels[dateKey],
    placeholder: placeholders[dateKey],
    handleChange,
    value,
    error,
    shouldManageZero: dateKey !== 'year',
  }
}
