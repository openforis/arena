import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { cluster } from '../../mock/nodeDefs'

/*
eslint-disable camelcase
*/
const { cluster_id } = cluster.children

export const gotoRecord = (record) => {
  const clusterIdName = cluster_id.name
  const clusterId = record[clusterIdName]

  test(`Goto record ${clusterIdName} ${clusterId}`, async () => {
    const cellSelector = `${getSelector(DataTestId.records.cellNodeDef(clusterIdName))}[data-value="${clusterId}"]`
    await Promise.all([
      page.waitForSelector(getSelector(DataTestId.surveyForm.surveyForm)),
      page.waitForNavigation(),
      page.click(cellSelector),
    ])
  })
}
