import fs from 'fs'
import { load as csvLoadSync } from 'csv-load-sync'
import * as csv from '@fast-csv/parse'

export const parseCsv = (filePath) => csvLoadSync(filePath)

export const parseCsvAsync = async (filePath) =>
  new Promise((resolve, reject) => {
    const csvContent = fs.readFileSync(filePath)
    const data = []
    const stream = csv
      .parse()
      .on('data', (row) => data.push(row))
      .on('error', (error) => reject(error))
      .on('end', () => resolve(data))
    stream.write(csvContent)
    stream.end()
  })
