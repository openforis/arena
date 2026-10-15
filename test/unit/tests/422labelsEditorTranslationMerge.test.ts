import { mergeTranslatedLabels } from '@webapp/components/survey/LabelsEditor/mergeTranslatedLabels'

describe('LabelsEditor AI translation merge (422)', () => {
  test('fills the requested languages that are still empty', () => {
    const { labels, applied } = mergeTranslatedLabels({
      labels: { en: 'Tree' },
      source: { lang: 'en', text: 'Tree' },
      targetLangs: ['es', 'fr'],
      byLang: { es: 'Árbol', fr: 'Arbre' },
    })
    expect(labels).toEqual({ en: 'Tree', es: 'Árbol', fr: 'Arbre' })
    expect(applied).toEqual(['es', 'fr'])
  })

  test('keeps a language typed while the translation ran', () => {
    // the user typed the French label after clicking translate
    const { labels, applied, sourceChanged } = mergeTranslatedLabels({
      labels: { en: 'Tree', fr: 'Hauteur' },
      source: { lang: 'en', text: 'Tree' },
      targetLangs: ['es', 'fr'],
      byLang: { es: 'Árbol', fr: 'Arbre' },
    })
    expect(labels).toEqual({ en: 'Tree', es: 'Árbol', fr: 'Hauteur' })
    expect(applied).toEqual(['es'])
    expect(sourceChanged).toBe(false)
  })

  test('drops the whole translation when the source label changed while it ran', () => {
    const current = { en: 'Tree height', fr: '' }
    const result = mergeTranslatedLabels({
      labels: current,
      source: { lang: 'en', text: 'Tree' },
      targetLangs: ['es', 'fr'],
      byLang: { es: 'Árbol', fr: 'Arbre' },
    })
    expect(result).toEqual({ labels: current, applied: [], sourceChanged: true })
    expect(result.labels).toBe(current)
    // a source that was cleared counts as changed too
    expect(
      mergeTranslatedLabels({
        labels: { en: '' },
        source: { lang: 'en', text: 'Tree' },
        targetLangs: ['es'],
        byLang: { es: 'Árbol' },
      }).sourceChanged
    ).toBe(true)
  })

  test('a blank label counts as empty', () => {
    const { labels } = mergeTranslatedLabels({
      labels: { en: 'Tree', es: '  ' },
      source: { lang: 'en', text: 'Tree' },
      targetLangs: ['es'],
      byLang: { es: 'Árbol' },
    })
    expect(labels.es).toBe('Árbol')
  })

  test('ignores languages that were not requested and answers without text', () => {
    const { labels, applied } = mergeTranslatedLabels({
      labels: { en: 'Tree' },
      source: { lang: 'en', text: 'Tree' },
      targetLangs: ['es'],
      byLang: { de: 'Baum', es: '  ', fr: 12 },
    })
    expect(applied).toEqual([])
    expect(labels).toEqual({ en: 'Tree' })
  })

  test('returns the same labels object when nothing applies, and never changes its input', () => {
    const current = { en: 'Tree', es: 'Árbol' }
    const unchanged = mergeTranslatedLabels({
      labels: current,
      source: { lang: 'en', text: 'Tree' },
      targetLangs: ['es'],
      byLang: { es: 'Otro' },
    })
    expect(unchanged.labels).toBe(current)
    const merged = mergeTranslatedLabels({
      labels: current,
      source: { lang: 'en', text: 'Tree' },
      targetLangs: ['fr'],
      byLang: { fr: 'Arbre' },
    })
    expect(merged.labels).not.toBe(current)
    expect(current).toEqual({ en: 'Tree', es: 'Árbol' })
  })
})
