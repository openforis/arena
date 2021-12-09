import fs from 'fs'
import { load as csvLoadSync } from 'csv-load-sync'
import { parse as parseAsync } from 'csv'

export const parseCsv = (filePath) => csvLoadSync(filePath)

export const parseCsvAsync = async (filePath) =>
  new Promise((resolve, reject) => {
    const csvContent = fs.readFileSync(filePath)
    parseAsync(csvContent, { columns: true, skip_empty_lines: true }, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
