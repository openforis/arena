const RecordUpdateManagerTest = require('./recordTests/recordUpdateManagerTest')

describe('RecordUpdateManager Test', async () => {
  it('Record creation', RecordUpdateManagerTest.recordCreationTest)
  it('Default value applied', RecordUpdateManagerTest.defaultValueAppliedTest)
})