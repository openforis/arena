import './Calculation.scss'
import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import * as NodeDef from '@core/survey/nodeDef'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as Validation from '@core/validation/validation'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/input'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import Dropdown from '@webapp/components/form/dropdown'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import useCalculationState from './useCalculationState'

const CalculationComponent = (props) => {
  const { analysis } = props

  const i18n = useI18n()
  const { attributesUuidsOtherChains, chain, step, calculation, editingCalculation, Actions } = analysis
  const { validation, attributes, attribute, aggregateFunctionEnabled, types, aggregateFns } = useCalculationState({
    attributesUuidsOtherChains,
    chain,
    step,
    calculation,
  })

  const nodeDefUuid = Calculation.getNodeDefUuid(calculation)

  return (
    <div className={`calculation chain-form${editingCalculation ? ' show' : ''}`}>
      <button type="button" className="btn-s btn-close" onClick={Actions.calculation.dismiss}>
        <span className="icon icon-10px icon-cross" />
      </button>

      <LabelsEditor
        labels={Calculation.getLabels(calculation)}
        validation={Validation.getFieldValidation(Calculation.keysProps.labels)(validation)}
        onChange={(labels) => Actions.calculation.updateProp({ prop: Calculation.keysProps.labels, value: labels })}
      />

      <FormItem label={i18n.t('common.type')}>
        <ButtonGroup
          selectedItemKey={Calculation.getType(calculation)}
          onChange={(type) => Actions.calculation.updateProp({ prop: Calculation.keysProps.type, value: type })}
          items={types}
        />
      </FormItem>

      <FormItem label={i18n.t('processingStepCalculation.attribute')}>
        <div className="calculation__attribute-container">
          <Dropdown
            items={attributes}
            selection={attribute}
            itemKeyProp={Calculation.keys.uuid}
            itemLabelFunction={(attrDef) => NodeDef.getLabel(attrDef, i18n.lang)}
            validation={Validation.getFieldValidation(Calculation.keys.nodeDefUuid)(validation)}
            onBeforeChange={Actions.canSelectNodeDef}
            onChange={(def) => Actions.calculation.updateAttribute({ attrDef: def })}
          />
          <Link
            type="button"
            className="btn btn-s btn-edit"
            to={`${appModuleUri(analysisModules.nodeDef)}${nodeDefUuid}/`}
            aria-disabled={!nodeDefUuid}
          >
            <span className="icon icon-pencil2 icon-12px icon-left" />
            {i18n.t('common.edit')}
          </Link>
          <button type="button" className="btn btn-s btn-add" onClick={Actions.addNodeDefAnalysis}>
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('common.add')}
          </button>
        </div>
      </FormItem>

      {aggregateFunctionEnabled && (
        <FormItem label={i18n.t('processingStepCalculation.aggregateFunction')}>
          <ButtonGroup
            selectedItemKey={Calculation.getAggregateFunction(calculation)}
            onChange={(aggregateFn) =>
              Actions.calculation.updateProp({ prop: Calculation.keysProps.aggregateFn, value: aggregateFn })
            }
            items={aggregateFns}
            deselectable
          />
        </FormItem>
      )}
    </div>
  )
}

CalculationComponent.propTypes = {
  analysis: PropTypes.object.isRequired,
}

export default CalculationComponent
