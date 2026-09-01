import isItemDeletedFnsSurvey from './survey'
import isItemDeletedFnsCategory from './category'
import isItemDeletedFnsTaxonomy from './taxonomy'
import isItemDeletedFnsRecord from './record'
import isItemDeletedFnsNode from './node'
import isItemDeletedFnsUser from './user'
import isItemDeletedFnsAnalysis from './analysis'

export default {
  ...isItemDeletedFnsSurvey,
  ...isItemDeletedFnsCategory,
  ...isItemDeletedFnsTaxonomy,
  ...isItemDeletedFnsRecord,
  ...isItemDeletedFnsNode,
  ...isItemDeletedFnsUser,
  ...isItemDeletedFnsAnalysis,
}
