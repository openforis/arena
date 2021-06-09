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
