import * as R from 'ramda';
import { uuidv4 } from './../uuid';
import ValidationResult from '../validation/validationResult';
import StringUtils from '../stringUtils';
import ObjectUtils from '../objectUtils';

const keys = {
  placeholder: 'placeholder',
  expression: 'expression',
  applyIf: 'applyIf',
  messages: 'messages',
  severity: 'severity'
}

// ====== CREATE
export interface IExpression {
  uuid: string;
  expression: string;
  applyIf: string;
  placeholder: boolean;
  messages?: any[];
}

const createExpression = (expression = '', applyIf = '', placeholder = false) => ({
  uuid: uuidv4(),
  expression,
  applyIf,
  placeholder
})

// ====== READ

const getExpression: (obj: IExpression) => string = R.prop(keys.expression) as (obj: IExpression) => string

const getApplyIf: (obj: IExpression) => string = R.prop(keys.applyIf) as (obj: IExpression) => string

const getMessages = R.propOr({}, keys.messages)

const getSeverity = R.propOr(ValidationResult.severities.error, keys.severity)

const isPlaceholder = R.propEq(keys.placeholder, true)

const isEmpty: (expression?: IExpression) => boolean
= (expression = {} as IExpression) => StringUtils.isBlank(getExpression(expression)) && StringUtils.isBlank(getApplyIf(expression))

// ====== UPDATE

const assocProp = (propName: string, value) => R.pipe(
  R.assoc(propName, value),
  R.dissoc(keys.placeholder),
)

const assocMessages = messages => assocProp(keys.messages, messages)

export interface IMessage {
  lang: string;
  label: string;
}
const assocMessage = (message: IMessage) =>
  nodeDefExpression => {
    const messagesOld = getMessages(nodeDefExpression)
    const messagesNew = R.assoc(message.lang, message.label, messagesOld)
    return assocMessages(messagesNew)(nodeDefExpression)
  }

const assocSeverity = severity => assocProp(keys.severity, severity)

// ====== UTILS

const extractNodeDefNames: (jsExpr: string) => string[] = (jsExpr = '') => {
  if (StringUtils.isBlank(jsExpr))
    return []

  const names: string[] = []
  const regex = /(node|sibling)\(['"](\w+)['"]\)/g

  let matches: any[]
  while (matches = regex.exec(jsExpr) as any[]) {
    names.push(matches[2])
  }
  return names
}

const findReferencedNodeDefs = (nodeDefExpressions: IExpression[]) =>
  R.pipe(
    R.reduce((acc, nodeDefExpr: IExpression) =>
        R.pipe(
          R.concat(extractNodeDefNames(getExpression(nodeDefExpr))),
          R.concat(extractNodeDefNames(getApplyIf(nodeDefExpr))),
        )(acc),
      [] as string[]
    ),
    R.uniq
  )(nodeDefExpressions)

export default {
  keys,

  //CREATE
  createExpression,
  createExpressionPlaceholder: () => createExpression('', '', true),

  //READ
  getUuid: ObjectUtils.getUuid,
  getExpression,
  getApplyIf,
  getMessages,
  getMessage: (lang, defaultValue = '') => R.pipe(
    getMessages,
    R.propOr(defaultValue, lang)
  ),
  getSeverity,
  isEmpty,
  isPlaceholder,

  //UPDATE
  assocExpression: expression => assocProp(keys.expression, expression),
  assocApplyIf: applyIf => assocProp(keys.applyIf, applyIf),
  assocMessage,
  assocSeverity,

  //UTILS
  findReferencedNodeDefs
};
