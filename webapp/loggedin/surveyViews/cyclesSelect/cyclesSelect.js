import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/components/hooks'
import { FormItem } from '@webapp/components/form/input'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import * as SurveyState from '@webapp/survey/surveyState'

const CyclesSelect = props => {
  const { cycleKeyCurrent, cyclesKeysSurvey, cyclesKeysSelectable, cyclesKeysSelected, disabled, onChange } = props
  const i18n = useI18n()

  const cyclesKeys = cyclesKeysSelectable ? cyclesKeysSelectable : cyclesKeysSurvey

  return (
    cyclesKeysSurvey.length !== 1 && (
      <FormItem label={i18n.t('common.cycle_plural')}>
        <ButtonGroup
          multiple={true}
          deselectable={true}
          selectedItemKey={cyclesKeysSelected}
          onChange={cycles => onChange(cycles.sort((a, b) => Number(a) - Number(b)))}
          items={cyclesKeys.map(cycle => ({
            key: cycle,
            label: Number(cycle) + 1,
            disabled:
              (cyclesKeysSelected.length === 1 && cycle === cyclesKeysSelected[0]) || // Disabled if current cycle is the only one selected in nodeDef
              cycle === cycleKeyCurrent, // Cannot remove nodeDef from current cycle
          }))}
          disabled={disabled}
        />
      </FormItem>
    )
  )
}

CyclesSelect.defaultProps = {
  cycleKeyCurrent: null, // Selected survey cycle (from store)
  cyclesKeysSurvey: [], // All survey cycles (from store)
  cyclesKeysSelectable: null, // Selectable cycle keys (default: all cycle keys)
  cyclesKeysSelected: [], // Selected cycle keys
  disabled: false,
  onChange: selection => selection, // Required onChange function
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const cycleKeyCurrent = SurveyState.getSurveyCycleKey(state)
  const cyclesKeysSurvey = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)

  return {
    cycleKeyCurrent,
    cyclesKeysSurvey,
  }
}

export default connect(mapStateToProps)(CyclesSelect)
