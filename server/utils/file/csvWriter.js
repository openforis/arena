import { format } from '@fast-csv/format'

import { FlatDataWriterUtils } from './flatDataWriterUtils'
import { CsvField } from './csvField'

const transformJsonToCsv = ({ fields, options: optionsParam = FlatDataWriterUtils.defaultOptions }) => {
  const options = { ...FlatDataWriterUtils.defaultOptions, ...optionsParam }
  const { objectTransformer = null } = options
  const rowTransformer = objectTransformer ?? FlatDataWriterUtils.defaultObjectTransformer(options)
  const fieldNames = CsvField.getNames(fields)
  return format({
    headers: fieldNames ?? true, // if fieldNames is null or undefined, include all fields
    quoteColumns: true,
    transform: (row) => rowTransformer(row), // use this syntax to avoid passing callback function to rowTranformer callback
  })
}

export const writeItemsToStream = ({
  outputStream,
  items,
  fields: fieldsParam = null,
  options = FlatDataWriterUtils.defaultOptions,
}) =>
  new Promise((resolve, reject) => {
    const fields = fieldsParam ?? Object.keys(items[0] ?? {})
    const transform = transformJsonToCsv({ fields, options })
    transform.pipe(outputStream)
    transform.on('error', reject)
    transform.on('finish', resolve)

    for (const row of items) {
      transform.write(row)
    }
    transform.end()
  })

export const pipeDataStreamToStream = ({ stream, fields, options, outputStream }) => {
  const csvTransform = transformJsonToCsv({ fields, options })
  return stream.pipe(csvTransform).pipe(outputStream)
}
