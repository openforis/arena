import './NodeDefDetails.scss'

import React from 'react'
import { useDispatch } from 'react-redux'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'

import TabBar from '@webapp/components/tabBar'
import { FormItem, Input } from '@webapp/components/form/input'
import * as NodeDefUiProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

import { NodeDefState, useNodeDef, useActions } from './store'
import ButtonBar from './ButtonBar'
import ValidationsProps from './ValidationsProps'
import AdvancedProps from './AdvancedProps'
import BasicProps from './BasicProps'

const NodeDefDetails = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  const {
    nodeDefState,
    setNodeDefState,
    editingFromDesigner,
    nodeDefParent,
    keyEditDisabled,
    multipleEditDisabled,
  } = useNodeDef()

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)

  const nodeDefType = NodeDef.getType(nodeDef)

  const Actions = useActions({ nodeDefState, setNodeDefState })

  return nodeDef ? (
    <>
      <div className="node-def-edit">
        <div className="node-def-edit__container">
          <FormItem label={i18n.t('common.name')} className="node-def-edit__title">
            <Input
              value={NodeDef.getName(nodeDef)}
              validation={Validation.getFieldValidation(NodeDef.propKeys.name)(validation)}
              onChange={(value) =>
                dispatch(Actions.setNodeDefProp(NodeDef.propKeys.name, StringUtils.normalizeName(value)))
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
                  nodeDefState,
                  setNodeDefState,
                  keyEditDisabled,
                  multipleEditDisabled,
                  editingFromDesigner,
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
                        setNodeDefProp: (...args) => dispatch(Actions.setNodeDefProp(...args)),
                      },
                    },
                    {
                      label: i18n.t('nodeDefEdit.validations'),
                      component: ValidationsProps,
                      props: {
                        nodeDef,
                        validation,
                        nodeDefParent,
                        setNodeDefProp: (...args) => dispatch(Actions.setNodeDefProp(...args)),
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
