import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { cluster } from '../../mock/nodeDefs'

/*
eslint-disable camelcase
*/
const { cluster_id } = cluster.children

export const gotoRecord = (record) => {
  const clusterIdName = cluster_id.name
  const clusterId = record[clusterIdName]

  test(`Goto record ${clusterIdName} ${clusterId}`, async () => {
    const cellSelector = `${getSelector(TestId.records.cellNodeDef(clusterIdName))}[data-value="${clusterId}"]`
    const cellLocator = page.locator(cellSelector)

    await Promise.all([
      page.waitForSelector(getSelector(TestId.surveyForm.surveyForm)),
      page.waitForNavigation(),
      cellLocator.dblclick(),
    ])
  })
}
