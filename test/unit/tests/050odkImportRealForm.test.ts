import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as XForm from '@server/modules/odkImport/service/odkImport/model/xform'
import { mapXFormTypeToNodeDefType } from '@server/modules/odkImport/service/odkImport/model/xformTypeMapping'
import { OdkExpressionConverter } from '@server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob/odkExpressionConverter'

import { getContextUser } from '../../integration/config/context'
import * as SB from '../../utils/surveyBuilder'

// A real, unmodified ODK sample form - "Household Survey.xml" from ODK's own official sample-forms
// repository (https://github.com/getodk/sample-forms/blob/master/xml-examples/Household%20Survey.xml,
// published there specifically "for use in ODK Collect and ODK Web Forms"). Every hand-written XForm
// fixture used elsewhere in this test suite (046-049) is spec-minimal and self-authored - two of the
// six Phase 4 hardening bugs (ODK "note" detection, the "Name (code)" language convention) were wrong
// assumptions that passed every one of those hand-written tests until checked against real ODK/pyxform
// behavior. This file exists to close that gap: real preload metadata, a real multi-select with a
// count-selected() constraint, a real repeat group, a real if()-ternary calculate, a real regex()
// constraint, a real absolute-path selected() reference, a bind with no body control at all, and 5 real
// (non-"Name (code)") itext languages, none of it invented for the occasion.
const householdSurveyXml = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa">
	<h:head>
		<h:title>Household Survey</h:title>
		<model>
			<itext>
				<translation lang="English">
					<text id="GroupLabel">
						<value>Surveyor Information</value>
					</text>
					<text id="EnterNameLabel">
						<value>Enter your name.</value>
					</text>
					<text id="EnterNameHint">
						<value>Use Menu button to Change Language.</value>
					</text>
					<text id="Yes">
						<value>Yes</value>
					</text>
					<text id="No">
						<value>No</value>
					</text>
				</translation>
				<translation lang="Spanish">
					<text id="GroupLabel">
						<value>Agrimensor Información</value>
					</text>
					<text id="EnterNameLabel">
						<value>Escriba su nombre.</value>
					</text>
					<text id="EnterNameHint">
						<value>Nombre y apellido, por favor.</value>
					</text>
					<text id="Yes">
						<value>Sí</value>
					</text>
					<text id="No">
						<value>No</value>
					</text>
				</translation>
				<translation lang="French">
					<text id="GroupLabel">
						<value>Arpenteur de l'information</value>
					</text>
					<text id="EnterNameLabel">
						<value>Entrez votre nom.</value>
					</text>
					<text id="EnterNameHint">
						<value>Nom et prénom, s'il vous plaît.</value>
					</text>
					<text id="Yes">
						<value>Oui</value>
					</text>
					<text id="No">
						<value>Non</value>
					</text>
				</translation>
				<translation lang="Swahili">
					<text id="GroupLabel">
						<value>Mfanyakazi habari</value>
					</text>
					<text id="EnterNameLabel">
						<value>Andika jina lako.</value>
					</text>
					<text id="EnterNameHint">
						<value>Kwanza na wa mwisho jina, tafadhali.</value>
					</text>
					<text id="Yes">
						<value>Ndyio</value>
					</text>
					<text id="No">
						<value>Hapana</value>
					</text>
				</translation>
				<translation lang="Chinese">
					<text id="GroupLabel">
						<value>验船师信息</value>
					</text>
					<text id="EnterNameLabel">
						<value>输入你的名字。</value>
					</text>
					<text id="EnterNameHint">
						<value>姓和名，请。</value>
					</text>
					<text id="Yes">
						<value>是</value>
					</text>
					<text id="No">
						<value>否</value>
					</text>
				</translation>
			</itext>
			<instance>
				<HouseholdSurvey id="HouseholdSurvey1">
					<StartTime/>
					<EndTime/>
					<DeviceID/>
					<SubscriberID/>
					<SurveyorName/>
					<SurveyorID/>
					<SurveyorCode/>
					<HouseholdLocation/>
					<HouseholdImage/>
					<HouseholdAudio/>
					<HouseholdVideo/>
					<HeadOfHouseholdName/>
					<HeadOfHouseholdAge/>
					<HeadOfHouseholdGender>m</HeadOfHouseholdGender>
					<HeadOfHouseholdGenderText/>
					<HeadOfHouseholdConfirmation/>
					<ChildrenOfHousehold jr:template="">
						<ChildName/>
						<ChildBirthdate/>
						<ChildColors/>
						<ChildInSchool/>
					</ChildrenOfHousehold>
					<SurveyorNotes/>
				</HouseholdSurvey>
			</instance>
			<bind nodeset="/HouseholdSurvey/StartTime" type="dateTime" jr:preload="timestamp" jr:preloadParams="start"/>
			<bind nodeset="/HouseholdSurvey/EndTime" type="dateTime" jr:preload="timestamp" jr:preloadParams="end"/>
			<bind nodeset="/HouseholdSurvey/DeviceID" type="string" jr:preload="property" jr:preloadParams="deviceid"/>
			<bind nodeset="/HouseholdSurvey/SubscriberID" type="string" jr:preload="property" jr:preloadParams="subscriberid"/>
			<bind nodeset="/HouseholdSurvey/SurveyorName" type="string"/>
			<bind nodeset="/HouseholdSurvey/SurveyorCode" type="string" constraint="regex(., '[A-Za-z]{2}[0-9]{2}')" jr:constraintMsg="This isn't a valid key."/>
			<bind nodeset="/HouseholdSurvey/SurveyorID" type="barcode" required="true()" relevant="selected(/HouseholdSurvey/SurveyorCode, '')"/>
			<bind nodeset="/HouseholdSurvey/HouseholdLocation" type="geopoint"/>
			<bind nodeset="/HouseholdSurvey/HouseholdImage" type="binary"/>
			<bind nodeset="/HouseholdSurvey/HouseholdAudio" type="binary"/>
			<bind nodeset="/HouseholdSurvey/HouseholdVideo" type="binary"/>
			<bind nodeset="/HouseholdSurvey/HeadOfHouseholdName" required="true()" type="string"/>
			<bind nodeset="/HouseholdSurvey/HeadOfHouseholdAge" required="true()" type="int" constraint=". &gt;= 0 and . &lt; 120" jr:constraintMsg="Age must be between 0 and 120."/>
			<bind nodeset="/HouseholdSurvey/HeadOfHouseholdGender" type="string"/>
			<bind nodeset="/HouseholdSurvey/HeadOfHouseholdGenderText" calculate="if(../HeadOfHouseholdGender = 'm', 'a man', 'a woman')" type="string"/>
			<bind nodeset="/HouseholdSurvey/HeadOfHouseholdConfirmation" type="string" required="true()" constraint=". != 'no'" jr:constraintMsg="Acknowledge before continuing."/>
			<bind nodeset="/HouseholdSurvey/ChildrenOfHousehold"/>
			<bind nodeset="/HouseholdSurvey/ChildrenOfHousehold/ChildName" type="string"/>
			<bind nodeset="/HouseholdSurvey/ChildrenOfHousehold/ChildBirthdate" type="date" constraint=". &lt;= today()" jr:constraintMsg="Only dates in the past are allowed."/>
			<bind nodeset="/HouseholdSurvey/ChildrenOfHousehold/ChildColors" type="string" constraint="count-selected(.) = 2" jr:constraintMsg="Only two colors allowed."/>
			<bind nodeset="/HouseholdSurvey/ChildrenOfHousehold/ChildInSchool" type="string"/>

			<bind nodeset="/HouseholdSurvey/SurveyorNotes" type="string"/>
		</model>
	</h:head>
	<h:body>
		<group>
			<label ref="jr:itext('GroupLabel')"/>
			<input ref="/HouseholdSurvey/SurveyorName">
				<label ref="jr:itext('EnterNameLabel')"/>
				<hint ref="jr:itext('EnterNameHint')"/>
			</input>
			<input ref="/HouseholdSurvey/SurveyorCode">
				<label>Enter your secret code.</label>
				<hint>Leave empty if you have no secret code.</hint>
			</input>
			<input ref="/HouseholdSurvey/SurveyorID">
				<label>No code entered. Please scan your ID instead.</label>
				<hint>A barcode is required to continue, but you can go back and enter a secret code. Try two letters followed by two numbers.</hint>
			</input>
		</group>
		<group>
			<label>Household Info</label>
			<input ref="/HouseholdSurvey/HouseholdLocation">
				<label>Take GPS coordinates at the entrance of the house.</label>
				<hint>Make sure you have a view of the sky.</hint>
			</input>
			<upload ref="/HouseholdSurvey/HouseholdImage" mediatype="image/*">
				<label>Take a well focused picture of the front of the house.</label>
			</upload>
			<upload ref="/HouseholdSurvey/HouseholdVideo" mediatype="video/*">
				<label>While walking around the house, record what you see.</label>
			</upload>
		</group>
		<group>
			<label>Household Members</label>
			<group>
				<label>Head of Household</label>
				<input ref="/HouseholdSurvey/HeadOfHouseholdName">
					<label>What is the full name of the head of household?</label>
				</input>
				<input ref="/HouseholdSurvey/HeadOfHouseholdAge">
					<label>How old is the head of household?</label>
					<hint>Age should between 0 and 120 years.</hint>
				</input>
				<select1 ref="/HouseholdSurvey/HeadOfHouseholdGender">
					<label>What is the gender of the head of household?</label>
					<hint>Male is selected by default.</hint>
					<item>
						<label>Male</label>
						<value>m</value>
					</item>
					<item>
						<label>Female</label>
						<value>f</value>
					</item>
				</select1>
				<trigger ref="/HouseholdSurvey/HeadOfHouseholdConfirmation">
					<label>Acknowledge that '<output value="/HouseholdSurvey/HeadOfHouseholdName"/>' is <output value="/HouseholdSurvey/HeadOfHouseholdAge"/> years old and is <output value="/HouseholdSurvey/HeadOfHouseholdGenderText"/>?</label>
				</trigger>
			</group>
			<group>
				<label>Child in Household</label>
				<repeat nodeset="/HouseholdSurvey/ChildrenOfHousehold">
					<input ref="/HouseholdSurvey/ChildrenOfHousehold/ChildName">
						<label>What is the child's full name?</label>
					</input>
					<input ref="/HouseholdSurvey/ChildrenOfHousehold/ChildBirthdate">
						<label>What is the child's birthdate.</label>
						<hint>No birthdays in future, please.</hint>
					</input>
					<select ref="/HouseholdSurvey/ChildrenOfHousehold/ChildColors">
						<label>What are the child's favorite two colors.</label>
						<item>
							<label>Red</label>
							<value>red</value>
						</item>
						<item>
							<label>Orange</label>
							<value>ora</value>
						</item>
						<item>
							<label>Yellow</label>
							<value>yel</value>
						</item>
						<item>
							<label>Green</label>
							<value>gre</value>
						</item>
						<item>
							<label>Blue</label>
							<value>blu</value>
						</item>
						<item>
							<label>Purple</label>
							<value>pur</value>
						</item>
						<item>
							<label>Pink</label>
							<value>pin</value>
						</item>
						<item>
							<label>Brown</label>
							<value>bro</value>
						</item>
						<item>
							<label>Black</label>
							<value>bla</value>
						</item>
						<item>
							<label>White</label>
							<value>whi</value>
						</item>
					</select>
					<select1 ref="/HouseholdSurvey/ChildrenOfHousehold/ChildInSchool">
						<label>Is the child attending school?</label>
						<hint>Try using Menu button to Change Languages. 'Yes' and 'No' have been translated.</hint>
						<item>
							<label ref="jr:itext('Yes')"/>
							<value>y</value>
						</item>
						<item>
							<label ref="jr:itext('No')"/>
							<value>n</value>
						</item>
					</select1>
				</repeat>
			</group>
		</group>
		<group>
			<label>Household Notes</label>
			<input ref="/HouseholdSurvey/SurveyorNotes">
				<label>Survey is almost done. Any other relevant information?</label>
			</input>
		</group>
	</h:body>
</h:html>
`

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
