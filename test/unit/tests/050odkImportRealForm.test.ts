import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as XForm from '@server/modules/odkImport/service/odkImport/model/xform'
import { mapXFormTypeToNodeDefType } from '@server/modules/odkImport/service/odkImport/model/xformTypeMapping'
import { OdkExpressionConverter } from '@server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob/odkExpressionConverter'

import { getContextUser } from '../../integration/config/context'
import * as SB from '../../utils/surveyBuilder'
import { householdSurveyXml } from './resources/householdSurveyXform'

describe('odkImport / real ODK form (Household Survey, getodk/sample-forms)', () => {
  const xform = XForm.parseXForm(householdSurveyXml)

  describe('xform.ts parsing', () => {
    test('getFormTitle extracts the real title', () => {
      expect(XForm.getFormTitle(xform)).toBe('Household Survey')
    })

    test('getPrimaryInstanceRoot finds the root, whose id differs from its own tag name', () => {
      const root = XForm.getPrimaryInstanceRoot(xform)
      expect(root.name).toBe('HouseholdSurvey')
      expect(root.attributes?.id).toBe('HouseholdSurvey1')
    })

    test('buildRepeatPathsSet detects the one real <repeat> in the form', () => {
      const repeatPaths = XForm.buildRepeatPathsSet(xform)
      expect(repeatPaths.has('/HouseholdSurvey/ChildrenOfHousehold')).toBe(true)
      expect(repeatPaths.size).toBe(1)
    })

    test('buildBindsByPath captures real constraint/calculate/relevant/required expressions verbatim', () => {
      const bindsByPath = XForm.buildBindsByPath(xform)

      expect(bindsByPath.get('/HouseholdSurvey/SurveyorCode')?.constraint).toBe(`regex(., '[A-Za-z]{2}[0-9]{2}')`)
      expect(bindsByPath.get('/HouseholdSurvey/SurveyorID')).toMatchObject({
        type: 'barcode',
        required: 'true()',
        relevant: `selected(/HouseholdSurvey/SurveyorCode, '')`,
      })
      expect(bindsByPath.get('/HouseholdSurvey/HeadOfHouseholdGenderText')?.calculate).toBe(
        `if(../HeadOfHouseholdGender = 'm', 'a man', 'a woman')`
      )
      expect(bindsByPath.get('/HouseholdSurvey/HeadOfHouseholdAge')?.constraint).toBe('. >= 0 and . < 120')
      expect(bindsByPath.get('/HouseholdSurvey/ChildrenOfHousehold/ChildColors')?.constraint).toBe(
        'count-selected(.) = 2'
      )
      // a bind can exist with no body control referencing it at all (HouseholdAudio has no <upload>/<input>
      // anywhere in this real form's body) - still a real bind, just never surfaced for display
      expect(bindsByPath.get('/HouseholdSurvey/HouseholdAudio')?.type).toBe('binary')
    })

    test('buildBodyControlsByPath finds media uploads with mediatype, and confirms a bind-only field has no entry', () => {
      const controlsByPath = XForm.buildBodyControlsByPath(xform)

      expect(controlsByPath.get('/HouseholdSurvey/HouseholdImage')).toMatchObject({
        controlType: 'upload',
        mediatype: 'image/*',
      })
      expect(controlsByPath.get('/HouseholdSurvey/HouseholdVideo')).toMatchObject({
        controlType: 'upload',
        mediatype: 'video/*',
      })
      // HouseholdAudio has a bind (asserted above) but no body element referencing it anywhere
      expect(controlsByPath.has('/HouseholdSurvey/HouseholdAudio')).toBe(false)

      const childColors = controlsByPath.get('/HouseholdSurvey/ChildrenOfHousehold/ChildColors')
      expect(childColors?.controlType).toBe('select')
      expect(childColors?.items).toHaveLength(10)
      expect(childColors?.items[0]).toEqual({ value: 'red', labelRef: null, labelText: 'Red' })

      const childInSchool = controlsByPath.get('/HouseholdSurvey/ChildrenOfHousehold/ChildInSchool')
      expect(childInSchool?.controlType).toBe('select1')
      expect(childInSchool?.items.map((item) => item.labelRef)).toEqual(['Yes', 'No'])
    })

    test('getItextTranslations resolves all 5 real languages, defaulting to the first when none is marked default', () => {
      const { translations, defaultLang } = XForm.getItextTranslations(xform)

      // none of this real form's <translation> elements carries a default="true()" attribute -
      // defaultLang falls back to the first one encountered, per getItextTranslations' documented rule
      expect(defaultLang).toBe('English')

      expect(translations.EnterNameLabel).toEqual({
        English: 'Enter your name.',
        Spanish: 'Escriba su nombre.',
        French: 'Entrez votre nom.',
        Swahili: 'Andika jina lako.',
        Chinese: '输入你的名字。',
      })
      expect(translations.Yes).toEqual({
        English: 'Yes',
        Spanish: 'Sí',
        French: 'Oui',
        Swahili: 'Ndyio',
        Chinese: '是',
      })
    })
  })

  describe('xformTypeMapping on real binds', () => {
    const bindsByPath = XForm.buildBindsByPath(xform)

    test('barcode (SurveyorID) maps to text, flagged unmappedType - scan-assist UX lost, data kept', () => {
      const bind = bindsByPath.get('/HouseholdSurvey/SurveyorID')
      const result = mapXFormTypeToNodeDefType({
        odkType: bind?.type ?? null,
        readonly: bind?.readonly ?? null,
        hasCalculate: Boolean(bind?.calculate),
      })
      expect(result).toEqual({ nodeDefType: NodeDef.nodeDefType.text, skip: false, flag: 'unmappedType' })
    })

    test('geopoint (HouseholdLocation) maps cleanly to coordinate', () => {
      const bind = bindsByPath.get('/HouseholdSurvey/HouseholdLocation')
      const result = mapXFormTypeToNodeDefType({
        odkType: bind?.type ?? null,
        readonly: bind?.readonly ?? null,
        hasCalculate: Boolean(bind?.calculate),
      })
      expect(result).toEqual({ nodeDefType: NodeDef.nodeDefType.coordinate, skip: false, flag: null })
    })

    test('dateTime (StartTime, a real jr:preload="timestamp" field) maps to text, flagged unmappedType', () => {
      const bind = bindsByPath.get('/HouseholdSurvey/StartTime')
      const result = mapXFormTypeToNodeDefType({
        odkType: bind?.type ?? null,
        readonly: bind?.readonly ?? null,
        hasCalculate: Boolean(bind?.calculate),
      })
      expect(result).toEqual({ nodeDefType: NodeDef.nodeDefType.text, skip: false, flag: 'unmappedType' })
    })
  })

  describe('OdkExpressionConverter on real expressions, against a real Arena survey', () => {
    let survey: any = {}
    let nodeDefsByXFormPath: Map<string, any> = new Map()

    const xformPathByNodeDefName: Record<string, string> = {
      household_survey: '/HouseholdSurvey',
      surveyor_code: '/HouseholdSurvey/SurveyorCode',
      surveyor_id: '/HouseholdSurvey/SurveyorID',
      head_of_household_age: '/HouseholdSurvey/HeadOfHouseholdAge',
      head_of_household_gender: '/HouseholdSurvey/HeadOfHouseholdGender',
      head_of_household_gender_text: '/HouseholdSurvey/HeadOfHouseholdGenderText',
      children_of_household: '/HouseholdSurvey/ChildrenOfHousehold',
      child_colors: '/HouseholdSurvey/ChildrenOfHousehold/ChildColors',
    }

    beforeAll(async () => {
      const user = getContextUser()
      survey = await SB.survey(
        user,
        SB.entity(
          'household_survey',
          SB.attribute('surveyor_code', NodeDef.nodeDefType.text),
          SB.attribute('surveyor_id', NodeDef.nodeDefType.text),
          SB.attribute('head_of_household_age', NodeDef.nodeDefType.integer),
          SB.attribute('head_of_household_gender', NodeDef.nodeDefType.text),
          SB.attribute('head_of_household_gender_text', NodeDef.nodeDefType.text),
          SB.entity(
            'children_of_household',
            SB.attribute('child_colors', NodeDef.nodeDefType.code).category('child_colors').multiple()
          ).multiple()
        )
      )
        .categories(SB.category('child_colors').items(SB.categoryItem('red'), SB.categoryItem('blu')))
        .build()

      nodeDefsByXFormPath = new Map(
        Object.entries(xformPathByNodeDefName).map(([name, path]) => [path, Survey.getNodeDefByName(name)(survey)])
      )
    }, 10000)

    test('SurveyorID relevant: a real absolute-path selected() reference converts correctly', async () => {
      const converted = await OdkExpressionConverter.convert({
        survey,
        nodeDefCurrent: Survey.getNodeDefByName('surveyor_id')(survey),
        currentXFormPath: xformPathByNodeDefName.surveyor_id,
        nodeDefsByXFormPath,
        expression: `selected(/HouseholdSurvey/SurveyorCode, '')`,
      })
      expect(converted).not.toBeNull()
      expect((converted as string).trim()).toBe(`includes(surveyor_code, '')`)
    })

    test('HeadOfHouseholdAge constraint: a real numeric range converts correctly', async () => {
      const converted = await OdkExpressionConverter.convert({
        survey,
        nodeDefCurrent: Survey.getNodeDefByName('head_of_household_age')(survey),
        currentXFormPath: xformPathByNodeDefName.head_of_household_age,
        nodeDefsByXFormPath,
        expression: '. >= 0 and . < 120',
      })
      expect(converted).not.toBeNull()
      expect((converted as string).trim()).toBe('this >= 0 && this < 120')
    })

    test('HeadOfHouseholdGenderText calculate: a real if()-ternary is never converted, as designed', async () => {
      const converted = await OdkExpressionConverter.convert({
        survey,
        nodeDefCurrent: Survey.getNodeDefByName('head_of_household_gender_text')(survey),
        currentXFormPath: xformPathByNodeDefName.head_of_household_gender_text,
        nodeDefsByXFormPath,
        expression: `if(../HeadOfHouseholdGender = 'm', 'a man', 'a woman')`,
      })
      expect(converted).toBeNull()
    })

    test('SurveyorCode constraint: a real regex() call is left unconverted (not an Arena expression function)', async () => {
      const converted = await OdkExpressionConverter.convert({
        survey,
        nodeDefCurrent: Survey.getNodeDefByName('surveyor_code')(survey),
        currentXFormPath: xformPathByNodeDefName.surveyor_code,
        nodeDefsByXFormPath,
        expression: `regex(., '[A-Za-z]{2}[0-9]{2}')`,
      })
      expect(converted).toBeNull()
    })

    test('ChildColors constraint: a real count-selected() call is left unconverted (not an Arena expression function)', async () => {
      const converted = await OdkExpressionConverter.convert({
        survey,
        nodeDefCurrent: Survey.getNodeDefByName('child_colors')(survey),
        currentXFormPath: xformPathByNodeDefName.child_colors,
        nodeDefsByXFormPath,
        expression: 'count-selected(.) = 2',
      })
      expect(converted).toBeNull()
    })
  })
})
