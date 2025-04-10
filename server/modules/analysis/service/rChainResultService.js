import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'fast-csv'

import * as ProcessUtils from '@core/processUtils'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as NodeDef from '@core/survey/nodeDef'

import * as RChainResultRepository from '../repository/rChainResultRepository'

// Directory where CSV results will be stored
const getResultsDir = (surveyId, chainUuid) =>
  path.join(ProcessUtils.ENV.analysisOutputDir, `survey_${surveyId}`, 'results', chainUuid)

// Ensure the results directory exists
const ensureResultsDir = async (surveyId, chainUuid) => {
  const dir = getResultsDir(surveyId, chainUuid)
  await FileUtils.mkdir(dir, { recursive: true })
  return dir
}

// Save a result dataframe to CSV
export const saveResultToCsv = async ({ surveyId, chainUuid, cycle, entityDef, data, tx }) => {
  // Ensure results directory exists
  const resultsDir = await ensureResultsDir(surveyId, chainUuid)

  // Generate filename based on entity name and timestamp
  const entityName = NodeDef.getName(entityDef)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${entityName}_${timestamp}.csv`
  const filePath = path.join(resultsDir, fileName)

  // Write data to CSV file
  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath)

    csv.write(data, { headers: true }).pipe(writeStream).on('finish', resolve).on('error', reject)
  })

  // Get file size
  const stats = await fs.promises.stat(filePath)
  const fileSize = stats.size

  // Store metadata in database
  const result = await RChainResultRepository.insertResult(
    {
      surveyId,
      chainUuid,
      cycle,
      entityDefUuid: NodeDef.getUuid(entityDef),
      fileName,
      filePath,
      fileSize,
    },
    tx
  )

  return result
}

// Fetch results with filtering options
export const fetchResults = async ({
  surveyId,
  chainUuid = null,
  entityDefUuid = null,
  fromDate = null,
  toDate = null,
  limit = null,
  offset = 0,
  tx,
}) => {
  // Build query conditions
  const conditions = []
  const params = []

  // Always filter by survey ID
  conditions.push(`survey_id = $${params.length + 1}`)
  params.push(surveyId)

  // Optional filters
  if (chainUuid) {
    conditions.push(`chain_uuid = $${params.length + 1}`)
    params.push(chainUuid)
  }

  if (entityDefUuid) {
    conditions.push(`entity_def_uuid = $${params.length + 1}`)
    params.push(entityDefUuid)
  }

  if (fromDate) {
    conditions.push(`date_created >= $${params.length + 1}`)
    params.push(fromDate)
  }

  if (toDate) {
    conditions.push(`date_created <= $${params.length + 1}`)
    params.push(toDate)
  }

  // Build query
  const query = `
    SELECT * FROM r_chain_result
    WHERE ${conditions.join(' AND ')}
    ORDER BY date_created DESC
    ${limit ? `LIMIT ${limit}` : ''}
    OFFSET ${offset}
  `

  // Execute query
  const results = await tx.any(query, params)

  return results
}

// Read CSV data from a result
export const readResultData = async ({ filePath, filterOptions = {} }) => {
  // Check if file exists
  if (!(await FileUtils.exists(filePath))) {
    throw new Error(`Result file not found: ${filePath}`)
  }

  // Read CSV file
  const rows = []

  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on('data', (row) => {
        // Apply filters if specified
        let includeRow = true

        Object.entries(filterOptions).forEach(([key, value]) => {
          if (row[key] !== value) {
            includeRow = false
          }
        })

        if (includeRow) {
          rows.push(row)
        }
      })
      .on('error', reject)
      .on('end', resolve)
  })

  return rows
}

// Delete a result and its file
export const deleteResult = async ({ id, tx }) => {
  // Get result metadata
  const result = await RChainResultRepository.fetchResultById({ id }, tx)

  if (!result) {
    throw new Error(`Result not found: ${id}`)
  }

  // Delete file
  if (await FileUtils.exists(result.filePath)) {
    await fs.promises.unlink(result.filePath)
  }

  // Delete from database
  await RChainResultRepository.deleteResultById({ id }, tx)
}

// Create OLAP view from results
export const createOlapView = async ({
  surveyId,
  chainUuid,
  entityDefUuid,
  dimensions = [],
  measures = [],
  filters = {},
  tx,
}) => {
  // Fetch results metadata
  const results = await fetchResults({
    surveyId,
    chainUuid,
    entityDefUuid,
    tx,
  })

  if (results.length === 0) {
    return []
  }

  // Read data from all matching result files
  const allData = []

  for (const result of results) {
    const rows = await readResultData({
      filePath: result.filePath,
      filterOptions: filters,
    })

    allData.push(...rows)
  }

  // Process data for OLAP view
  const olapData = allData.map((row) => {
    const olapRow = {}

    // Extract dimensions
    dimensions.forEach((dimension) => {
      olapRow[dimension] = row[dimension]
    })

    // Extract measures
    measures.forEach((measure) => {
      olapRow[measure] = parseFloat(row[measure]) || 0
    })

    return olapRow
  })

  return olapData
}
