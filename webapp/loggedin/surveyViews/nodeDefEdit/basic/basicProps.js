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
    surveyCycleKey, nodeDef, validation,
    nodeDefKeyEditDisabled, nodeDefMultipleEditDisabled,

    cyclesKeysSurvey, cyclesKeysParent,
    displayAsEnabled, displayInEnabled,
    displayAsFormDisabled, displayAsTableDisabled,
    displayInParentPageDisabled, displayInOwnPageDisabled,

    putNodeDefProp, putNodeDefLayoutProp,
    toggleTaxonomyEdit, toggleCategoryEdit
  } = props

  const i18n = useI18n()

  const onPropLabelsChange = (labelItem, key, currentValue) => {
    putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
  }

  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)
  const displayIn = NodeDefLayout.getDisplayIn(surveyCycleKey)(nodeDef)
  const cyclesNodeDef = NodeDef.getCycles(nodeDef)

  return (
    <div className="form">
      <FormItem label={i18n.t('common.type')}>
        <label>{nodeDef.type}</label>
      </FormItem>

      <FormItem label={i18n.t('common.name')}>
        <Input
          value={NodeDef.getName(nodeDef)}
          validation={Validation.getFieldValidation(NodeDef.propKeys.name)(validation)}
          onChange={value => putNodeDefProp(nodeDef, NodeDef.propKeys.name, normalizeName(value))}/>
      </FormItem>

      <LabelsEditor
        labels={NodeDef.getLabels(nodeDef)}
        onChange={(labelItem) => onPropLabelsChange(labelItem, NodeDef.propKeys.labels, NodeDef.getLabels(nodeDef))}/>

      <LabelsEditor
        formLabelKey="common.description"
        labels={NodeDef.getDescriptions(nodeDef)}
        onChange={(labelItem) => onPropLabelsChange(labelItem, NodeDef.propKeys.descriptions, NodeDef.getDescriptions(nodeDef))}/>

      {
        NodeDef.isCode(nodeDef) &&
        <CodeProps
          surveyCycleKey={surveyCycleKey}
          nodeDef={nodeDef}
          validation={validation}
          toggleCategoryEdit={toggleCategoryEdit}
          putNodeDefProp={putNodeDefProp}
          putNodeDefLayoutProp={putNodeDefLayoutProp}/>
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
            onChange={(checked) => putNodeDefProp(nodeDef, NodeDef.propKeys.key, checked)}/>
        </FormItem>
      }

      {
        NodeDef.canNodeDefBeMultiple(nodeDef) &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.multiple')}>
          <Checkbox
            checked={NodeDef.isMultiple(nodeDef)}
            disabled={nodeDefMultipleEditDisabled}
            onChange={(checked) => putNodeDefProp(nodeDef, NodeDef.propKeys.multiple, checked)}/>
        </FormItem>
      }

      {
        displayAsEnabled &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayAs')}>
          <ButtonGroup
            selectedItemKey={renderType}
            onChange={renderType => putNodeDefLayoutProp(nodeDef, NodeDefLayout.keys.renderType, renderType)}
            items={[
              {
                key: NodeDefLayout.renderType.form,
                label: i18n.t('nodeDefEdit.basicProps.form'),
                disabled: displayAsFormDisabled,
              },
              {
                key: NodeDefLayout.renderType.table,
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
            onChange={displayIn => putNodeDefLayoutProp(
              nodeDef,
              NodeDefLayout.keys.pageUuid,
              displayIn === NodeDefLayout.displayIn.parentPage ? null : uuidv4()
            )}
            items={[
              {
                key: NodeDefLayout.displayIn.parentPage,
                label: i18n.t('nodeDefEdit.basicProps.parentPage'),
                disabled: displayInParentPageDisabled,
              },
              {
                key: NodeDefLayout.displayIn.ownPage,
                label: i18n.t('nodeDefEdit.basicProps.ownPage'),
                disabled: displayInOwnPageDisabled,
              },
            ]}
          />
        </FormItem>
      }

      {
        cyclesKeysSurvey.length > 1 &&
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
            items={
              R.pipe(
                R.sort((a, b) => Number(a) - Number(b)),
                R.map(cycle => ({
                  key: cycle,
                  label: Number(cycle) + 1,
                  disabled: cyclesNodeDef.length === 1 && cycle === cyclesNodeDef[0] // disabled if current cycle is the only one selected in nodeDef
                }))
              )(cyclesKeysParent)
            }
            disabled={NodeDef.isRoot(nodeDef)}
          />
        </FormItem>
      }
    </div>
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const nodeDef = NodeDefEditState.getNodeDef(state)
  const isEntityAndNotRoot = NodeDef.isEntity(nodeDef) && !NodeDef.isRoot(nodeDef)

  const displayAsFormDisabled = false
  const displayAsTableDisabled = Survey.hasNodeDefChildrenEntities(nodeDef)(survey) || NodeDef.isSingle(nodeDef)

  const displayInParentPageDisabled = NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)
  const displayInOwnPageDisabled = false

  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const cyclesKeysSurvey = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)
  const cyclesKeysParent = NodeDef.isRoot(nodeDef) ? cyclesKeysSurvey : NodeDef.getCycles(nodeDefParent)

  return {
    surveyCycleKey,

    displayAsEnabled: isEntityAndNotRoot,
    displayInEnabled: isEntityAndNotRoot,

    displayAsFormDisabled,
    displayAsTableDisabled,
    displayInParentPageDisabled,
    displayInOwnPageDisabled,

    cyclesKeysSurvey,
    cyclesKeysParent,
  }
}

export default connect(mapStateToProps)(BasicProps)