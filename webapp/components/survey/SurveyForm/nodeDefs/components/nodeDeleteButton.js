import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { DialogConfirmActions } from '@webapp/store/ui'

import { RecordActions } from '@webapp/store/ui/record'

const NodeDeleteButton = (props) => {
  const { nodeDef, node, disabled, showConfirm, removeNode } = props

  const dispatch = useDispatch()

  return (
    <button
      type="button"
      className="btn btn-s btn-transparent"
      style={{
        alignSelf: 'center',
        justifySelf: 'center',
      }}
      aria-disabled={disabled}
      onClick={() => {
        const performDelete = () => dispatch(RecordActions.removeNode(nodeDef, node))
        if (showConfirm) {
          dispatch(
            DialogConfirmActions.showDialogConfirm({
              key: 'surveyForm.confirmNodeDelete',
              onOk: removeNode || performDelete,
            })
          )
        } else {
          ;(removeNode || performDelete)?.()
        }
      }}
    >
      <span className="icon icon-bin icon-12px" />
    </button>
  )
}

NodeDeleteButton.propTypes = {
  nodeDef: PropTypes.any.isRequired,
  node: PropTypes.any.isRequired,
  disabled: PropTypes.bool,
  showConfirm: PropTypes.bool,
  removeNode: PropTypes.func,
}

NodeDeleteButton.defaultProps = {
  disabled: false,
  showConfirm: true,
  removeNode: null,
}

export default NodeDeleteButton
