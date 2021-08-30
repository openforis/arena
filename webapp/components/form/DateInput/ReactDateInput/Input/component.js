import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { KeyboardKeys } from '@webapp/utils/keyboardKeys'

import { useInput } from '../hooks'

const getValueToShow = ({ numericValue, value, isFocused, zeroTyped }) => {
  if (isFocused && zeroTyped && numericValue === 0) return '0'
  if (zeroTyped && /^0/.test(value) && !/^00/.test(value)) return value

  if (value !== '' && !Number.isNaN(numericValue) && numericValue > 0) {
    return String(isFocused && (/^00/.test(value) || numericValue > 10) ? numericValue : value)
  }

  return ''
}

const Input = React.forwardRef(
  (
    {
      disabled,
      placeholders,
      labels,

      date,
      format,
      separator,

      itemIndex,
      dateKey,

      onChange,
      moveBack,
      moveNext,

      shouldManageZero,

      onFocus,
      onBlur,

      showLabel,
    },
    ref
  ) => {
    const { value, label, placeholder, handleChange } = useInput({
      labels,
      placeholders,
      ref,
      date,
      onChange,
      format,
      separator,
      itemIndex,
      isfocused: ref && ref.current !== document.activeElement,
      dateKey,
    })

    const [nextBack, setNextBack] = useState(false)
    const [nextBackArrow, setNextBackArrow] = useState(false)
    const [nextForwardArrow, setNextForwardArrow] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const [zeroTyped, setZeroTyped] = useState(false)
    const numericValue = parseInt(value, 10)

    const handleFocus = () => {
      setZeroTyped(false)
      setIsFocused(true)
      ref.current.select(0, ref.current.value.length)
      onFocus()
    }

    const handleBlur = () => {
      setZeroTyped(false)
      setIsFocused(false)
      onBlur()
    }
    const handleKeyDown = (e) => {
      if (
        shouldManageZero &&
        e.key === '0' &&
        (e.target.value === '' ||
          (ref.current.selectionStart === 0 && ref.current.selectionEnd === e.target.value.length))
      ) {
        setZeroTyped(true)
      }

      if (zeroTyped) {
        if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
          // 1.2.3.... keys
          const nextValue = `${e.target.value}${e.key}`
          if (nextValue !== '' && nextValue.length <= 2) {
            moveNext({ itemIndex, [dateKey]: nextValue })
            e.stopPropagation()
            e.preventDefault()
          }
        } else if (e.key !== '0') {
          setZeroTyped(false)
        }
      }
    }

    const handleKeyUp = (e) => {
      if (e.key !== KeyboardKeys.Backspace) {
        // delete key
        setNextBack(false)
      }
      if (e.key === KeyboardKeys.Backspace && e.target.value === '') {
        if (nextBack) {
          setNextBack(false)
          moveBack({ itemIndex })
        } else {
          setNextBack(true)
        }
      }

      if (e.key !== KeyboardKeys.ArrowLeft) {
        // arrow key left
        setNextBackArrow(false)
      }

      if (
        e.key === KeyboardKeys.ArrowLeft && // arrow key left
        ref.current.selectionStart === ref.current.selectionEnd &&
        ref.current.selectionStart === 0
      ) {
        if (nextBackArrow) {
          setNextBackArrow(false)
          moveBack({ itemIndex })
        } else {
          setNextBackArrow(true)
        }
      }

      if (e.key !== KeyboardKeys.ArrowRight) {
        // arrow key right
        setNextForwardArrow(false)
      }

      if (
        e.key === KeyboardKeys.ArrowRight && // arrow key right
        ref.current.selectionStart === ref.current.selectionEnd &&
        ref.current.selectionStart === ref.current.value.length
      ) {
        if (nextForwardArrow) {
          setNextForwardArrow(false)
          moveNext({ itemIndex, [dateKey]: ref.current.value })
        } else {
          setNextForwardArrow(true)
        }
      }
    }

    return (
      <div className="input-container">
        {showLabel && (
          <div className="label-container">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="label">{label}</label>
          </div>
        )}
        <input
          ref={ref}
          className={` date-input input-${dateKey} ${value === '' ? 'empty' : ''}`}
          disabled={disabled}
          placeholder={placeholder}
          type="text"
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          value={getValueToShow({
            zeroTyped: shouldManageZero ? zeroTyped : !shouldManageZero,
            numericValue,
            value,
            ref,
            shouldManageZero,
            isFocused,
          })}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          pattern="\d*"
        />
      </div>
    )
  }
)

Input.propTypes = {
  disabled: PropTypes.bool,
  placeholders: PropTypes.object.isRequired,
  labels: PropTypes.object.isRequired,

  date: PropTypes.string,
  format: PropTypes.string.isRequired,
  separator: PropTypes.string.isRequired,

  itemIndex: PropTypes.number.isRequired,
  dateKey: PropTypes.string.isRequired,

  onChange: PropTypes.func,
  moveBack: PropTypes.func,
  moveNext: PropTypes.func,

  shouldManageZero: PropTypes.bool,

  onFocus: PropTypes.func,
  onBlur: PropTypes.func,

  showLabel: PropTypes.bool,
}

Input.defaultProps = {
  disabled: false,

  onChange: null,
  moveBack: null,
  moveNext: null,

  shouldManageZero: true,

  onFocus: null,
  onBlur: null,

  showLabel: false,
}

export default Input
