import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { cluster } from '../../mock/nodeDefs'

/*
eslint-disable camelcase
*/
const { cluster_id } = cluster.children

export const gotoRecord = ({ record, unlock = false }) => {
  const clusterIdName = cluster_id.name
  const clusterId = record[clusterIdName]

  test(`Goto record ${clusterIdName} ${clusterId}`, async () => {
    const recordKeyCellSelector = `${getSelector(TestId.records.cellNodeDef(clusterIdName))}[data-value="${clusterId}"]`

    await Promise.all([
      page.waitForSelector(getSelector(TestId.surveyForm.surveyForm)),
      page.waitForNavigation(),
      page.dblclick(recordKeyCellSelector),
    ])
    if (unlock) {
      await page.click(getSelector(TestId.record.editLockToggleBtn))
    }
  })
}
