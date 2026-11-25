import { fileFormats } from '../../utils/flatDataImportTestUtils'
import { getContextUser } from '../config/context'

import * as DataImportTest from './_record/dataImportTest'

// same scenarios for every supported file format
describe.each(fileFormats)('Data import (%s)', (fileFormat) => {
  const params = () => ({ user: getContextUser(), fileFormat })

  test('Insert records and nested entities, update existing values (calculated attributes updated)', () =>
    DataImportTest.dataImportTest(params()))

  test('A row with an invalid value makes the import fail without persisting anything', () =>
    DataImportTest.dataImportInvalidValueTest(params()))

  test('Importing values into a not existing entity without insertMissingNodes fails', () =>
    DataImportTest.dataImportEntityNotFoundTest(params()))

  test('Importing values into a not existing record fails', () => DataImportTest.dataImportRecordNotFoundTest(params()))

  test('Dry run does not persist any change', () => DataImportTest.dataImportDryRunTest(params()))

  test('Dry run reports missing key columns', () => DataImportTest.dataImportDryRunMissingKeyColumnTest(params()))

  test('A data editor cannot update records owned by another user', () =>
    DataImportTest.dataImportRecordOfAnotherUserTest(params()))

  test('A system admin can delete the existing entities not in the file', () =>
    DataImportTest.dataImportDeleteExistingEntitiesTest(params()))
})

describe('Data import options', () => {
  test('Options restricted in the UI are rejected for a data editor', () =>
    DataImportTest.dataImportRestrictedOptionsTest({ user: getContextUser() }))
})
