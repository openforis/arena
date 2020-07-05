import './nodeDefView.scss'

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { matchPath, useHistory, useLocation, useParams } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'
import { analysisModules, appModuleUri, designerModules } from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'
import { NodeDefsActions, useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'

import { useOnUpdate } from '@webapp/components/hooks'
import TabBar from '@webapp/components/tabBar'
import { FormItem, Input } from '@webapp/components/form/input'
import * as NodeDefUiProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

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
  const nodeDef = useSelector(NodeDefState.getNodeDef)
  const validation = useSelector(NodeDefState.getValidation)
  const isDirty = useSelector(NodeDefState.isDirty)

  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)
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
      history.push(appModuleUri(analysisModules.processingChains))
    }
  }, [surveyCycleKey])

  return (
    nodeDef && (
      <>
        <div className="node-def-edit">
          <div className="node-def-edit__container">
            <FormItem label={i18n.t('common.name')} className="node-def-edit__title">
              <Input
                value={NodeDef.getName(nodeDef)}
                validation={Validation.getFieldValidation(NodeDef.propKeys.name)(validation)}
                onChange={(value) =>
                  dispatch(NodeDefsActions.setNodeDefProp(NodeDef.propKeys.name, StringUtils.normalizeName(value)))
                }
              />
              <div className="attribute-selector">
                {nodeDefType} {NodeDefUiProps.getIconByType(nodeDefType)}
              </div>
            </FormItem>

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
                    setNodeDefParentUuid: (...args) => dispatch(NodeDefsActions.setNodeDefParentUuid(...args)),
                    setNodeDefProp: (...args) => dispatch(NodeDefsActions.setNodeDefProp(...args)),
                    putNodeDefLayoutProp: (...args) => dispatch(NodeDefsActions.putNodeDefLayoutProp(...args)),
                    setNodeDefLayoutProp: (...args) => dispatch(NodeDefsActions.setNodeDefLayoutProp(...args)),
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
                          setNodeDefProp: (...args) => dispatch(NodeDefsActions.setNodeDefProp(...args)),
                        },
                      },
                      {
                        label: i18n.t('nodeDefEdit.validations'),
                        component: ValidationsProps,
                        props: {
                          nodeDef,
                          validation,
                          nodeDefParent,
                          setNodeDefProp: (...args) => dispatch(NodeDefsActions.setNodeDefProp(...args)),
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
                    ? dispatch(
                        DialogConfirmActions.showDialogConfirm({
                          key: 'common.cancelConfirm',
                          onOk: NodeDefsActions.cancelNodeDefEdits(history),
                        })
                      )
                    : dispatch(NodeDefsActions.cancelNodeDefEdits(history))
                }
              >
                {i18n.t(isDirty ? 'common.cancel' : 'common.back')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => dispatch(NodeDefsActions.saveNodeDefEdits())}
                aria-disabled={!isDirty || StringUtils.isBlank(nodeDefName)}
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
          </div>
        </div>
      </>
    )
  )
}

export default NodeDefView
