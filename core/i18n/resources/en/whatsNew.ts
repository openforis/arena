export default {
  title: `What's new in Arena`,
  since: 'Since version {{version}}',
  experimental: 'Experimental',
  dontShowAgain: `Don't show these again`,
  slideCounter: '{{current}} of {{total}}',
  noItems: 'No new features to show.',
  items: {
    dataQueryAiGenerate: {
      title: 'Create Data Explorer queries with AI',
      description: `In **Data Explorer**, describe the data you are looking for in plain language (e.g. *"number of trees by species in each province"*) and let AI build the query for you.

AI can also suggest a name and a description when you save a query.

*Requires AI features to be enabled in your user profile.*`,
    },
    recordPrint: {
      title: 'Print records',
      description: `Export a record as a printable **Word** or **PDF** document, pictures included, using the PDF button in the record editor.

You can choose the page orientation (portrait or landscape).`,
    },
    attributeClone: {
      title: 'Clone attributes in the form designer',
      description: `In the **form designer**, use the menu of an attribute to **clone** it into the same or another entity, with all its properties.`,
    },
    odkImport: {
      title: 'Import surveys and data from ODK',
      description: `Create a new survey from an **ODK form (.xml)** and import the data collected with **ODK Collect**.

*This feature is in beta.*`,
    },
    dynamicEnumerator: {
      title: 'Dynamic enumeration of entities',
      description: `Use an **expression** to choose which category items generate the rows of an enumerated multiple entity: e.g. \`unique(plot.land_use)\` creates a row only for the land uses actually found in the plots.`,
    },
  },
}
