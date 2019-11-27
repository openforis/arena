import './cyclesEditor.scss'

import React, {useRef} from 'react'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as SurveyCycle from '@core/survey/surveyCycle'
import * as Validation from '@core/validation/validation'

import {useI18n} from '@webapp/commonComponents/hooks'
import ValidationTooltip from '@webapp/commonComponents/validationTooltip'

const DateEditor = ({date, onChange}) => {
  const [year, month, day] = R.pipe(R.defaultTo('--'), R.split('-'))(date)

  const yearRef = useRef(null)
  const monthRef = useRef(null)
  const dayRef = useRef(null)

  const onChangeDate = () =>
    onChange(
      `${yearRef.current.value}-${monthRef.current.value}-${dayRef.current.value}`,
    )

  return (
    <span className="date">
      <input
        type="text"
        ref={yearRef}
        size="4"
        maxLength="4"
        value={year}
        onChange={onChangeDate}
      />
      -
      <input
        type="text"
        ref={monthRef}
        size="2"
        maxLength="2"
        value={month}
        onChange={onChangeDate}
      />
      -
      <input
        type="text"
        ref={dayRef}
        size="2"
        maxLength="2"
        value={day}
        onChange={onChangeDate}
      />
    </span>
  )
}

const DateContainer = ({date, i18n, keyLabel, readOnly, onChange}) => (
  <div className="date-container">
    <span className="date-label">{i18n.t(keyLabel)}</span>
    {readOnly ? (
      <span className="date">{date}</span>
    ) : (
      <DateEditor date={date} onChange={onChange} />
    )}
  </div>
)

const CycleEditor = props => {
  const {
    cycleKey,
    cycle,
    i18n,
    readOnly,
    validation,
    canDelete,
    onChange,
    onDelete,
  } = props

  const stepNum = Number(cycleKey) + 1

  return (
    <ValidationTooltip validation={validation} showKeys={false}>
      <div key={cycleKey} className="cycle">
        <div className="step">{stepNum}</div>
        <DateContainer
          date={SurveyCycle.getDateStart(cycle)}
          keyLabel="common.from"
          i18n={i18n}
          readOnly={readOnly}
          onChange={date => onChange(SurveyCycle.setDateStart(date)(cycle))}
        />
        {(SurveyCycle.getDateEnd(cycle) || !readOnly) && (
          <DateContainer
            date={SurveyCycle.getDateEnd(cycle)}
            keyLabel="common.to"
            i18n={i18n}
            readOnly={readOnly}
            onChange={date => onChange(SurveyCycle.setDateEnd(date)(cycle))}
          />
        )}

        {canDelete && (
          <button
            className="btn-s btn-transparent btn-delete"
            onClick={() =>
              window.confirm(
                i18n.t('homeView.surveyInfo.confirmDeleteCycle', {
                  cycle: stepNum,
                }),
              )
                ? onDelete(cycleKey)
                : null
            }
          >
            <span className="icon icon-bin2 icon-12px" />
          </button>
        )}
      </div>
    </ValidationTooltip>
  )
}

const CyclesEditor = props => {
  const {cycles, readOnly, setCycles, validation} = props
  const cycleEntries = Object.entries(cycles)

  const i18n = useI18n()

  const onDelete = stepToDelete => {
    delete cycles[stepToDelete]
    setCycles(cycles)
  }

  return (
    <div className="home-survey-info__cycles-editor">
      <div className="cycles">
        {cycleEntries.map(([cycleKey, cycle], i) => (
          <CycleEditor
            key={cycleKey}
            cycleKey={cycleKey}
            cycle={cycle}
            i18n={i18n}
            readOnly={readOnly}
            validation={Validation.getFieldValidation(cycleKey)(validation)}
            onChange={cycleUpdate =>
              setCycles(R.assoc(cycleKey, cycleUpdate)(cycles))
            }
            canDelete={
              !readOnly &&
              cycleKey !== Survey.cycleOneKey &&
              i === cycleEntries.length - 1
            }
            onDelete={onDelete}
          />
        ))}

        {!readOnly && (
          <button
            className="btn-s btn-add"
            onClick={() =>
              setCycles(
                R.assoc(cycleEntries.length, SurveyCycle.newCycle())(cycles),
              )
            }
          >
            <span className="icon icon-plus icon-10px" />
          </button>
        )}
      </div>
    </div>
  )
}

export default CyclesEditor
