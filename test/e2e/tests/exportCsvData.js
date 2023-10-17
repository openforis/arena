import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'

import { TestId, getSelector } from '../../../webapp/utils/testId'

import { survey } from '../mock/survey'

import { records } from '../mock/records'
import { gotoHome, gotoDataExport } from './_navigation'

import { downloadsPath } from '../paths'
import { cluster, tree, plot } from '../mock/nodeDefs'
import * as DateUtils from '../../../core/dateUtils'
import { parseCsvAsync } from '../../utils/csvUtils'

let extractedFolderName = ''

/* eslint-disable camelcase */
const {
  cluster_time,
  cluster_boolean,
  // cluster_coordinate,
  cluster_decimal,
  cluster_country,
  cluster_region,
  cluster_province,
} = cluster.children

const { plot_id, plot_text } = plot.children
const { tree_dec_1, tree_dec_2, tree_species } = tree.children

const getCodeAndLabel = (value) => {
  const code = value.match(new RegExp(/\([0-9]+\)/))[0].replace(/\D/g, '') // extract code in parenthesis
  const label = value.replace(/ \([0-9]+\)/, '') // remove " (code)" suffix
  return { code, label }
}
export default () =>
  describe('Export data in csv', () => {
    gotoDataExport()

    test(`Export data ${survey.name}`, async () => {
      const prepareExportBtnSelector = getSelector(TestId.dataExport.prepareExport, 'button')
      await page.waitForSelector(prepareExportBtnSelector)

      // click on the export button and wait for the job dialog to open
      await Promise.all([page.waitForSelector(getSelector(TestId.modal.modal)), page.click(prepareExportBtnSelector)])

      // wait for the job to complete: export button will appear
      const downloadBtnSelector = getSelector(TestId.dataExport.exportCSV, 'button')
      await page.waitForSelector(downloadBtnSelector)

      await expect(downloadBtnSelector).toBeTruthy()
    })

    test(`Download data`, async () => {
      const filename = `${survey.name}_export`
      const zipFileName = `${filename}.zip`

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click(getSelector(TestId.dataExport.exportCSV, 'button')),
      ])

      const surveyZipPath = path.resolve(downloadsPath, zipFileName)

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
      const clusterFilePath = path.resolve(extractedFolderName, 'cluster.csv')
      await expect(fs.existsSync(clusterFilePath)).toBeTruthy()

      const clusterData = await parseCsvAsync(clusterFilePath)

      await expect(clusterData.length).toBe(records.length)

      await Promise.all(
        clusterData.map(async (_cluster) => {
          const mockRecord = records.find(
            (record) => Number(record[cluster_decimal.name]).toFixed(2) === Number(_cluster.cluster_decimal).toFixed(2)
          )
          await expect(mockRecord).toBeTruthy()

          await expect(Number(_cluster.cluster_decimal).toFixed(2)).toBe(
            Number(mockRecord[cluster_decimal.name]).toFixed(2)
          )

          // await expect(_cluster.cluster_coordinate).toBe(mockRecord[cluster_coordinate.name])

          await expect(_cluster.cluster_time).toBe(DateUtils.format(mockRecord[cluster_time.name], 'HH:mm'))
          await expect(String(_cluster.cluster_boolean)).toBe(String(mockRecord[cluster_boolean.name]))

          const { code: countryCode, label: countryLabel } = getCodeAndLabel(mockRecord[cluster_country.name])
          await expect(_cluster.cluster_country).toBe(countryCode)
          await expect(_cluster.cluster_country_label).toBe(countryLabel)

          const { code: regionCode, label: regionLabel } = getCodeAndLabel(mockRecord[cluster_region.name])
          await expect(_cluster.cluster_region).toBe(regionCode)
          await expect(_cluster.cluster_region_label).toBe(regionLabel)

          const { code: provinceCode, label: provinceLabel } = getCodeAndLabel(mockRecord[cluster_province.name])
          await expect(_cluster.cluster_province).toBe(provinceCode)
          await expect(_cluster.cluster_province_label).toBe(provinceLabel)
        })
      )
    })

    test(`Check plot data`, async () => {
      const plotFilePath = path.resolve(extractedFolderName, 'plot.csv')
      await expect(fs.existsSync(plotFilePath)).toBeTruthy()

      const plotData = await parseCsvAsync(plotFilePath)

      const mockPlots = records.flatMap((record) => ({
        plot_id: record.plot_id,
        plot_text: record.plot_text,
      }))

      await expect(mockPlots.length).toBe(plotData.length)

      await Promise.all(
        plotData.map(async (_plot) => {
          const mockPlot = mockPlots.find(
            (_mockPlot) => String(_mockPlot[plot_id.name]) === String(_plot[plot_id.name])
          )
          await expect(mockPlot).toBeTruthy()
          await expect(mockPlot[plot_text.name]).toBe(_plot[plot_text.name])
        })
      )
    })

    test(`Check tree data`, async () => {
      const treeFilePath = path.resolve(extractedFolderName, 'tree.csv')
      await expect(fs.existsSync(treeFilePath)).toBeTruthy()

      const treeData = await parseCsvAsync(treeFilePath)

      const mockTrees = records.flatMap((record) => record.trees)

      await expect(mockTrees.length).toBe(treeData.length)

      await Promise.all(
        treeData.map(async (_tree) => {
          const mockTree = mockTrees.find(
            (_mockTree) => Number(_tree[tree_dec_1.name]).toFixed(2) === Number(_mockTree[tree_dec_1.name]).toFixed(2)
          )

          await expect(mockTree).toBeTruthy()
          await expect(Number(mockTree[tree_dec_1.name]).toFixed(2)).toBe(Number(_tree[tree_dec_1.name]).toFixed(2))
          await expect(Number(mockTree[tree_dec_2.name]).toFixed(2)).toBe(Number(_tree[tree_dec_2.name]).toFixed(2))

          await expect(mockTree[tree_species.name].code).toBe(_tree.tree_species)
          await expect(mockTree[tree_species.name].scientificName).toBe(_tree.tree_species_scientific_name)
        })
      )
    })

    gotoHome()
  })
