import React from 'react'
import PropTypes from 'prop-types'

const Chip = (props) => {
  const { item, itemLabel, onDelete, canBeRemoved, readOnly } = props

  return (
    <div className="form-input">
      <div className="form-input-chip-item">
        {itemLabel}

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
  item: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  itemLabel: PropTypes.string,
  readOnly: PropTypes.bool,

  onDelete: PropTypes.func,
  canBeRemoved: PropTypes.bool,
}

Chip.defaultProps = {
  item: {},
  itemLabel: 'value',
  readOnly: false,
  canBeRemoved: false,
  onDelete: null,
}
export default Chip
