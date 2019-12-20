import './itemsView.scss'

import React from 'react'
import { useI18n } from '@webapp/commonComponents/hooks'
import ItemsTable from './itemsTable'

const ItemsView = props => {
  const { onClose } = props
  const i18n = useI18n()

  return (
    <div className="items">
      <ItemsTable {...props} />

      {onClose && (
        <div className="items__footer">
          <button className="btn" onClick={() => onClose()}>
            {i18n.t('common.close')}
          </button>
        </div>
      )}
    </div>
  )
}

export default ItemsView
