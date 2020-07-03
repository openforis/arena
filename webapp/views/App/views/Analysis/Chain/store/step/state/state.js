export const keys = {
  step: 'step',
  stepOriginal: 'stepOriginal',
  stepDirty: 'stepDirty',
}

// ==== CREATE
export const create = ({ step, stepOriginal, stepDirty }) => ({
  [keys.step]: step,
  [keys.stepOriginal]: stepOriginal,
  [keys.stepDirty]: stepDirty,
})

// ==== READ
export const getStep = (state) => state[keys.step]
export const getStepOriginal = (state) => state[keys.stepOriginal]
export const getStepDirty = (state) => state[keys.stepDirty]

export const get = (state) => ({
  [keys.step]: getStep(state),
  [keys.stepOriginal]: getStepOriginal(state),
  [keys.stepDirty]: getStepDirty(state),
})

// ==== UPDATE
export const assoc = (newProps) => (state) => ({
  [keys.step]: Object.prototype.hasOwnProperty.call(newProps, keys.step) ? newProps[keys.step] : state[keys.step],
  [keys.stepOriginal]: Object.prototype.hasOwnProperty.call(newProps, keys.stepOriginal)
    ? newProps[keys.stepOriginal]
    : state[keys.stepOriginal],
  [keys.stepDirty]: Object.prototype.hasOwnProperty.call(newProps, keys.stepDirty)
    ? newProps[keys.stepDirty]
    : state[keys.stepDirty],
})
