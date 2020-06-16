import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as SurveyCycle from '@core/survey/surveyCycle'

import { DialogConfirmActions } from '@webapp/store/ui'

import ValidationTooltip from '@webapp/components/validationTooltip'

import DateContainer from './DateContainer'

const CycleEditor = (props) => {
  const { cycleKey, cycle, readOnly, validation, canDelete, onChange, onDelete } = props

  const stepNum = Number(cycleKey) + 1
  const dispatch = useDispatch()

  return (
    <ValidationTooltip validation={validation} showKeys={false}>
      <div key={cycleKey} className="cycle">
        <div className="step">{stepNum}</div>
        <DateContainer
          date={SurveyCycle.getDateStart(cycle)}
          keyLabel="common.from"
          readOnly={readOnly}
          onChange={(date) => onChange(SurveyCycle.setDateStart(date)(cycle))}
        />
        {(SurveyCycle.getDateEnd(cycle) || !readOnly) && (
          <DateContainer
            date={SurveyCycle.getDateEnd(cycle)}
            keyLabel="common.to"
            readOnly={readOnly}
            onChange={(date) => onChange(SurveyCycle.setDateEnd(date)(cycle))}
          />
        )}

        {canDelete && (
          <button
            type="button"
            className="btn-s btn-transparent btn-delete"
            onClick={() =>
              dispatch(
                DialogConfirmActions.showDialogConfirm({
                  key: 'homeView.surveyInfo.confirmDeleteCycle',
                  params: { cycle: stepNum },
                  onOk: () => onDelete(cycleKey),
                })
              )
            }
          >
            <span className="icon icon-bin2 icon-12px" />
          </button>
        )}
      </div>
    </ValidationTooltip>
  )
}

CycleEditor.propTypes = {
  cycleKey: PropTypes.string.isRequired,
  cycle: PropTypes.object.isRequired,
  readOnly: PropTypes.bool.isRequired,
  validation: PropTypes.object.isRequired,
  canDelete: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

export default CycleEditor
