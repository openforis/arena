import fs from 'node:fs'
import path from 'node:path'

import AdmZip from 'adm-zip'
import { expect, Page, TestInfo } from '@playwright/test'

import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'
import { TestId } from '@webapp/utils/testId'

import { taxa } from '../fixtures/seed/sampleRecordDisplay'
import {
  category,
  cluster,
  flattenCategoryItems,
  plot,
  SampleNodeDef,
  SampleRecord,
  taxonomy,
  tree,
} from '../fixtures/seed/sampleSurveyModel'
import { Urls } from './urls'

type AnyObject = Record<string, any>

const getProps = (obj: AnyObject): AnyObject => ({ ...obj.props, ...obj.propsDraft })

/**
 * Reads the entries of an extracted survey export (Arena backup) file.
 */
export class SurveyExport {
  constructor(
    readonly zipPath: string,
    private readonly dirPath: string
  ) {}

  entry(entryPath: string): any {
    return JSON.parse(fs.readFileSync(path.join(this.dirPath, entryPath), 'utf8'))
  }

  hasEntry(entryPath: string): boolean {
    return fs.existsSync(path.join(this.dirPath, entryPath))
  }

  get survey(): AnyObject {
    return this.entry(ExportFile.survey)
  }

  get nodeDefs(): AnyObject[] {
    return Object.values(this.survey.nodeDefs)
  }

  nodeDefByName(name: string): AnyObject {
    return this.nodeDefs.find((nodeDef) => getProps(nodeDef).name === name)!
  }

  childDefs(parentDef: AnyObject): AnyObject[] {
    return this.nodeDefs.filter((nodeDef) => nodeDef.parentUuid === parentDef.uuid && !nodeDef.analysis)
  }
}

/**
 * Exports the current survey from the dashboard, downloads and extracts the export file.
 * @param {Page} page - The page.
 * @param {TestInfo} testInfo - Test info (the file is saved in the test output folder).
 * @param {object} [options] - Options.
 * @param {boolean} [options.withData] - Whether to include the data (records); for templates only the survey is exported.
 * @returns {Promise<SurveyExport>} - The extracted survey export.
 */
export const exportSurvey = async (
  page: Page,
  testInfo: TestInfo,
  { withData = true }: { withData?: boolean } = {}
): Promise<SurveyExport> => {
  await page.goto(Urls.dashboard)
  await page.getByTestId(TestId.dashboard.surveyExportBtn).click()
  await page
    .getByTestId(withData ? TestId.dashboard.surveyExportWithDataBtn : TestId.dashboard.surveyExportOnlySurveyBtn)
    .click()

  const downloadBtn = page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Download' })
  await expect(downloadBtn).toBeVisible({ timeout: 30_000 })
  const [download] = await Promise.all([page.waitForEvent('download'), downloadBtn.click()])

  const zipPath = testInfo.outputPath('survey_export.zip')
  await download.saveAs(zipPath)
  const dirPath = testInfo.outputPath('survey_export')
  new AdmZip(zipPath).extractAllTo(dirPath, true)
  return new SurveyExport(zipPath, dirPath)
}

// ===== verification of the sample survey export

export const verifySurveyInfo = (
  surveyExport: SurveyExport,
  expected: { name: string; labels?: Record<string, string>; languages?: string[] }
): void => {
  const props = getProps(surveyExport.survey)
  expect(props.name).toBe(expected.name)
  if (expected.labels) expect(props.labels).toEqual(expected.labels)
  expect(props.languages).toEqual(expected.languages ?? ['en'])
}

const verifyChildDefs = (surveyExport: SurveyExport, parentName: string, children: Record<string, SampleNodeDef>) => {
  const parentDef = surveyExport.nodeDefByName(parentName)
  const childDefs = surveyExport.childDefs(parentDef)
  const attributeDefs = childDefs.filter((nodeDef) => nodeDef.type !== 'entity')
  const sortNames = (names: string[]) => [...names].sort((nameA, nameB) => nameA.localeCompare(nameB))
  expect(sortNames(attributeDefs.map((nodeDef) => getProps(nodeDef).name))).toEqual(sortNames(Object.keys(children)))
  for (const nodeDef of attributeDefs) {
    const expected = children[getProps(nodeDef).name]
    expect(nodeDef.type).toBe(expected.type)
    expect(getProps(nodeDef).labels.en).toBe(expected.label)
    expect(Boolean(getProps(nodeDef).key)).toBe(Boolean(expected.key))
  }
}

export const verifySampleNodeDefs = (surveyExport: SurveyExport): void => {
  const rootDef = surveyExport.nodeDefs.find((nodeDef) => !nodeDef.parentUuid)!
  expect(getProps(rootDef).name).toBe(cluster.name)
  expect(getProps(rootDef).labels.en).toBe(cluster.label)

  verifyChildDefs(surveyExport, cluster.name, cluster.children)
  verifyChildDefs(surveyExport, plot.name, plot.children)
  verifyChildDefs(surveyExport, tree.name, tree.children)

  // country -> region -> province hierarchy
  const [countryDef, regionDef, provinceDef] = ['cluster_country', 'cluster_region', 'cluster_province'].map((name) =>
    surveyExport.nodeDefByName(name)
  )
  expect(getProps(countryDef).parentCodeDefUuid ?? null).toBeNull()
  expect(getProps(regionDef).parentCodeDefUuid).toBe(countryDef.uuid)
  expect(getProps(provinceDef).parentCodeDefUuid).toBe(regionDef.uuid)
  expect(getProps(countryDef).categoryUuid).toBeTruthy()
  expect(getProps(regionDef).categoryUuid).toBe(getProps(countryDef).categoryUuid)
  expect(getProps(provinceDef).categoryUuid).toBe(getProps(countryDef).categoryUuid)
}

export const verifySampleCategories = (surveyExport: SurveyExport): void => {
  const categoriesExport = Object.values(surveyExport.entry(ExportFile.categories)) as AnyObject[]
  expect(categoriesExport).toHaveLength(1)
  const [categoryExport] = categoriesExport
  expect(getProps(categoryExport).name).toBe(category.name)
  expect(Object.values(categoryExport.levels).map((level: any) => getProps(level).name)).toEqual(
    category.levels.map((level) => level.name)
  )
  const itemsExport: AnyObject[] = surveyExport.entry(
    ExportFile.categoryItemsSingleFile({ categoryUuid: categoryExport.uuid })
  )
  const expectedItems = flattenCategoryItems()
  expect(itemsExport).toHaveLength(expectedItems.length)
  for (const itemExport of itemsExport) {
    const expectedItem = expectedItems.find((item) => item.code === getProps(itemExport).code)!
    expect(getProps(itemExport).labels.en).toBe(expectedItem.label)
  }
}

export const verifySampleTaxonomies = (surveyExport: SurveyExport): void => {
  const taxonomiesExport = Object.values(surveyExport.entry(ExportFile.taxonomies)) as AnyObject[]
  expect(taxonomiesExport).toHaveLength(1)
  const [taxonomyExport] = taxonomiesExport
  expect(getProps(taxonomyExport).name).toBe(taxonomy.name)
  expect(getProps(taxonomyExport).descriptions.en).toBe(taxonomy.description)

  const taxaExport: AnyObject[] = surveyExport.entry(ExportFile.taxa({ taxonomyUuid: taxonomyExport.uuid }))
  expect(taxaExport).toHaveLength(taxa.length)
  for (const taxonExport of taxaExport) {
    const props = getProps(taxonExport)
    const expected = taxa.find((taxon) => taxon.code === props.code)!
    expect(props.family).toBe(expected.family)
    expect(props.genus).toBe(expected.genus)
    expect(props.scientificName).toBe(expected.scientific_name)
  }
}

export const verifySampleRecords = (surveyExport: SurveyExport, expectedRecords: SampleRecord[]): void => {
  const recordsExport: AnyObject[] = surveyExport.entry(ExportFile.records)
  expect(recordsExport).toHaveLength(expectedRecords.length)

  const defUuid = (name: string) => surveyExport.nodeDefByName(name).uuid
  for (const recordSummary of recordsExport) {
    const recordExport = surveyExport.entry(ExportFile.record({ recordUuid: recordSummary.uuid }))
    const nodes = Object.values(recordExport.nodes) as AnyObject[]
    const nodesOf = (name: string) => nodes.filter((node) => node.nodeDefUuid === defUuid(name))
    const valueOf = (name: string) => nodesOf(name)[0]?.value

    const expected = expectedRecords.find((record) => record.cluster_id === valueOf('cluster_id'))!
    expect(expected, `record with cluster_id ${valueOf('cluster_id')} not expected`).toBeTruthy()
    expect(recordExport.preview).toBeFalsy()
    expect(recordExport.step).toBe('1')
    expect(recordExport.cycle).toBe('0')

    expect(valueOf('cluster_decimal')).toBe(expected.cluster_decimal)
    expect(valueOf('cluster_date')).toBe(expected.cluster_date)
    expect(valueOf('cluster_time')).toBe(expected.cluster_time)
    expect(valueOf('cluster_boolean')).toBe(expected.cluster_boolean)
    expect(valueOf('cluster_coordinate')).toMatchObject(expected.cluster_coordinate)
    for (const codeName of ['cluster_country', 'cluster_region', 'cluster_province']) {
      expect(valueOf(codeName)?.itemUuid).toBeTruthy()
    }
    expect(valueOf('plot_id')).toBe(expected.plot_id)
    expect(valueOf('plot_text')).toBe(expected.plot_text)

    const treeIdNodes = nodesOf('tree_id')
    expect(treeIdNodes).toHaveLength(expected.trees.length)
    for (const expectedTree of expected.trees) {
      const treeIdNode = treeIdNodes.find((node) => node.value === expectedTree.tree_id)!
      const treeChildValue = (name: string) =>
        nodesOf(name).find((node) => node.parentUuid === treeIdNode.parentUuid)?.value
      expect(treeChildValue('tree_dec_1')).toBe(expectedTree.tree_dec_1)
      expect(treeChildValue('tree_dec_2')).toBe(expectedTree.tree_dec_2)
      expect(treeChildValue('tree_species')?.taxonUuid).toBeTruthy()
    }
  }
}
