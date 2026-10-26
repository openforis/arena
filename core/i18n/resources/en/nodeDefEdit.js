export default {
  additionalFields: 'Additional fields',
  basic: 'Basic',
  advanced: 'Advanced',
  mobileApp: 'Mobile App',
  print: 'Print',
  printProps: {
    printOrientation: {
      label: 'Page orientation',
      info: 'Orientation used when this entity starts its own printable section. Default inherits the document orientation chosen at export.',
    },
    orientations: {
      default: 'Default (document)',
      portrait: 'Portrait',
      landscape: 'Landscape',
    },
  },
  validations: 'Validations',
  function: 'Function',
  editingFunction: 'Editing function {{functionName}}',
  editorHelp: {
    json: 'Valid expressions are a subset of Javascript.',
    sql: 'Only valid SQL expressions are allowed.',
  },
  editorCompletionHelp: '- Show the available variables and functions that can be used',
  functionDescriptions: {
    categoryItemProp:
      'Returns the value of the specified $t(extraProp.label) of a category item having the specified code',
    dateTimeDiff: 'Returns the difference (in minutes) from 2 date-time couples',
    distance: 'Returns the distance (in meters) between the specified coordinates',
    first: 'Returns the first value or node of the specified multiple attribute or entity',
    geoCoordinateAtDistance:
      'Returns the coordinates at a specified distance and bearing from the specified coordinates',
    geoDistance: '$t(nodeDefEdit:functionDescriptions.distance)',
    geoPolygon: 'Generates a polygon in GeoJSON from a list of coordinates',
    includes: 'Returns true if the specified multiple attribute includes the specified value.',
    index: 'Returns the index of the specified node among its siblings',
    isEmpty: 'Returns true if the argument has no value specified',
    isNotEmpty: 'Returns true if the argument has some value specified',
    last: 'Returns the last value or node of the specified multiple attribute or entity',
    ln: 'Returns the natural logarithm of X',
    log10: 'Returns the base 10 logarithm of X',
    max: 'Returns the maximum of the arguments',
    min: 'Returns the minimum of the arguments',
    now: 'Returns the current date or time',
    parent: 'Returns the parent entity of the specified node',
    pow: 'Returns the value of a base raised to a power',
    prevCycleNote: 'Works only in Arena Mobile when multiple cycles are defined and the previous-cycle link is enabled',
    prevCycleValue:
      'Returns the value of the same attribute in the record of the previous cycle. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    prevCycleValues:
      'Returns the values of the same attributes in the record of the previous cycle. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    recordCycle: 'Returns the cycle of the current record',
    recordDateCreated:
      'Returns the creation date and time of the current record as a datetime value. It can be used in a text, date, or time attribute',
    recordDateLastModified:
      'Returns the last modified date and time of the current record as a datetime value. It can be used in a text, date, or time attribute',
    recordOwnerEmail: 'Returns the email of the user owning the record',
    recordOwnerName: 'Returns the name of the user owning the record',
    recordOwnerRole: 'Returns the role (in the current survey) of the user owning the record',
    rowIndex: 'Returns the current table row (or form) index',
    taxonProp: 'Returns the value of the specified $t(extraProp.label) of a taxon having the specified code',
    taxonVernacularName:
      'Returns the (first) vernacular (or local) name in the specified language of a taxon having the specified code',
    unique: 'Returns the unique values of a multiple attribute or entity',
    userEmail: 'Returns the email of the logged in user',
    userIsRecordOwner:
      'Returns a boolean value "true" if the user editing the record is also its owner, "false" otherwise',
    userName: 'Returns the name of the logged in user',
    userProp: 'Returns the value of the specified $t(extraProp.label) of the logged in user',
    uuid: 'Generates a UUID (universally unique identifier) that can be used as identifier (e.g. as a key attribute of an enity)',
    // SQL functions
    avg: 'Returns the average value of a numeric variable',
    count: 'Returns the number of rows that matches a specified criterion',
    sum: 'Returns the total sum of a numeric variable',
  },
  functionName: {
    rowIndex: 'Row index',
  },
  basicProps: {
    analysis: 'Analysis',
    autoIncrementalKey: {
      label: 'Auto incremental',
      info: 'Value will be automatically generated',
    },
    autoCreateMinCountItems: {
      label: 'Auto-create minimum items',
      info: 'When the entity becomes relevant or its parent entity is created, a number of entities equal to the minimum count will be generated automatically.',
    },
    displayAs: 'Display as',
    displayIn: 'Display in',
    entitySource: 'Entity Source',
    enumerate: {
      label: 'Enumerate',
      info: `The rows will be automatically generated using the category items associated to a code attribute marked as Key defined inside the entity; rows cannot be added or deleted and the key code attribute won't be editable`,
    },
    enumeratingItemsExpression: {
      label: 'Enumerating items expression',
      info: 'Optional expression that filters which category items are enumerated (e.g. unique(table_source.source_type)). When empty, all category items are used.',
    },
    enumerator: {
      label: 'Enumerator',
      info: 'The items in the category will be used to generate the rows of the parent entity',
    },
    form: 'Form',
    formula: 'Formula',
    includedInClonedData: 'Included in cloned data',
    includedInMultipleEntitySummary: {
      label: 'Include in multiple entity summary',
      info: `If marked, the attribute value will be visible in the entity selector (in Arena) and in the entity summary view (in Arena Mobile)`,
    },
    includedInRecordsList: {
      label: 'Include in records list',
      info: `If marked, the attribute will be visible in records list`,
    },
    key: 'Key',
    maxKeysCountReached: 'Max keys count reached ({{maxKeysCount}})',
    multiple: 'Multiple',
    ownPage: 'Its own page',
    parentPage: 'Parent page ({{parentPage}})',
    qualifier: {
      label: 'Qualifier',
      info: `When a new record is created by a user belonging to a group, this attribute will be automatically filled with the value specified for it in the qualifiers of the user's group. Users will only be able to see and modify records belonging to their own group, if they belong to one.`,
    },
    table: 'Table',
  },
  advancedProps: {
    areaBasedEstimate: 'Area-based estimate',
    defaultValues: 'Default values',
    defaultValuesInfo: `This allows you to automatically fill in an answer based on specific rules.  
If you set up multiple rules, the system will check them in order from top to bottom.  
It will apply the very first rule that matches your conditions and use that as the answer.`,
    defaultValueEvaluatedOneTime: 'Default value evaluated only one time',
    defaultValueEvaluatedOneTimeInfo: `The default value will be evaluated only one time, when the attribute is created.
If not marked, the default value will be re-evaluated every time the record is updated.
It should be marked when using expressions like now() or uuid() that should be evaluated only once, when the attribute value is generated for the first time.`,
    defaultValuesNotEditableForAutoIncrementalKey: 'Default values not editable because auto incremental key is set',
    defaultValuesNotSpecified: 'Default values not specified',
    defaultValuesSpecified: 'Default values specified',
    editableIf: 'Editability',
    editableIfInfo: `By default, a user can always access a relevant field.  
Here we can set a rule whether a user can type into or change this field.  
If the conditions you set are met, the field can be edited. If not, it becomes "read-only" (locked).`,
    editableAlways: 'Always editable',
    editableIfConditionIsMet: 'Editable if condition is met',
    hidden: 'Always hidden',
    hiddenInReport: 'Hidden in Analytical Dashboard',
    hiddenInReportInfo: `If marked, the attribute won't be visible in the Analytical Dashboard`,
    hiddenWhenNotRelevant: 'Hidden when not relevant',
    itemsFilter: 'Items filter',
    itemsFilterInfo: `Expression used to filter selectable items.
In the expression, the word "this" will refer to the item itself. 
E.g. this.region = region_attribute_name 
(where "region" is the name of an extra property defined for the item and region_attribute_name is the name of an attribute in the survey)`,
    readOnly: 'Read only',
    relevantIf: 'Relevance',
    relevantIfInfo: `By default, all fields are always active.  
If you set a relevance rule and it isn't met, the field will either turn grey or be hidden entirely,  
and any automatic answers will be ignored.  
Use this to dynamically show or hide parts of your survey; e.g. only revealing a "Please specify" text box if a user selects "Other" in the previous question.`,
    relevantIfRadioNone: 'Always relevant',
    relevantIfRadioDefined: 'Relevant if condition is met',
    script: 'Script',
    visibleIf: 'Visibility',
    visibleIfInfo: `By default, a field is always visible.  
If you set a rule, it will only be visible when that rule is met; otherwise, it will be hidden.  
Note: unlike hiding an "inactive" (irrelevant) field, a hidden field can still have an automatic answer saved behind the scenes.  
This is perfect for hiding entire parts of a survey based on who is logged in (like user roles).`,
    visibleAlways: 'Always visible',
    visibleIfConditionIsMet: 'Visible if condition is met',
  },
  mobileAppProps: {
    hiddenInMobile: {
      label: 'Hidden in Arena Mobile',
      info: `If marked, the attribute won't be visible in AM`,
    },
    includedInPreviousCycleLink: {
      label: 'Include in previous cycle link',
      info: `If marked, the value from the previous cycle will be shown on the data entry form (when the link to the previous cycle is set active in the mobile app)`,
    },
  },
  numericProps: {
    unit: 'Unit',
  },
  decimalProps: {
    maxNumberDecimalDigits: 'Max number of decimal digits',
  },
  fileProps: {
    fileNameExpression: 'File name expression',
    fileType: 'File type',
    fileTypes: {
      image: 'Image',
      video: 'Video',
      audio: 'Audio',
      other: 'Other',
    },
    maxFileSize: 'Max. file size (Mb)',
    numberOfFiles: 'Go to Validations to change the Min. and Max. number of files.',
    showGeotagInformation: 'Show geotag information',
  },
  mobileProps: {
    title: 'Mobile App',
  },
  timeProps: {
    includeSeconds: 'Include seconds',
  },
  geoProps: {
    positionTracking: 'Position tracking',
    positionTrackingInfo: `It applies only to Arena Mobile: if checked, the value is the path walked by the user while filling in the record (recorded by tracking the device position) and it cannot be edited manually`,
  },
  formHeaderProps: {
    headerColorLabel: 'Header color',
    headerColor: {
      blue: 'Blue',
      green: 'Green',
      orange: 'Orange',
      red: 'Red',
      yellow: 'Yellow',
    },
  },
  textProps: {
    displayAsTypes: {
      hyperlink: 'Hyperlink',
      markdown: 'Markdown',
      text: 'Text',
    },
    textInputType: 'Text input type',
    textInputTypes: {
      singleLine: 'Single line',
      multiLine: 'Multi line',
    },
    textTransform: 'Text transform',
    textTransformTypes: {
      none: 'none',
      capitalize: 'capitalize',
      uppercase: 'uppercase',
      lowercase: 'lowercase',
    },
  },
  booleanProps: {
    labelValue: 'Label value',
    labelValues: {
      trueFalse: '$t(common.true)/$t(common.false)',
      yesNo: '$t(common.yes)/$t(common.no)',
    },
  },
  codeProps: {
    category: 'Category',
    codeShown: 'Show code',
    displayAsTypes: {
      checkbox: 'Checkbox',
      dropdown: 'Dropdown',
    },
    parentCode: 'Parent Code',
  },
  coordinateProps: {
    allowOnlyDeviceCoordinate: 'Allow only device coordinate',
    allowOnlyDeviceCoordinateInfo: `It applies only to Arena Mobile: if checked, the user won't be able to modify the X/Y values, but only device GPS can be used to get them`,
    mapMarkerColor: 'Map marker color',
  },
  expressionsProp: {
    expression: 'Expression',
    applyIf: 'Apply If',
    confirmDelete: 'Delete this expression?',
    severity: 'Severity',
  },
  validationsProps: {
    minCount: 'Min count',
    maxCount: 'Max count',
    expressions: 'Validation expressions',
    attributeAlwaysValid: 'Attribute always valid',
    attributeValidWhenConditionIsMet: 'Attribute valid when condition is met',
    notRequired: 'Not required',
    alwaysRequired: 'Always required',
    requiredWhenConditionIsMet: 'Required when condition is met',
  },
  cannotChangeIntoMultipleWithDefaultValues: 'This node cannot be converted to multiple because it has default values.',
  cannotDeleteNodeDefReferenced: `Cannot delete "{{nodeDef}}": it's referenced by these node definitions: {{nodeDefDependents}}`,
  cloneDialog: {
    confirmButtonLabel: 'Clone',
    title: 'Cloning node definition "{{nodeDefName}}"',
    entitySelectLabel: 'Entity to clone into:',
  },
  conversion: {
    dialogTitle: 'Convert {{nodeDefName}} into another type',
    fromType: 'From type',
    toType: 'To type',
  },
  moveDialog: {
    confirmButtonLabel: 'Move',
    title: 'Moving node definition "{{nodeDefName}}" from "{{parentNodeDefName}}"',
    entitySelectLabel: 'Entity to move into:',
  },
  movedNodeDefinitionHasErrors: 'The node definition "{{nodeDefName}}" you have moved has errors; please fix them.',
  nodeDefintionsHaveErrors: 'These node definitions have errors: {{nodeDefNames}}. Please fix them.',
  filterVariable: 'Variable to filter items',
  filterVariableForLevel: 'Variable for {{levelName}}',
  unique: {
    label: 'Unique',
    info: `When an attribute is marked as **Unique**, its value must be unique inside the closest multiple entity (an error will be shown otherwise).  

---

E.g. in a structure like *cluster -> plot -> tree*, if you have an attribute *tree_species* marked as **Unique**, you can have only one tree per species inside the same *plot*.`,
  },
  nodeDefClonedSuccessfully: 'Node definition "{{nodeDefName}}" cloned successfully into "{{targetParentNodeDefName}}"',
  categoriesClonedFromSurvey: 'The following categories were also cloned from the source survey: {{names}}',
  taxonomiesClonedFromSurvey: 'The following taxonomies were also cloned from the source survey: {{names}}',
}
