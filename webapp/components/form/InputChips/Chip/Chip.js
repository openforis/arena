import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

const extractValueFromFunctionOrProp = (item, func, prop, defaultProp) =>
  R.is(Object, item)
    ? func
      ? func(item)
      : prop
      ? R.prop(prop)(item)
      : R.has(defaultProp)(item)
      ? R.prop(defaultProp)(item)
      : item
    : item // Primitive

const getItemLabel = (item, itemLabelFunction, itemLabelProp) =>
  extractValueFromFunctionOrProp(item, itemLabelFunction, itemLabelProp, 'value')

const Chip = (props) => {
  const { item, itemLabelFunction, itemLabelProp, onDelete, canBeRemoved, readOnly } = props

  return (
    <div className="form-input">
      <div className="form-input-chip-item">
        {getItemLabel(item, itemLabelFunction, itemLabelProp)}

        {!readOnly && (
          <button
            type="button"
            className="btn btn-s btn-remove"
            onClick={() => onDelete(item)}
            aria-disabled={!canBeRemoved}
          >
            <span className="icon icon-cross icon-8px" />
          </button>
        )}
      </div>
    </div>
  )
}

Chip.propTypes = {
  item: [],

  itemLabelFunction: null,
  itemLabelProp: 'value',

  readOnly: false,

  onDelete: null,
  canBeRemoved: null,
}

Chip.defaultProps = {
  item: PropTypes.any,
  itemLabelFunction: PropTypes.any,
  itemLabelProp: PropTypes.any,
  readOnly: PropTypes.any,

  onDelete: PropTypes.any,
  canBeRemoved: PropTypes.any,
}

export default Chip
