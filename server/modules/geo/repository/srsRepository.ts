import { SRSFactory } from '@openforis/arena-core'

import { db, DbClient } from '@server/db/db'

const DATUM_NAME_REGEX = /DATUM\["([\w\s]+)"/

const extractName = (row: any) => {
  const { auth_name, auth_srid, srtext: wkt } = row
  const datumNameMatch = wkt.match(DATUM_NAME_REGEX)

  const authNameAndCode = `${auth_name}:${auth_srid}`

  if (datumNameMatch) {
    const name = datumNameMatch[1].replaceAll('_', ' ')
    return `${name} (${authNameAndCode})`
  }
  return authNameAndCode
}

const rowToSrs = (row: any) => {
  const { srid: code, srtext: wkt } = row
  const name = extractName(row)
  return SRSFactory.createInstance({ code: String(code), name, wkt })
}

/**
 * Fetches the SRSs with the specified codes.
 * @param {object} params - The parameters.
 * @param {string[]} params.srsCodes - The SRS codes.
 * @param {import('@server/db/db').DbClient} [client] - The database client.
 * @returns {Promise<import('@openforis/arena-core').ArenaSRS[]>} - The SRSs.
 */
export const fetchSRSsByCodes = ({ srsCodes }: { srsCodes: string[] }, client: DbClient = db) =>
  // "IN ()" is not valid SQL
  srsCodes.length === 0
    ? Promise.resolve([])
    : client.map(`SELECT * FROM spatial_ref_sys WHERE srid IN ($1:csv)`, [srsCodes], rowToSrs)

export const findSRSByCodeOrName = (codeOrName: string, client: DbClient = db) => {
  const codeOrNameTrimmed = codeOrName.trim().toLowerCase()
  const codeSearch = `${codeOrNameTrimmed}%`
  const nameSearch = `%DATUM[%${codeOrNameTrimmed}%`

  return client.map(
    `SELECT * 
    FROM spatial_ref_sys 
    WHERE srid::text LIKE $/codeSearch/ 
      OR LOWER(srtext) LIKE $/nameSearch/
      OR LOWER(CONCAT(auth_name, ':', auth_srid)) LIKE $/codeSearch/ `,
    { codeSearch, nameSearch },
    rowToSrs
  )
}
