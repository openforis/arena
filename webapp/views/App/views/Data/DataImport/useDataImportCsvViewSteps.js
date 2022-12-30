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

export const useDataImportCsvViewSteps = ({ canSelectCycle, state }) => {
  const activeStep = determineActiveStep({ canSelectCycle, state })

  const steps = getStepKeysFiltered({ canSelectCycle }).map((key) => ({ key, label: `dataImportView.steps.${key}` }))

  return {
    activeStep,
    steps,
  }
}
