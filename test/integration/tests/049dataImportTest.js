import { getContextUser } from '../config/context'
import { fileFormats } from '../../utils/flatDataImportTestUtils'

import * as DataImportTest from './_record/dataImportTest'

// same scenarios for every supported file format
describe.each(fileFormats)('Data import (%s)', (fileFormat) => {
  const params = () => ({ user: getContextUser(), fileFormat })

  test('Insert records and nested entities, update existing values (calculated attributes updated)', async () =>
    DataImportTest.dataImportTest(params()))

  test('A row with an invalid value makes the import fail without persisting anything', async () =>
    DataImportTest.dataImportInvalidValueTest(params()))

  test('Importing values into a not existing entity without insertMissingNodes fails', async () =>
    DataImportTest.dataImportEntityNotFoundTest(params()))

  test('Importing values into a not existing record fails', async () =>
    DataImportTest.dataImportRecordNotFoundTest(params()))

  test('Dry run does not persist any change', async () => DataImportTest.dataImportDryRunTest(params()))
})
