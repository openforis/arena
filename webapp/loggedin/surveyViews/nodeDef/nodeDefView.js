import './nodeDefView.scss'

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { matchPath, useHistory, useLocation, useParams } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { useI18n, useOnUpdate, useSurvey, useSurveyCycleKey, useNodeDef } from '@webapp/commonComponents/hooks'
import TabBar from '@webapp/commonComponents/tabBar'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'
import {
  setNodeDefParentUuid,
  setNodeDefProp,
  putNodeDefLayoutProp,
  setNodeDefLayoutProp,
  cancelNodeDefEdits,
  saveNodeDefEdits,
  removeNodeDef,
} from '@webapp/survey/nodeDefs/actions'
import { navigateToChainsView } from '@webapp/loggedin/modules/analysis/chain/actions'
import * as NodeDefState from '@webapp/loggedin/surveyViews/nodeDef/nodeDefState'
import ValidationsProps from './advanced/validationsProps'
import AdvancedProps from './advanced/advancedProps'
import BasicProps from './basic/basicProps'

import { setNodeDefUuidForEdit } from './actions'

const _isNodeDefKeyEditDisabled = (survey, nodeDef) =>
  !nodeDef ||
  NodeDef.isRoot(nodeDef) ||
  NodeDef.isMultiple(nodeDef) ||
  (!NodeDef.isKey(nodeDef) &&
    Survey.getNodeDefKeys(Survey.getNodeDefParent(nodeDef)(survey))(survey).length >= NodeDef.maxKeyAttributes) ||
  NodeDef.isReadOnly(nodeDef)

const _isNodeDefMultipleEditDisabled = (survey, surveyCycleKey, nodeDef) =>
  !nodeDef ||
  NodeDef.isPublished(nodeDef) ||
  NodeDef.isKey(nodeDef) ||
  NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef) ||
  Survey.isNodeDefParentCode(nodeDef)(survey) ||
  NodeDef.isReadOnly(nodeDef) ||
  NodeDef.isAnalysis(nodeDef)

const NodeDefView = () => {
  const i18n = useI18n()
  const history = useHistory()
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const { nodeDefUuid } = useParams()

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()
  const nodeDef = useNodeDef()
  const validation = useSelector(NodeDefState.getValidation)
  const isDirty = useSelector(NodeDefState.isDirty)

  const nodeDefParent = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey)
  const nodeDefKeyEditDisabled = _isNodeDefKeyEditDisabled(survey, nodeDef)
  const nodeDefMultipleEditDisabled = _isNodeDefMultipleEditDisabled(survey, surveyCycleKey, nodeDef)

  const editingNodeDefFromDesigner = Boolean(
    matchPath(pathname, `${appModuleUri(designerModules.nodeDef)}:nodeDefUuid`)
  )

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      dispatch(setNodeDefUuidForEdit(nodeDefUuid))
    }
  }, [])

  useOnUpdate(() => {
    if (editingNodeDefFromDesigner) {
      history.goBack()
    } else {
      dispatch(navigateToChainsView(history))
    }
  }, [surveyCycleKey])

  return (
    nodeDef && (
      <>
        <div className="node-def-edit">
          <div className="node-def-edit__container">
            <TabBar
              showTabs={!NodeDef.isAnalysis(nodeDef)}
              tabs={[
                {
                  label: i18n.t('nodeDefEdit.basic'),
                  component: BasicProps,
                  props: {
                    nodeDef,
                    validation,
                    nodeDefKeyEditDisabled,
                    nodeDefMultipleEditDisabled,
                    editingNodeDefFromDesigner,
                    setNodeDefParentUuid: (...args) => dispatch(setNodeDefParentUuid(...args)),
                    setNodeDefProp: (...args) => dispatch(setNodeDefProp(...args)),
                    putNodeDefLayoutProp: (...args) => dispatch(putNodeDefLayoutProp(...args)),
                    setNodeDefLayoutProp: (...args) => dispatch(setNodeDefLayoutProp(...args)),
                  },
                },
                ...(NodeDef.isRoot(nodeDef)
                  ? []
                  : [
                      {
                        label: i18n.t('nodeDefEdit.advanced'),
                        component: AdvancedProps,
                        props: {
                          nodeDef,
                          validation,
                          nodeDefParent,
                          setNodeDefProp: (...args) => dispatch(setNodeDefProp(...args)),
                        },
                      },
                      {
                        label: i18n.t('nodeDefEdit.validations'),
                        component: ValidationsProps,
                        props: {
                          nodeDef,
                          validation,
                          nodeDefParent,
                          setNodeDefProp: (...args) => dispatch(setNodeDefProp(...args)),
                        },
                      },
                    ]),
              ]}
            />

            <div className="button-bar">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={() =>
                  isDirty
                    ? dispatch(showDialogConfirm('common.cancelConfirm', {}, cancelNodeDefEdits(history)))
                    : dispatch(cancelNodeDefEdits(history))
                }
              >
                {i18n.t(isDirty ? 'common.cancel' : 'common.back')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => dispatch(saveNodeDefEdits())}
                aria-disabled={!isDirty || StringUtils.isBlank(NodeDef.getName(nodeDef))}
              >
                <span className="icon icon-floppy-disk icon-left icon-12px" />
                {i18n.t('common.save')}
              </button>
              {!NodeDef.isRoot(nodeDef) && !NodeDef.isTemporary(nodeDef) && (
                <button
                  type="button"
                  className="btn btn-danger btn-delete"
                  onClick={() => dispatch(removeNodeDef(nodeDef, history))}
                >
                  <span className="icon icon-bin2 icon-left icon-12px" />
                  {i18n.t('common.delete')}
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  )
}

export default NodeDefView
