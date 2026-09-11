import * as XForm from '@server/modules/odkImport/service/odkImport/model/xform'

const sampleXForm = `<?xml version="1.0"?>
<h:html xmlns:h="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/2002/xforms" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>My Form</h:title>
    <model>
      <itext>
        <translation lang="English" default="true()">
          <text id="/data/name:label"><value>Name</value></text>
        </translation>
        <translation lang="French">
          <text id="/data/name:label"><value>Nom</value></text>
        </translation>
      </itext>
      <instance>
        <data id="my_form">
          <name/>
          <age/>
          <group1>
            <field_in_group/>
          </group1>
          <repeat_group>
            <rep_field/>
          </repeat_group>
          <choice_field/>
          <listed_field/>
          <meta><instanceID/></meta>
        </data>
      </instance>
      <instance id="list1">
        <root>
          <item><name>a</name><label>Item A</label></item>
          <item><name>b</name><label>Item B</label></item>
        </root>
      </instance>
      <bind nodeset="/data/name" type="string"/>
      <bind nodeset="/data/age" type="int"/>
      <bind nodeset="/data/group1/field_in_group" type="string"/>
      <bind nodeset="/data/repeat_group/rep_field" type="string"/>
      <bind nodeset="/data/choice_field" type="select1"/>
      <bind nodeset="/data/listed_field" type="select1"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label ref="jr:itext('/data/name:label')"/></input>
    <input ref="/data/age"><label>Age</label></input>
    <group ref="/data/group1">
      <label>Group 1</label>
      <input ref="/data/group1/field_in_group"><label>Field</label></input>
    </group>
    <repeat nodeset="/data/repeat_group">
      <input ref="/data/repeat_group/rep_field"><label>Rep field</label></input>
    </repeat>
    <select1 ref="/data/choice_field">
      <label>Choice</label>
      <item><label>Red</label><value>red</value></item>
      <item><label>Blue</label><value>blue</value></item>
    </select1>
    <select1 ref="/data/listed_field">
      <label>Listed</label>
      <itemset nodeset="instance('list1')/root/item"/>
    </select1>
  </h:body>
</h:html>`

describe('odkImport / xform', () => {
  const xform = XForm.parseXForm(sampleXForm)

  test('getFormTitle extracts the h:title text', () => {
    expect(XForm.getFormTitle(xform)).toBe('My Form')
  })

  test('getPrimaryInstanceRoot finds the id-less <data> instance', () => {
    const root = XForm.getPrimaryInstanceRoot(xform)
    expect(root.name).toBe('data')
    expect(root.attributes?.id).toBe('my_form')
  })

  test('visitPrimaryInstanceNodes walks the whole tree, skipping <meta>', () => {
    const root = XForm.getPrimaryInstanceRoot(xform)
    const visited: string[] = []
    XForm.visitPrimaryInstanceNodes(root, (node) => visited.push(node.path))

    expect(visited).toEqual([
      '/data',
      '/data/name',
      '/data/age',
      '/data/group1',
      '/data/group1/field_in_group',
      '/data/repeat_group',
      '/data/repeat_group/rep_field',
      '/data/choice_field',
      '/data/listed_field',
    ])
  })

  test('buildBindsByPath keys every bind by its nodeset', () => {
    const bindsByPath = XForm.buildBindsByPath(xform)
    expect(bindsByPath.get('/data/age')).toEqual({
      nodeset: '/data/age',
      type: 'int',
      relevant: null,
      constraint: null,
      required: null,
      calculate: null,
      readonly: null,
    })
    expect(bindsByPath.size).toBe(6)
  })

  test('buildRepeatPathsSet only contains paths wrapped in a body <repeat>', () => {
    const repeatPaths = XForm.buildRepeatPathsSet(xform)
    expect(repeatPaths.has('/data/repeat_group')).toBe(true)
    expect(repeatPaths.has('/data/group1')).toBe(false)
    expect(repeatPaths.size).toBe(1)
  })

  test('buildBodyControlsByPath extracts inline items, mediatype, and itext label refs', () => {
    const controlsByPath = XForm.buildBodyControlsByPath(xform)

    const nameControl = controlsByPath.get('/data/name')
    expect(nameControl?.controlType).toBe('input')
    expect(nameControl?.labelRef).toBe('/data/name:label')

    const choiceControl = controlsByPath.get('/data/choice_field')
    expect(choiceControl?.controlType).toBe('select1')
    expect(choiceControl?.items).toEqual([
      { value: 'red', labelRef: null, labelText: 'Red' },
      { value: 'blue', labelRef: null, labelText: 'Blue' },
    ])
    expect(choiceControl?.itemsetInstanceId).toBeNull()

    const listedControl = controlsByPath.get('/data/listed_field')
    expect(listedControl?.itemsetInstanceId).toBe('list1')
    expect(listedControl?.items).toEqual([])
  })

  test('getSecondaryInstancesByInstanceId extracts choice items keyed by instance id', () => {
    const secondaryInstances = XForm.getSecondaryInstancesByInstanceId(xform)
    expect(secondaryInstances.get('list1')).toEqual([
      { name: 'a', labelRef: null, labelText: 'Item A' },
      { name: 'b', labelRef: null, labelText: 'Item B' },
    ])
  })

  test('getItextTranslations resolves translations and the explicit default language', () => {
    const { translations, defaultLang } = XForm.getItextTranslations(xform)
    expect(defaultLang).toBe('English')
    expect(translations['/data/name:label']).toEqual({ English: 'Name', French: 'Nom' })
  })

  test('resolveLabels prefers itext indirection, falls back to a literal label in the default language', () => {
    const { translations } = XForm.getItextTranslations(xform)

    expect(
      XForm.resolveLabels({ labelRef: '/data/name:label', labelText: null, translations, defaultLanguage: 'English' })
    ).toEqual({ English: 'Name', French: 'Nom' })

    expect(XForm.resolveLabels({ labelRef: null, labelText: 'Age', translations, defaultLanguage: 'English' })).toEqual(
      {
        English: 'Age',
      }
    )

    expect(XForm.resolveLabels({ labelRef: null, labelText: null, translations, defaultLanguage: 'English' })).toEqual(
      {}
    )
  })

  test('getItextTranslations prefers the plain-text <value> over a media-annotated one (form="image"/"audio")', () => {
    const xformWithMediaItext = XForm.parseXForm(`<?xml version="1.0"?>
<h:html xmlns:h="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/2002/xforms">
  <h:head>
    <model>
      <itext>
        <translation lang="English" default="true()">
          <text id="/data/photo_field:label">
            <value form="image">photo_field-media/label.png</value>
            <value>Take a photo</value>
          </text>
        </translation>
      </itext>
      <instance><data id="x"><photo_field/></data></instance>
    </model>
  </h:head>
  <h:body><upload ref="/data/photo_field"><label ref="jr:itext('/data/photo_field:label')"/></upload></h:body>
</h:html>`)
    const { translations } = XForm.getItextTranslations(xformWithMediaItext)
    expect(translations['/data/photo_field:label']).toEqual({ English: 'Take a photo' })
  })
})
