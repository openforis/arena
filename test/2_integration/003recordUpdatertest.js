import * as RecordUpdateManagerTest from './recordTests/recordUpdateManagerTest'

export const RecordUpdateManager = async () => {
  describe('RecordUpdateManager Test', () => {
    test('Record creation', RecordUpdateManagerTest.recordCreationTest)
    test('Default value applied', RecordUpdateManagerTest.defaultValueAppliedTest)
  })
}
