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
import Dropdown from '@webapp/components/form/Dropdown'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import { State } from '../../store'
import useCalculationState from './useCalculationState'

const CalculationComponent = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const calculationEdit = State.getCalculationEdit(state)
  const editingCalculation = Boolean(State.getCalculationEdit(state))

  const { validation, attributes, attribute, aggregateFunctionEnabled, types, aggregateFns } = useCalculationState({
    state,
  })

  const nodeDefUuid = Calculation.getNodeDefUuid(calculationEdit)

  return (
    <div className={`calculation chain-form${editingCalculation ? ' show' : ''}`}>
      {/* <button type="button" className="btn-s btn-close" onClick={Actions.calculation.dismiss}>
        <span className="icon icon-10px icon-cross" />
      </button> */}

      <LabelsEditor
        labels={Calculation.getLabels(calculationEdit)}
        validation={Validation.getFieldValidation(Calculation.keysProps.labels)(validation)}
        onChange={(labels) =>
          Actions.updatePropCalculation({ prop: Calculation.keysProps.labels, value: labels, state })
        }
      />

      <FormItem label={i18n.t('common.type')}>
        <ButtonGroup
          selectedItemKey={Calculation.getType(calculationEdit)}
          onChange={(type) => Actions.updatePropCalculation({ prop: Calculation.keysProps.type, value: type, state })}
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
            onBeforeChange={(nodeDef) => Actions.canSelectNodeDef({ nodeDef, state })}
            onChange={(def) => Actions.updateAttributeCalculation({ attrDef: def, state })}
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
          <button type="button" className="btn btn-s btn-add" onClick={() => Actions.addNodeDefAnalysis({ state })}>
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('common.add')}
          </button>
        </div>
      </FormItem>

      {aggregateFunctionEnabled && (
        <FormItem label={i18n.t('processingStepCalculation.aggregateFunction')}>
          <ButtonGroup
            selectedItemKey={Calculation.getAggregateFunction(calculationEdit)}
            onChange={(aggregateFn) =>
              Actions.updatePropCalculation({ prop: Calculation.keysProps.aggregateFn, value: aggregateFn, state })
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
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default CalculationComponent
