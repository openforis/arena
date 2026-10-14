import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayoutUpdater from '@core/survey/nodeDefLayoutUpdater'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as SurveyFile from '@core/survey/surveyFile'
import * as Taxon from '@core/survey/taxon'
import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import {
  SurveyCompareApplicabilityStatus,
  SurveyCompareMatchType,
  SurveyCompareReason,
  SurveyCompareStatus,
  buildApplyPlan,
  buildSurveyInfoApplyPlan,
  compareSurveys,
  expandSelection,
} from '@core/survey/surveyCompare'

import * as SB from '../../utils/surveyBuilder'
import {
  buildCategory,
  buildSurvey,
  clone,
  compare,
  findDiff,
  itemsByCategoryUuid,
  markAllPublished,
  plan,
} from '../../utils/surveyCompareTestUtils'

const getUuid = (survey: any, name: string): string => NodeDef.getUuid(Survey.getNodeDefByName(name)(survey))

const getCycles = (survey: any) => Survey.getCycleKeys(Survey.getSurveyInfo(survey))

// moves a node def to another entity, updating the layout of both parents
const moveNodeDef = ({ survey, name, parentName }) => {
  const nodeDef = Survey.getNodeDefByName(name)(survey)
  const cycles = getCycles(survey)
  let surveyUpdated = survey
  const oldParent = NodeDefLayoutUpdater.updateParentLayout({ survey, nodeDef, cyclesDeleted: cycles })
  surveyUpdated = Survey.mergeNodeDefs({ [NodeDef.getUuid(oldParent)]: oldParent })(surveyUpdated)
  const newParent = Survey.getNodeDefByName(parentName)(surveyUpdated)
  const nodeDefMoved = NodeDef.changeParentEntity({ targetParentNodeDef: newParent })(nodeDef)
  surveyUpdated = Survey.mergeNodeDefs({ [NodeDef.getUuid(nodeDef)]: nodeDefMoved })(surveyUpdated)
  const newParentUpdated = NodeDefLayoutUpdater.updateParentLayout({
    survey: surveyUpdated,
    nodeDef: nodeDefMoved,
    cyclesAdded: cycles,
  })
  return Survey.mergeNodeDefs({ [NodeDef.getUuid(newParentUpdated)]: newParentUpdated })(surveyUpdated)
}

const dissocNodeDefs = ({ survey, names }) =>
  names.reduce((acc, name) => Survey.dissocNodeDef(getUuid(acc, name))(acc), survey)

const setSurveyInfo = (info: any) => (survey: any) => ({ ...survey, info })

const updateSurveyInfoProps = (survey: any, props: Record<string, any>) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  return setSurveyInfo({ ...surveyInfo, props: { ...surveyInfo.props, ...props } })(survey)
}

describe('SurveyCompare: full sync', () => {
  describe('moves', () => {
    const prepare = async ({ published = false } = {}) => {
      const { survey, items } = await buildSurvey()
      const target = published ? markAllPublished(survey) : survey
      const source = moveNodeDef({ survey: clone(survey), name: 'dbh', parentName: 'cluster' })
      const result = compare({ source, target, sourceItems: items, targetItems: items })
      return { source, target, items, result }
    }

    test('a node def moved to another entity is applied with its parent layouts', async () => {
      const { source, target, items, result } = await prepare()
      const dbhDiff = findDiff(result, 'dbh')
      expect(dbhDiff.status).toBe(SurveyCompareStatus.changed)
      expect(dbhDiff.propDiffs.map((propDiff) => propDiff.key)).toContain('parent')
      expect(dbhDiff.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicable)

      const applyPlan = plan({
        source,
        target,
        sourceItems: items,
        targetItems: items,
        result,
        selectedIds: [dbhDiff.id],
      })
      const clusterUuid = getUuid(target, 'cluster')
      const treeUuid = getUuid(target, 'tree')
      const dbhUuid = getUuid(target, 'dbh')
      const updatesByUuid = Object.fromEntries(applyPlan.nodeDefsToUpdate.map((update) => [update.nodeDefUuid, update]))
      expect(updatesByUuid[dbhUuid].parentUuid).toBe(clusterUuid)
      expect(updatesByUuid[dbhUuid].meta).toEqual({ h: [clusterUuid] })
      expect(JSON.stringify(updatesByUuid[clusterUuid].props.layout)).toContain(dbhUuid)
      expect(JSON.stringify(updatesByUuid[treeUuid].props.layout)).not.toContain(dbhUuid)
    })

    test('a published node def cannot be moved', async () => {
      const { result } = await prepare({ published: true })
      expect(findDiff(result, 'dbh').applicability).toEqual({
        status: SurveyCompareApplicabilityStatus.notApplicable,
        reasons: [SurveyCompareReason.publishedMoveNotSupported],
      })
    })
  })

  describe('deletions', () => {
    test('deleting an entity deletes its descendants and updates the parent layout', async () => {
      const { survey: target, items } = await buildSurvey()
      const source = dissocNodeDefs({ survey: clone(target), names: ['tree_id', 'species', 'dbh', 'tree'] })
      const result = compare({ source, target, sourceItems: items, targetItems: items })
      const treeDiff = findDiff(result, 'tree')
      expect(treeDiff.status).toBe(SurveyCompareStatus.removed)
      expect(treeDiff.dependsOn).toEqual(
        expect.arrayContaining(['tree_id', 'species', 'dbh'].map((name) => findDiff(result, name).id))
      )
      const applyPlan = plan({
        source,
        target,
        sourceItems: items,
        targetItems: items,
        result,
        selectedIds: [treeDiff.id],
      })
      const treeUuid = getUuid(target, 'tree')
      expect(applyPlan.nodeDefUuidsToDelete).toEqual([treeUuid])
      const clusterUpdate = applyPlan.nodeDefsToUpdate.find(
        (update) => update.nodeDefUuid === getUuid(target, 'cluster')
      )
      expect(JSON.stringify(clusterUpdate.props.layout)).not.toContain(treeUuid)
    })

    test('deleting a published node def is a warning', async () => {
      const { survey, items } = await buildSurvey()
      const target = markAllPublished(survey)
      const source = dissocNodeDefs({ survey: clone(survey), names: ['dbh'] })
      const result = compare({ source, target, sourceItems: items, targetItems: items })
      expect(findDiff(result, 'dbh').applicability).toEqual({
        status: SurveyCompareApplicabilityStatus.applicableWithWarning,
        reasons: [SurveyCompareReason.publishedNodeDefDeleted],
      })
    })

    test('a category can be deleted only together with the node defs using it', async () => {
      const { survey: target, items } = await buildSurvey()
      const categoryUuid = Category.getUuid(Survey.getCategoryByName('tree_species')(target))
      const withoutCategory = Survey.assocCategories({})(clone(target))
      const result = compare({ source: withoutCategory, target, sourceItems: [], targetItems: items })
      const categoryDiff = result.categories.find((diff) => diff.targetUuid === categoryUuid)
      expect(categoryDiff.status).toBe(SurveyCompareStatus.removed)
      expect(categoryDiff.applicability.reasons).toEqual([SurveyCompareReason.categoryInUse])

      const source = dissocNodeDefs({ survey: withoutCategory, names: ['species'] })
      const result2 = compare({ source, target, sourceItems: [], targetItems: items })
      const categoryDiff2 = result2.categories.find((diff) => diff.targetUuid === categoryUuid)
      expect(categoryDiff2.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicable)
      expect(categoryDiff2.dependsOn).toEqual([findDiff(result2, 'species').id])
    })
  })

  describe('category levels', () => {
    const withLevels = (survey: any, levelNames: string[]) => {
      const category = Survey.getCategoryByName('tree_species')(survey)
      const levels = levelNames.map((name, index) => {
        const existing = Category.getLevelByIndex(index)(category)
        return existing
          ? { ...existing, props: { ...existing.props, name } }
          : Category.newLevel(category, { [CategoryLevel.keysProps.name]: name }, index)
      })
      const categoryUpdated = Category.assocLevelsArray(levels)(category)
      return Survey.assocCategories({ [Category.getUuid(category)]: categoryUpdated })(survey)
    }

    test('levels are renamed and added', async () => {
      const { survey: target, items } = await buildSurvey()
      const source = withLevels(clone(target), ['taxon', 'variety'])
      const result = compare({ source, target, sourceItems: items, targetItems: items })
      const [categoryDiff] = result.categories
      expect(categoryDiff.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicable)
      const applyPlan = plan({
        source,
        target,
        sourceItems: items,
        targetItems: items,
        result,
        selectedIds: [categoryDiff.id],
      })
      expect(applyPlan.categoryLevelPropsToUpdate.map(({ value }) => value)).toEqual(['taxon'])
      expect(applyPlan.categoryLevelsToInsert.map((level) => [level.index, level.props.name])).toEqual([[1, 'variety']])
    })

    test('unpublished levels only in this survey are deleted by the removal change', async () => {
      const { survey, items } = await buildSurvey()
      const target = withLevels(survey, ['species', 'variety'])
      const result = compare({ source: clone(survey), target, sourceItems: items, targetItems: items })
      const [categoryDiff] = result.categories
      expect(categoryDiff.applicability).toBeUndefined()
      expect(categoryDiff.removal.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicable)
      const applyPlan = plan({
        source: survey,
        target,
        sourceItems: items,
        targetItems: items,
        result,
        selectedIds: [categoryDiff.removal.id],
      })
      const varietyLevel = Category.getLevelByIndex(1)(Survey.getCategoryByName('tree_species')(target))
      expect(applyPlan.categoryLevelsToDelete.map(({ levelUuid }) => levelUuid)).toEqual([
        CategoryLevel.getUuid(varietyLevel),
      ])
    })
  })

  describe('taxonomies', () => {
    const buildTaxonomySurvey = async ({ taxa }) => {
      const taxonomyBuilder = SB.taxonomy('trees').taxa(...taxa)
      const categoryBuilder = buildCategory()
      const survey = await SB.survey(
        null,
        SB.entity(
          'cluster',
          SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
          SB.attribute('tree_taxon', NodeDef.nodeDefType.taxon).taxonomy('trees')
        )
      )
        .categories(categoryBuilder)
        .taxonomies(taxonomyBuilder)
        .build()
      const { taxonomy, taxa: taxaBuilt } = taxonomyBuilder.build()
      // every taxon has the vernacular name "<code> name" in English
      const taxaWithNames = taxaBuilt.map((taxon) =>
        Taxon.assocVernacularNamesByLang({
          eng: [TaxonVernacularName.newTaxonVernacularName('eng', `${Taxon.getCode(taxon)} name`)],
        })(taxon)
      )
      return { survey, taxaByTaxonomyUuid: { [Taxonomy.getUuid(taxonomy)]: taxaWithNames } }
    }

    const compareWithTaxa = ({ source, target }) =>
      compareSurveys({
        sourceSurvey: source.survey,
        targetSurvey: target.survey,
        sourceItemsByCategoryUuid: {},
        targetItemsByCategoryUuid: {},
        sourceTaxaByTaxonomyUuid: source.taxaByTaxonomyUuid,
        targetTaxaByTaxonomyUuid: target.taxaByTaxonomyUuid,
      })

    test('taxa are compared by code; new vernacular names are added, unpublished taxa removed', async () => {
      const target = await buildTaxonomySurvey({
        taxa: [
          SB.taxon('QUE', 'Fagaceae', 'Quercus', 'Quercus sp.'),
          SB.taxon('PIN', 'Pinaceae', 'Pinus', 'Pinus sp.'),
        ],
      })
      const source = {
        survey: target.survey,
        taxaByTaxonomyUuid: Object.fromEntries(
          Object.entries(target.taxaByTaxonomyUuid).map(([uuid, taxa]) => {
            const [que] = clone(taxa)
            const queUpdated = Taxon.appendVernacularName(
              TaxonVernacularName.newTaxonVernacularName('eng', 'Common oak')
            )(que)
            const abi = Taxon.newTaxon({
              taxonomyUuid: uuid,
              code: 'ABI',
              family: 'Pinaceae',
              genus: 'Abies',
              scientificName: 'Abies sp.',
            })
            return [uuid, [queUpdated, abi]]
          })
        ),
      }
      const result = compareWithTaxa({ source, target })
      const [taxonomyDiff] = result.taxonomies
      expect(taxonomyDiff.taxaCount).toEqual({ added: 1, changed: 1, removed: 1 })
      expect(taxonomyDiff.removal.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicable)

      const applyPlan = buildApplyPlan({
        sourceSurvey: source.survey,
        targetSurvey: target.survey,
        sourceItemsByCategoryUuid: {},
        targetItemsByCategoryUuid: {},
        sourceTaxaByTaxonomyUuid: source.taxaByTaxonomyUuid,
        targetTaxaByTaxonomyUuid: target.taxaByTaxonomyUuid,
        result,
        selectedIds: [taxonomyDiff.id, taxonomyDiff.removal.id],
      })
      expect(applyPlan.taxaToInsert[0].taxa.map(Taxon.getCode)).toEqual(['ABI'])
      const [queUpdate] = applyPlan.taxaToUpdate[0].taxa
      expect(Taxon.getVernacularNamesArray(queUpdate).map(TaxonVernacularName.getName)).toEqual(['Common oak'])
      const pin = Object.values(target.taxaByTaxonomyUuid)[0].find((taxon) => Taxon.getCode(taxon) === 'PIN')
      expect(applyPlan.taxonUuidsToDelete).toEqual([Taxon.getUuid(pin)])
    })

    test('a taxon attribute using a new taxonomy depends on it', async () => {
      const source = await buildTaxonomySurvey({ taxa: [SB.taxon('QUE', 'Fagaceae', 'Quercus', 'Quercus sp.')] })
      const targetSurvey = dissocNodeDefs({ survey: clone(source.survey), names: ['tree_taxon'] })
      const target = { survey: Survey.assocTaxonomies({})(targetSurvey), taxaByTaxonomyUuid: {} }
      const result = compareWithTaxa({ source, target })
      const [taxonomyDiff] = result.taxonomies
      expect(taxonomyDiff.status).toBe(SurveyCompareStatus.added)
      expect(findDiff(result, 'tree_taxon').dependsOn).toEqual([taxonomyDiff.id])
    })
  })

  describe('survey info and files', () => {
    test('a node def in a new cycle depends on the survey cycles change', async () => {
      const { survey: target, items } = await buildSurvey()
      let source = updateSurveyInfoProps(clone(target), {
        languages: ['en', 'fr'],
        cycles: { ...(Survey.getCycles(Survey.getSurveyInfo(target)) as any), 1: { dateStart: '2026-01-01' } },
      })
      const dbh = Survey.getNodeDefByName('dbh')(source)
      source = Survey.mergeNodeDefs({ [NodeDef.getUuid(dbh)]: NodeDef.assocCycles(['0', '1'])(dbh) })(source)
      const result = compare({ source, target, sourceItems: items, targetItems: items })
      expect(result.surveyInfo.map((diff) => diff.key)).toEqual(['cycles', 'languages'])
      const cyclesDiff = result.surveyInfo.find((diff) => diff.key === 'cycles')
      expect(findDiff(result, 'dbh').dependsOn).toContain(cyclesDiff.id)

      const { appliedIds } = expandSelection({ result, selectedIds: [findDiff(result, 'dbh').id] })
      expect(appliedIds.has(cyclesDiff.id)).toBe(true)
      const surveyInfoPlan = buildSurveyInfoApplyPlan({
        sourceSurvey: source,
        targetSurvey: target,
        surveyInfoDiffs: result.surveyInfo,
        surveyFileDiffs: result.surveyFiles,
        appliedIds,
      })
      expect(Object.keys(surveyInfoPlan.surveyProps)).toEqual(['cycles'])
    })

    test('removing languages from a published survey is a warning', async () => {
      const { survey, items } = await buildSurvey()
      const target = setSurveyInfo({
        ...Survey.getSurveyInfo(updateSurveyInfoProps(survey, { languages: ['en', 'fr'] })),
        published: true,
      })(survey)
      const result = compare({ source: clone(survey), target, sourceItems: items, targetItems: items })
      expect(result.surveyInfo[0].applicability.reasons).toEqual([SurveyCompareReason.publishedLanguagesRemoved])
    })

    test('survey files are compared by name and replaced with new files', async () => {
      const { survey, items } = await buildSurvey()
      const layer = (size: number) =>
        SurveyFile.createFile({ name: 'plots.kml', size, type: SurveyFile.SurveyFileType.preloadedMapLayer })
      const target = updateSurveyInfoProps(survey, { preloadedMapLayers: [layer(10)] })
      const sourceLayer = layer(20)
      const source = updateSurveyInfoProps(clone(survey), {
        preloadedMapLayers: [sourceLayer],
        branding: { surveyLogo1: { fileUuid: 'logo-uuid', size: 5, name: 'logo.png' } },
      })
      const result = compare({ source, target, sourceItems: items, targetItems: items })
      expect(result.surveyFiles.map((diff) => [diff.name, diff.status])).toEqual([
        ['logo.png', SurveyCompareStatus.added],
        ['plots.kml', SurveyCompareStatus.changed],
      ])
      const surveyInfoPlan = buildSurveyInfoApplyPlan({
        sourceSurvey: source,
        targetSurvey: target,
        surveyInfoDiffs: result.surveyInfo,
        surveyFileDiffs: result.surveyFiles,
        appliedIds: new Set(result.surveyFiles.map((diff) => diff.id)),
      })
      expect(surveyInfoPlan.surveyFilesToInsert.map(({ sourceUuid }) => sourceUuid).sort()).toEqual(
        ['logo-uuid', SurveyFile.getUuid(sourceLayer)].sort()
      )
      expect(surveyInfoPlan.surveyFileUuidsToDelete).toEqual([
        SurveyFile.getUuid(Survey.getPreloadedMapLayers(Survey.getSurveyInfo(target))[0]),
      ])
      const [layerUpdated] = surveyInfoPlan.surveyProps.preloadedMapLayers
      expect(SurveyFile.getSize(layerUpdated)).toBe(20)
      expect(surveyInfoPlan.surveyProps.branding.surveyLogo1.name).toBe('logo.png')
    })
  })

  describe('renames', () => {
    test('a node def renamed in a survey built separately is suggested as rename and matched manually', async () => {
      const { survey: target, items } = await buildSurvey()
      const { survey: sourceBuilt } = await buildSurvey()
      const dbh = Survey.getNodeDefByName('dbh')(sourceBuilt)
      const source = Survey.mergeNodeDefs({
        [NodeDef.getUuid(dbh)]: NodeDef.assocProp({ key: 'name', value: 'dbh_cm' })(dbh),
      })(sourceBuilt)
      const result = compare({ source, target, sourceItems: items, targetItems: items })
      const dbhCmDiff = findDiff(result, 'dbh_cm')
      expect(dbhCmDiff.status).toBe(SurveyCompareStatus.added)
      expect(dbhCmDiff.renameCandidate).toEqual({
        targetUuid: getUuid(target, 'dbh'),
        name: 'dbh',
        path: 'cluster/tree/dbh',
      })

      const manualMatches = { [dbhCmDiff.sourceUuid]: dbhCmDiff.renameCandidate.targetUuid }
      const params = {
        sourceSurvey: source,
        targetSurvey: target,
        sourceItemsByCategoryUuid: itemsByCategoryUuid(source, items),
        targetItemsByCategoryUuid: itemsByCategoryUuid(target, items),
        manualMatches,
      }
      const result2 = compareSurveys(params)
      const renamedDiff = findDiff(result2, 'dbh_cm')
      expect(renamedDiff.matchedBy).toBe(SurveyCompareMatchType.manual)
      expect(renamedDiff.propDiffs.map((propDiff) => propDiff.key)).toEqual(['name'])
      expect(findDiff(result2, 'dbh')).toBeUndefined()

      const applyPlan = buildApplyPlan({ ...params, result: result2, selectedIds: [renamedDiff.id] })
      expect(applyPlan.nodeDefsToUpdate).toEqual([
        expect.objectContaining({ nodeDefUuid: getUuid(target, 'dbh'), props: { name: 'dbh_cm' } }),
      ])
    })
  })
})
