import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { Button } from '@webapp/components/buttons'
import { NodeDefsActions, useSurveyCycleKey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { State } from './store'

const ButtonBar = (props) => {
  const { state, Actions } = props

  const nodeDef = State.getNodeDef(state)
  const dirty = State.isDirty(state)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cycle = useSurveyCycleKey()

  const previousDefUuid = Actions.getSiblingNodeDefUuid({ state, offset: -1 })
  const nextDefUuid = Actions.getSiblingNodeDefUuid({ state, offset: 1 })

  const saveDisabled = !dirty || StringUtils.isBlank(NodeDef.getName(nodeDef))

  const canNavigateNodeDefs =
    !NodeDef.isRoot(nodeDef) &&
    !NodeDef.isTemporary(nodeDef) &&
    !NodeDef.isAnalysis(nodeDef) &&
    !(NodeDef.isEntity(nodeDef) && NodeDefLayout.isDisplayInOwnPage(cycle)(nodeDef))

  return (
    <div className="button-bar">
      {canNavigateNodeDefs && (
        <Button
          className="btn-previous"
          testId={TestId.nodeDefDetails.previousBtn}
          onClick={() => Actions.goToNodeDef({ state, offset: -1 })}
          iconClassName="icon-arrow-left2"
          title="common.previous"
          disabled={!previousDefUuid}
        />
      )}
      <Button
        className="btn-cancel"
        testId={TestId.nodeDefDetails.backBtn}
        onClick={() => Actions.cancelEdits({ state })}
        label={dirty ? 'common.cancel' : 'common.back'}
      />
      <Button
        className="btn-primary"
        testId={TestId.nodeDefDetails.saveAndBackBtn}
        onClick={() => Actions.saveEdits({ state, goBackOnEnd: true })}
        disabled={saveDisabled}
        iconClassName="icon-floppy-disk icon-12px"
        label="common.saveAndBack"
      />
      <Button
        className="btn-primary"
        testId={TestId.nodeDefDetails.saveBtn}
        onClick={() => Actions.saveEdits({ state })}
        disabled={saveDisabled}
        iconClassName="icon-floppy-disk icon-12px"
        label="common.save"
      />
      {canNavigateNodeDefs && (
        <Button
          className="btn-next"
          testId={TestId.nodeDefDetails.nextBtn}
          onClick={() => Actions.goToNodeDef({ state, offset: 1 })}
          iconClassName="icon-arrow-right2"
          title="common.next"
          disabled={!nextDefUuid}
        />
      )}
      {!NodeDef.isRoot(nodeDef) && !NodeDef.isTemporary(nodeDef) && (
        <Button
          testId={TestId.nodeDefDetails.deleteBtn}
          className="btn-danger btn-delete"
          onClick={() => dispatch(NodeDefsActions.removeNodeDef(nodeDef, navigate))}
          iconClassName="icon-bin2 icon-12px"
          label="common.delete"
        />
      )}
    </div>
  )
}

ButtonBar.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonBar
