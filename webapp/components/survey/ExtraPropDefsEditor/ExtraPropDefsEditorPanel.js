import React from 'react'
import PropTypes from 'prop-types'

import { PanelRight } from '@webapp/components'
import { useI18n } from '@webapp/store/system'

import { ExtraPropDefsEditor } from './ExtraPropDefsEditor'

export const ExtraPropDefsEditorPanel = (props) => {
  const {
    canAdd = true,
    extraPropDefs,
    isExtraPropDefReadOnly,
    onExtraPropDefDelete,
    onExtraPropDefUpdate,
    toggleEditExtraPropsPanel,
  } = props

  const i18n = useI18n()

  return (
    <PanelRight
      className="extra-prop-defs-editor-panel"
      header={i18n.t('extraProp.label_plural')}
      width="52rem"
      onClose={toggleEditExtraPropsPanel}
    >
      <ExtraPropDefsEditor
        canAdd={canAdd}
        extraPropDefs={extraPropDefs}
        isExtraPropDefReadOnly={isExtraPropDefReadOnly}
        onExtraPropDefDelete={onExtraPropDefDelete}
        onExtraPropDefUpdate={onExtraPropDefUpdate}
      />
    </PanelRight>
  )
}

ExtraPropDefsEditorPanel.propTypes = {
  ...ExtraPropDefsEditor.propTypes,
  toggleEditExtraPropsPanel: PropTypes.func.isRequired,
}
