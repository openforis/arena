import * as R from 'ramda'

import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

import * as Chain from '../processingChain'
import * as Step from '../processingStep'

export const assocProp = ({ chain, key, value }) => ({ chain: ObjectUtils.setProp(key, value)(chain) })

export const assocSteps = ({ chain, steps }) => ({ chain: A.assoc(Chain.keys.processingSteps, steps)(chain) })

export const assocStep = ({ chain, step }) => ({
  chain: R.assocPath([Chain.keys.processingSteps, Step.getIndex(step)], step)(chain),
})

export const dissocTemporary = ({ chain, step, calculation }) => ({
  chain: ObjectUtils.dissocTemporary(chain),
  step: ObjectUtils.dissocTemporary(step),
  calculation: ObjectUtils.dissocTemporary(calculation),
})

export const dissocSteps = ({ chain }) => ({ chain: A.dissoc(Chain.keys.processingSteps, chain) })

const _filterSteps = ({ chain, filterFn }) => ({
  chain: A.assoc(Chain.keys.processingSteps, Chain.getProcessingSteps(chain).filter(filterFn), chain),
})

export const dissocStep = ({ chain, step: stepToDissoc }) =>
  _filterSteps({ chain, filterFn: (step) => !Step.isEqual(step)(stepToDissoc) })

export const dissocStepTemporary = ({ chain }) => _filterSteps({ chain, filterFn: (step) => !Step.isTemporary(step) })
