import { SRSFactory } from '@openforis/arena-core'

import { db } from '@server/db/db'

const DATUM_NAME_REGEX = /DATUM\["([\w\s]+)"/

const extractName = (row) => {
  const { auth_name, auth_srid, srtext: wkt } = row
  const datumNameMatch = wkt.match(DATUM_NAME_REGEX)

  const authNameAndCode = `${auth_name}:${auth_srid}`

  if (datumNameMatch) {
    const name = datumNameMatch[1].replaceAll(/_/g, ' ')
    return `${name} (${authNameAndCode})`
  }
  return authNameAndCode
}

const rowToSrs = (row) => {
  const { srid: code, srtext: wkt } = row
  const name = extractName(row)
  return SRSFactory.createInstance({ code, name, wkt })
}

export const fetchSRSsByCodes = async ({ srsCodes }, client = db) =>
  client.map(`SELECT * FROM spatial_ref_sys WHERE srid IN ($1:csv)`, [srsCodes], rowToSrs)

export const findSRSByCodeOrName = async (codeOrName, client = db) => {
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
