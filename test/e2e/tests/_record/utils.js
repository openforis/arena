import { TestId, getSelector } from '../../../../webapp/utils/testId'
import * as DateUtils from '../../../../core/dateUtils'
import { tree } from '../../mock/nodeDefs'
import { FormUtils } from '../utils/formUtils'

// ==== value parser
export const parseValue = (value) => (typeof value === 'function' ? value() : value)

// ==== selector utils
export const getNodeDefSelector = (nodeDef, parentSelector = '') =>
  `${parentSelector} ${getSelector(TestId.surveyForm.nodeDefWrapper(nodeDef.name))}`.trim()

export const getBooleanSelector = (nodeDef, parentSelector, value) =>
  `${getNodeDefSelector(nodeDef, parentSelector)} .MuiButtonBase-root[data-value="${value}"]`

export const getCoordinateSelector = (nodeDef, parentSelector) => {
  const nodeDefSelector = getNodeDefSelector(nodeDef, parentSelector)
  const xSelector = `${nodeDefSelector} ${FormUtils.getInputSelector(TestId.surveyForm.coordinateX(nodeDef.name))}`
  const ySelector = `${nodeDefSelector} ${FormUtils.getInputSelector(TestId.surveyForm.coordinateY(nodeDef.name))}`
  const srsTestId = TestId.surveyForm.coordinateSRS(nodeDef.name)

  return { xSelector, ySelector, srsTestId }
}

export const getDateTimeInputSelector = (nodeDef, parentSelector) =>
  `${getNodeDefSelector(nodeDef, parentSelector)} input`

export const getDateTimeCalendarBtnSelector = (nodeDef, parentSelector) =>
  `${getNodeDefSelector(nodeDef, parentSelector)} button.MuiIconButton-edgeEnd`

export const getTaxonSelector = (nodeDef, parentSelector) => {
  const nodeDefSelector = getNodeDefSelector(nodeDef, parentSelector)
  const _selector = (field) =>
    `${nodeDefSelector} ${FormUtils.getInputSelector(TestId.surveyForm.taxonField(nodeDef.name, field))}`
  const codeSelector = _selector('code')
  const scientificNameSelector = _selector('scientificName')
  const vernacularNameSelector = _selector('vernacularName')
  return { codeSelector, scientificNameSelector, vernacularNameSelector }
}

export const getTextSelector = (nodeDef, parentSelector) =>
  `${getNodeDefSelector(nodeDef, parentSelector)} input[type="text"]`

export const getTreeSelector = (treeIdx) => getSelector(TestId.surveyForm.entityRowData(tree.name, treeIdx))

// ==== format utils
export const formatTime = (date) => DateUtils.format(date, DateUtils.formats.timeStorage)
