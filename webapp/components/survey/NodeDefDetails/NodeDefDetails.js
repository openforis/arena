import './NodeDefDetails.scss'

import React from 'react'
import { useDispatch } from 'react-redux'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { NodeDefsActions } from '@webapp/store/survey'

import TabBar from '@webapp/components/tabBar'
import { FormItem, Input } from '@webapp/components/form/input'
import * as NodeDefUiProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

import { useNodeDef } from './hooks'
import * as NodeDefState from './store/state'
import ButtonBar from './ButtonBar'
import ValidationsProps from './advanced/ValidationsProps'
import AdvancedProps from './advanced/AdvancedProps'
import BasicProps from './basic/BasicProps'

const NodeDefDetails = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  const { nodeDefState, editingFromDesigner, nodeDefParent, keyEditDisabled, multipleEditDisabled } = useNodeDef()

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)

  const nodeDefType = NodeDef.getType(nodeDef)

  return nodeDef ? (
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
                  nodeDefKeyEditDisabled: keyEditDisabled,
                  nodeDefMultipleEditDisabled: multipleEditDisabled,
                  editingNodeDefFromDesigner: editingFromDesigner,
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

          <ButtonBar nodeDefState={nodeDefState} />
        </div>
      </div>
    </>
  ) : null
}

export default NodeDefDetails
