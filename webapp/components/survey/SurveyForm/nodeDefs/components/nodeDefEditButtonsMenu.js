import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { NodeDefsActions, useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { Button, ButtonDelete, ButtonMenu } from '@webapp/components'

import { NodeDefEntitySelectorDialog } from './nodeDefEntitySelectorDialog'
import { NodeDefConversionDialog } from './nodeDefConversionDialog'

const actionsWithEntitySelection = { clone: 'clone', move: 'move' }

const iconByAction = {
  [actionsWithEntitySelection.clone]: 'icon-copy',
  [actionsWithEntitySelection.move]: 'icon-arrow-up-right2',
}

const isEntityVisibleByAction = {
  [actionsWithEntitySelection.move]: ({ cycle, entityDef, nodeDef }) =>
    NodeDef.isAttribute(nodeDef) ||
    (!NodeDef.isEqual(nodeDef)(entityDef) &&
      !NodeDef.isDescendantOf(nodeDef)(entityDef) &&
      !NodeDefLayout.isRenderTable(cycle)(entityDef)),
}

const isEntitySelectableByAction = {
  [actionsWithEntitySelection.clone]: () => true,
  [actionsWithEntitySelection.move]: ({ entityDefUuid, nodeDef }) =>
    entityDefUuid !== NodeDef.getUuid(nodeDef) && entityDefUuid !== NodeDef.getParentUuid(nodeDef),
}

const availabilityByAction = {
  [actionsWithEntitySelection.clone]: ({ nodeDef }) => NodeDef.isAttribute(nodeDef),
  [actionsWithEntitySelection.move]: ({ survey, cycle, nodeDef }) => {
    if (NodeDef.isPublished(nodeDef)) return false

    const availableEntityDefs = []
    Survey.visitDescendantsAndSelf({
      cycle,
      visitorFn: (visitedNodeDef) => {
        const visitedNodeDefUuid = NodeDef.getUuid(visitedNodeDef)
        if (
          NodeDef.isEntity(visitedNodeDef) &&
          isEntityVisibleByAction[actionsWithEntitySelection.move]({ cycle, entityDef: visitedNodeDef, nodeDef }) &&
          isEntitySelectableByAction[actionsWithEntitySelection.move]({ entityDefUuid: visitedNodeDefUuid, nodeDef })
        ) {
          availableEntityDefs.push(visitedNodeDef)
        }
      },
    })(survey)
    return availableEntityDefs.length > 0
  },
}

export const NodeDefEditButtonsMenu = (props) => {
  const { nodeDef } = props

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const [state, setState] = useState({ action: null, entitySelectDialogOpen: false, conversionDialogOpen: false })

  const { entitySelectDialogOpen, conversionDialogOpen, action } = state

  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

  const openEntitySelectDialog = useCallback(
    (action) => () => {
      setState((statePrev) => ({ ...statePrev, entitySelectDialogOpen: true, action }))
    },
    []
  )

  const closeEntitySelectDialog = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, entitySelectDialogOpen: false, action: null }))
  }, [])

  const openConvertIntoDialog = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, conversionDialogOpen: true }))
  }, [])

  const closeConversionDialog = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, conversionDialogOpen: false }))
  }, [])

  const entitySelectConfirmByAction = useMemo(
    () => ({
      [actionsWithEntitySelection.clone]: ({ entityDefUuid }) =>
        dispatch(NodeDefsActions.cloneNodeDefIntoEntityDef({ nodeDef, nodeDefParentUuid: entityDefUuid, navigate })),
      [actionsWithEntitySelection.move]: ({ entityDefUuid }) =>
        dispatch(
          NodeDefsActions.moveNodeDef({
            nodeDefUuid: NodeDef.getUuid(nodeDef),
            targetParentNodeDefUuid: entityDefUuid,
            navigate,
          })
        ),
    }),
    [dispatch, navigate, nodeDef]
  )

  const onEntitySelectConfirm = useCallback(
    (entityDefUuid) => {
      closeEntitySelectDialog()
      entitySelectConfirmByAction[action]({ entityDefUuid })
    },
    [action, closeEntitySelectDialog, entitySelectConfirmByAction]
  )

  const menuItems = useMemo(() => {
    const _menuItems = []
    // items with entity selection (clone or move actions)
    const availableActions = Object.keys(actionsWithEntitySelection).filter((action) =>
      availabilityByAction[action]({ survey, cycle, nodeDef })
    )
    _menuItems.push(
      ...availableActions.map((action) => ({
        key: `node-${action}`,
        content: (
          <Button
            iconClassName={iconByAction[action]}
            label={`surveyForm:${action}`}
            labelParams={{ nodeDefLabel }}
            onClick={openEntitySelectDialog(action)}
            onMouseDown={(e) => e.stopPropagation()}
            size="small"
            variant="text"
          />
        ),
      }))
    )
    // convert action (only for attributes)
    if (NodeDef.isAttribute(nodeDef) && !NodeDef.isPublished(nodeDef)) {
      _menuItems.push({
        key: 'node-convert',
        content: (
          <Button
            iconClassName="icon-loop2 icon-12px"
            label="surveyForm:convert"
            labelParams={{ nodeDefLabel }}
            onClick={openConvertIntoDialog}
            onMouseDown={(e) => e.stopPropagation()}
            size="small"
            variant="text"
          />
        ),
      })
    }
    // delete action
    if (!NodeDef.isRoot(nodeDef)) {
      _menuItems.push({
        key: 'node-delete',
        content: (
          <ButtonDelete
            label="surveyForm:delete"
            labelParams={{ nodeDefLabel }}
            onClick={() => dispatch(NodeDefsActions.removeNodeDef(nodeDef))}
            onMouseDown={(e) => e.stopPropagation()}
            size="small"
          />
        ),
      })
    }
    return _menuItems
  }, [cycle, dispatch, nodeDef, nodeDefLabel, openConvertIntoDialog, openEntitySelectDialog, survey])

  if (menuItems.length === 0) return null

  return (
    <>
      <ButtonMenu className="btn-transparent" iconClassName="icon-menu icon-16px" items={menuItems} />
      {entitySelectDialogOpen && (
        <NodeDefEntitySelectorDialog
          filterFn={(entityDef) => isEntityVisibleByAction[action]({ cycle, entityDef, nodeDef })}
          isEntitySelectable={(entityDefUuid) => isEntitySelectableByAction[action]({ entityDefUuid, nodeDef })}
          confirmButtonLabel={`nodeDefEdit.${action}Dialog.confirmButtonLabel`}
          currentNodeDef={nodeDef}
          entitySelectLabel={`nodeDefEdit.${action}Dialog.entitySelectLabel`}
          onConfirm={onEntitySelectConfirm}
          onClose={closeEntitySelectDialog}
          title={`nodeDefEdit.${action}Dialog.title`}
        />
      )}
      {conversionDialogOpen && <NodeDefConversionDialog nodeDef={nodeDef} onClose={closeConversionDialog} />}
    </>
  )
}

NodeDefEditButtonsMenu.propTypes = { nodeDef: PropTypes.object.isRequired }
