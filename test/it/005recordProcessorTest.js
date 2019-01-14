const RecordProcessorTest = require('./recordTests/recordProcessorTest')

describe('RecordProcessor Test', async () => {
  it('Record creation', RecordProcessorTest.recordCreationTest)

  it('Default value applied', RecordProcessorTest.defaultValueAppliedTest)
})