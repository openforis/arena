import { expectExists, getElement, getElements } from '../api'

const dataAttributes = {
  nodeDefName: 'data-node-def-name',
  childNames: 'data-child-names',
}

const selectors = {
  surveyForm: '.survey-form',
  nodeDefPageItem: '.survey-form__node-def-page-item',
  entityWrapper: (entityName) =>
    `.survey-form__node-def-entity-wrapper${entityName ? `[${dataAttributes.nodeDefName}='${entityName}']` : ''}`,
}

export const expectSurveyFormLoaded = async () => expectExists({ selector: selectors.surveyForm })

const getNodeDefElementText = async ({ item }) => {
  const itemText = await item.text()
  const text = await itemText.split('\n')[0]
  return text
}

export const expectItemIsTheLastNodeDef = async ({ item }) => {
  const items = await getElements({ selector: selectors.nodeDefPageItem })

  const last = items[items.length - 1]

  const itemText = await getNodeDefElementText({ item: last })
  await expect(itemText).toBe(item.label)
}

const getSurveyFormEntityWrapper = async ({ entityName = null }) =>
  getElement({ selector: selectors.entityWrapper(entityName) })

export const expectSurveyFormItemNames = async ({ entityName = null, itemNames: itemNamesExpected }) => {
  const wrapper = await getSurveyFormEntityWrapper({ entityName })
  const nodeDefNamesOrderedAttribute = await wrapper.attribute(dataAttributes.childNames)
  const nodeDefNamesOrdered = nodeDefNamesOrderedAttribute.split(',')
  await expect(nodeDefNamesOrdered).toStrictEqual(itemNamesExpected)
}

export const expectSurveyFormItems = async ({ entityName = null, items }) =>
  expectSurveyFormItemNames({ entityName, itemNames: items.map((item) => item.name) })
