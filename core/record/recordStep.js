import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

const keys = {
  steps: 'steps',
  id: ObjectUtils.keys.id,
  name: 'name',
}

export const stepNames = {
  entry: 'entry',
  cleansing: 'cleansing',
  analysis: 'analysis',
}

export const steps = [
  { id: '1', name: stepNames.entry },
  { id: '2', name: stepNames.cleansing },
  { id: '3', name: stepNames.analysis },
]

export const getStepId = R.prop(keys.id)

export const getDefaultStep = () => R.pipe(R.head, getStepId)(steps)

export const getStep = (stepId) => R.find(R.propEq(keys.id, stepId), steps)

export const getStepIdByName = (stepName) => {
  const step = R.find(R.propEq(keys.name, stepName), steps)
  return getStepId(step)
}

const getStepIndex = (stepId) => R.findIndex(R.propEq(keys.id, stepId))

const getStepIncrement = (stepId, increment) =>
  R.pipe(
    getStepIndex(stepId),
    (idx) => R.add(idx, increment),
    (idx) => (idx >= 0 ? R.nth(idx, steps) : null)
  )(steps)

export const getNextStep = (stepId) => getStepIncrement(stepId, +1)

export const getPreviousStep = (stepId) => getStepIncrement(stepId, -1)

export const { getId } = ObjectUtils
export const getName = R.prop(keys.name)

export const areAdjacent = (step1, step2) => {
  if (!(step1 || step2)) {
    return false
  }

  const idx1 = getStepIndex(getId(step1))(steps)
  const idx2 = getStepIndex(getId(step2))(steps)
  return Math.abs(idx1 - idx2) === 1
}
