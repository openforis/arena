import './NodeDefDetails.scss'

import React from 'react'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'

import TabBar from '@webapp/components/tabBar'
import { FormItem, Input } from '@webapp/components/form/input'
import * as NodeDefUiProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

import { NodeDefState, useNodeDefDetails } from './store'
import ButtonBar from './ButtonBar'
import ValidationsProps from './ValidationsProps'
import AdvancedProps from './AdvancedProps'
import BasicProps from './BasicProps'

const NodeDefDetails = () => {
  const i18n = useI18n()

  const { nodeDefState, actions, editingFromDesigner } = useNodeDefDetails()

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
              onChange={(value) => actions.setProp(NodeDef.propKeys.name, StringUtils.normalizeName(value))}
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
                  actions,
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
                        nodeDefState,
                        actions,
                      },
                    },
                    {
                      label: i18n.t('nodeDefEdit.validations'),
                      component: ValidationsProps,
                      props: {
                        nodeDefState,
                        actions,
                      },
                    },
                  ]),
            ]}
          />

          <ButtonBar nodeDefState={nodeDefState} actions={actions} />
        </div>
      </div>
    </>
  ) : null
}

export default NodeDefDetails
