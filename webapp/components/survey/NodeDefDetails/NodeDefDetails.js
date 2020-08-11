import './NodeDefDetails.scss'

import React from 'react'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'

import TabBar from '@webapp/components/tabBar'
import { FormItem, Input } from '@webapp/components/form/input'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import ButtonBar from './ButtonBar'
import ValidationsProps from './ValidationsProps'
import AdvancedProps from './AdvancedProps'
import BasicProps from './BasicProps'

import { State, useNodeDefDetails } from './store'

const NodeDefDetails = () => {
  const i18n = useI18n()

  const { state, Actions, editingFromDesigner } = useNodeDefDetails()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)

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
                Actions.setProp({ state, key: NodeDef.propKeys.name, value: StringUtils.normalizeName(value) })
              }
            />
            <div className="attribute-selector">
              {nodeDefType} {NodeDefUIProps.getIconByType(nodeDefType)}
            </div>
          </FormItem>

          <TabBar
            showTabs={!NodeDef.isAnalysis(nodeDef)}
            tabs={[
              {
                label: i18n.t('nodeDefEdit.basic'),
                component: BasicProps,
                props: {
                  state,
                  Actions,
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
                        state,
                        Actions,
                      },
                    },

                    ...(NodeDefUIProps.getValidationsEnabledByType(nodeDefType)
                      ? [
                          {
                            label: i18n.t('nodeDefEdit.validations'),
                            component: ValidationsProps,
                            props: {
                              state,
                              Actions,
                            },
                          },
                        ]
                      : []),
                  ]),
            ]}
          />

          <ButtonBar state={state} Actions={Actions} />
        </div>
      </div>
    </>
  ) : null
}

export default NodeDefDetails
