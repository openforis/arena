import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

// Users are built directly (not via getContextUser()) so each test can give them different
// "extra" props, read by userProp() (@openforis/arena-core Users.getCombinedExtraProps).
const userA = { uuid: 'test-user-dependent-a', props: { extra: { role: 'role1', level: 'admin' } } }
const userB = { uuid: 'test-user-dependent-b', props: { extra: { role: 'role2', level: 'other' } } }

describe('User dependent node state update', () => {
  test('applicable is recomputed per user, without persisting', async () => {
    const survey = await SB.survey(
      userA,
      SB.entity(
        'root',
        SB.entity('entity_role1').applyIf("userProp('role') == 'role1'"),
        SB.entity('entity_role2').applyIf("userProp('role') == 'role2'")
      )
    ).build()

    const record = RB.record(
      userA,
      survey,
      RB.entity('root', RB.entity('entity_role1'), RB.entity('entity_role2'))
    ).build()

    const entityRole1DefUuid = NodeDef.getUuid(Survey.getNodeDefByName('entity_role1')(survey))
    const entityRole2DefUuid = NodeDef.getUuid(Survey.getNodeDefByName('entity_role2')(survey))

    // userA has role1: entity_role1 applicable, entity_role2 not
    const recordForUserA = await Record.recomputeUserDependentNodeState({ user: userA, survey, record })
    const rootAfterUserA = Record.getRootNode(recordForUserA)
    expect(Node.isChildApplicable(entityRole1DefUuid)(rootAfterUserA)).toBe(true)
    expect(Node.isChildApplicable(entityRole2DefUuid)(rootAfterUserA)).toBe(false)

    // userB has role2: entity_role2 applicable, entity_role1 not - recomputed fresh from the
    // SAME persisted-looking record, proving it doesn't just keep whatever userA last computed.
    const recordForUserB = await Record.recomputeUserDependentNodeState({ user: userB, survey, record })
    const rootAfterUserB = Record.getRootNode(recordForUserB)
    expect(Node.isChildApplicable(entityRole1DefUuid)(rootAfterUserB)).toBe(false)
    expect(Node.isChildApplicable(entityRole2DefUuid)(rootAfterUserB)).toBe(true)

    // the original record object passed in must be untouched (pure/in-memory, no side effect
    // on the caller's copy - persistence decisions are entirely up to the caller)
    const rootOriginal = Record.getRootNode(record)
    expect(Node.isChildApplicable(entityRole1DefUuid)(rootOriginal)).toBe(true)
  })

  test('default value is recomputed per user and cascades to a dependent (non user-dependent) applicable expression', async () => {
    const survey = await SB.survey(
      userA,
      SB.entity(
        'root',
        SB.attribute('level', NodeDef.nodeDefType.text)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: "userProp('level')" })),
        SB.attribute('admin_only_flag', NodeDef.nodeDefType.text).applyIf("level == 'admin'")
      )
    ).build()

    const record = RB.record(
      userA,
      survey,
      RB.entity('root', RB.attribute('level'), RB.attribute('admin_only_flag'))
    ).build()

    const adminOnlyFlagDefUuid = NodeDef.getUuid(Survey.getNodeDefByName('admin_only_flag')(survey))

    // userA's level is 'admin': default value applied, and admin_only_flag becomes applicable
    // as a result - proving the default value change cascades to its real dependents.
    const recordForUserA = await Record.recomputeUserDependentNodeState({ user: userA, survey, record })
    const nodeLevelUserA = RecordUtils.findNodeByPath('root/level')(survey, recordForUserA)
    const rootAfterUserA = Record.getRootNode(recordForUserA)
    expect(Node.getValue(nodeLevelUserA)).toBe('admin')
    expect(Node.isChildApplicable(adminOnlyFlagDefUuid)(rootAfterUserA)).toBe(true)

    // userB's level is 'other': re-applying the default value for a different user overwrites
    // the previously-applied default (it was never manually edited), and admin_only_flag
    // becomes non-applicable again as a consequence.
    const recordForUserB = await Record.recomputeUserDependentNodeState({
      user: userB,
      survey,
      record: recordForUserA,
    })
    const nodeLevelUserB = RecordUtils.findNodeByPath('root/level')(survey, recordForUserB)
    const rootAfterUserB = Record.getRootNode(recordForUserB)
    expect(Node.getValue(nodeLevelUserB)).toBe('other')
    expect(Node.isChildApplicable(adminOnlyFlagDefUuid)(rootAfterUserB)).toBe(false)
  })
})
