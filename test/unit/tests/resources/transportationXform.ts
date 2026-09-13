import fs from 'fs'
import path from 'path'

// A real, historic ODK/OpenRosa demo form ("Transportation" survey) sourced from onaio/onadata - the
// open-source ODK/OpenRosa platform formerly known as formhub (https://github.com/onaio/onadata/blob/
// 4235d053c0f25001bfd5bda19924daea5b1e72c0/onadata/apps/main/tests/fixtures/transportation/
// transportation2.xml). Kept in onadata's own test suite alongside real ODK Collect submissions against
// this same form (see transportationSubmissions.ts) - a genuine schema+data pair, unlike the Household
// Survey fixture (real form, no publicly available real submissions - see householdSurveyXform.ts).
// Uses static <item> choices (no dynamic itemset/secondary-instance selects), a multi-select and several
// nested select1s, so it complements Household Survey's repeat-group/geopoint/preload coverage with
// real multi-select + select1 data.
export const transportationXml = fs.readFileSync(path.join(__dirname, 'transportationXform.xml'), 'utf8')
