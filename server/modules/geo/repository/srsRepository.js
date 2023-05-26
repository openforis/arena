import { SRSFactory } from '@openforis/arena-core'

import { db } from '@server/db/db'

const DATUM_NAME_REGEX = /DATUM\["([\w\s]+)"/

const extractName = (row) => {
  const { auth_name, auth_srid, srtext: wkt } = row
  const datumNameMatch = wkt.match(DATUM_NAME_REGEX)
  if (datumNameMatch) {
    return datumNameMatch[1].replaceAll(/_/g, ' ')
  }
  return `${auth_name}:${auth_srid}`
}

export const fetchSrssByCodes = async ({ srsCodes }, client = db) =>
  client.map(`SELECT * FROM spatial_ref_sys WHERE srid IN ($1:csv)`, [srsCodes], (row) => {
    const { srid: code, srtext: wkt } = row
    const name = extractName(row)
    return SRSFactory.createInstance({ code, name, wkt })
  })
