export default {
  title: 'Novedades en Arena',
  since: 'Desde la versión {{version}}',
  experimental: 'Experimental',
  dontShowAgain: 'No volver a mostrar',
  slideCounter: '{{current}} de {{total}}',
  noItems: 'No hay novedades para mostrar.',
  items: {
    googleSignIn: {
      title: 'Inicio de sesión con su cuenta de Google',
      description: `En la página de inicio de sesión, haga clic en **Iniciar sesión con Google** para iniciar sesión con su cuenta de Google (Gmail o Google Workspace) en lugar de escribir su contraseña.

La primera vez, la cuenta de Google se vincula a su cuenta de Arena por su dirección de correo electrónico: utilice la misma dirección de correo electrónico de su cuenta de Arena. Los usuarios invitados también pueden aceptar la invitación con Google. Vincule o desvincule su cuenta de Google en **Mi perfil > Métodos de inicio de sesión**; el inicio de sesión con correo electrónico y contraseña sigue disponible.`,
    },
    twoFactorAuth: {
      title: 'Autenticación de dos factores',
      description: `Proteja su cuenta con la **autenticación de dos factores (2FA)**: después de su contraseña, Arena solicita un código de verificación generado por una aplicación de autenticación en su teléfono (p. ej. Google Authenticator o Authy).

En **Mi perfil > Inicio de sesión y seguridad**, haga clic en **Gestionar 2FA**, añada un dispositivo y escanee el código QR con la aplicación. Guarde los códigos de respaldo mostrados al final: cada uno de ellos le permite iniciar sesión una vez si pierde su teléfono.`,
    },
    aiFeatures: {
      title: 'Funciones de IA',
      description: `En **Mi perfil > Funciones de IA**, elija **Qué puede ver la IA**:

- **Solo ayuda**: sus preguntas y fragmentos del manual de usuario de Arena;
- **+ Diseño de la encuesta**: también entidades, atributos, etiquetas, categorías y expresiones (ningún valor de los registros);
- **+ Datos de los registros**: también los valores de los registros y los resultados de las consultas.

Con **Personalizar** activa o desactiva cada función. En **Proveedores**, use el proveedor **Predeterminado de Arena** o añada el suyo: un **Servidor local** en su computadora o su red (p. ej. LM Studio u Ollama) o un proveedor en la nube con su clave API (OpenAI, Anthropic, Google Gemini y otros).`,
    },
    aiAssistant: {
      title: 'Asistente de IA',
      description: `Haga clic en el botón **Asistente de IA** del encabezado para abrir un panel que trabaja sobre la pantalla que está usando:

- **Diseño**: crea y modifica la encuesta en el diseñador de formularios;
- **Análisis**: responde preguntas sobre los datos mediante consultas;
- **Depuración**: busca errores en los registros y propone correcciones;
- **Ayuda**: responde preguntas sobre Arena.

Los cambios que propone se aplican solo después de que usted los revise. En el panel aparecen **sugerencias** (p. ej. etiquetas que faltan en un idioma): haga clic en una para que el asistente se encargue.`,
    },
    surveyAiPolicy: {
      title: 'Política de IA de la encuesta',
      description: `En **Información de la encuesta > Política de IA**, los administradores de la encuesta eligen dónde puede la IA procesar el contenido de la encuesta, por separado para el **Diseño de la encuesta** y los **Datos de los registros**: **Desactivada**, **En este dispositivo** (un servidor de IA local), **Servidor de la organización** o **Nube**.

Se aplica la más estricta entre esta política y los límites del servidor de Arena, a todos los usuarios de la encuesta.`,
    },
    mobileUploadEmailNotification: {
      title: 'Notificación por correo electrónico de los registros cargados desde Arena Mobile',
      description: `En **Información de la encuesta → Seguridad**, marque **Notificar por correo electrónico a los administradores de la encuesta la carga de registros desde Arena Mobile**: después de cada carga, cada administrador de la encuesta recibe un correo electrónico con la lista de los registros cargados, sus valores clave, si son nuevos o actualizados, el usuario que los creó, las fechas y el número de errores y advertencias de validación.

Se envía un solo correo por carga, aunque un dispositivo cargue muchos registros. La opción está disponible cuando **Permitir la carga de registros de Arena Mobile al servidor** está marcada, y se aplica una vez publicada la encuesta.`,
    },
    surveyGuestRole: {
      title: 'Nuevo rol: Invitado, para ver los registros sin editarlos',
      description: `Invite usuarios con el nuevo rol **Invitado** (**Usuarios > Invitar usuario**): pueden ver todos los registros de la encuesta, también en **Arena Mobile**, pero no pueden editarlos ni eliminarlos, ni añadir nuevos.

Añada el invitado a un **grupo de usuarios** (**Usuarios > Grupos de usuarios**) con calificadores para mostrar solo una parte de los datos: los registros cuyos atributos calificadores coinciden con los valores del grupo (p. ej. las parcelas de una región). Los grupos con la opción **Puede ver los registros de** dan acceso también a los registros de otros grupos.

Las encuestas existentes obtienen el nuevo rol automáticamente.`,
    },
    areaOfInterest: {
      title: 'Áreas de interés: comprobar si una ubicación está dentro de un área',
      description: `En **Información de la encuesta → Mapa**, agregue una o más **áreas de interés** (p. ej. los municipios de un área piloto), cada una con un nombre y un polígono en formato GeoJSON. Visualícelas en un mapa al agregarlas, una por una o todas juntas (**Mostrar todas en el mapa**), y muéstrelas como capas en **Datos > Mapa**.

La nueva función de expresión \`geoDistanceToAOIBoundary(location, 'area_name')\` devuelve la distancia en metros entre una ubicación y el límite del área: negativa dentro, positiva fuera. Compárela con la precisión GPS (\`location.accuracy\`) para clasificar las ubicaciones como dentro, fuera o inciertas, por ejemplo en valores por defecto de atributos de solo lectura y en reglas de validación con severidad *advertencia*. \`geoAOIContaining(location)\` devuelve el nombre del área que contiene la ubicación. Ambas funcionan también sin conexión en **Arena Mobile**.

Gracias a **[ASSEDEV Alerte Environnement](https://assedev.fr)** por la solicitud.`,
    },
    dataQueryTotals: {
      title: 'Totales y porcentajes en el Explorador de datos',
      description: `En **Datos > Explorador**, en el modo **Agregar** con una sola medida (p. ej. la suma del volumen de los árboles por especie), abra el menú **Vista** y elija **Mostrar total y porcentaje**: cada fila muestra su porcentaje del total y se agrega una fila **Total** al final de la tabla.

Las opciones **Mostrar nombres** y **Mostrar códigos** también están en el menú **Vista**.`,
    },
    mapWorkspace: {
      title: `Un nuevo espacio de trabajo del mapa`,
      description: `**Datos > Mapa** tiene un nuevo diseño: arriba, los menús **Mapa base**, **Añadir datos**, **Visualización** y **Herramientas** y un cuadro de búsqueda de coordenadas y claves de registros; al lado, las pestañas **Capas**, **Registros** y **Leyenda**; abajo, una barra de estado con las coordenadas del puntero y la escala.

Recorra los registros en el mapa, añada sus propios archivos (KML, Shapefile, GeoJSON) o servicios WMS / WMTS, mida distancias y áreas y tome capturas de pantalla.`,
    },
    dataMatrixExport: {
      title: `Exportar datos como matriz`,
      description: `En **Datos > Explorador**, seleccione una entidad múltiple (p. ej. las especies de cada registro), haga clic en **Exportar** y elija **Exportar como: Matriz de datos** para obtener una tabla con una fila por especie (o cualquier otro atributo) y una columna por registro, con el valor que elija en las celdas (p. ej. cobertura).

Es el formato que necesitan las herramientas de análisis de vegetación como **Turboveg**, **Juice** y **Synbiosys**. Defina un filtro en el Explorador para exportar solo algunos registros.`,
    },
    mobilePreview: {
      title: 'Vista previa de la encuesta en Arena Mobile',
      description: `En el diseñador de formularios, abre el menú junto al botón **Vista previa** y elige **Vista previa (móvil)** para probar la encuesta en borrador tal como se ve en **Arena Mobile**, en un teléfono o una tableta, en orientación vertical u horizontal.

La vista previa se ejecuta en el navegador: algunas funciones de un dispositivo real (p. ej. mapas y cámara) no están disponibles.`,
    },
    requiredIf: {
      title: 'Atributos obligatorios según una condición',
      description: `En el diseñador de formularios, en la pestaña **Validaciones** de un atributo, elige **Obligatorio cuando se cumple la condición** y escribe la condición: el atributo será obligatorio solo cuando la condición sea verdadera.

Durante la entrada de datos, el error "Valor requerido" se muestra solo cuando se cumple la condición.`,
    },
    themeSelector: {
      title: 'Tema claro y oscuro',
      description: `Usa el menú **Tema** del encabezado (también en la página de inicio de sesión) para cambiar entre el tema **Claro** y **Oscuro**, o seguir el **Predeterminado del sistema**.`,
    },
    surveyCompare: {
      title: 'Comparar y actualizar encuestas',
      description: `En el **Panel de control**, usa **Funciones avanzadas > Comparar / actualizar desde archivo** para comparar esta encuesta con una exportada desde otro servidor Arena (p. ej. un servidor de pruebas) o con otra encuesta de este servidor.

Revisa las diferencias y aplica solo los cambios que selecciones: se guardan como borrador hasta que publiques la encuesta.`,
    },
    usersBackup: {
      title: 'Copia de seguridad y restauración de usuarios',
      description: `En **Usuarios**, usa **Copia de seguridad / Restaurar** para exportar todos los usuarios, con sus roles en las encuestas y grupos de usuarios, y restaurarlos en otro servidor Arena.

Antes de restaurar, puedes elegir qué hacer con cada usuario.`,
    },
    samplingPointDataWhisp: {
      title: 'Análisis Whisp de los puntos de muestreo',
      description: `En la categoría de **datos de puntos de muestreo**, usa **Generar análisis Whisp** para analizar todas las ubicaciones de los puntos de muestreo con **Open Foris Whisp**.

El análisis se ejecuta en segundo plano y los resultados se guardan en una nueva categoría.`,
    },
    dashboardUpgrade: {
      title: 'Un nuevo panel de control',
      description: `El **Panel de control** tiene un nuevo aspecto: registros y colaboradores de un vistazo, un mapa de los datos recogidos y la tendencia de los registros añadidos en el tiempo.`,
    },
    clearNonApplicableValues: {
      title: 'Se borran los valores no relevantes',
      description: `Durante la entrada de datos, cuando un cambio hace que otros campos dejen de ser relevantes, sus valores se borran, tras pedirte confirmación.

Los administradores de la encuesta pueden mantener el comportamiento anterior con **Conservar los valores de los atributos no relevantes** (**Información de la encuesta > Seguridad**).`,
    },
    systemLogs: {
      title: 'Registros del sistema',
      description: `En **Administración del sistema > Registros del sistema**, sigue en directo los registros del servidor, con filtros por texto y nivel.`,
    },
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
      description: `Cree una nueva encuesta a partir de un **formulario ODK** (XForm, .xml): en **Inicio > Nueva encuesta > Importar**, seleccione **ODK (.xml)** como **Fuente** y haga clic en **Iniciar importación**. Las preguntas del formulario se convierten en atributos, las repeticiones (repeats) en entidades múltiples y las listas de opciones en categorías, con las etiquetas en todos los idiomas del formulario. Antes de publicar, defina los atributos clave de la entidad raíz y corrija los errores indicados por **Publicar**, si los hay.

Después, importe los datos recopilados con **ODK Collect** en **Datos > Importación de datos > ODK / ODK Collect**: un archivo .zip con una carpeta por envío (exportación de ODK Briefcase). Los envíos ya importados se omiten.`,
    },
    positionTracking: {
      title: 'Seguimiento de la posición: registrar el recorrido realizado en el campo',
      description: `Marque **Seguimiento de la posición** en la pestaña **Básico** de un atributo **Geoespacial** simple: en **Arena Mobile**, el valor del atributo es el recorrido realizado por el usuario mientras rellena el registro, registrado siguiendo la posición del dispositivo.

El recorrido no se puede editar manualmente. La opción se aplica solo a Arena Mobile.`,
    },
    dynamicEnumerator: {
      title: 'Enumeración dinámica de entidades',
      description: `Usa una **expresión** para elegir qué elementos de la categoría generan las filas de una entidad múltiple enumerada: p. ej. \`unique(plot.land_use)\` crea una fila solo para los usos del suelo presentes en las parcelas.`,
    },
  },
}
