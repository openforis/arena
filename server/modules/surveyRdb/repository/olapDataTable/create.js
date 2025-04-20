import TableOlapData from '@common/model/db/tables/olapData/table'

export const createOlapDataTable = async ({ survey, cycle, chain, entityDef }, client) => {
  const table = new TableOlapData({ survey, cycle, chain, entityDef })

  return client.query(
    `CREATE TABLE
        ${table.nameQualified}
      (
        ${table.columnNamesAndTypes.join(', ')}
        PRIMARY KEY (${TableOlapData.baseColumnSet.id})
      )`
  )
}
