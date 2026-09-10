import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

const wgs84SrsId = '4326'

/**
 * Converts an ODK submission attribute's raw text content (the element's inner text, e.g.
 * "44.123 11.456 100 5" for a geopoint) into Arena node value(s). A `code` (single-select) attribute
 * resolves to one value; a `code` attribute with `multiple: true` (ODK `select`) resolves to an ARRAY
 * of values, one per space-separated selected code - the caller creates one sibling Node per entry,
 * the same way Arena represents any multi-select attribute (not a single array-valued node).
 * @param params - Function parameters.
 * @param params.survey - The Arena survey (for category item code lookup).
 * @param params.nodeDef - The Arena NodeDef the value is being extracted for.
 * @param params.categoryItemProvider - Provides `getItemByCode({ survey, categoryUuid, code, draft, client })`.
 * @param params.rawText - The submission element's raw text content, or null/empty if absent.
 * @param params.tx - The current DB transaction.
 * @returns The extracted value (or array of values, for multiple `code`), or null if there's nothing to set.
 */
export const extractAttributeValue = async ({
  survey,
  nodeDef,
  categoryItemProvider,
  rawText,
  tx,
}: {
  survey: any
  nodeDef: any
  categoryItemProvider: { getItemByCode: (params: any) => Promise<any> }
  rawText: string | null
  tx: any
}): Promise<any> => {
  const text = rawText?.trim() ?? ''
  if (!text) return null

  const type = NodeDef.getType(nodeDef)

  switch (type) {
    case NodeDef.nodeDefType.text:
      return text

    case NodeDef.nodeDefType.integer: {
      const parsed = Number.parseInt(text, 10)
      return Number.isNaN(parsed) ? null : parsed
    }

    case NodeDef.nodeDefType.decimal: {
      const parsed = Number.parseFloat(text)
      return Number.isNaN(parsed) ? null : parsed
    }

    case NodeDef.nodeDefType.date:
      // ODK's own date format is already ISO 8601 (YYYY-MM-DD) - no conversion needed
      return text

    case NodeDef.nodeDefType.time: {
      // ODK time format: HH:MM or HH:MM:SS(.sss)(+/-HH:MM) - only the HH:MM prefix is kept, matching
      // Arena's own time attribute precision
      const match = /^(\d{2}):(\d{2})/.exec(text)
      return match ? `${match[1]}:${match[2]}` : null
    }

    case NodeDef.nodeDefType.coordinate: {
      // ODK geopoint: "lat lon altitude accuracy" (space-separated, altitude/accuracy optional)
      const parts = text.split(/\s+/)
      const [latRaw, lonRaw, altitudeRaw, accuracyRaw] = parts
      const lat = Number.parseFloat(latRaw)
      const lon = Number.parseFloat(lonRaw)
      if (Number.isNaN(lat) || Number.isNaN(lon)) return null

      const altitude = altitudeRaw !== undefined ? Number.parseFloat(altitudeRaw) : undefined
      const accuracy = accuracyRaw !== undefined ? Number.parseFloat(accuracyRaw) : undefined

      return Node.newNodeValueCoordinate({
        x: lon,
        y: lat,
        srsId: wgs84SrsId,
        altitude: Number.isNaN(altitude as number) ? undefined : altitude,
        accuracy: Number.isNaN(accuracy as number) ? undefined : accuracy,
      })
    }

    case NodeDef.nodeDefType.code: {
      const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
      const codes = NodeDef.isMultiple(nodeDef) ? text.split(/\s+/) : [text]

      const values = []
      for (const code of codes) {
        const item = await categoryItemProvider.getItemByCode({ survey, categoryUuid, code, draft: true, client: tx })
        if (item) {
          values.push(Node.newNodeValueCode({ itemUuid: item.uuid }))
        }
      }
      if (values.length === 0) return null
      return NodeDef.isMultiple(nodeDef) ? values : values[0]
    }

    case NodeDef.nodeDefType.file:
      // the media filename itself - the caller (recordsImportJob) resolves it against the zip and
      // inserts the actual file, then sets the node value once the file record exists
      return text

    default:
      return null
  }
}
