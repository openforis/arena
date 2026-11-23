import { Step, StepLabel, Stepper as MuiStepper } from '@mui/material'

import { useI18n } from '@webapp/store/system'

type StepperProps = {
  activeStep: number
  steps?: {
    key: string
    label: string
  }[]
}

const Stepper = (props: StepperProps) => {
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

export default Stepper
