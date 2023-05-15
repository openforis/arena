import './ExtraPropDefsEditor.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Category from '@core/survey/category'

import { ButtonAdd, PanelRight } from '@webapp/components'

import { ExtraPropDefEditor } from './ExtraPropDefEditor'
import { useExtraPropDefsEditor } from './useExtraPropDefsEditor'

export const ExtraPropDefsEditor = (props) => {
  const { category, onExtraPropDefDelete, onExtraPropDefUpdate, toggleEditExtraPropsPanel, canAdd = true } = props

  const { i18n, extraPropDefs, readOnly, onItemAdd, onItemDelete, onItemUpdate } = useExtraPropDefsEditor({
    category,
    onExtraPropDefDelete,
    onExtraPropDefUpdate,
  })

  return (
    <PanelRight
      className="extra-prop-defs-editor"
      header={i18n.t('extraProp.label_plural')}
      width="52rem"
      onClose={toggleEditExtraPropsPanel}
    >
      <div className="items-container">
        {extraPropDefs.map((extraPropDef, index) => (
          <ExtraPropDefEditor
            key={extraPropDef.uuid}
            extraPropDef={extraPropDef}
            extraPropDefs={extraPropDefs}
            index={index}
            readOnly={readOnly || Category.isExtraPropDefReadOnly(extraPropDef)(category)}
            onItemDelete={onItemDelete}
            onItemUpdate={onItemUpdate}
          />
        ))}
      </div>
      {canAdd && (
        <ButtonAdd
          className="item-add-btn"
          disabled={readOnly || extraPropDefs.some((item) => item.newItem)}
          onClick={onItemAdd}
        />
      )}
    </PanelRight>
  )
}

ExtraPropDefsEditor.propTypes = {
  canAdd: PropTypes.bool,
  category: PropTypes.object.isRequired,
  onExtraPropDefDelete: PropTypes.func.isRequired,
  onExtraPropDefUpdate: PropTypes.func.isRequired,
  toggleEditExtraPropsPanel: PropTypes.func.isRequired,
}

ExtraPropDefsEditor.defaultProps = {
  canAdd: true,
}
