import fs from 'node:fs'
import path from 'node:path'

// Real ODK Collect submissions against transportationXform.ts's form, sourced from onaio/onadata's own
// test suite (https://github.com/onaio/onadata/tree/9aa15caa4cb9ead70074e362654d8c24ffc7c573/onadata/apps/
// main/tests/fixtures/transportation/instances) - genuine field data, not synthesized for this test suite.
// Kept as separate files/exports (rather than one array) so each one's real quirk is named and easy to
// reference on its own.

// transport_2011-07-25_19-05-36.xml: a real multi-select answer ("ambulance bicycle", space-separated)
// and two real nested select1 answers ("daily"/"weekly"), with a well-formed uuid: instanceID.
export const transportationSubmission1Xml = fs.readFileSync(
  path.join(__dirname, 'transportationSubmission1.xml'),
  'utf8'
)

// transport_no_response.xml: the multi-select field is missing entirely (not just empty) and every
// nested select1 is an empty element - AND its instanceID ("uuid:7g0a1508-...") is not actually a valid
// uuid (a 'g' character where only hex digits belong), a real-world malformed-data case.
export const transportationSubmission2NoResponseXml = fs.readFileSync(
  path.join(__dirname, 'transportationSubmission2NoResponse.xml'),
  'utf8'
)

// transport_2011-07-25_19-05-52.xml: same answers as submission 1, from a different form version/device
// (different "version" attribute, different but well-formed uuid: instanceID) - a near-duplicate real
// submission, useful for asserting distinct records are created rather than one overwriting the other.
export const transportationSubmission3Xml = fs.readFileSync(
  path.join(__dirname, 'transportationSubmission3.xml'),
  'utf8'
)
