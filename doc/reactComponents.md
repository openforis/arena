## **React Components: Common practice**

- File name is uppercase
- Stylesheet file has the same name of the component
- The folder in which it is included must have the same name (uppercase included) and have an index.js with default export of the component
- Subcomponents must be in the same folder of the component and follow the same rules
- Imports are order according to the following list:
  - styleSheet
  - React
  - PropTypes
  - redux
  - react-router
  - other node modules
  - _empty line_
  - model object and utils: core, common, webapp, utils
  - _empty line_
  - service, store
  - _empty line_
  - common hooks
  - common components
  - _empty line_
  - local components
- Use functional components
- For redux-store state use hooks, do not use connect
- propTypes are required
- defaultProps when propTypes are not required
- classNames:
  - root className must have the same name of the component, but lower case
  - components inner classNames must start with ${rootClassName}__${name} (e.g. `root__btn-save`)
  - subcomponents root className must have ${parentRootClassName}-${componentNameLowerCase} e.g. `root-componentA` and `root-componentA__btn-delete`
