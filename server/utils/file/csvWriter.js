import { format } from '@fast-csv/format'

import { FlatDataWriterUtils } from './flatDataWriterUtils'
import { CsvField } from './csvField'
import { StreamUtils } from '../streamUtils'

const transformJsonToCsv = ({ fields, options: optionsParam = FlatDataWriterUtils.defaultOptions }) => {
  const options = { ...FlatDataWriterUtils.defaultOptions, ...optionsParam }
  const { objectTransformer = null } = options
  const rowTransformer = objectTransformer ?? FlatDataWriterUtils.defaultObjectTransformer(options)
  const fieldNames = CsvField.getNames(fields)
  const formatOptions = {
    alwaysWriteHeaders: !!fieldNames, // alwaysWriteHeaders set to true throws an error if headers is not specified as an array
    headers: fieldNames ?? true, // if fieldNames is null or undefined, include all fields
    quoteColumns: true,
    transform: (row) => rowTransformer(row), // use this syntax to avoid passing callback function to rowTranformer callback
  }
  return format(formatOptions)
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
    const outputCompletePromise = StreamUtils.waitForWritableStreamComplete(outputStream)
    // attach error handlers before piping to catch any errors that may occur during the transformation or writing process
    outputCompletePromise.catch(reject)
    transform.pipe(outputStream)
    transform.on('error', reject)
    outputStream.on('error', reject)
    transform.on('finish', () => {
      outputCompletePromise.then(resolve)
    })

    for (const row of items) {
      transform.write(row)
    }
    transform.end()
  })

export const pipeDataStreamToStream = ({ stream, fields, options, outputStream }) => {
  const csvTransform = transformJsonToCsv({ fields, options })
  const outputCompletePromise = StreamUtils.waitForWritableStreamComplete(outputStream)
  stream.pipe(csvTransform).pipe(outputStream)
  return outputCompletePromise
}
