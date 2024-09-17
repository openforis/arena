import React from 'react'
import PropTypes from 'prop-types'

export const Slider = (props) => {
  const { className, id, max, min, name, onChange, onMouseDown, onMouseUp, options, step, value } = props

  const listId = options ? `${id}-dl` : null

  return (
    <>
      <input
        className={className}
        id="map-layer-slider"
        list={listId}
        min={min}
        max={max}
        name={name}
        onChange={onChange}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        step={step}
        type="range"
        value={value}
      />

      {options && (
        <datalist id={listId}>
          {options.map(({ value, label }) => (
            <option key={value} value={value} label={label} />
          ))}
        </datalist>
      )}
    </>
  )
}

Slider.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  max: PropTypes.number,
  min: PropTypes.number,
  name: PropTypes.string,
  onChange: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string,
    })
  ),
  step: PropTypes.number,
  value: PropTypes.number,
}
