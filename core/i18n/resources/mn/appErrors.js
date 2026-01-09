export default {
  cannotGetChild: "Атрибут {{name}}-с '{{childName}}' хүүг авч чадахгүй байна",
  cannotImportFilesExceedingQuota: 'Бичлэгийн файлуудыг импортлох боломжгүй: файл хадгалах квот хэтэрсэн',
  cannotInsertFileExceedingQuota: 'Файл оруулах боломжгүй: файл хадгалах квот хэтэрсэн',
  cannotOverridePublishedTaxa: 'Нийтлэгдсэн таксоныг дарж бичих боломжгүй',
  cantUpdateStep: 'Алхам шинэчлэх боломжгүй',
  chainCannotBeSaved: 'Сүлжээ буруу тул хадгалах боломжгүй',
  csv: {
    emptyHeaderFound: '{{columnPosition}} баганад хоосон гарчиг олдсон',
    emptyHeaders: 'Хоосон гарчгууд олдсон',
  },
  dataExport: {
    excelMaxCellsLimitExceeded:
      'Өгөгдөл экспортлох алдаа (хэт олон зүйл). Өгөгдлийг CSV форматаар экспортлохыг оролдоно уу.',
    noRecordsMatchingSearchCriteria: 'Хайлтын шалгуурт тохирох бичлэг олдсонгүй',
  },
  dataImport: {
    importFromMobileNotAllawed: 'Arena Mobile-с өгөгдөл импортлохыг хориглоно',
    noRecordsFound: 'Импортын файлд бичлэг олдсонгүй эсвэл буруу файлын формат',
  },
  entryDataNotFound: 'Оролтын өгөгдөл олдсонгүй: {{entryName}}',
  expression: {
    identifierNotFound: 'Танигч олдсонгүй',
    undefinedFunction: 'Тодорхойлогдоогүй функц',
  },
  functionHasTooFewArguments: 'Функц {{fnName}} нь дор хаяж {{minArity}} шаарддаг ({{numArgs}} авсан)',
  functionHasTooManyArguments: 'Функц {{fnName}} нь хамгийн ихдээ {{maxArity}} зөвшөөрдөг ({{numArgs}} авсан)',
  generic: 'Гэнэтийн алдаа: {{text}}',
  importingDataIntoWrongCollectSurvey:
    'Буруу цуглуулгын судалгаанд өгөгдөл импортлож байна. Хүлээгдэж буй URI: {{collectSurveyUri}}',
  invalidType: 'Буруу төрөл {{type}}',
  jobCanceledOrErrorsFound: 'Ажил цуцлагдсан эсвэл алдаа олдсон; гүйлгээг буцаах',
  paramIsRequired: 'Парам {{param}} шаардлагатай',
  unableToFindParent: '{{name}}-н эцгийг олж чадахгүй байна',
  unableToFindNode: '{{name}} нэртэй зангилааг олж чадахгүй байна',
  unableToFindSibling: '{{name}} нэртэй ах дүүг олж чадахгүй байна',
  undefinedFunction: "Тодорхойлогдоогүй функц '{{fnName}}' эсвэл буруу параметрийн төрлүүд",
  invalidSyntax: 'Илэрхийллийн синтакс буруу байна',
  networkError: 'Сервертэй холбогдоход алдаа гарлаа',
  record: {
    errorUpdating: 'Бичлэг шинэчлэхэд алдаа гарлаа',
    entityNotFound: '"{{entityName}}" нэртэй объект "{{keyValues}}" түлхүүрээр олдсонгүй',
    updateSelfAndDependentsDefaultValues:
      'Бичлэг шинэчлэхэд алдаа гарлаа; {{nodeDefName}} зангилааны илэрхийллийг үнэлэхэд алдаа гарлаа: {{details}}',
  },
  sessionExpiredRefreshPage: 'Сесс дууссан байж магадгүй.\nХуудсыг сэргээж үзнэ үү.',
  survey: {
    nodeDefNameNotFound: 'Зангилааны тодорхойлолт олдсонгүй: {{name}}',
  },
  unsupportedFunctionType: 'Дэмжигдээгүй функцийн төрөл: {{exprType}}',
  userHasPendingInvitation:
    "'{{email}}' имэйлтэй хэрэглэгчид хүлээгдэж буй урилга аль хэдийн байна; үүнийг хүлээн авах хүртэл түүнийг энэ судалгаанд урих боломжгүй",
  userHasRole: 'Өгөгдсөн хэрэглэгч энэ судалгаанд аль хэдийн үүрэгтэй байна',
  userHasRole_other: 'Өгөгдсөн хэрэглэгчид энэ судалгаанд аль хэдийн үүрэгтэй байна',
  userInvalid: 'Хэрэглэгч буруу байна',
  userIsAdmin: 'Өгөгдсөн хэрэглэгч аль хэдийн системийн администратор байна',
  userNotAllowedToChangePref: 'Хэрэглэгч тохиргоог өөрчлөх боломжгүй',
  userNotAuthorized: 'Хэрэглэгч {{userName}} эрхгүй байна',
}
