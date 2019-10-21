import * as R from 'ramda';
import fs from 'fs';
import { transform, stringify } from 'csv';
import StringUtils from '../../../core/stringUtils';

const _transformObj = obj => Object.entries(obj).reduce(
  (objAcc, [key, value]) => Object.assign(objAcc, { [key]: StringUtils.removeNewLines(value) }),
  {}
)

const transformToStream = (stream, columns) => {
  // @ts-ignore TODO
  const transformer = transform(_transformObj)
  transformer
    // @ts-ignore TODO
    .pipe(stringify({ quoted_string: true, header: true, columns }))
    .pipe(stream)
  return transformer
}

const writeToStream = (stream, data) => new Promise((resolve, reject) => {
  const transformer = transformToStream(stream, R.pipe(R.head, R.keys)(data))
  transformer
    .on('error', reject)
    .on('finish', resolve)

  data.forEach(row => transformer.write(row))
  transformer.end()
})

const writeToFile = (filePath, data) => writeToStream(fs.createWriteStream(filePath), data)

export default {
  transformToStream,
  writeToFile,
  writeToStream,
};
