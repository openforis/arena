import { ArenaServer } from '@openforis/arena-server'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as ObjectUtils from '@core/objectUtils'
import * as Taxon from '@core/survey/taxon'
import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import { SurveyCompareApplicabilityStatus, SurveyCompareStatus, getAllChanges } from '@core/survey/surveyCompare'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefService from '@server/modules/nodeDef/service/nodeDefService'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import SurveyCompareJob from '@server/modules/surveyCompare/service/surveyCompareJob'
import SurveyCompareApplyJob from '@server/modules/surveyCompare/service/surveyCompareApplyJob'
import * as SurveyCompareService from '@server/modules/surveyCompare/service/surveyCompareService'

import * as SB from '../../utils/surveyBuilder'
import * as SurveyUtils from '../../utils/surveyUtils'
import { getContextUser } from '../config/context'

const cycle = Survey.cycleOneKey

const exportSurvey = async ({ user, surveyId }) => {
  const exportJob = new SurveyExportJob({ surveyId, user, backup: false })
  await exportJob.start()
  if (!exportJob.isSucceeded()) throw new Error('Survey export failed')
  return (exportJob as any).context.filePath
}

const fetchSurvey = async (surveyId: number) =>
  SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })

const runCompare = async ({ user, surveyId, filePath = undefined, sourceFileName = undefined }) => {
  const job = new SurveyCompareJob({ user, surveyId, filePath, sourceFileName })
  await job.start()
  expect(job.isSucceeded()).toBe(true)
  const { resultFileName, sourceFileName: sourceFileNameResult } = job.result as any
  const result = await SurveyCompareService.readSurveyCompareResult({ resultFileName })
  return { result, sourceFileName: sourceFileNameResult }
}

describe('Survey compare: apply changes made in another environment', () => {
  let devSurveyId: number
  let qaSurveyId: any

  beforeAll(async () => {
    ArenaServer.initServices()
    const user = getContextUser()

    // "Dev" survey
    const devSurvey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
        SB.entity(
          'tree',
          SB.attribute('tree_id', NodeDef.nodeDefType.integer).key(),
          SB.attribute('species', NodeDef.nodeDefType.code).category('tree_species'),
          SB.attribute('dbh', NodeDef.nodeDefType.decimal)
        ).multiple()
      )
    )
      .categories(
        SB.category('tree_species')
          .levels('species')
          .items(SB.categoryItem('1').label('Oak'), SB.categoryItem('2').label('Pine'))
      )
      .buildAndStore()
    devSurveyId = Survey.getId(devSurvey)

    // "QA" survey: imported from the Dev export (same uuids), then published
    const importJob = new ArenaImportJob({
      filePath: await exportSurvey({ user, surveyId: devSurveyId }),
      user,
      backup: false,
    })
    await importJob.start()
    if (!importJob.isSucceeded()) throw new Error('Survey import failed')
    qaSurveyId = (importJob.result as any).surveyId
    await SurveyUtils.publishSurvey(user, qaSurveyId)

    // changes in Dev: new attribute, validation expression, new category item
    let dev = await fetchSurvey(devSurveyId)
    const treeDef = Survey.getNodeDefByName('tree')(dev)
    await NodeDefService.insertNodeDef({
      user,
      surveyId: devSurveyId,
      cycle,
      nodeDef: NodeDef.newNodeDef(treeDef, NodeDef.nodeDefType.decimal, [cycle], { name: 'height' }),
    })
    dev = await fetchSurvey(devSurveyId)
    const dbhDef = Survey.getNodeDefByName('dbh')(dev)
    await NodeDefService.updateNodeDefProps({
      user,
      surveyId: devSurveyId,
      cycle,
      nodeDefUuid: NodeDef.getUuid(dbhDef),
      parentUuid: NodeDef.getParentUuid(dbhDef),
      propsAdvanced: {
        [NodeDef.keysPropsAdvanced.validations]: NodeDefValidations.assocExpressions([
          NodeDefExpression.createExpression({ expression: 'dbh < height' }),
        ])(NodeDef.getValidations(dbhDef)),
      },
    })
    const category = Survey.getCategoryByName('tree_species')(dev)
    const [level] = Category.getLevelsArray(category)
    await CategoryManager.insertItem(
      user,
      devSurveyId,
      Category.getUuid(category),
      CategoryItem.newItem(level.uuid, null, { code: '3', labels: { en: 'Fir' } })
    )
  }, 60000)

  afterAll(async () => {
    if (devSurveyId) await SurveyManager.deleteSurvey(devSurveyId)
    if (qaSurveyId) await SurveyManager.deleteSurvey(qaSurveyId)
  })

  test('differences are detected and applied to the QA survey', async () => {
    const user = getContextUser()
    const devExportFilePath = await exportSurvey({ user, surveyId: devSurveyId })

    const { result, sourceFileName } = await runCompare({ user, surveyId: qaSurveyId, filePath: devExportFilePath })
    expect(result.identical).toBe(false)
    expect(result.counts.nodeDefs).toEqual({ added: 1, changed: 2, removed: 0 })
    expect(result.counts.categories.changed).toBe(1)

    const selectedIds = [...result.nodeDefs, ...result.categories]
      .filter((diff) => diff.applicability?.status === SurveyCompareApplicabilityStatus.applicable)
      .map((diff) => diff.id)

    // the API passes numeric survey ids
    const applyJob = new SurveyCompareApplyJob({ user, surveyId: Number(qaSurveyId), sourceFileName, selectedIds })
    await applyJob.start()
    expect(applyJob.isSucceeded()).toBe(true)
    expect((applyJob.result as any).skippedIds).toEqual([])

    const dev = await fetchSurvey(devSurveyId)
    const qa = await fetchSurvey(qaSurveyId)
    const devHeight = Survey.getNodeDefByName('height')(dev)
    const qaHeight = Survey.getNodeDefByName('height')(qa)
    expect(NodeDef.getUuid(qaHeight)).toBe(NodeDef.getUuid(devHeight))
    expect(NodeDef.isPublished(qaHeight)).toBe(false)

    const qaTree = Survey.getNodeDefByName('tree')(qa)
    const qaTreeChildrenInLayout = NodeDefLayout.getLayoutChildren(cycle)(qaTree).map((child) => child.i)
    expect(qaTreeChildrenInLayout).toContain(NodeDef.getUuid(qaHeight))

    const qaDbhExpressions = NodeDefValidations.getExpressions(
      NodeDef.getValidations(Survey.getNodeDefByName('dbh')(qa))
    )
    expect(qaDbhExpressions.map(NodeDefExpression.getExpression)).toEqual(['dbh < height'])

    const qaCategory = Survey.getCategoryByName('tree_species')(qa)
    const qaItems = await CategoryService.fetchItemsByCategoryUuid({
      surveyId: qaSurveyId,
      categoryUuid: Category.getUuid(qaCategory),
      draft: true,
    })
    expect(qaItems.map(CategoryItem.getCode).sort()).toEqual(['1', '2', '3'])

    // comparing again with the same file: no differences left
    const { result: resultAfter } = await runCompare({ user, surveyId: qaSurveyId, sourceFileName })
    expect(resultAfter.nodeDefs.filter((diff) => diff.status !== SurveyCompareStatus.identical)).toEqual([])
    expect(resultAfter.categories.filter((diff) => diff.status !== SurveyCompareStatus.identical)).toEqual([])

    // the QA survey can be published with the changes
    await SurveyUtils.publishSurvey(user, qaSurveyId)
  }, 60000)

  // phase 2: deletions, taxonomies and survey info
  test('deletions, new taxonomies and survey info changes are applied to the QA survey', async () => {
    const user = getContextUser()
    let dev = await fetchSurvey(devSurveyId)
    // new language
    await SurveyManager.updateSurveyProps(user, devSurveyId, {
      ...ObjectUtils.getProps(Survey.getSurveyInfo(dev)),
      languages: ['en', 'fr'],
    })
    // species attribute and its category deleted
    await NodeDefService.markNodeDefDeleted({
      user,
      surveyId: devSurveyId,
      cycle,
      nodeDefUuid: NodeDef.getUuid(Survey.getNodeDefByName('species')(dev)),
    })
    await CategoryManager.deleteCategory(
      user,
      devSurveyId,
      Category.getUuid(Survey.getCategoryByName('tree_species')(dev))
    )
    // new taxonomy used by a new attribute
    const taxonomy = Taxonomy.newTaxonomy({ [Taxonomy.keysProps.name]: 'trees' })
    await TaxonomyManager.insertTaxonomy({ user, surveyId: devSurveyId, taxonomy })
    const taxa = ['QUE', 'PIN'].map((code) =>
      Taxon.assocVernacularNamesByLang({
        eng: [TaxonVernacularName.newTaxonVernacularName('eng', `${code} name`)],
      })(
        Taxon.newTaxon({
          taxonomyUuid: Taxonomy.getUuid(taxonomy),
          code,
          family: 'f',
          genus: 'g',
          scientificName: code,
        })
      )
    )
    await TaxonomyManager.insertTaxa({ user, surveyId: devSurveyId, taxa })
    dev = await fetchSurvey(devSurveyId)
    await NodeDefService.insertNodeDef({
      user,
      surveyId: devSurveyId,
      cycle,
      nodeDef: NodeDef.newNodeDef(Survey.getNodeDefByName('tree')(dev), NodeDef.nodeDefType.taxon, [cycle], {
        name: 'tree_taxon',
        [NodeDef.propKeys.taxonomyUuid]: Taxonomy.getUuid(taxonomy),
      }),
    })

    const { result, sourceFileName } = await runCompare({
      user,
      surveyId: qaSurveyId,
      filePath: await exportSurvey({ user, surveyId: devSurveyId }),
    })
    expect(result.surveyInfo.map((diff) => diff.key)).toEqual(['languages'])
    expect(result.counts.nodeDefs).toEqual({ added: 1, changed: 1, removed: 1 })
    expect(result.counts.categories).toEqual({ added: 0, changed: 0, removed: 1 })
    expect(result.counts.taxonomies).toEqual({ added: 1, changed: 0, removed: 0 })
    const speciesDiff = result.nodeDefs.find((diff) => diff.name === 'species')
    expect(speciesDiff.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicableWithWarning)

    const selectedIds = getAllChanges(result)
      .filter((diff) => diff.status !== SurveyCompareStatus.identical)
      .map((diff) => diff.id)
    // the API passes numeric survey ids
    const applyJob = new SurveyCompareApplyJob({ user, surveyId: Number(qaSurveyId), sourceFileName, selectedIds })
    await applyJob.start()
    expect(applyJob.isSucceeded()).toBe(true)

    const qa = await fetchSurvey(qaSurveyId)
    expect(Survey.getLanguages(Survey.getSurveyInfo(qa))).toEqual(['en', 'fr'])
    expect(Survey.getNodeDefsArray(qa).some((nodeDef) => NodeDef.getName(nodeDef) === 'species')).toBe(false)
    expect(Survey.getCategoryByName('tree_species')(qa)).toBeFalsy()
    const qaTaxonomy = Survey.getTaxonomyByName('trees')(qa)
    expect(Taxonomy.getUuid(qaTaxonomy)).toBe(Taxonomy.getUuid(taxonomy))
    const qaTaxa = await TaxonomyRepository.fetchTaxaWithVernacularNames({
      surveyId: qaSurveyId,
      taxonomyUuid: Taxonomy.getUuid(qaTaxonomy),
      draft: true,
    })
    expect(qaTaxa.map(Taxon.getCode).sort()).toEqual(['PIN', 'QUE'])
    expect(NodeDef.getTaxonomyUuid(Survey.getNodeDefByName('tree_taxon')(qa))).toBe(Taxonomy.getUuid(taxonomy))

    // comparing again with the same file: no differences left
    const { result: resultAfter } = await runCompare({ user, surveyId: qaSurveyId, sourceFileName })
    expect(getAllChanges(resultAfter).filter((diff) => diff.status !== SurveyCompareStatus.identical)).toEqual([])

    await SurveyUtils.publishSurvey(user, qaSurveyId)
  }, 60000)
})
