import { isHexColor } from '@core/colorUtils'
import { escapeHtml } from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'

import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-map-marker-color-user' }

/**
 * Validates a coordinate attribute with the given map marker color.
 * @param {unknown} mapMarkerColor - The color (prop not set when undefined).
 * @returns {Promise<string[]>} The error keys of the map marker color prop.
 */
const getMapMarkerColorErrorKeys = async (mapMarkerColor: unknown): Promise<string[]> => {
  const locationBuilder = SB.attribute('location', NodeDef.nodeDefType.coordinate)
  if (mapMarkerColor !== undefined) locationBuilder.prop(NodeDef.propKeys.mapMarkerColor, mapMarkerColor)
  const survey = await SB.survey(
    user,
    SB.entity('plot', SB.attribute('plot_id', NodeDef.nodeDefType.integer).key(), locationBuilder)
  ).build()
  const nodeDef = Survey.getNodeDefByName('location')(survey)
  const validation = await SurveyValidator.validateNodeDef(survey, nodeDef)
  const colorValidation = Validation.getFieldValidation(NodeDef.propKeys.mapMarkerColor)(validation)
  return Validation.getErrors(colorValidation).map((error) => String(error.key))
}

describe('map layer names: HTML escape (296)', () => {
  test('escapes the HTML special characters', () => {
    expect(escapeHtml(`<img src=x onerror="f('a')"> & b`)).toBe(
      '&lt;img src=x onerror=&quot;f(&#39;a&#39;)&quot;&gt; &amp; b'
    )
  })

  test('keeps plain labels unchanged', () => {
    expect(escapeHtml('Cluster / Plot / Tree location')).toBe('Cluster / Plot / Tree location')
  })

  test('turns null and undefined into an empty string', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })
})

describe('map marker color (296)', () => {
  test.each([
    ['#3885ca', true],
    ['#3885CA', true],
    ['#fff', false],
    ['3885ca', false],
    ['red', false],
    ['#3885ca" onclick="x', false],
    ['', false],
    [null, false],
    [undefined, false],
  ])('isHexColor(%s) → %s', (value, expected) => {
    expect(isHexColor(value)).toBe(expected)
  })

  test.each([[undefined], [''], ['#3885ca']])('node def validation accepts %s', async (color) => {
    expect(await getMapMarkerColorErrorKeys(color)).toEqual([])
  })

  test.each([['red'], ['#fff'], ['#3885ca"><b>x</b>']])('node def validation rejects %s', async (color) => {
    expect(await getMapMarkerColorErrorKeys(color)).toEqual([Validation.messageKeys.nodeDefEdit.mapMarkerColorInvalid])
  })
})
