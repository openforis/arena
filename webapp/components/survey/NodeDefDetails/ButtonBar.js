import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { NodeDefsActions } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'

import { NodeDefState, useActions } from './store'

const ButtonBar = (props) => {
  const { nodeDefState, setNodeDefState } = props

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const dirty = NodeDefState.isDirty(nodeDefState)

  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()
  const Actions = useActions({ nodeDefState, setNodeDefState })

  return (
    <div className="button-bar">
      <button
        type="button"
        className="btn btn-cancel"
        onClick={() =>
          dirty
            ? dispatch(
                DialogConfirmActions.showDialogConfirm({
                  key: 'common.cancelConfirm',
                  onOk: Actions.cancelNodeDefEdits(history),
                })
              )
            : dispatch(Actions.cancelNodeDefEdits(history))
        }
      >
        {i18n.t(dirty ? 'common.cancel' : 'common.back')}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => dispatch(Actions.saveNodeDefEdits())}
        aria-disabled={!dirty || StringUtils.isBlank(NodeDef.getName(nodeDef))}
      >
        <span className="icon icon-floppy-disk icon-left icon-12px" />
        {i18n.t('common.save')}
      </button>
      {!NodeDef.isRoot(nodeDef) && !NodeDef.isTemporary(nodeDef) && (
        <button
          type="button"
          className="btn btn-danger btn-delete"
          onClick={() => dispatch(NodeDefsActions.removeNodeDef(nodeDef, history))}
        >
          <span className="icon icon-bin2 icon-left icon-12px" />
          {i18n.t('common.delete')}
        </button>
      )}
    </div>
  )
}

ButtonBar.propTypes = {
  nodeDefState: PropTypes.object.isRequired,
  setNodeDefState: PropTypes.func.isRequired,
}

export default ButtonBar
