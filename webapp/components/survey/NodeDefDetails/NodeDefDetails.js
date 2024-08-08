import './NodeDefDetails.scss'

import React, { useMemo } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import TabBar from '@webapp/components/tabBar'
import { FormItem, Input } from '@webapp/components/form/Input'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import ButtonBar from './ButtonBar'
import ValidationsProps from './ValidationsProps'
import AdvancedProps from './AdvancedProps'
import BasicProps from './BasicProps'
import AnalysisEntitySelector from './AnalysisEntitySelector'

import { State, useNodeDefDetails } from './store'

const NodeDefDetails = (props) => {
  const { nodeDefUuid = null } = props

  const i18n = useI18n()

  const { state, Actions, editingFromDesigner } = useNodeDefDetails({ nodeDefUuid })

  const nodeDef = State.getNodeDef(state)
  const nodeDefNull = !nodeDef
  const nodeDefIsRoot = nodeDef && NodeDef.isRoot(nodeDef)
  const nodeDefType = nodeDef && NodeDef.getType(nodeDef)

  const tabs = useMemo(() => {
    if (nodeDefNull) return []
    const tabProps = { state, Actions, editingFromDesigner }
    const _tabs = [
      {
        label: i18n.t('nodeDefEdit.basic'),
        component: BasicProps,
        id: TestId.nodeDefDetails.basic,
        props: tabProps,
      },
    ]
    if (!nodeDefIsRoot) {
      _tabs.push({
        label: i18n.t('nodeDefEdit.advanced'),
        component: AdvancedProps,
        id: TestId.nodeDefDetails.advanced,
        props: tabProps,
      })
      if (NodeDefUIProps.getValidationsEnabledByType(nodeDefType)) {
        _tabs.push({
          label: i18n.t('nodeDefEdit.validations'),
          component: ValidationsProps,
          id: TestId.nodeDefDetails.validations,
          props: tabProps,
        })
      }
    }
    return _tabs
  }, [Actions, editingFromDesigner, i18n, nodeDefIsRoot, nodeDefNull, nodeDefType, state])

  if (!nodeDef) return null

  const validation = State.getValidation(state)

  const className = classNames('node-def-edit', { 'full-screen': !nodeDefUuid })

  return (
    <div className={className}>
      <div className="node-def-edit__container">
        {NodeDef.isAnalysis(nodeDef) && (
          <AnalysisEntitySelector
            onChange={(parentUuid) => Actions.setParentUuid({ state, parentUuid })}
            validation={Validation.getFieldValidation(NodeDef.keys.parentUuid)(validation)}
            nodeDef={nodeDef}
          />
        )}

        <FormItem label={i18n.t('common.name')} className="node-def-edit__title">
          <Input
            id={TestId.nodeDefDetails.nodeDefName}
            value={NodeDef.getName(nodeDef)}
            validation={Validation.getFieldValidation(NodeDef.propKeys.name)(validation)}
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.name, value })}
            readOnly={!NodeDef.canNameBeEdited(nodeDef)}
            textTransformFunction={StringUtils.normalizeName}
          />
          <div className="attribute-selector">
            {nodeDefType} {NodeDefUIProps.getIconByType(nodeDefType)}
          </div>
        </FormItem>

        <TabBar showTabs={!NodeDef.isAnalysis(nodeDef) && !NodeDef.isRoot(nodeDef)} tabs={tabs} />

        <ButtonBar state={state} Actions={Actions} />
      </div>
    </div>
  )
}

NodeDefDetails.propTypes = {
  nodeDefUuid: PropTypes.string,
}

export default NodeDefDetails
