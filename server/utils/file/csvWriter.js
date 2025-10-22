import { format } from '@fast-csv/format'

import { FlatDataWriterUtils } from './flatDataWriterUtils'
import { CsvField } from './csvField'

const transformJsonToCsv = ({ fields, options: optionsParam = FlatDataWriterUtils.defaultOptions }) => {
  const options = { ...FlatDataWriterUtils.defaultOptions, ...optionsParam }
  const { objectTransformer = null } = options
  const rowTransformer = objectTransformer ?? FlatDataWriterUtils.defaultObjectTransformer(options)
  const fieldNames = CsvField.getNames(fields)
  return format({ headers: fieldNames, quoteColumns: true }).transform(rowTransformer)
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
      .pipe(outputStream)
      .on('error', reject)
      .on('finish', resolve)

    items.forEach((row) => transform.write(row))
    transform.end()
  })

export const pipeDataStreamToStream = ({ stream, fields, options, outputStream }) => {
  const csvTransform = transformJsonToCsv({ fields, options })
  return stream.pipe(csvTransform).pipe(outputStream)
}
