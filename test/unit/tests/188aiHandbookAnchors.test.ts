import { readHeadingAnchors } from '@webapp/ai/help/handbookAnchors'
import { buildHandbook } from '@webapp/ai/help/handbookSplitter'

import { handbookFixture } from './resources/handbookFixture'

const html = [
  '<html><body>',
  '<h1 class="c59" id="h.title"></h1>',
  '<h1 class="c1" id="h.intro"><span class="c4">1. Introduction</span></h1>',
  '<p>1. Introduction</p>',
  '<h2 id="h.create"><span>2.1.</span><span>&nbsp;Create   a survey</span></h2>',
  '<h3 class="c2" id="h.details">2.1.1. Survey details </h3>',
  '<h3 id="h.details2">2.1.1. Survey details</h3>',
  '<h1 id="h.annex"><span class="c42">Annex 1. System architecture </span></h1>',
  '<h1 id="h.amp">4. Q&amp;A &#8211; &#x2014; &lt;tips&gt;</h1>',
  '</body></html>',
].join('\n')

describe('handbook heading anchors', () => {
  const anchors = readHeadingAnchors(html)

  test('maps each heading text (tags stripped, entities decoded, spaces collapsed) to its id', () => {
    expect(anchors).toEqual({
      '1. Introduction': 'h.intro',
      '2.1. Create a survey': 'h.create',
      '2.1.1. Survey details': 'h.details',
      'Annex 1. System architecture': 'h.annex',
      '4. Q&A – — <tips>': 'h.amp',
    })
  })

  test('sections get the anchor of their heading; parts share it; no heading match gives null', () => {
    const handbook = buildHandbook({ raw: handbookFixture, source: 'doc', fetchedAt: 'now', anchors })
    expect(handbook.sections.map(({ id, anchor }) => [id, anchor])).toEqual([
      ['1', 'h.intro'],
      ['2', null],
      ['2.1', 'h.create'],
      ['2.1.1', 'h.details'],
      ['3', null],
      ['3', null],
      ['Acknowledgements', null],
      ['A1', 'h.annex'],
    ])
  })

  test('without anchors, sections have none', () => {
    const handbook = buildHandbook({ raw: handbookFixture, source: 'doc', fetchedAt: 'now' })
    expect(handbook.sections.every((section) => section.anchor === null)).toBe(true)
  })
})
