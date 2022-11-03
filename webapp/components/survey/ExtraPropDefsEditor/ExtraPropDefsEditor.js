import './ExtraPropDefsEditor.scss'

import React from 'react'
import { ButtonAdd, PanelRight } from '@webapp/components'

import { ExtraPropDefEditor } from './ExtraPropDefEditor'
import { useExtraPropDefsEditor } from './useExtraPropDefsEditor'

export const ExtraPropDefsEditor = (props) => {
  const { toggleEditExtraPropsPanel } = props
  const { i18n, extraPropDefs, readOnly, onItemAdd, onItemDelete, onItemUpdate } = useExtraPropDefsEditor(props)

  return (
    <PanelRight
      className="extra-prop-defs-editor"
      header={i18n.t('extraProp.label', { count: 2 })}
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
            readOnly={readOnly}
            onItemDelete={onItemDelete}
            onItemUpdate={onItemUpdate}
          />
        ))}
      </div>
      <ButtonAdd
        className="item-add-btn"
        disabled={readOnly || extraPropDefs.some((item) => item.newItem)}
        onClick={onItemAdd}
      />
    </PanelRight>
  )
}
