import React from 'react'
import { useDispatch } from 'react-redux'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'

const NodeDeleteButton = ({ nodeDef, node, disabled = false, showConfirm = true, removeNode }) => {
  const dispatch = useDispatch()

  return (
    <button
      className="btn btn-s btn-transparent"
      style={{
        alignSelf: 'center',
        justifySelf: 'center',
      }}
      aria-disabled={disabled}
      onClick={() =>
        showConfirm
          ? dispatch(showDialogConfirm('surveyForm.confirmNodeDelete', {}, () => removeNode(nodeDef, node)))
          : removeNode(nodeDef, node)
      }
    >
      <span className="icon icon-bin icon-12px" />
    </button>
  )
}

export default NodeDeleteButton
