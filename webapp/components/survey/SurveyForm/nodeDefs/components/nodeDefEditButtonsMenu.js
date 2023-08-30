import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'

import { NodeDefsActions } from '@webapp/store/survey'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { Button, ButtonMenu } from '@webapp/components'
import { NodeDefEntitySelectorDialog } from './entitySelectorDialog'
import { useNavigate } from 'react-router'
import { useState } from 'react'

export const NodeDefEditButtonsMenu = (props) => {
  const { nodeDef } = props

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const lang = useSurveyPreferredLang()
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)

  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

  const openCloneDialog = useCallback(() => {
    setCloneDialogOpen(true)
  }, [])

  const closeCloneDialog = useCallback(() => {
    setCloneDialogOpen(false)
  }, [])

  const onCloneIntoEntityDefSelected = useCallback(
    (nodeDefParentUuid) => {
      closeCloneDialog()
      dispatch(NodeDefsActions.cloneNodeDefIntoEntityDef({ nodeDef, nodeDefParentUuid, navigate }))
    },
    [closeCloneDialog, dispatch, navigate, nodeDef]
  )

  const items = []
  if (NodeDef.isAttribute(nodeDef)) {
    items.push({
      key: 'node-clone',
      content: (
        <Button
          className="btn-s btn-transparent"
          onClick={openCloneDialog}
          onMouseDown={(e) => e.stopPropagation()}
          iconClassName="icon-copy"
          label="surveyForm.clone"
          labelParams={{ nodeDefLabel }}
        />
      ),
    })
  }
  if (!NodeDef.isRoot(nodeDef)) {
    items.push({
      key: 'node-delete',
      content: (
        <Button
          className="btn-s btn-transparent"
          onClick={() => dispatch(NodeDefsActions.removeNodeDef(nodeDef))}
          onMouseDown={(e) => e.stopPropagation()}
          iconClassName="icon-bin2 icon-12px"
          label="surveyForm.delete"
          labelParams={{ nodeDefLabel }}
        />
      ),
    })
  }

  if (items.length === 0) return null

  return (
    <>
      <ButtonMenu className="btn-transparent" iconClassName="icon-menu icon-16px" items={items} />
      {cloneDialogOpen && (
        <NodeDefEntitySelectorDialog
          nodeDef={nodeDef}
          onChange={onCloneIntoEntityDefSelected}
          onClose={closeCloneDialog}
        />
      )}
    </>
  )
}

NodeDefEditButtonsMenu.propTypes = {
  nodeDef: PropTypes.object.isRequired,
}
