import { Objects } from '@openforis/arena-core'

const stepKeys = {
  selectCyle: 'selectCycle',
  selectImportType: 'selectImportType',
  selectEntity: 'selectEntity',
  selectFile: 'selectFile',
  startImport: 'startImport',
}

const getStepKeysFiltered = ({ canSelectCycle }) =>
  Object.values(stepKeys).filter((stepKey) => canSelectCycle || stepKey !== stepKeys.selectCyle)

const determineActiveStep = ({ canSelectCycle, state }) => {
  const stepKeysFiltered = getStepKeysFiltered({ canSelectCycle })
  const getStepIndex = (stepKey) => stepKeysFiltered.indexOf(stepKey)

  const { cycle, dataImportType, file, selectedEntityDefUuid } = state

  if (Objects.isEmpty(cycle)) {
    return getStepIndex(stepKeys.selectCyle)
  }
  if (!dataImportType) {
    return getStepIndex(stepKeys.selectImportType)
  }
  if (!selectedEntityDefUuid) {
    return getStepIndex(stepKeys.selectEntity)
  }
  if (!file) {
    return getStepIndex(stepKeys.selectFile)
  }
  return getStepIndex(stepKeys.startImport)
}

export const useDataImportCsvViewSteps = ({ canSelectCycle, state }) => {
  const activeStep = determineActiveStep({ canSelectCycle, state })
  const stepKeysFiltered = getStepKeysFiltered({ canSelectCycle })

  const steps = stepKeysFiltered.map((key) => ({ key, label: `dataImportView.steps.${key}` }))

  return {
    activeStep,
    steps,
  }
}
