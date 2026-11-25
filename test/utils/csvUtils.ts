import { parse } from '@fast-csv/parse'
import { load as csvLoadSync } from 'csv-load-sync'
import fs from 'node:fs'

export const parseCsv = (filePath) => csvLoadSync(filePath)

export const parseCsvAsync = (filePath) =>
  new Promise((resolve, reject) => {
    const csvContent = fs.readFileSync(filePath)
    const data = []
    const stream = parse({ headers: true })
      .on('data', (row) => data.push(row))
      .on('error', (error) => reject(error))
      .on('end', () => resolve(data))
    stream.write(csvContent)
    stream.end()
  })
