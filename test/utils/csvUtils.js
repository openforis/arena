import fs from 'fs'
import { parse } from 'csv/sync'

export const parseCsv = (filePath) => parse(fs.readFileSync(filePath), { columns: true, skip_empty_lines: true })
