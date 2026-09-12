import fs from 'fs'
import path from 'path'

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
export const householdSurveyXml = fs.readFileSync(path.join(__dirname, 'householdSurvey.xml'), 'utf8')
