import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { NodeDefsActions } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import * as NodeDefState from './store/state'

const ButtonBar = (props) => {
  const { nodeDefState } = props

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const dirty = NodeDefState.isDirty(nodeDefState)

  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()

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
                  onOk: NodeDefsActions.cancelNodeDefEdits(history),
                })
              )
            : dispatch(NodeDefsActions.cancelNodeDefEdits(history))
        }
      >
        {i18n.t(dirty ? 'common.cancel' : 'common.back')}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => dispatch(NodeDefsActions.saveNodeDefEdits())}
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
}

export default ButtonBar
