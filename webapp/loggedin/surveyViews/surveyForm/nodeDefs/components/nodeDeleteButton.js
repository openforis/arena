import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'
import { removeNode } from '@webapp/loggedin/surveyViews/record/actions'

const NodeDeleteButton = (props) => {
  const { nodeDef, node, disabled, showConfirm } = props

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
        const performDelete = () => dispatch(removeNode(nodeDef, node))
        if (showConfirm) {
          dispatch(showDialogConfirm('surveyForm.confirmNodeDelete', {}, performDelete))
        } else {
          performDelete()
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
}

NodeDeleteButton.defaultProps = {
  disabled: false,
  showConfirm: true,
}

export default NodeDeleteButton
