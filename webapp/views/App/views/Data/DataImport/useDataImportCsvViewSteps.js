const stepKeys = {
  selectImportType: 'selectImportType',
  selectCyle: 'selectCycle',
  selectEntity: 'selectEntity',
  selectFile: 'selectFile',
  startImport: 'startImport',
}

const getStepKeysFiltered = ({ surveyCycleKeys }) =>
  Object.values(stepKeys).filter((stepKey) => surveyCycleKeys.length > 1 || stepKey !== stepKeys.selectCyle)

const determineActiveStep = ({ surveyCycleKeys, state }) => {
  const stepKeysFiltered = getStepKeysFiltered({ surveyCycleKeys })
  const getStepIndex = (stepKey) => stepKeysFiltered.indexOf(stepKey)

  const { cycle, dataImportType, file, selectedEntityDefUuid } = state

  if (!dataImportType) {
    return getStepIndex(stepKeys.selectImportType)
  }
  if (!cycle) {
    return getStepIndex(stepKeys.selectCyle)
  }
  if (!selectedEntityDefUuid) {
    return getStepIndex(stepKeys.selectEntity)
  }
  if (!file) {
    return getStepIndex(stepKeys.selectFile)
  }
  return getStepIndex(stepKeys.startImport)
}

export const useDataImportCsvViewSteps = ({ surveyCycleKeys, state }) => {
  const activeStep = determineActiveStep({ surveyCycleKeys, state })

  const steps = getStepKeysFiltered({ surveyCycleKeys }).map((key) => ({ key, label: `dataImportView.steps.${key}` }))

  return {
    activeStep,
    steps,
  }
}
