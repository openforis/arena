import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { NodeDefsActions } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { State } from './store'

const ButtonBar = (props) => {
  const { state, Actions } = props

  const nodeDef = State.getNodeDef(state)
  const dirty = State.isDirty(state)

  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()

  return (
    <div className="button-bar">
      <button
        type="button"
        className="btn btn-cancel"
        data-testid={TestId.nodeDefDetails.backBtn}
        onClick={() => Actions.cancelEdits({ state })}
      >
        {i18n.t(dirty ? 'common.cancel' : 'common.back')}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        data-testid={TestId.nodeDefDetails.saveBtn}
        onClick={() => Actions.saveEdits({ state })}
        aria-disabled={!dirty || StringUtils.isBlank(NodeDef.getName(nodeDef))}
      >
        <span className="icon icon-floppy-disk icon-left icon-12px" />
        {i18n.t('common.save')}
      </button>
      {!NodeDef.isRoot(nodeDef) && !NodeDef.isTemporary(nodeDef) && (
        <button
          data-testid={TestId.nodeDefDetails.deleteBtn}
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
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonBar
