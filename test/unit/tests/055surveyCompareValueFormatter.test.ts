import { formatValue } from '@webapp/views/App/views/Designer/SurveyCompare/surveyCompareValueFormatter'

const t = (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key)

const toText = (lines) =>
  lines.map(({ label, value, separator }) => (separator ? '---' : [label, value].filter(Boolean).join(': ')))

describe('SurveyCompare value formatter', () => {
  test('expressions are shown as expression and apply if', () => {
    const value = [{ expression: 'dbh * 2', applyIf: 'dbh > 0' }, { expression: '0' }]
    expect(toText(formatValue({ t, key: 'defaultValues', value }))).toEqual([
      'nodeDefEdit.expressionsProp.expression: dbh * 2',
      'nodeDefEdit.expressionsProp.applyIf: dbh > 0',
      '---',
      'nodeDefEdit.expressionsProp.expression: 0',
    ])
  })

  test('validations', () => {
    const value = {
      required: true,
      count: { min: 2 },
      expressions: [{ expression: 'dbh < height', severity: 'warning', messages: { en: 'Too big' } }],
    }
    expect(toText(formatValue({ t, key: 'validations', value }))).toEqual([
      'common.required',
      'nodeDefEdit.validationsProps.minCount: 2',
      'nodeDefEdit.validationsProps.expressions',
      'nodeDefEdit.expressionsProp.expression: dbh < height',
      'nodeDefEdit.expressionsProp.severity: common.warning',
      'surveyCompareView.props.messages',
      'en: Too big',
    ])
  })

  test('labels, booleans and cycles', () => {
    expect(toText(formatValue({ t, key: 'labels', value: { en: 'Tree', es: 'Árbol' } }))).toEqual([
      'en: Tree',
      'es: Árbol',
    ])
    expect(toText(formatValue({ t, key: 'key', value: true }))).toEqual(['common.yes'])
    expect(toText(formatValue({ t, key: 'cycles', value: ['0', '1'] }))).toEqual(['1, 2'])
    expect(formatValue({ t, key: 'labels', value: undefined })).toEqual([])
  })

  test('form layout', () => {
    const value = { renderType: 'form', layoutChildren: [{ i: 'dbh', x: 0, y: 1, w: 1, h: 1 }] }
    expect(toText(formatValue({ t, key: 'layout', value }))).toEqual([
      'nodeDefEdit.basicProps.displayAs: form',
      'surveyCompareView.props.formLayout',
      'dbh: surveyCompareView.props.gridPosition {"row":2,"column":1,"width":1,"height":1}',
    ])
  })
})
