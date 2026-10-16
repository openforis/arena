import * as NodeDef from '@core/survey/nodeDef'

import { buildChangeSet } from '@webapp/ai/changeSets/buildChangeSet'
import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import { findTranslationSource } from '@webapp/ai/changeSets/translationSource'
import { createCategoryItemRefs } from '@webapp/ai/tools/design/categoryItemRefs'
import { categoryItemLabelsProposeSetTool } from '@webapp/ai/tools/design/categoryItemLabelsProposeSet'
import { runTool } from '@webapp/ai/tools/registry'
import { buildCardRows } from '@webapp/components/ai/Assistant/changeSetCardModel'
import {
  getItemKind,
  getReviewColumns,
  hasCardValue,
  isSameItemAsPrevious,
} from '@webapp/components/ai/Assistant/changeItemModel'
import {
  buildReviewItems,
  filterReviewItems,
  type ReviewItem,
} from '@webapp/components/ai/Assistant/changeSetReviewModel'

import { buildAssistantSurvey, createToolContext, getDefByName } from '@test/unit/utils/assistantTestUtils'
import {
  buildCategoryLabelsSurvey,
  categoryLabelChangeSet,
  categoryLabelOp,
  categoryUuidOf,
} from '@test/unit/utils/categoryLabelsTestUtils'

describe('translation source of a proposed label (543)', () => {
  test('the first filled text in another language, survey languages first', () => {
    const languages = ['en', 'fr', 'es']
    expect(findTranslationSource({ texts: { en: 'Tree', fr: 'Arbre' }, lang: 'es', languages })).toEqual({
      lang: 'en',
      text: 'Tree',
    })
    expect(findTranslationSource({ texts: { en: ' ', fr: 'Arbre' }, lang: 'es', languages })).toEqual({
      lang: 'fr',
      text: 'Arbre',
    })
    expect(findTranslationSource({ texts: { en: 'Tree' }, lang: 'en', languages })).toBeNull()
    expect(findTranslationSource({ texts: { de: 'Baum' }, lang: 'fr', languages })).toEqual({
      lang: 'de',
      text: 'Baum',
    })
  })

  test('label rows show the text they translate, from the survey or from a node definition the card creates', async () => {
    const survey = await buildAssistantSurvey({ languages: ['en', 'fr'] })
    const cluster = getDefByName(survey, 'cluster')
    const remarks = createProposedNodeDef({
      parent: cluster,
      type: 'text',
      cycle: '0',
      name: 'cluster_remarks',
      labels: { en: 'Remarks' },
    })
    const clusterIdUuid = NodeDef.getUuid(getDefByName(survey, 'cluster_id'))
    let next = 0
    const changeSet = buildChangeSet({
      survey,
      summary: 'Labels',
      idFactory: () => `op${next++}`,
      drafts: [
        { type: 'nodeDef.create', nodeDef: remarks, parentUuid: NodeDef.getUuid(cluster) },
        {
          type: 'label.set',
          nodeDefUuid: NodeDef.getUuid(remarks),
          kind: 'labels',
          lang: 'fr',
          from: null,
          to: 'Remarques',
        },
        { type: 'label.set', nodeDefUuid: clusterIdUuid, kind: 'labels', lang: 'fr', from: null, to: 'Identifiant' },
        // a rewrite of the default language text, not a translation
        {
          type: 'label.set',
          nodeDefUuid: clusterIdUuid,
          kind: 'labels',
          lang: 'en',
          from: 'Cluster id',
          to: 'Cluster ID',
        },
      ],
    })
    const rows = buildCardRows({ cardState: { changeSet }, survey, lang: 'en' })
    expect(rows.map((row) => row.source ?? null)).toEqual([
      null,
      { lang: 'en', text: 'Remarks' },
      { lang: 'en', text: 'Cluster id' },
      null,
    ])
    const items = buildReviewItems({ cardState: { changeSet }, survey, lang: 'en' })
    expect(items[2].source).toEqual({ lang: 'en', text: 'Cluster id' })
  })

  test('category item labels keep the source read when the item was listed', async () => {
    const survey = await buildCategoryLabelsSurvey()
    const speciesUuid = categoryUuidOf(survey, 'species')
    const refs = createCategoryItemRefs()
    refs.register({
      surveyId: 7,
      categoryUuid: speciesUuid,
      ref: '1',
      entry: { itemUuid: 'item-1', levelName: 'genus', labels: { en: 'Pinus' } },
    })
    const ctx = createToolContext({ survey, categoryItemRefs: refs })
    await runTool(
      categoryItemLabelsProposeSetTool,
      { summary: 'Translate species', items: [{ categoryName: 'species', ref: '1', lang: 'fr', text: 'Pin' }] },
      ctx
    )
    expect(ctx.changeSets[0].operations[0]).toMatchObject({ source: { lang: 'en', text: 'Pinus' } })

    const withSource = {
      ...categoryLabelOp({ categoryUuid: speciesUuid, ref: '1' }),
      source: { lang: 'en', text: 'Pinus' },
    }
    const [item] = buildReviewItems({
      cardState: { changeSet: categoryLabelChangeSet([withSource]) },
      survey,
      lang: 'en',
    })
    expect(item.source).toEqual({ lang: 'en', text: 'Pinus' })
    // a proposal saved before the source was recorded
    const [older] = buildReviewItems({
      cardState: { changeSet: categoryLabelChangeSet([categoryLabelOp({ categoryUuid: speciesUuid, ref: '1' })]) },
      survey,
      lang: 'en',
    })
    expect(older.source).toBeNull()
  })

  describe('translation layout', () => {
    const translation = (id: string, lang: string, sourceLang: string, from: string | null = null): ReviewItem => ({
      id,
      name: 'tree_height',
      detail: null,
      nodeDefUuid: 'uuid-1',
      field: { key: 'aiAssistant.card.label', params: { lang } },
      from: { kind: 'text', text: from },
      to: { kind: 'text', text: 'Hauteur' },
      source: { lang: sourceLang, text: 'Height' },
      result: null,
      groupKey: 'entity:tree',
      groupName: 'tree',
    })
    const readOnly: ReviewItem = {
      ...translation('ro', 'fr', 'en'),
      field: { key: 'aiAssistant.card.props.readOnly', params: {} },
      from: { kind: 'boolean', value: false },
      to: { kind: 'boolean', value: true },
      source: null,
    }

    test('review columns: Original for translations, Current only for other changes with a value', () => {
      // a French translation of English texts: languages in the headers, no Current column
      expect(getReviewColumns([translation('a', 'fr', 'en'), translation('b', 'fr', 'en', 'Etat sanitaire')])).toEqual({
        original: { lang: 'en' },
        current: false,
        proposedLang: 'fr',
      })
      // languages that differ go on the rows
      expect(getReviewColumns([translation('a', 'fr', 'en'), translation('b', 'es', 'fr')])).toEqual({
        original: { lang: null },
        current: false,
        proposedLang: null,
      })
      // mixed with another change: its current value needs the Current column, Proposed has no single language
      expect(getReviewColumns([translation('a', 'fr', 'en'), readOnly])).toEqual({
        original: { lang: 'en' },
        current: true,
        proposedLang: null,
      })
      // no translation: no Original column
      expect(getReviewColumns([readOnly])).toEqual({ original: null, current: true, proposedLang: null })
    })

    test('the kind of a label change has no language; other changes keep their title', () => {
      expect(getItemKind(translation('a', 'fr', 'en'))).toEqual({ key: 'aiAssistant.card.kind.label', params: {} })
      expect(
        getItemKind({ ...translation('a', 'fr', 'en'), field: { key: 'aiAssistant.card.description', params: {} } })
      ).toEqual({ key: 'aiAssistant.card.kind.description', params: {} })
      expect(getItemKind(readOnly)).toEqual({ key: 'aiAssistant.card.props.readOnly', params: {} })
    })

    test('consecutive changes of the same item show its name once', () => {
      const description = {
        ...translation('d', 'fr', 'en'),
        field: { key: 'aiAssistant.card.description', params: {} },
      }
      const other = { ...translation('o', 'fr', 'en'), nodeDefUuid: 'uuid-2', name: 'tree_id' }
      const items = [translation('a', 'fr', 'en'), description, other]
      expect(items.map((_item, index) => isSameItemAsPrevious(items, index))).toEqual([false, true, false])
      const categoryItem = (id: string, ref: string): ReviewItem => ({
        ...translation(id, 'fr', 'en'),
        nodeDefUuid: null,
        name: ref,
        groupKey: 'category:c1',
      })
      const labels = [categoryItem('c1', '1'), categoryItem('c2', '1'), categoryItem('c3', '1.2')]
      expect(labels.map((_item, index) => isSameItemAsPrevious(labels, index))).toEqual([false, true, false])
    })

    test('a blank current text has nothing to replace', () => {
      expect(hasCardValue(null)).toBe(false)
      expect(hasCardValue({ kind: 'text', text: ' ' })).toBe(false)
      expect(hasCardValue({ kind: 'text', text: 'Etat sanitaire' })).toBe(true)
      expect(hasCardValue({ kind: 'expressions', items: [] })).toBe(false)
      expect(hasCardValue({ kind: 'boolean', value: false })).toBe(true)
    })

    test('the search also matches the original text', () => {
      const items = [
        { ...translation('a', 'fr', 'en'), name: 'tree_h' },
        { ...readOnly, name: 'tree_id' },
      ]
      const shown = filterReviewItems(items, { filter: 'all', search: 'height', selectedIds: [], conflictIds: [] })
      expect(shown.map((item) => item.id)).toEqual(['a'])
    })
  })
})
