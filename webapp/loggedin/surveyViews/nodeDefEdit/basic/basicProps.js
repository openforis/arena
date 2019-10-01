import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../common/survey/nodeDefLayout'
import Validation from '../../../../../common/validation/validation'

import { uuidv4 } from '../../../../../common/uuid'
import { normalizeName } from '../../../../../common/stringUtils'

import { useI18n } from '../../../../commonComponents/hooks'
import { FormItem, Input } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'
import LabelsEditor from '../../labelsEditor/labelsEditor'
import ButtonGroup from '../../../../commonComponents/form/buttonGroup'
import CodeProps from './codeProps'
import TaxonProps from './taxonProps'

import * as SurveyState from '../../../../survey/surveyState'
import * as NodeDefEditState from '../nodeDefEditState'

const BasicProps = props => {
  const {
    nodeDef, validation,
    nodeDefKeyEditDisabled, nodeDefMultipleEditDisabled,

    cyclesSurvey,
    displayAsEnabled, displayInEnabled,
    displayAsFormDisabled, displayAsTableDisabled,
    displayInParentPageDisabled, displayInOwnPageDisabled,

    putNodeDefProp,
    toggleTaxonomyEdit, toggleCategoryEdit
  } = props

  const i18n = useI18n()

  const onPropLabelsChange = (labelItem, key, currentValue) => {
    putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
  }

  const renderType = NodeDefLayout.getRenderType(nodeDef)
  const displayIn = NodeDefLayout.getDisplayIn(nodeDef)
  const cyclesNodeDef = NodeDef.getCycles(nodeDef)

  return (
    <div className="form">
      <FormItem label={i18n.t('common.type')}>
        <label>{nodeDef.type}</label>
      </FormItem>

      <FormItem label={i18n.t('common.name')}>
        <Input
          value={NodeDef.getName(nodeDef)}
          validation={Validation.getFieldValidation('name')(validation)}
          onChange={value => putNodeDefProp(nodeDef, 'name', normalizeName(value))}/>
      </FormItem>

      <LabelsEditor
        labels={NodeDef.getLabels(nodeDef)}
        onChange={(labelItem) => onPropLabelsChange(labelItem, 'labels', NodeDef.getLabels(nodeDef))}/>

      <LabelsEditor
        formLabelKey="common.description"
        labels={NodeDef.getDescriptions(nodeDef)}
        onChange={(labelItem) => onPropLabelsChange(labelItem, 'descriptions', NodeDef.getDescriptions(nodeDef))}/>

      {
        NodeDef.isCode(nodeDef) &&
        <CodeProps
          nodeDef={nodeDef}
          validation={validation}
          toggleCategoryEdit={toggleCategoryEdit}
          putNodeDefProp={putNodeDefProp}/>
      }

      {
        NodeDef.isTaxon(nodeDef) &&
        <TaxonProps
          nodeDef={nodeDef}
          validation={validation}
          toggleTaxonomyEdit={toggleTaxonomyEdit}
          putNodeDefProp={putNodeDefProp}/>
      }

      {
        NodeDef.canNodeDefBeKey(nodeDef) &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.key')}>
          <Checkbox
            checked={NodeDef.isKey(nodeDef)}
            disabled={nodeDefKeyEditDisabled}
            onChange={(checked) => putNodeDefProp(nodeDef, 'key', checked)}/>
        </FormItem>
      }

      {
        NodeDef.canNodeDefBeMultiple(nodeDef) &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.multiple')}>
          <Checkbox
            checked={NodeDef.isMultiple(nodeDef)}
            disabled={nodeDefMultipleEditDisabled}
            onChange={(checked) => putNodeDefProp(nodeDef, 'multiple', checked)}/>
        </FormItem>
      }

      {
        displayAsEnabled &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayAs')}>
          <ButtonGroup
            selectedItemKey={renderType}
            onChange={renderType => putNodeDefProp(nodeDef, NodeDefLayout.nodeDefLayoutProps.render, renderType)}
            items={[
              {
                key: NodeDefLayout.nodeDefRenderType.form,
                label: i18n.t('nodeDefEdit.basicProps.form'),
                disabled: displayAsFormDisabled,
              },
              {
                key: NodeDefLayout.nodeDefRenderType.table,
                label: i18n.t('nodeDefEdit.basicProps.table'),
                disabled: displayAsTableDisabled,
              },
            ]}
          />
        </FormItem>
      }

      {
        displayInEnabled &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayIn')}>
          <ButtonGroup
            selectedItemKey={displayIn}
            onChange={displayIn => putNodeDefProp(
              nodeDef,
              NodeDefLayout.nodeDefLayoutProps.pageUuid,
              displayIn === NodeDefLayout.nodeDefDisplayIn.parentPage ? null : uuidv4()
            )}
            items={[
              {
                key: NodeDefLayout.nodeDefDisplayIn.parentPage,
                label: i18n.t('nodeDefEdit.basicProps.parentPage'),
                disabled: displayInParentPageDisabled,
              },
              {
                key: NodeDefLayout.nodeDefDisplayIn.ownPage,
                label: i18n.t('nodeDefEdit.basicProps.ownPage'),
                disabled: displayInOwnPageDisabled,
              },
            ]}
          />
        </FormItem>
      }

      <FormItem label={i18n.t('common.cycle_plural')}>
        <ButtonGroup
          multiple={true}
          deselectable={true}
          selectedItemKey={cyclesNodeDef}
          onChange={cycles => putNodeDefProp(
            nodeDef,
            NodeDef.propKeys.cycles,
            cycles
          )}
          items={cyclesSurvey.map(cycle => ({
            key: cycle,
            label: Number(cycle) + 1,
            disabled: cyclesNodeDef.length === 1 && cycle === cyclesNodeDef[0]
          }))}
          disabled={NodeDef.isRoot(nodeDef)}
        />
      </FormItem>
    </div>
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDef = NodeDefEditState.getNodeDef(state)
  const isEntityAndNotRoot = NodeDef.isEntity(nodeDef) && !NodeDef.isRoot(nodeDef)

  const displayAsFormDisabled = false
  const displayAsTableDisabled = Survey.hasNodeDefChildrenEntities(nodeDef)(survey) || NodeDef.isSingle(nodeDef)

  const displayInParentPageDisabled = NodeDefLayout.isRenderForm(nodeDef)
  const displayInOwnPageDisabled = false

  return {
    displayAsEnabled: isEntityAndNotRoot,
    displayInEnabled: isEntityAndNotRoot,

    displayAsFormDisabled,
    displayAsTableDisabled,
    displayInParentPageDisabled,
    displayInOwnPageDisabled,

    cyclesSurvey: R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey),
  }
}

export default connect(mapStateToProps)(BasicProps)