import './NodeDefDetails.scss'

import React from 'react'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { DataTestId } from '@webapp/utils/dataTestId'

import TabBar from '@webapp/components/tabBar'
import { FormItem, Input } from '@webapp/components/form/Input'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import ButtonBar from './ButtonBar'
import ValidationsProps from './ValidationsProps'
import AdvancedProps from './AdvancedProps'
import BasicProps from './BasicProps'
import AnalysisEntitySelector from './AnalysisEntitySelector'

import { State, useNodeDefDetails } from './store'

const NodeDefDetails = () => {
  const i18n = useI18n()
  const survey = useSurvey()

  const { state, Actions, editingFromDesigner } = useNodeDefDetails()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const lang = useSurveyPreferredLang()

  const nodeDefType = NodeDef.getType(nodeDef)

  return nodeDef ? (
    <>
      <div className="node-def-edit">
        <div className="node-def-edit__container">
          {NodeDef.isAnalysis(nodeDef) && (
            <AnalysisEntitySelector
              onChange={(parentUuid) => Actions.setParentUuid({ state, parentUuid })}
              nodeDef={nodeDef}
            />
          )}

          <FormItem label={i18n.t('common.name')} className="node-def-edit__title">
            <Input
              id={DataTestId.nodeDefDetails.nodeDefName}
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
                id: DataTestId.nodeDefDetails.basic,
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
                      id: DataTestId.nodeDefDetails.advanced,
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
                            id: DataTestId.nodeDefDetails.validations,
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
