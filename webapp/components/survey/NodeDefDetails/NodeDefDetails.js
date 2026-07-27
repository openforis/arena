import './NodeDefDetails.scss'

import classNames from 'classnames'
import PropTypes from 'prop-types'
import { useMemo } from 'react'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { TestId } from '@webapp/utils/testId'

import { FormItem, Input } from '@webapp/components/form/Input'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import TabBar from '@webapp/components/tabBar'

import AdvancedProps from './AdvancedProps'
import AnalysisEntitySelector from './AnalysisEntitySelector'
import BasicProps from './BasicProps'
import ButtonBar from './ButtonBar'
import { MobileAppProps } from './MobileAppProps'
import ValidationsProps from './ValidationsProps'

import { useSurveyCycleKey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { NodeDefEditReadOnlyContext, State, useNodeDefDetails } from './store'

const NodeDefDetails = (props) => {
  const { nodeDefUuid = null, readOnly = false } = props

  const i18n = useI18n()

  const { state, Actions, editingFromDesigner } = useNodeDefDetails({ nodeDefUuid })

  const cycle = useSurveyCycleKey()
  const nodeDef = State.getNodeDef(state)
  const nodeDefNull = !nodeDef
  const nodeDefIsRoot = nodeDef && NodeDef.isRoot(nodeDef)
  const nodeDefType = nodeDef && NodeDef.getType(nodeDef)
  const canHaveMobileProps = NodeDef.canHaveMobileProps(cycle)(nodeDef)
  const tabs = useMemo(() => {
    if (nodeDefNull) return []
    const tabProps = { state, Actions, editingFromDesigner }
    const _tabs = [
      {
        label: 'nodeDefEdit.basic',
        component: BasicProps,
        id: TestId.nodeDefDetails.basic,
        props: tabProps,
      },
    ]
    if (!nodeDefIsRoot) {
      _tabs.push({
        label: 'nodeDefEdit.advanced',
        component: AdvancedProps,
        id: TestId.nodeDefDetails.advanced,
        props: tabProps,
      })
      if (canHaveMobileProps) {
        _tabs.push({
          label: 'nodeDefEdit.mobileApp',
          component: MobileAppProps,
          id: TestId.nodeDefDetails.mobile,
          props: tabProps,
        })
      }
      // a qualifier attribute is always system-managed and effectively read-only, so validation rules
      // make no sense for it; still show the tab if some are already defined, so they can be cleared
      if (
        NodeDefUIProps.getValidationsEnabledByType(nodeDefType) &&
        (!NodeDef.isQualifier(nodeDef) || NodeDef.hasValidationsDefined(nodeDef))
      ) {
        _tabs.push({
          label: 'nodeDefEdit.validations',
          component: ValidationsProps,
          id: TestId.nodeDefDetails.validations,
          props: tabProps,
        })
      }
    }
    return _tabs
  }, [Actions, canHaveMobileProps, editingFromDesigner, nodeDef, nodeDefIsRoot, nodeDefNull, nodeDefType, state])

  if (!nodeDef) return null

  const validation = State.getValidation(state)

  const className = classNames('node-def-edit', { 'full-screen': !nodeDefUuid, 'read-only': readOnly })

  return (
    <NodeDefEditReadOnlyContext.Provider value={readOnly}>
      <div className={className}>
        <div className="node-def-edit__container">
          <div className="node-def-edit__fields">
            {NodeDef.isAnalysis(nodeDef) && (
              <AnalysisEntitySelector
                onChange={(parentUuid) => Actions.setParentUuid({ state, parentUuid })}
                validation={Validation.getFieldValidation(NodeDef.keys.parentUuid)(validation)}
                nodeDef={nodeDef}
              />
            )}

            <FormItem label="common.name" className="node-def-edit__title">
              <Input
                id={TestId.nodeDefDetails.nodeDefName}
                autoFocus={!readOnly}
                value={NodeDef.getName(nodeDef)}
                validation={Validation.getFieldValidation(NodeDef.propKeys.name)(validation)}
                onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.name, value })}
                readOnly={readOnly || !NodeDef.canNameBeEdited(nodeDef)}
                textTransformFunction={StringUtils.normalizeName}
              />
              <div className="attribute-selector">
                {i18n.t(`surveyForm:addChildToTypes.${nodeDefType}`)} {NodeDefUIProps.getIconByType(nodeDefType)}
              </div>
            </FormItem>

            <TabBar
              showTabs={!NodeDef.isAnalysis(nodeDef) && !NodeDef.isRoot(nodeDef) && !NodeDef.isLayoutElement(nodeDef)}
              tabs={tabs}
            />
          </div>

          <ButtonBar state={state} Actions={Actions} readOnly={readOnly} />
        </div>
      </div>
    </NodeDefEditReadOnlyContext.Provider>
  )
}

NodeDefDetails.propTypes = {
  nodeDefUuid: PropTypes.string,
  readOnly: PropTypes.bool,
}

export default NodeDefDetails
