import { mergeTranslatedLabels } from '@webapp/components/survey/LabelsEditor/mergeTranslatedLabels'

describe('LabelsEditor AI translation merge (422)', () => {
  test('fills the requested languages that are still empty', () => {
    const { labels, applied } = mergeTranslatedLabels({
      labels: { en: 'Tree' },
      targetLangs: ['es', 'fr'],
      byLang: { es: 'Árbol', fr: 'Arbre' },
    })
    expect(labels).toEqual({ en: 'Tree', es: 'Árbol', fr: 'Arbre' })
    expect(applied).toEqual(['es', 'fr'])
  })

  test('keeps what was typed while the translation ran, source language included', () => {
    // the labels now: the user edited the source and typed the French label after clicking translate
    const { labels, applied } = mergeTranslatedLabels({
      labels: { en: 'Tree height', fr: 'Hauteur' },
      targetLangs: ['es', 'fr'],
      byLang: { es: 'Árbol', fr: 'Arbre' },
    })
    expect(labels).toEqual({ en: 'Tree height', es: 'Árbol', fr: 'Hauteur' })
    expect(applied).toEqual(['es'])
  })

  test('a blank label counts as empty', () => {
    const { labels } = mergeTranslatedLabels({
      labels: { en: 'Tree', es: '  ' },
      targetLangs: ['es'],
      byLang: { es: 'Árbol' },
    })
    expect(labels.es).toBe('Árbol')
  })

  test('ignores languages that were not requested and answers without text', () => {
    const { labels, applied } = mergeTranslatedLabels({
      labels: { en: 'Tree' },
      targetLangs: ['es'],
      byLang: { de: 'Baum', es: '  ', fr: 12 },
    })
    expect(applied).toEqual([])
    expect(labels).toEqual({ en: 'Tree' })
  })

  test('returns the same labels object when nothing applies, and never changes its input', () => {
    const current = { en: 'Tree', es: 'Árbol' }
    const unchanged = mergeTranslatedLabels({ labels: current, targetLangs: ['es'], byLang: { es: 'Otro' } })
    expect(unchanged.labels).toBe(current)
    const merged = mergeTranslatedLabels({ labels: current, targetLangs: ['fr'], byLang: { fr: 'Arbre' } })
    expect(merged.labels).not.toBe(current)
    expect(current).toEqual({ en: 'Tree', es: 'Árbol' })
  })
})
