import Stream from 'stream'
import { StreamParser } from '@json2csv/plainjs'

import { FlatDataWriterUtils } from './flatDataWriterUtils'
import { CsvField } from './csvField'

const getParserOptions = ({ fields, options: optionsParam = FlatDataWriterUtils.defaultOptions }) => {
  const options = { ...FlatDataWriterUtils.defaultOptions, ...optionsParam }
  const { objectTransformer = null } = options
  const transform = objectTransformer ?? FlatDataWriterUtils.defaultObjectTransformer(options)
  return { fields: CsvField.getNames(fields), transforms: [transform] }
}

export const writeItemsToStream = ({
  outputStream,
  items,
  fields: fieldsParam = null,
  options = FlatDataWriterUtils.defaultOptions,
}) =>
  new Promise((resolve, reject) => {
    try {
      const fields = fieldsParam ?? Object.keys(items[0] ?? {})

      const stream = new Stream.Readable({ objectMode: true, highWaterMark: 512 })
        .on('error', reject)
        .on('end', resolve)

      pipeDataStreamToStream({ stream, fields, options, outputStream })

      items.forEach((row) => stream.push(row))

      stream.push(null) // end of data
      stream.destroy()
    } finally {
      outputStream?.end()
    }
  })

export const pipeDataStreamToStream = ({ stream, fields, options, outputStream }) => {
  const parser = new StreamParser(getParserOptions({ fields, options }), {})

  parser.onData = (data) => outputStream.write(data)

  stream
    .on('data', (item) => {
      parser.pushLine(item)
    })
    .on('end', () => {
      parser.end()
    })
}
