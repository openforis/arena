import { validateStep } from './validation'

export const stepPropsUpdate = 'analysis/step/props/update'
export const calculationIndexUpdate = 'analysis/calculation/index/update'

export const updateStepProps = (props) => async (dispatch) => {
  await dispatch({ type: stepPropsUpdate, props })
  dispatch(validateStep())
}

export const updateCalculationIndex = (indexFrom, indexTo) => (dispatch) =>
  dispatch({ type: calculationIndexUpdate, indexFrom, indexTo })
