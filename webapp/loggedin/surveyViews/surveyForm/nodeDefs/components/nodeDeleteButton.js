import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

const NodeDeleteButton = ({ nodeDef, node, disabled = false, showConfirm = true, removeNode }) => {
  const i18n = useI18n()

  return (
    <button
      className="btn btn-s btn-transparent"
      style={{
        alignSelf: 'center',
        justifySelf: 'center',
      }}
      aria-disabled={disabled}
      onClick={() => {
        if (!showConfirm || confirm(i18n.t('surveyForm.confirmNodeDelete'))) {
          removeNode(nodeDef, node)
        }
      }}
    >
      <span className="icon icon-bin icon-12px" />
    </button>
  )
}

export default NodeDeleteButton
