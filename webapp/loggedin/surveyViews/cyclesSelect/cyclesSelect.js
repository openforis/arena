import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/commonComponents/hooks'
import { FormItem } from '@webapp/commonComponents/form/input'
import ButtonGroup from '@webapp/commonComponents/form/buttonGroup'
import * as SurveyState from '@webapp/survey/surveyState'

const CyclesSelect = props => {
  const { surveyCycleKey, cycles, cyclesSelected, disabled, onChange } = props
  const i18n = useI18n()

  return (
    <FormItem label={i18n.t('common.cycle_plural')}>
      <ButtonGroup
        multiple={true}
        deselectable={true}
        selectedItemKey={cyclesSelected}
        onChange={cycles => onChange(cycles.sort((a, b) => Number(a) - Number(b)))}
        items={cycles.map(cycle => ({
          key: cycle,
          label: Number(cycle) + 1,
          disabled:
            (cyclesSelected.length === 1 && cycle === cyclesSelected[0]) || // Disabled if current cycle is the only one selected in nodeDef
            cycle === surveyCycleKey, // Cannot remove nodeDef from current cycle
        }))}
        disabled={disabled}
      />
    </FormItem>
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const cyclesKeysSurvey = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)

  return {
    cyclesKeysSurvey,
  }
}

export default connect(mapStateToProps)(CyclesSelect)
