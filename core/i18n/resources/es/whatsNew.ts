export default {
  title: 'Novedades en Arena',
  since: 'Desde la versión {{version}}',
  experimental: 'Experimental',
  dontShowAgain: 'No volver a mostrar',
  slideCounter: '{{current}} de {{total}}',
  noItems: 'No hay novedades para mostrar.',
  items: {
    dataQueryAiGenerate: {
      title: 'Crea consultas del Explorador de datos con IA',
      description: `En el **Explorador de datos**, describe en lenguaje natural los datos que buscas (p. ej. *"número de árboles por especie en cada provincia"*) y deja que la IA construya la consulta por ti.

La IA también puede sugerir un nombre y una descripción al guardar una consulta.

*Requiere que las funciones de IA estén habilitadas en tu perfil de usuario.*`,
    },
    recordPrint: {
      title: 'Imprimir registros',
      description: `Exporta un registro como documento **Word** o **PDF** imprimible, incluidas las imágenes, con el botón PDF del editor de registros.

Puedes elegir la orientación de la página (vertical u horizontal).`,
    },
    attributeClone: {
      title: 'Clonar atributos en el diseñador de formularios',
      description: `En el **diseñador de formularios**, usa el menú de un atributo para **clonarlo** en la misma entidad o en otra, con todas sus propiedades.`,
    },
    odkImport: {
      title: 'Importar encuestas y datos desde ODK',
      description: `Crea una nueva encuesta a partir de un **formulario ODK (.xml)** e importa los datos recogidos con **ODK Collect**.

*Esta función está en fase beta.*`,
    },
    dynamicEnumerator: {
      title: 'Enumeración dinámica de entidades',
      description: `Usa una **expresión** para elegir qué elementos de la categoría generan las filas de una entidad múltiple enumerada: p. ej. \`unique(plot.land_use)\` crea una fila solo para los usos del suelo presentes en las parcelas.`,
    },
  },
}
