import * as R from 'ramda';

const keys = {
  steps: 'steps',
  id: 'id',
  name: 'name',
}

const steps = [
  { id: '1', name: 'entry' },
  { id: '2', name: 'cleansing' },
  { id: '3', name: 'analysis' },
]

export interface IStep {
  id: string;
  name: string;
}

export const getDefaultStep: () => string = () => R.pipe(
  R.head as (x: IStep[]) => IStep,
  R.prop(keys.id) as (x: IStep) => string,
)(steps)

export const getStep = stepId => R.find(
  R.propEq(keys.id, stepId),
  steps
)

const getStepIndex = stepId => R.findIndex(
  R.propEq(keys.id, stepId)
)

const getStepIncrement = (stepId, increment) => R.pipe(
  getStepIndex(stepId),
  idx => R.add(idx, increment),
  idx => idx >= 0 ? R.nth(idx, steps) : null
)(steps)

export const getNextStep = stepId => getStepIncrement(stepId, +1)

export const getPreviousStep = stepId => getStepIncrement(stepId, -1)

export const getId = R.prop(keys.id)
export const getName = R.prop(keys.name)

export const areAdjacent = (step1, step2) => {
  if (!(step1 || step2))
    return false

  const idx1 = getStepIndex(getId(step1))(steps)
  const idx2 = getStepIndex(getId(step2))(steps)
  return Math.abs(idx1 - idx2) === 1
}

export default {
  getDefaultStep,
  getStep,
  getNextStep,
  getPreviousStep,

  getId,
  getName,
  areAdjacent,
};
