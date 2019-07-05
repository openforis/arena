import './sortEditor.scss'

import React from 'react'

import useI18n from '../../../../../../../commonComponents/useI18n'

import Dropdown from '../../../../../../../commonComponents/form/dropdown'

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

  const i18n = useI18n()

  return (
    <div className="sort-row">
      <div className={'sort-row__label'}>
        {isFirst ? i18n.t('data.dataVis.dataSort.orderBy') : i18n.t('data.dataVis.dataSort.thenBy') }
      </div>

      <Dropdown
        items={variables}
        selection={selectedVariable}
        itemLabelProp="label"
        itemKeyProp="value"
        onChange={item => onSelectVariable(item)} />

      {
        !isPlaceholder &&
        <div className="sort-row__buttons">
          <button className={`btn btn-s btn-switch-operand${selectedOrder === 'asc' ? ' active' : ''}`}
                  onClick={() => onSelectOrder('asc')}>
            {i18n.t('data.dataVis.dataSort.ascending')}
          </button>
          <button className={`btn btn-s btn-switch-operand${selectedOrder === 'desc' ? ' active' : ''}`}
                  onClick={() => onSelectOrder('desc')}>
            {i18n.t('data.dataVis.dataSort.descending')}
          </button>
          <button className="btn btn-s btn-delete btns__last"
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