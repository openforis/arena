import * as R from 'ramda'
import * as ObjectUtils from '@core/objectUtils'

import * as Chain from '../processingChain'
import * as Step from '../processingStep'

export const assocProp = ObjectUtils.setProp

export const assocSteps = ({ chain, steps }) => R.assoc(Chain.keys.processingSteps, steps)(chain)

export const assocStep = ({ chain, step }) =>
  R.assocPath([Chain.keys.processingSteps, Step.getIndex(step)], step)(chain)

export const dissocTemporary = ({ chain }) => ObjectUtils.dissocTemporary(chain)

export const dissocSteps = ({ chain }) => R.dissoc(Chain.keys.processingSteps)(chain)

const _filterSteps = ({ chain, filterFn }) => ({
  ...chain,
  [Chain.keys.processingSteps]: Chain.getProcessingSteps(chain).filter(filterFn),
})

export const dissocStep = ({ chain, step: stepToDissoc }) =>
  _filterSteps({ chain, filterFn: (step) => !Step.isEqual(step)(stepToDissoc) })

export const dissocStepTemporary = ({ chain }) => _filterSteps({ chain, filterFn: (step) => !Step.isTemporary(step) })
