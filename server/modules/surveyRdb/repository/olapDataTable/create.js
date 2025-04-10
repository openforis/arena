import TableOlapData from '@common/model/db/tables/olapData/table'

export const createOLAPDataTable = async ({ survey, cycle, chainId, entityDef }, client) => {
  const table = new TableOlapData({ survey, cycle, chainId, entityDef })

  return client.query(
    `CREATE TABLE
        ${table.nameQualified}
      (
        ${table.columnNamesAndTypes.join(', ')}
        PRIMARY KEY (${TableOlapData.baseColumnSet.id})
      )`
  )
}
