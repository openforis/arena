import './nodeDefView.scss'

import React, { useEffect } from 'react'
import { connect, useDispatch } from 'react-redux'
import { matchPath, useHistory, useLocation, useParams } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { useI18n, useOnUpdate } from '@webapp/commonComponents/hooks'
import TabBar from '@webapp/commonComponents/tabBar'

import ValidationsProps from './advanced/validationsProps'
import AdvancedProps from './advanced/advancedProps'
import BasicProps from './basic/basicProps'

import * as SurveyState from '@webapp/survey/surveyState'
import * as NodeDefState from './nodeDefState'

import {
  setNodeDefParentUuid,
  setNodeDefProp,
  putNodeDefLayoutProp,
  setNodeDefLayoutProp,
  cancelNodeDefEdits,
  saveNodeDefEdits,
  removeNodeDef,
} from '@webapp/survey/nodeDefs/actions'
import { setNodeDefUuidForEdit } from './actions'
import { navigateToProcessingChainsView } from '@webapp/loggedin/modules/analysis/processingChain/actions'
import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'

const NodeDefView = (props) => {
  const {
    surveyCycleKey,
    nodeDef,
    nodeDefParent,
    validation,
    isDirty,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
    setNodeDefParentUuid,
    setNodeDefProp,
    putNodeDefLayoutProp,
    setNodeDefLayoutProp,
    setNodeDefUuidForEdit,
    cancelNodeDefEdits,
    saveNodeDefEdits,
    removeNodeDef,
    navigateToProcessingChainsView,
  } = props

  const i18n = useI18n()
  const history = useHistory()
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const { nodeDefUuid } = useParams()

  const editingNodeDefFromDesigner = Boolean(
    matchPath(pathname, appModuleUri(designerModules.nodeDef) + ':nodeDefUuid')
  )

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      setNodeDefUuidForEdit(nodeDefUuid)
    }
  }, [])

  useOnUpdate(() => {
    if (editingNodeDefFromDesigner) {
      history.goBack()
    } else {
      navigateToProcessingChainsView(history)
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
                    setNodeDefParentUuid,
                    setNodeDefProp,
                    putNodeDefLayoutProp,
                    setNodeDefLayoutProp,
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
                          setNodeDefProp,
                        },
                      },
                      {
                        label: i18n.t('nodeDefEdit.validations'),
                        component: ValidationsProps,
                        props: {
                          nodeDef,
                          validation,
                          nodeDefParent,
                          setNodeDefProp,
                        },
                      },
                    ]),
              ]}
            />

            <div className="button-bar">
              <button
                className="btn btn-cancel"
                onClick={() =>
                  isDirty
                    ? dispatch(showDialogConfirm('common.cancelConfirm', {}, () => cancelNodeDefEdits(history)))
                    : cancelNodeDefEdits(history)
                }
              >
                {i18n.t(isDirty ? 'common.cancel' : 'common.back')}
              </button>
              <button
                className="btn btn-primary"
                onClick={saveNodeDefEdits}
                aria-disabled={!isDirty || StringUtils.isBlank(NodeDef.getName(nodeDef))}
              >
                <span className="icon icon-floppy-disk icon-left icon-12px" />
                {i18n.t('common.save')}
              </button>
              {!NodeDef.isRoot(nodeDef) && !NodeDef.isTemporary(nodeDef) && (
                <button className="btn btn-danger btn-delete" onClick={() => removeNodeDef(nodeDef, history)}>
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

NodeDefView.defaultProps = {
  nodeDef: null,
  nodeDefParent: null,
}

const isNodeDefKeyEditDisabled = (survey, nodeDef) =>
  !nodeDef ||
  NodeDef.isRoot(nodeDef) ||
  NodeDef.isMultiple(nodeDef) ||
  (!NodeDef.isKey(nodeDef) &&
    Survey.getNodeDefKeys(Survey.getNodeDefParent(nodeDef)(survey))(survey).length >= NodeDef.maxKeyAttributes) ||
  NodeDef.isReadOnly(nodeDef)

const isNodeDefMultipleEditDisabled = (survey, surveyCycleKey, nodeDef) =>
  !nodeDef ||
  NodeDef.isPublished(nodeDef) ||
  NodeDef.isKey(nodeDef) ||
  NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef) ||
  Survey.isNodeDefParentCode(nodeDef)(survey) ||
  NodeDef.isReadOnly(nodeDef) ||
  NodeDef.isAnalysis(nodeDef)

const mapStateToProps = (state) => {
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const nodeDef = NodeDefState.getNodeDef(state)
  const nodeDefParent = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey)
  const validation = NodeDefState.getValidation(state)
  const isDirty = NodeDefState.isDirty(state)

  const nodeDefKeyEditDisabled = isNodeDefKeyEditDisabled(survey, nodeDef)
  const nodeDefMultipleEditDisabled = isNodeDefMultipleEditDisabled(survey, surveyCycleKey, nodeDef)

  return {
    surveyCycleKey,
    nodeDef,
    nodeDefParent,
    validation,
    isDirty,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
  }
}

export default connect(mapStateToProps, {
  setNodeDefParentUuid,
  setNodeDefProp,
  putNodeDefLayoutProp,
  setNodeDefLayoutProp,
  setNodeDefUuidForEdit,
  cancelNodeDefEdits,
  saveNodeDefEdits,
  removeNodeDef,
  navigateToProcessingChainsView,
})(NodeDefView)
