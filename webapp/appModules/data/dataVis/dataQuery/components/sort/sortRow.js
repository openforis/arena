import './sortEditor.scss'

import React from 'react'

import Dropdown from '../../../../../../commonComponents/form/dropdown'

const SortRow = (props) => {
  const {
    variables,
    selectedVariable,
    onSelectVariable,
    selectedOrder,
    onSelectOrder,
    onDelete,
    isPlaceholder,
    isFirst,
  } = props

  return (
    <div className="sort-row">
      <div className={'sort-row__label'}>
        { isFirst ? 'Order by:' : 'Then by:' }
      </div>

      <Dropdown
        items={variables}
        selection={selectedVariable}
        itemLabelProp="label"
        itemKeyProp="value"
        inputSize={25}
        onChange={item => onSelectVariable(item)} />

      {
        !isPlaceholder &&
        <div className="sort-row__buttons">
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
        </div>
      }
    </div>
  )
}

export default SortRow