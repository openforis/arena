import './sortRow.css'

import React from 'react'

import Dropdown from '../../../../../../commonComponents/form/dropdown'

const SortRow = ({ variables, selectedVariable, onSelectVariable, selectedOrder, onSelectOrder, onDelete, isPlaceholder }) => (
  <div className="sort_row">
    <Dropdown items={variables}
              selection={selectedVariable}
              itemLabelProp="label" itemKeyProp="value"
              inputSize={25}
              onChange={item => onSelectVariable(item)} />

    {
      !isPlaceholder &&
      <React.Fragment>
        <button className={`btn btn-s btn-of-light btn-switch-operand${selectedOrder === 'asc' ? ' active' : ''}`}
                onClick={() => onSelectOrder('asc')}>
          Asc
        </button>
        <button className={`btn btn-s btn-of-light btn-switch-operand${selectedOrder === 'desc' ? ' active' : ''}`}
                onClick={() => onSelectOrder('desc')}>
          Desc
        </button>
        <button className="btn btn-s btn-of-light btn-delete btns__last"
                onClick={onDelete}
                aria-disabled={isPlaceholder}>
          <span className="icon icon-bin icon-10px" />
        </button>
      </React.Fragment>
    }
  </div>
)

export default SortRow