import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'
import csv from 'csv/lib/sync'

import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'

import { survey } from '../mock/survey'

import { records } from '../mock/records'
import { gotoHome, gotoDataExport } from './_navigation'

import { downloadsPath } from '../downloads/path'
import { cluster, tree } from '../mock/nodeDefs'

let surveyZipPath = ''
let extractedFolderName = ''

/* eslint-disable camelcase */
const { cluster_decimal } = cluster.children
const { tree_dec_1 } = tree.children

export default () =>
  describe('Export data in csv', () => {
    gotoDataExport()

    test(`Export data ${survey.name}`, async () => {
      await page.click(getSelector(DataTestId.dataExport.prepareExport, 'button'))
      await page.waitForSelector(getSelector(DataTestId.modal.modal))
      await page.click(DataTestId.modal.close)

      await expect(getSelector(DataTestId.dataExport.exportCSV, 'button')).toBeTruthy()
    })

    test(`Download data`, async () => {
      const exportButton = await page.waitForSelector(getSelector(DataTestId.dataExport.exportCSV, 'button'))
      const exportZipName = await exportButton.innerText()

      const filename = exportZipName.replace(/ /g, '').split(/-(.+)/)[1]
      const zipFileName = `${filename}.zip`

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.waitForResponse('**/export-csv-data/**'),
        page.click(getSelector(DataTestId.dataExport.exportCSV, 'button')),
      ])

      surveyZipPath = path.resolve(downloadsPath, zipFileName)

      await download.saveAs(surveyZipPath)

      await expect(fs.existsSync(surveyZipPath)).toBeTruthy()

      const zip = new AdmZip(surveyZipPath)
      extractedFolderName = path.resolve(downloadsPath, filename)

      zip.extractAllTo(extractedFolderName, true, '')

      await expect(fs.existsSync(extractedFolderName)).toBeTruthy()

      await expect(fs.existsSync(path.resolve(extractedFolderName, 'cluster.csv'))).toBeTruthy()
      await expect(fs.existsSync(path.resolve(extractedFolderName, 'plot.csv'))).toBeTruthy()
      await expect(fs.existsSync(path.resolve(extractedFolderName, 'tree.csv'))).toBeTruthy()
    })

    test(`Check cluster data`, async () => {
      await expect(fs.existsSync(path.resolve(extractedFolderName, 'cluster.csv'))).toBeTruthy()

      const clusterData = csv.parse(fs.readFileSync(path.resolve(extractedFolderName, 'cluster.csv')), {
        columns: true,
        skip_empty_lines: true,
      })

      await expect(clusterData.length).toBe(records.length)

      await Promise.all(
        clusterData.map(async (_cluster) => {
          await expect(
            records.some(
              (record) =>
                Number(record[cluster_decimal.name]).toFixed(2) === Number(_cluster.cluster_decimal).toFixed(2)
            )
          ).toBeTruthy()
        })
      )
    })

    test(`Check plot data`, async () => {
      await expect(fs.existsSync(path.resolve(extractedFolderName, 'plot.csv'))).toBeTruthy()

      const plotData = csv.parse(fs.readFileSync(path.resolve(extractedFolderName, 'plot.csv')), {
        columns: true,
        skip_empty_lines: true,
      })

      const mockPlots = records.flatMap((record) => record.plot_id)

      await expect(mockPlots.length).toBe(plotData.length)
    })

    test(`Check tree data`, async () => {
      await expect(fs.existsSync(path.resolve(extractedFolderName, 'tree.csv'))).toBeTruthy()

      const treeData = csv.parse(fs.readFileSync(path.resolve(extractedFolderName, 'tree.csv')), {
        columns: true,
        skip_empty_lines: true,
      })

      const mockTrees = records.flatMap((record) => record.trees)

      await expect(mockTrees.length).toBe(treeData.length)

      await Promise.all(
        treeData.map(async (_tree) => {
          await expect(
            mockTrees.some(
              (mockTree) => Number(_tree[tree_dec_1.name]).toFixed(2) === Number(mockTree[tree_dec_1.name]).toFixed(2)
            )
          ).toBeTruthy()
        })
      )
    })

    gotoHome()
  })
