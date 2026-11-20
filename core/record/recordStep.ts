import {
  RecordStepAnalysisCode,
  RecordStepCleansingCode,
  RecordStepEntryCode,
  RecordStepsList,
} from '@openforis/arena-core'

import * as A from '@core/arena'

import * as ObjectUtils from '@core/objectUtils'

export type RecordStep = { id: string; name: string }

const keys = {
  steps: 'steps',
  id: ObjectUtils.keys.id,
  name: 'name',
} as const

export const stepNames = {
  entry: 'entry',
  cleansing: 'cleansing',
  analysis: 'analysis',
} as const

export const entryCode: string = RecordStepEntryCode
export const cleansingCode: string = RecordStepCleansingCode
export const analysisCode: string = RecordStepAnalysisCode

export const steps: RecordStep[] = RecordStepsList

export const getStepId = (step: RecordStep | null | undefined): string | undefined =>
  A.prop(keys.id)(step) as string | undefined

export const getDefaultStep = (): string => getStepId(steps[0])

export const getStep = (stepId: string | null | undefined): RecordStep | undefined =>
  steps.find((step) => step.id === stepId)

export const getStepIdByName = (stepName: string): string | undefined =>
  getStepId(steps.find((step) => step.name === stepName))

const getStepIndex = (stepId: string | null | undefined): number => steps.findIndex((step) => step.id === stepId)

// undefined after the last step, null before the first one
const getStepIncrement = (stepId: string, increment: number): RecordStep | null | undefined => {
  const index = getStepIndex(stepId) + increment
  return index >= 0 ? steps[index] : null
}

export const getNextStep = (stepId: string): RecordStep | null | undefined => getStepIncrement(stepId, +1)

export const getPreviousStep = (stepId: string): RecordStep | null | undefined => getStepIncrement(stepId, -1)

export const { getId } = ObjectUtils
export const getName = (step: RecordStep | null | undefined): string | undefined =>
  A.prop(keys.name)(step) as string | undefined

// false if a step is missing (e.g. unknown step id): its index (-1) would be adjacent to the first step one (0)
export const areAdjacent = (step1: RecordStep | null | undefined, step2: RecordStep | null | undefined): boolean => {
  if (!step1 || !step2) {
    return false
  }
  const idx1 = getStepIndex(getId(step1))
  const idx2 = getStepIndex(getId(step2))
  return Math.abs(idx1 - idx2) === 1
}
