import { SRSFactory } from '@openforis/arena-core'

import { db, DbClient } from '@server/db/db'

const DATUM_NAME_REGEX = /DATUM\["([\w\s]+)"/

// row of the PostGIS spatial_ref_sys table
type SpatialRefSysRow = { srid: number; auth_name: string; auth_srid: number; srtext: string }

const extractName = (row: SpatialRefSysRow) => {
  const { auth_name, auth_srid, srtext: wkt } = row
  const datumNameMatch = DATUM_NAME_REGEX.exec(wkt)

  const authNameAndCode = `${auth_name}:${auth_srid}`

  if (datumNameMatch) {
    const name = datumNameMatch[1].replaceAll('_', ' ')
    return `${name} (${authNameAndCode})`
  }
  return authNameAndCode
}

const rowToSrs = (row: SpatialRefSysRow) => {
  const { srid: code, srtext: wkt } = row
  const name = extractName(row)
  return SRSFactory.createInstance({ code: String(code), name, wkt })
}

/**
 * Fetches the SRSs with the specified codes.
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
