import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { DialogConfirmActions } from '@webapp/store/ui'

import { RecordActions } from '@webapp/store/ui/record'
import { ButtonIconDelete } from '@webapp/components/buttons'

const NodeDeleteButton = (props) => {
  const { nodeDef, node, disabled, showConfirm, removeNode } = props

  const dispatch = useDispatch()

  return (
    <ButtonIconDelete
      disabled={disabled}
      onClick={() => {
        const performDelete = () => dispatch(RecordActions.removeNode(nodeDef, node))
        const _removeNode = () => (removeNode ? removeNode(nodeDef, node) : null)
        const handleDelete = removeNode ? _removeNode : performDelete
        if (showConfirm) {
          dispatch(
            DialogConfirmActions.showDialogConfirm({
              key: 'surveyForm.confirmNodeDelete',
              onOk: handleDelete,
            })
          )
        } else {
          handleDelete()
        }
      }}
    />
  )
}

NodeDeleteButton.propTypes = {
  nodeDef: PropTypes.any.isRequired,
  node: PropTypes.any.isRequired,
  disabled: PropTypes.bool,
  removeNode: PropTypes.func,
  showConfirm: PropTypes.bool,
}

NodeDeleteButton.defaultProps = {
  disabled: false,
  showConfirm: true,
}

export default NodeDeleteButton
