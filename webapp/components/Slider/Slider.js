import React from 'react'
import PropTypes from 'prop-types'

export const Slider = (props) => {
  const { className, id, max, min, name, onChange, options, step, value } = props

  const listId = options ? `${id}-dl` : null

  return (
    <>
      <input
        id="map-layer-slider"
        value={value}
        onChange={onChange}
        className={className}
        type="range"
        step={step}
        min={min}
        max={max}
        name={name}
        list={listId}
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
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string,
    })
  ),
  step: PropTypes.number,
  value: PropTypes.number,
}

Slider.defaultProps = {
  options: null,
}
