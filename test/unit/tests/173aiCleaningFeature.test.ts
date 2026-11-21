import { AiFeaturePermission, getAiFeature, isGatewayFeature } from '@common/ai/features'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import { permissionMiddlewares } from '@server/modules/ai/api/aiMiddleware'

describe('assistantCleaning feature', () => {
  test('is an assistant gateway feature on data, with a fixed data class and the record cleanse permission', () => {
    expect(AiFeaturePermission.recordCleanse).toBe('recordCleanse')
    expect(getAiFeature('assistantCleaning')).toEqual({
      key: 'assistantCleaning',
      category: 'assistantCleaning',
      dataClass: 'data',
      variableDataClass: false,
      permission: 'recordCleanse',
      gateway: true,
      tools: true,
    })
    expect(isGatewayFeature('assistantCleaning')).toBe(true)
  })

  test('the gateway maps its permission to the record cleanse middleware', () => {
    expect(permissionMiddlewares[getAiFeature('assistantCleaning').permission]).toBe(
      AuthMiddleware.requireRecordCleansePermission
    )
  })
})
