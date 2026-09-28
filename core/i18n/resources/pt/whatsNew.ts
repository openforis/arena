export default {
  title: 'Novidades no Arena',
  since: 'Desde a versão {{version}}',
  experimental: 'Experimental',
  dontShowAgain: 'Não mostrar novamente',
  slideCounter: '{{current}} de {{total}}',
  noItems: 'Não há novidades para mostrar.',
  items: {
    dataQueryAiGenerate: {
      title: 'Crie consultas do Explorador de dados com IA',
      description: `No **Explorador de dados**, descreva em linguagem simples os dados que procura (p. ex. *"número de árvores por espécie em cada província"*) e deixe a IA construir a consulta por si.

A IA também pode sugerir um nome e uma descrição ao guardar uma consulta.

*Requer que as funcionalidades de IA estejam ativadas no seu perfil de utilizador.*`,
    },
    recordPrint: {
      title: 'Imprimir registos',
      description: `Exporte um registo como documento **Word** ou **PDF** imprimível, incluindo imagens, com o botão PDF do editor de registos.

Pode escolher a orientação da página (vertical ou horizontal).`,
    },
    attributeClone: {
      title: 'Clonar atributos no designer de formulários',
      description: `No **designer de formulários**, use o menu de um atributo para o **clonar** na mesma entidade ou noutra, com todas as suas propriedades.`,
    },
    odkImport: {
      title: 'Importar inquéritos e dados do ODK',
      description: `Crie um novo inquérito a partir de um **formulário ODK (.xml)** e importe os dados recolhidos com o **ODK Collect**.

*Esta funcionalidade está em fase beta.*`,
    },
    dynamicEnumerator: {
      title: 'Enumeração dinâmica de entidades',
      description: `Use uma **expressão** para escolher que itens da categoria geram as linhas de uma entidade múltipla enumerada: p. ex. \`unique(plot.land_use)\` cria uma linha apenas para os usos do solo presentes nas parcelas.`,
    },
  },
}
