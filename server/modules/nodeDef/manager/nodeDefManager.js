const R = require('ramda')
const db = require('../../../db/db')

const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefValidations = require('../../../../common/survey/nodeDefValidations')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')
const SurveyUtils = require('../../../../common/survey/surveyUtils')

const NodeDefRepository = require('../repository/nodeDefRepository')
const NodeDefValidator = require('../validator/nodeDefValidator')

const { markSurveyDraft } = require('../../survey/repository/surveySchemaRepositoryUtils')

const ActivityLog = require('../../activityLog/activityLogger')

// ======= CREATE

const insertNodeDef = async (user, surveyId, nodeDefParam, client = db) =>
  await client.tx(async t => {
    const nodeDef = await NodeDefRepository.insertNodeDef(surveyId, nodeDefParam, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefCreate, nodeDefParam, t)

    return {
      ...nodeDef,
      validation: await NodeDefValidator.validateNodeDef({}, nodeDef)
    }
  })

// ======= READ

const processNodeDefs = async (nodeDefsDb, draft, validate) => {
  const nodeDefsResult = R.pipe(
    R.reduce(
      (acc, nodeDef) => draft
        ? R.append(nodeDef, acc)
        // remove draft and unpublished nodeDef
        : nodeDef.draft && !nodeDef.published
          ? acc
          : R.append(nodeDef, acc),
      [],
    ),
    SurveyUtils.toUuidIndexedObj
  )(nodeDefsDb)

  return validate
    ? await NodeDefValidator.validateNodeDefs(nodeDefsResult)
    : nodeDefsResult
}

const fetchNodeDefsBySurveyId = async (surveyId, draft = false, advanced = false, validate = false, client = db) => {
  const nodeDefsDB = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyId, draft, advanced, client)
  return await processNodeDefs(nodeDefsDB, draft, validate)
}

const fetchNodeDefsByUuid = async (surveyId, nodeDefUuids = [], draft = false, validate = false) => {
  const nodeDefsDB = await NodeDefRepository.fetchNodeDefsByUuid(surveyId, nodeDefUuids, draft, validate)
  return await processNodeDefs(nodeDefsDB, draft, validate)
}

// ======= UPDATE

const updateNodeDefProps = async (user, surveyId, nodeDefUuid, props, propsAdvanced = {}, client = db) =>
  await client.tx(async t => {
    const nodeDef = await NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, props, propsAdvanced, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefUpdate, { nodeDefUuid, props, propsAdvanced }, t)

    return nodeDef
  })

const deleteNodeDefValidationMessagesLabels = async (surveyId, deletedLanguages, client = db) => {
  await client.tx(async tx => {
    // 1. fetch all node defs (already published)
    const nodeDefs = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyId, false, true, tx)

    for (const nodeDef of nodeDefs) {
      // 2. for each node def, remove messages in deleted languages and update its expressions in validations
      const validations = NodeDef.getValidations(nodeDef)
      const expressions = NodeDefValidations.getExpressions(validations)

      let nodeDefUpdateRequired = false
      const expressionsUpdated = []

      for (const expression of expressions) {
        // 3. for each expression find messages in deleted languages (if any)
        const messages = NodeDefExpression.getMessages(expression)

        const deletedMessageLanguages = R.pipe(
          R.keys,
          R.intersection(deletedLanguages)
        )(messages)

        if (R.isEmpty(deletedMessageLanguages)) {
          expressionsUpdated.push(expression)
        } else {
          // 4. remove messages in deleted languages
          const messagesUpdated = R.omit(deletedMessageLanguages, messages)
          expressionsUpdated.push(NodeDefExpression.assocMessages(messagesUpdated)(expression))
          nodeDefUpdateRequired = true
        }

        if (nodeDefUpdateRequired) {
          // 5. update node def in db (props already published)
          const validationsUpdated = NodeDefValidations.assocExpressions(expressionsUpdated)(validations)
          await NodeDefRepository.updateNodeDefPropsPublished(surveyId, NodeDef.getUuid(nodeDef), {}, {
            [NodeDef.propKeys.validations]: validationsUpdated
          }, tx)
        }
      }
    }
  })
}

// ======= DELETE

const markNodeDefDeleted = async (user, surveyId, nodeDefUuid) =>
  await db.tx(async t => {
    const nodeDef = await NodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefMarkDeleted, { nodeDefUuid }, t)

    return nodeDef
  })

module.exports = {
  //CREATE
  insertNodeDef,

  //READ
  fetchNodeDefsBySurveyId,
  fetchNodeDefsByUuid,
  fetchNodeDefByUuid: NodeDefRepository.fetchNodeDefByUuid,

  //UPDATE
  updateNodeDefProps,
  publishNodeDefsProps: NodeDefRepository.publishNodeDefsProps,

  //DELETE
  markNodeDefDeleted,
  permanentlyDeleteNodeDefs: NodeDefRepository.permanentlyDeleteNodeDefs,
  deleteNodeDefsLabels: NodeDefRepository.deleteNodeDefsLabels,
  deleteNodeDefsDescriptions: NodeDefRepository.deleteNodeDefsDescriptions,
  deleteNodeDefValidationMessagesLabels
}