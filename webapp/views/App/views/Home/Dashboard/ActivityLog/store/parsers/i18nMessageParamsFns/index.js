import i18nMessageParamsFnsAnalysis from './analysis'
import i18nMessageParamsFnsCategory from './category'
import i18nMessageParamsFnsNode from './node'
import i18nMessageParamsFnsRecord from './record'
import i18nMessageParamsFnsSurvey from './survey'
import i18nMessageParamsFnsTaxonomy from './taxonomy'
import i18nMessageParamsFnsUser from './user'

export default {
  ...i18nMessageParamsFnsSurvey,
  ...i18nMessageParamsFnsCategory,
  ...i18nMessageParamsFnsTaxonomy,
  ...i18nMessageParamsFnsRecord,
  ...i18nMessageParamsFnsNode,
  ...i18nMessageParamsFnsUser,
  ...i18nMessageParamsFnsAnalysis,
}
