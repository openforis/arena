import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefLayoutUpdater from '@core/survey/nodeDefLayoutUpdater'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import {
  SurveyCompareApplicabilityStatus,
  SurveyCompareMatchType,
  SurveyComparePropGroup,
  SurveyCompareReason,
  SurveyCompareStatus,
  buildApplyPlan,
  compareSurveys,
} from '@core/survey/surveyCompare'

import * as SB from '../../utils/surveyBuilder'

const cycle = Survey.cycleOneKey

const buildCategory = () =>
  SB.category('tree_species')
    .levels('species')
    .items(SB.categoryItem('1').label('Oak'), SB.categoryItem('2').label('Pine'))

const buildSurvey = async ({ categoryBuilder = buildCategory() } = {}) => {
  const survey = await SB.survey(
    null,
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
    .categories(categoryBuilder)
    .build()
  return { survey, items: categoryBuilder.build().items }
}

const clone = (obj: any) => JSON.parse(JSON.stringify(obj))

const itemsByCategoryUuid = (survey: any, items: any[]) => ({
  [Category.getUuid(Survey.getCategoryByName('tree_species')(survey))]: items,
})

const compare = ({ source, target, sourceItems, targetItems }) =>
  compareSurveys({
    sourceSurvey: source,
    targetSurvey: target,
    sourceItemsByCategoryUuid: itemsByCategoryUuid(source, sourceItems),
    targetItemsByCategoryUuid: itemsByCategoryUuid(target, targetItems),
  })

const addAttribute = async ({ survey, parentName, name, type = NodeDef.nodeDefType.text, props = {} }) => {
  const parent = Survey.getNodeDefByName(parentName)(survey)
  const nodeDef = NodeDef.newNodeDef(parent, type, [cycle], { name, ...props })
  delete nodeDef.temporary
  let surveyUpdated = Survey.assocNodeDef({ nodeDef })(survey)
  const parentUpdated = NodeDefLayoutUpdater.updateParentLayout({
    survey: surveyUpdated,
    nodeDef,
    cyclesAdded: [cycle],
  })
  surveyUpdated = Survey.mergeNodeDefs({ [NodeDef.getUuid(parent)]: parentUpdated })(surveyUpdated)
  return { survey: await Survey.buildAndAssocDependencyGraph(surveyUpdated), nodeDef }
}

const updateNodeDef = ({ survey, name, updateFn }) => {
  const nodeDef = Survey.getNodeDefByName(name)(survey)
  return Survey.mergeNodeDefs({ [NodeDef.getUuid(nodeDef)]: updateFn(nodeDef) })(survey)
}

const setValidationExpression = (expression: string) => (nodeDef: any) =>
  NodeDef.mergePropsAdvanced({
    [NodeDef.keysPropsAdvanced.validations]: NodeDefValidations.assocExpressions([
      NodeDefExpression.createExpression({ expression }),
    ])(NodeDef.getValidations(nodeDef)),
  })(nodeDef)

const markAllPublished = (survey: any) => {
  const nodeDefs = Object.fromEntries(
    Survey.getNodeDefsArray(survey).map((nodeDef) => [NodeDef.getUuid(nodeDef), { ...nodeDef, published: true }])
  )
  return Survey.mergeNodeDefs(nodeDefs)(survey)
}

const findDiff = (result: any, name: string) => result.nodeDefs.find((diff) => diff.name === name)

describe('SurveyCompare', () => {
  test('a survey and its copy are identical', async () => {
    const { survey, items } = await buildSurvey()
    const result = compare({ source: survey, target: clone(survey), sourceItems: items, targetItems: items })

    expect(result.identical).toBe(true)
    expect(result.nodeDefs.every((diff) => diff.status === SurveyCompareStatus.identical)).toBe(true)
    expect(result.nodeDefs.every((diff) => diff.matchedBy === SurveyCompareMatchType.uuid)).toBe(true)
  })

  test('surveys built separately with the same definition are identical (matched by name)', async () => {
    const { survey: source, items: sourceItems } = await buildSurvey()
    const { survey: target, items: targetItems } = await buildSurvey()
    const result = compare({ source, target, sourceItems, targetItems })

    expect(result.identical).toBe(true)
    expect(findDiff(result, 'dbh').matchedBy).toBe(SurveyCompareMatchType.name)
  })

  describe('changes made in another environment (new attribute and validation change)', () => {
    const prepare = async () => {
      const { survey: target, items } = await buildSurvey()
      const { survey: sourceWithHeight, nodeDef: heightDef } = await addAttribute({
        survey: clone(target),
        parentName: 'tree',
        name: 'height',
        type: NodeDef.nodeDefType.decimal,
      })
      const source = updateNodeDef({
        survey: sourceWithHeight,
        name: 'dbh',
        updateFn: setValidationExpression('dbh > 0'),
      })
      const result = compare({ source, target, sourceItems: items, targetItems: items })
      return { source, target, items, heightDef, result }
    }

    test('differences are detected', async () => {
      const { result } = await prepare()

      expect(result.identical).toBe(false)
      expect(result.counts.nodeDefs).toEqual({ added: 1, changed: 2, removed: 0 })

      const heightDiff = findDiff(result, 'height')
      expect(heightDiff.status).toBe(SurveyCompareStatus.added)
      expect(heightDiff.path).toBe('cluster/tree/height')
      expect(heightDiff.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicable)

      const dbhDiff = findDiff(result, 'dbh')
      expect(dbhDiff.status).toBe(SurveyCompareStatus.changed)
      expect(dbhDiff.propDiffs.map((propDiff) => propDiff.key)).toEqual([NodeDef.keysPropsAdvanced.validations])
      expect(dbhDiff.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicable)

      const treeDiff = findDiff(result, 'tree')
      expect(treeDiff.status).toBe(SurveyCompareStatus.changed)
      expect(treeDiff.layoutOnly).toBe(true)
      expect(heightDiff.linkedTo).toEqual([treeDiff.id])

      expect(findDiff(result, 'cluster').hasDifferences).toBe(true)
      expect(findDiff(result, 'cluster_id').hasDifferences).toBe(false)
    })

    test('apply plan inserts the new attribute (same uuid) and updates the validation', async () => {
      const { source, target, items, heightDef, result } = await prepare()
      const plan = buildApplyPlan({
        sourceSurvey: source,
        targetSurvey: target,
        sourceItemsByCategoryUuid: itemsByCategoryUuid(source, items),
        targetItemsByCategoryUuid: itemsByCategoryUuid(target, items),
        result,
        selectedIds: [findDiff(result, 'height').id, findDiff(result, 'dbh').id],
      })
      expect(plan.skippedIds).toEqual([])
      expect(plan.nodeDefsToInsert).toHaveLength(1)
      const inserted = plan.nodeDefsToInsert[0]
      const treeDef = Survey.getNodeDefByName('tree')(target)
      expect(inserted.uuid).toBe(NodeDef.getUuid(heightDef))
      expect(inserted.parentUuid).toBe(NodeDef.getUuid(treeDef))
      expect(inserted.meta.h).toEqual([...NodeDef.getMetaHierarchy(treeDef), NodeDef.getUuid(treeDef)])

      const dbhUpdate = plan.nodeDefsToUpdate.find(
        (update) => update.nodeDefUuid === NodeDef.getUuid(Survey.getNodeDefByName('dbh')(target))
      )
      const expressions = NodeDefValidations.getExpressions(
        dbhUpdate.propsAdvanced[NodeDef.keysPropsAdvanced.validations]
      )
      expect(expressions.map(NodeDefExpression.getExpression)).toEqual(['dbh > 0'])

      // parent layout not selected: the new attribute is added to it anyway
      const treeUpdate = plan.nodeDefsToUpdate.find((update) => update.nodeDefUuid === NodeDef.getUuid(treeDef))
      const layoutChildren = treeUpdate.props.layout[cycle][NodeDefLayout.keys.layoutChildren]
      expect(layoutChildren.map((child) => child.i ?? child)).toContain(NodeDef.getUuid(heightDef))
    })

    test('applying the plan to the target makes it identical to the source', async () => {
      const { source, target, items, result } = await prepare()
      const treeDiff = findDiff(result, 'tree')
      const plan = buildApplyPlan({
        sourceSurvey: source,
        targetSurvey: target,
        sourceItemsByCategoryUuid: itemsByCategoryUuid(source, items),
        targetItemsByCategoryUuid: itemsByCategoryUuid(target, items),
        result,
        selectedIds: [findDiff(result, 'height').id, findDiff(result, 'dbh').id, treeDiff.id],
      })
      let targetUpdated = Survey.assocNodeDef({ nodeDef: plan.nodeDefsToInsert[0] })(target)
      for (const update of plan.nodeDefsToUpdate) {
        const nodeDef = Survey.getNodeDefByUuid(update.nodeDefUuid)(targetUpdated)
        // same semantics of the db update (top level props replaced)
        const nodeDefUpdated = {
          ...nodeDef,
          props: { ...nodeDef.props, ...update.props },
          propsAdvanced: { ...nodeDef.propsAdvanced, ...update.propsAdvanced },
        }
        targetUpdated = Survey.mergeNodeDefs({ [update.nodeDefUuid]: nodeDefUpdated })(targetUpdated)
      }
      const resultAfter = compare({ source, target: targetUpdated, sourceItems: items, targetItems: items })
      expect(resultAfter.nodeDefs.filter((diff) => diff.status !== SurveyCompareStatus.identical)).toEqual([])
    })
  })

  describe('published target survey', () => {
    const prepare = async ({ template = false } = {}) => {
      const { survey, items } = await buildSurvey()
      let target: any = markAllPublished(survey)
      if (template) {
        target = { ...target, info: { ...target.info, template: true } }
      }
      let source = updateNodeDef({
        survey: clone(survey),
        name: 'dbh',
        updateFn: NodeDef.mergeProps({ [NodeDef.propKeys.key]: true, [NodeDef.propKeys.name]: 'dbh_cm' }),
      })
      source = updateNodeDef({
        survey: source,
        name: 'tree_id',
        updateFn: NodeDef.mergeProps({ [NodeDef.propKeys.labels]: { en: 'Tree number' } }),
      })
      return compare({ source, target, sourceItems: items, targetItems: items })
    }

    test('key cannot change, renaming is a warning, other props can change', async () => {
      const result = await prepare()
      const dbhDiff = findDiff(result, 'dbh_cm')
      expect(dbhDiff.applicability.status).toBe(SurveyCompareApplicabilityStatus.notApplicable)
      expect(dbhDiff.applicability.reasons).toEqual([SurveyCompareReason.publishedKeyChanged])

      const treeIdDiff = findDiff(result, 'tree_id')
      expect(treeIdDiff.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicable)
    })

    test('templates are an exception', async () => {
      const result = await prepare({ template: true })
      const dbhDiff = findDiff(result, 'dbh_cm')
      expect(dbhDiff.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicable)
    })

    test('renaming a published node def is a warning', async () => {
      const { survey, items } = await buildSurvey()
      const target = markAllPublished(survey)
      const source = updateNodeDef({
        survey: clone(survey),
        name: 'dbh',
        updateFn: NodeDef.mergeProps({ [NodeDef.propKeys.name]: 'dbh_cm' }),
      })
      const result = compare({ source, target, sourceItems: items, targetItems: items })
      const dbhDiff = findDiff(result, 'dbh_cm')
      expect(dbhDiff.applicability.status).toBe(SurveyCompareApplicabilityStatus.applicableWithWarning)
      expect(dbhDiff.applicability.reasons).toEqual([SurveyCompareReason.publishedNameChanged])
    })
  })

  test('node defs only in the target survey are reported as removed and not applicable', async () => {
    const { survey: target, items } = await buildSurvey()
    const dbhUuid = NodeDef.getUuid(Survey.getNodeDefByName('dbh')(target))
    const source = Survey.dissocNodeDef(dbhUuid)(clone(target))
    const result = compare({ source, target, sourceItems: items, targetItems: items })

    const dbhDiff = findDiff(result, 'dbh')
    expect(dbhDiff.status).toBe(SurveyCompareStatus.removed)
    expect(dbhDiff.parentId).toBe(findDiff(result, 'tree').id)
    expect(dbhDiff.applicability.reasons).toEqual([SurveyCompareReason.removalNotSupported])
  })

  test('category items are compared by code', async () => {
    const { survey: target, items: targetItems } = await buildSurvey()
    const source = clone(target)
    const sourceItems = clone(targetItems)
    sourceItems[0].props.labels = { en: 'Quercus' }
    const levelUuid = CategoryItem.getLevelUuid(sourceItems[0])
    sourceItems.push(CategoryItem.newItem(levelUuid, null, { code: '3', labels: { en: 'Fir' } }))

    const result = compare({ source, target, sourceItems, targetItems })
    const [categoryDiff] = result.categories
    expect(categoryDiff.status).toBe(SurveyCompareStatus.changed)
    expect(categoryDiff.itemsCount).toEqual({ added: 1, changed: 1, removed: 0 })

    const plan = buildApplyPlan({
      sourceSurvey: source,
      targetSurvey: target,
      sourceItemsByCategoryUuid: itemsByCategoryUuid(source, sourceItems),
      targetItemsByCategoryUuid: itemsByCategoryUuid(target, targetItems),
      result,
      selectedIds: [categoryDiff.id],
    })
    expect(plan.categoryItemsToInsert[0].items.map(CategoryItem.getCode)).toEqual(['3'])
    expect(plan.categoryItemsToInsert[0].items[0].levelUuid).toBe(levelUuid)
    const [updatedItem] = plan.categoryItemsToUpdate[0].items
    expect(CategoryItem.getUuid(updatedItem)).toBe(CategoryItem.getUuid(targetItems[0]))
    expect(CategoryItem.getLabels(updatedItem)).toEqual({ en: 'Quercus' })
  })

  test('items only in this survey cannot be applied (they are not deleted)', async () => {
    const { survey: target, items: targetItems } = await buildSurvey()
    const source = clone(target)
    const levelUuid = CategoryItem.getLevelUuid(targetItems[0])
    const targetItemsWithExtra = [
      ...targetItems,
      CategoryItem.newItem(levelUuid, null, { code: '9', labels: { en: 'Other' } }),
    ]

    const result = compare({ source, target, sourceItems: targetItems, targetItems: targetItemsWithExtra })
    const [categoryDiff] = result.categories
    expect(categoryDiff.status).toBe(SurveyCompareStatus.changed)
    expect(categoryDiff.itemsCount).toEqual({ added: 0, changed: 0, removed: 1 })
    expect(categoryDiff.applicability).toEqual({
      status: SurveyCompareApplicabilityStatus.notApplicable,
      reasons: [SurveyCompareReason.categoryItemsRemovalNotSupported],
    })
    const plan = buildApplyPlan({
      sourceSurvey: source,
      targetSurvey: target,
      sourceItemsByCategoryUuid: itemsByCategoryUuid(source, targetItems),
      targetItemsByCategoryUuid: itemsByCategoryUuid(target, targetItemsWithExtra),
      result,
      selectedIds: [categoryDiff.id],
    })
    expect(plan.appliedIds).toEqual([])
    expect(plan.skippedIds).toEqual([categoryDiff.id])
  })

  test('items only in this survey are a warning when other item changes can be applied', async () => {
    const { survey: target, items: targetItems } = await buildSurvey()
    const source = clone(target)
    const sourceItems = clone(targetItems)
    sourceItems[0].props.labels = { en: 'Quercus' }
    const levelUuid = CategoryItem.getLevelUuid(targetItems[0])
    const targetItemsWithExtra = [
      ...targetItems,
      CategoryItem.newItem(levelUuid, null, { code: '9', labels: { en: 'Other' } }),
    ]

    const result = compare({ source, target, sourceItems, targetItems: targetItemsWithExtra })
    expect(result.categories[0].applicability).toEqual({
      status: SurveyCompareApplicabilityStatus.applicableWithWarning,
      reasons: [SurveyCompareReason.categoryItemsRemovalNotSupported],
    })
  })

  test('a new attribute using a new category depends on it', async () => {
    const { survey: target, items } = await buildSurvey()
    const newCategory = Category.newCategory({ [Category.keysProps.name]: 'tree_health' })
    const sourceWithCategory = Survey.assocCategories({
      ...Survey.getCategories(target),
      [Category.getUuid(newCategory)]: newCategory,
    })(clone(target))
    const { survey: source } = await addAttribute({
      survey: sourceWithCategory,
      parentName: 'tree',
      name: 'health',
      type: NodeDef.nodeDefType.code,
      props: { [NodeDef.propKeys.categoryUuid]: Category.getUuid(newCategory) },
    })
    const result = compare({ source, target, sourceItems: items, targetItems: items })
    const healthDiff = findDiff(result, 'health')
    const categoryDiff = result.categories.find((diff) => diff.name === 'tree_health')
    expect(categoryDiff.status).toBe(SurveyCompareStatus.added)
    expect(healthDiff.dependsOn).toEqual([categoryDiff.id])

    const plan = buildApplyPlan({
      sourceSurvey: source,
      targetSurvey: target,
      sourceItemsByCategoryUuid: itemsByCategoryUuid(source, items),
      targetItemsByCategoryUuid: itemsByCategoryUuid(target, items),
      result,
      selectedIds: [healthDiff.id],
    })
    expect(plan.categoriesToInsert.map(({ category }) => Category.getName(category))).toEqual(['tree_health'])
    expect(plan.nodeDefsToInsert[0].props.categoryUuid).toBe(Category.getUuid(newCategory))
  })

  test('an attribute whose expressions use a new attribute depends on it', async () => {
    const { survey: target, items } = await buildSurvey()
    const { survey: sourceWithHeight } = await addAttribute({
      survey: clone(target),
      parentName: 'tree',
      name: 'height',
      type: NodeDef.nodeDefType.decimal,
    })
    const source = await Survey.buildAndAssocDependencyGraph(
      updateNodeDef({ survey: sourceWithHeight, name: 'dbh', updateFn: setValidationExpression('dbh < height') })
    )
    const result = compare({ source, target, sourceItems: items, targetItems: items })
    expect(findDiff(result, 'dbh').dependsOn).toEqual([findDiff(result, 'height').id])
    expect(findDiff(result, 'dbh').propDiffs[0].group).toBe(SurveyComparePropGroup.propsAdvanced)
  })
})
