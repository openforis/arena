import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { Button, ButtonDelete } from '@webapp/components/buttons'
import { NodeDefsActions, useSurveyCycleKey } from '@webapp/store/survey'
import { useIsEditingNodeDefInFullScreen, useTreeSelectViewMode } from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

import { State } from './store'
import { TreeSelectViewMode } from '@webapp/model'

const ButtonBar = (props) => {
  const { state, Actions } = props

  const nodeDef = State.getNodeDef(state)
  const dirty = State.isDirty(state)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cycle = useSurveyCycleKey()
  const editingNodeDefInFullScreen = useIsEditingNodeDefInFullScreen()
  const treeSelectViewMode = useTreeSelectViewMode()
  const viewModeAllNodeDefs = treeSelectViewMode === TreeSelectViewMode.allNodeDefs

  const previousDefUuid = Actions.getSiblingNodeDefUuid({ state, offset: -1 })
  const nextDefUuid = Actions.getSiblingNodeDefUuid({ state, offset: 1 })

  const saveDisabled = !dirty || StringUtils.isBlank(NodeDef.getName(nodeDef))

  const canNavigateNodeDefs =
    (!NodeDef.isRoot(nodeDef) || viewModeAllNodeDefs) &&
    !NodeDef.isTemporary(nodeDef) &&
    !NodeDef.isAnalysis(nodeDef) &&
    (!(NodeDef.isEntity(nodeDef) && NodeDefLayout.isDisplayInOwnPage(cycle)(nodeDef)) || viewModeAllNodeDefs)

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
      {editingNodeDefInFullScreen && (
        <>
          <Button
            className="btn-cancel"
            testId={TestId.nodeDefDetails.backBtn}
            onClick={() => Actions.cancelEdits({ state })}
            label={dirty ? 'common.cancel' : 'common.back'}
            variant={dirty ? 'outlined' : 'contained'}
          />
          <Button
            className="btn-primary"
            testId={TestId.nodeDefDetails.saveAndBackBtn}
            onClick={() => Actions.saveEdits({ state, goBackOnEnd: true })}
            disabled={saveDisabled}
            iconClassName="icon-floppy-disk icon-12px"
            label="common.saveAndBack"
          />
        </>
      )}
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
        <ButtonDelete
          testId={TestId.nodeDefDetails.deleteBtn}
          onClick={() => dispatch(NodeDefsActions.removeNodeDef(nodeDef, navigate))}
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
