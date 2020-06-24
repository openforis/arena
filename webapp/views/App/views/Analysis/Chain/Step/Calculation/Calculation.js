import './Calculation.scss'
import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as NodeDef from '@core/survey/nodeDef'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'

import { FormItem } from '@webapp/components/form/input'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import Dropdown from '@webapp/components/form/dropdown'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import { checkCanSelectNodeDef, navigateToNodeDefEdit } from '@webapp/loggedin/modules/analysis/chain/actions'
import { resetCalculation, createNodeDefAnalysis } from '@webapp/loggedin/modules/analysis/calculation/actions'

import useCalculationState from './useCalculationState'

const CalculationView = (props) => {
  const { analysisState, analysisActions } = props

  const i18n = useI18n()
  const { chain, step, calculation, editingCalculation } = analysisState
  const { validation, attributes, attribute, aggregateFunctionEnabled, types, aggregateFns } = useCalculationState({
    chain,
    step,
    calculation,
  })

  const { calculation: calculationActions } = analysisActions

  const calculationDirty = calculation // TO REFACTOR

  const dispatch = useDispatch()
  const history = useHistory()
  const nodeDefUuid = Calculation.getNodeDefUuid(calculation)

  return (
    <div className={`calculation chain-form${editingCalculation ? ' show' : ''}`}>
      <button
        type="button"
        className="btn-s btn-close"
        onClick={() =>
          calculationDirty
            ? dispatch(
                DialogConfirmActions.showDialogConfirm({ key: 'common.cancelConfirm', onOk: resetCalculation() })
              )
            : dispatch(resetCalculation())
        }
      >
        <span className="icon icon-10px icon-cross" />
      </button>

      <LabelsEditor
        labels={Calculation.getLabels(calculation)}
        validation={Validation.getFieldValidation(Calculation.keysProps.labels)(validation)}
        onChange={(labels) => calculationActions.updateProp({ prop: Calculation.keysProps.labels, value: labels })}
      />

      <FormItem label={i18n.t('common.type')}>
        <ButtonGroup
          selectedItemKey={Calculation.getType(calculation)}
          onChange={(type) => calculationActions.updateProp({ prop: Calculation.keysProps.type, value: type })}
          items={types}
        />
      </FormItem>

      <FormItem label={i18n.t('processingStepCalculationView.attribute')}>
        <div className="calculation__attribute-container">
          <Dropdown
            items={attributes}
            selection={attribute}
            itemKeyProp={Calculation.keys.uuid}
            itemLabelFunction={(attrDef) => NodeDef.getLabel(attrDef, i18n.lang)}
            validation={Validation.getFieldValidation(Calculation.keys.nodeDefUuid)(validation)}
            onBeforeChange={(attrDef) => dispatch(checkCanSelectNodeDef(attrDef))}
            onChange={(def) => calculationActions.updateAttribute({ attrDef: def })}
          />
          <button
            type="button"
            className="btn btn-s btn-edit"
            onClick={() => dispatch(navigateToNodeDefEdit(history, nodeDefUuid))}
            aria-disabled={!nodeDefUuid}
          >
            <span className="icon icon-pencil2 icon-12px icon-left" />
            {i18n.t('common.edit')}
          </button>
          <button type="button" className="btn btn-s btn-add" onClick={() => dispatch(createNodeDefAnalysis(history))}>
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('common.add')}
          </button>
        </div>
      </FormItem>

      {aggregateFunctionEnabled && (
        <FormItem label={i18n.t('processingStepCalculationView.aggregateFunction')}>
          <ButtonGroup
            selectedItemKey={Calculation.getAggregateFunction(calculation)}
            onChange={(aggregateFn) =>
              calculationActions.updateProp({ prop: Calculation.keysProps.aggregateFn, value: aggregateFn })
            }
            items={aggregateFns}
            deselectable
          />
        </FormItem>
      )}
    </div>
  )
}

CalculationView.propTypes = {
  analysisState: PropTypes.object.isRequired,
  analysisActions: PropTypes.object.isRequired,
}

export default CalculationView
