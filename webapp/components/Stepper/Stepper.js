import React from 'react'
import PropTypes from 'prop-types'
import { Step, StepLabel, Stepper as MuiStepper } from '@mui/material'

import { useI18n } from '@webapp/store/system'

const Stepper = (props) => {
  const { activeStep, steps } = props

  const i18n = useI18n()

  return (
    <MuiStepper activeStep={activeStep}>
      {steps.map(({ key, label }) => {
        return (
          <Step key={key}>
            <StepLabel>{i18n.t(label)}</StepLabel>
          </Step>
        )
      })}
    </MuiStepper>
  )
}

Stepper.propTypes = {
  activeStep: PropTypes.number.isRequired,
  steps: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string.isRequired, label: PropTypes.string.isRequired })),
}

export default Stepper
