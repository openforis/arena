import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { tree } from '../../mock/nodeDefs'

// ==== value parser
export const parseValue = (value) => (typeof value === 'function' ? value() : value)

// ==== selector utils
export const getNodeDefSelector = (nodeDef, parentSelector = '') =>
  `${parentSelector} ${getSelector(TestId.surveyForm.nodeDefWrapper(nodeDef.name))}`.trim()

export const getBooleanSelector = (nodeDef, parentSelector, value) =>
  `${getNodeDefSelector(nodeDef, parentSelector)} button[data-value="${value}"]`

export const getCodeSelector = (nodeDef, parentSelector) =>
  `${getNodeDefSelector(nodeDef, parentSelector)} .dropdown__single-value`

export const getCoordinateSelector = (nodeDef, parentSelector) => {
  const nodeDefSelector = getNodeDefSelector(nodeDef, parentSelector)

  const xSelector = `${nodeDefSelector} ${getSelector(TestId.surveyForm.coordinateX(nodeDef.name), 'input')}`
  const ySelector = `${nodeDefSelector} ${getSelector(TestId.surveyForm.coordinateY(nodeDef.name), 'input')}`
  const srsSelector = `${nodeDefSelector} ${getSelector(TestId.surveyForm.coordinateSRS(nodeDef.name), 'input')}`
  return { xSelector, ySelector, srsSelector }
}

export const getTaxonSelector = (nodeDef, parentSelector) => {
  const nodeDefSelector = getNodeDefSelector(nodeDef, parentSelector)
  const _selector = (field) =>
    `${nodeDefSelector} ${getSelector(TestId.surveyForm.taxonField(nodeDef.name, field), 'input')}`
  const codeSelector = _selector('code')
  const scientificNameSelector = _selector('scientificName')
  const vernacularNameSelector = _selector('vernacularName')
  return { codeSelector, scientificNameSelector, vernacularNameSelector }
}

export const getTextSelector = (nodeDef, parentSelector) =>
  `${getNodeDefSelector(nodeDef, parentSelector)} input[type="text"]`

export const getTreeSelector = (treeIdx) => getSelector(TestId.surveyForm.entityRowData(tree.name, treeIdx))

// ==== format utils
export const formatTime = (date) => {
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}`
}

export const formatDate = (date) => {
  const year = `${date.getFullYear()}`
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return [year, month, day]
}
