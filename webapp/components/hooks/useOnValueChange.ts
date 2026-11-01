import { useState } from 'react'

/**
 * Calls onChange during render when the value changes (not on mount): it adjusts the state of the calling
 * component without the extra commit an effect would cause.
 *
 * @param value - The value to watch.
 * @param onChange - Called with the new value; it must only update the state of the calling component.
 */
export const useOnValueChange = <T>(value: T, onChange: (value: T) => void): void => {
  const [valuePrev, setValuePrev] = useState(value)
  if (!Object.is(value, valuePrev)) {
    setValuePrev(value)
    onChange(value)
  }
}
