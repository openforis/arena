import './nodeDefView.scss'

import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { NodeDefsActions, useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'

import TabBar from '@webapp/components/tabBar'
import { FormItem, Input } from '@webapp/components/form/input'
import * as NodeDefUiProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

import ValidationsProps from './advanced/validationsProps'
import AdvancedProps from './advanced/advancedProps'
import BasicProps from './basic/basicProps'

import { useNodeDefState } from './store/useNodeDefState'
import { useActions } from './store/actions/index'
import * as NodeDefState from './store/nodeDefState'

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

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()
  const { nodeDefState, setNodeDefState, editingNodeDefFromDesigner } = useNodeDefState()
  const { setNodeDefProp, cancelNodeDefEdits } = useActions({ nodeDefState, setNodeDefState })

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)
  const isDirty = NodeDefState.isDirty(nodeDefState)

  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)
  const nodeDefParent = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey)
  const nodeDefKeyEditDisabled = _isNodeDefKeyEditDisabled(survey, nodeDef)
  const nodeDefMultipleEditDisabled = _isNodeDefMultipleEditDisabled(survey, surveyCycleKey, nodeDef)

  return (
    nodeDef && (
      <>
        <div className="node-def-edit">
          <div className="node-def-edit__container">
            <FormItem label={i18n.t('common.name')} className="node-def-edit__title">
              <Input
                value={NodeDef.getName(nodeDef)}
                validation={Validation.getFieldValidation(NodeDef.propKeys.name)(validation)}
                onChange={(value) => dispatch(setNodeDefProp(NodeDef.propKeys.name, StringUtils.normalizeName(value)))}
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
                    nodeDefState,
                    setNodeDefState,
                    nodeDefKeyEditDisabled,
                    nodeDefMultipleEditDisabled,
                    editingNodeDefFromDesigner,
                  },
                },
                ...(NodeDef.isRoot(nodeDef)
                  ? []
                  : [
                      {
                        label: i18n.t('nodeDefEdit.advanced'),
                        component: AdvancedProps,
                        props: {
                          nodeDefState,
                          setNodeDefState,
                          nodeDefParent,
                        },
                      },
                      {
                        label: i18n.t('nodeDefEdit.validations'),
                        component: ValidationsProps,
                        props: {
                          nodeDefState,
                          setNodeDefState,
                          nodeDefParent,
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
                          onOk: cancelNodeDefEdits(history),
                        })
                      )
                    : dispatch(cancelNodeDefEdits(history))
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
