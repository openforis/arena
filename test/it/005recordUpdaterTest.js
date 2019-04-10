const RecordUpdaterTest = require('./recordTests/recordUpdaterTest')

describe('RecordUpdater Test', async () => {
  it('Record creation', RecordUpdaterTest.recordCreationTest)
  it('Default value applied', RecordUpdaterTest.defaultValueAppliedTest)
  it('Calculated value updated', RecordUpdaterTest.calculatedValueUpdateTest)
})