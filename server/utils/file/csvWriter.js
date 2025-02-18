import { Transform } from 'json2csv'

import { FlatDataWriterUtils } from './flatDataWriterUtils'

export const transformJsonToCsv = ({ fields, options: optionsParam = FlatDataWriterUtils.defaultOptions }) => {
  const options = { ...FlatDataWriterUtils.defaultOptions, ...optionsParam }
  const { objectTransformer = null } = options
  const transform = objectTransformer ?? FlatDataWriterUtils.defaultObjectTransformer(options)
  const opts = { fields, transforms: [transform] }
  const transformOpts = {
    objectMode: true,
    highWaterMark: 512,
  }
  return new Transform(opts, transformOpts)
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
    transform.on('error', reject).on('finish', resolve)

    items.forEach((row) => transform.write(row))
    transform.end()
  })

export const pipeDataStreamToStream = ({ stream, fields, options, outputStream }) => {
  const csvTransform = transformJsonToCsv({ fields, options })
  stream.pipe(csvTransform).pipe(outputStream)
}
