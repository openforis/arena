export default {
  title: 'Novidades no Arena',
  since: 'Desde a versão {{version}}',
  experimental: 'Experimental',
  dontShowAgain: 'Não mostrar novamente',
  showChangelog: 'Todas as alterações e correções (registro de alterações)',
  slideCounter: '{{current}} de {{total}}',
  noItems: 'Não há novidades para mostrar.',
  items: {
    appInfoAndNodeDateFunctions: {
      title: 'Novas funções de expressão: informações do aplicativo e datas dos nós',
      description: `Novas funções para valores padrão e regras de relevância e validação:

- **appId()**, **appIdLabel()**, **appPlatform()**, **appVersion()**: o aplicativo que edita o registro (\`arena\` / \`am\`, **Arena** / **Arena Mobile**), sua plataforma (\`web\`, \`android\` ou \`ios\`) e sua versão. São avaliadas quando o registro é criado e novamente quando é editado com outro aplicativo, plataforma ou versão do aplicativo: por ex., um atributo **Somente leitura** com o valor padrão \`appIdLabel()\` e **Valor padrão avaliado apenas uma vez** mantém o aplicativo que criou o registro.
- **nodeDateCreated(node)**, **nodeDateModified(node)**: data e hora de criação e da última modificação de um atributo ou entidade; para uma entidade, a última vez em que algum de seus valores mudou, por ex. \`nodeDateModified(parent(this))\`.

No editor de expressões básico, selecione-as na lista **Função**: o construtor das funções de data dos nós lista os atributos acessíveis a partir do nó atual e as entidades ancestrais.`,
    },
    googleSignIn: {
      title: 'Entre com sua conta Google',
      description: `Na página de login, clique em **Entrar com Google** para entrar com sua conta Google (Gmail ou Google Workspace) em vez de digitar sua senha.

Na primeira vez, a conta Google é vinculada à sua conta do Arena pelo endereço de e-mail: use o mesmo endereço de e-mail da sua conta do Arena. Os usuários convidados também podem aceitar o convite com o Google. Vincule ou desvincule sua conta Google em **Meu perfil > Métodos de início de sessão**; o login com e-mail e senha continua disponível.`,
    },
    twoFactorAuth: {
      title: 'Autenticação de dois fatores',
      description: `Proteja sua conta com a **autenticação de dois fatores (2FA)**: depois da senha, o Arena pede um código de verificação gerado por um aplicativo autenticador no seu celular (p. ex. Google Authenticator ou Authy).

Em **Meu perfil > Sign-in & security**, clique em **Gerenciar 2FA**, adicione um dispositivo e escaneie o código QR com o aplicativo. Guarde os códigos de backup exibidos no final: cada um deles permite entrar uma vez se você perder o celular.`,
    },
    aiFeatures: {
      title: 'Recursos de IA',
      description: `Em **Meu perfil > Recursos de IA**, escolha **O que a IA pode ver**:

- **Só ajuda**: suas perguntas e trechos do manual do usuário do Arena;
- **+ Estrutura do inventário**: também entidades, atributos, rótulos, categorias e expressões (sem valores dos registros);
- **+ Dados dos registros**: também os valores dos registros e os resultados das consultas.

Com **Personalizar** você ativa ou desativa cada recurso individualmente. Em **Provedores**, use o provedor **Padrão do Arena** ou adicione os seus: um **Servidor local** no seu computador ou na sua rede (p. ex. LM Studio ou Ollama) ou um provedor na nuvem com sua chave de API (OpenAI, Anthropic, Google Gemini e outros).`,
    },
    aiAssistant: {
      title: 'Assistente de IA',
      description: `Clique no botão **Assistente de IA** no cabeçalho para abrir um painel que trabalha na tela que você está usando:

- **Design**: cria e altera o inventário no designer de formulários;
- **Análise**: responde a perguntas sobre os dados com consultas;
- **Limpeza**: procura erros nos registros e propõe correções;
- **Ajuda**: responde a perguntas sobre o Arena.

As alterações propostas só são aplicadas depois que você as revisa. **Sugestões** (p. ex. rótulos faltando em um idioma) aparecem no painel: clique em uma delas para que o assistente a execute.`,
    },
    surveyAiPolicy: {
      title: 'Política de IA do inventário',
      description: `Em **Informações do inventário > Política de IA**, os administradores do inventário escolhem onde a IA pode processar o conteúdo do inventário, separadamente para a **Estrutura do inventário** e os **Dados dos registros**: **Desativado**, **Neste dispositivo** (um servidor de IA local), **Servidor da organização** ou **Nuvem**.

A mais restritiva entre esta política e os limites do servidor do Arena se aplica a todos os usuários do inventário.`,
    },
    mobileUploadEmailNotification: {
      title: 'Notificação por e-mail dos registros enviados do Arena Mobile',
      description: `Em **Informações do inquérito → Segurança**, marque **Notificar os administradores do inquérito por e-mail quando registros forem enviados do Arena Mobile**: após cada envio, cada administrador do inquérito recebe um e-mail com a lista dos registros enviados, seus valores-chave, se são novos ou atualizados, o usuário que os criou, as datas e o número de erros e avisos de validação.

É enviado um único e-mail por envio, mesmo quando um dispositivo envia muitos registros. A opção está disponível quando **Permitir upload de registros do Arena Mobile para o servidor** está marcada, e entra em vigor depois que o inquérito é publicado.`,
    },
    surveyGuestRole: {
      title: 'Novo papel: Convidado, para ver os registros sem editá-los',
      description: `Convide usuários com o novo papel **Convidado** (**Usuários > Convidar usuário**): eles podem ver todos os registros do levantamento, também no **Arena Mobile**, mas não podem editá-los nem excluí-los, nem adicionar novos.

Adicione o convidado a um **grupo de usuários** (**Usuários > Grupos de usuários**) com qualificadores para mostrar apenas uma parte dos dados: os registros cujos atributos qualificadores correspondem aos valores do grupo (p. ex. as parcelas de uma região). Os grupos com a opção **Pode ver os registros de** dão acesso também aos registros de outros grupos.

Os levantamentos existentes recebem o novo papel automaticamente.`,
    },
    areaOfInterest: {
      title: 'Áreas de interesse: verificar se uma localização está dentro de uma área',
      description: `Em **Informações do inquérito → Mapa**, adicione uma ou mais **áreas de interesse** (p. ex. os municípios de uma área piloto), cada uma com um nome e um polígono em formato GeoJSON. Visualize-as num mapa ao adicioná-las, uma a uma ou todas juntas (**Mostrar todas no mapa**), e mostre-as como camadas em **Dados > Mapa**.

A nova função de expressão \`geoDistanceToAOIBoundary(location, 'area_name')\` retorna a distância em metros entre uma localização e o limite da área: negativa dentro, positiva fora. Compare-a com a precisão do GPS (\`location.accuracy\`) para classificar as localizações como dentro, fora ou incertas, por exemplo em valores padrão de atributos só de leitura e em regras de validação com severidade *aviso*. \`geoAOIContaining(location)\` retorna o nome da área que contém a localização. Ambas funcionam também offline no **Arena Mobile**.

Obrigado à **[ASSEDEV Alerte Environnement](https://assedev.fr)** pelo pedido.`,
    },
    dataQueryTotals: {
      title: 'Totais e percentagens no Explorador de dados',
      description: `Em **Dados > Explorador**, no modo **Agregado** com uma única medida (p. ex. a soma do volume das árvores por espécie), abra o menu **Visualização** e escolha **Mostrar total e percentagem**: cada linha mostra a sua percentagem do total e é adicionada uma linha **Total** no fim da tabela.

As opções **Mostrar nomes** e **Mostrar códigos** também estão no menu **Visualização**.`,
    },
    mapWorkspace: {
      title: `Um novo espaço de trabalho do mapa`,
      description: `**Dados > Mapa** tem um novo layout: no topo, os menus **Mapa base**, **Adicionar dados**, **Exibição** e **Ferramentas** e uma caixa de pesquisa de coordenadas e chaves de registros; ao lado, as abas **Camadas**, **Registros** e **Legenda**; embaixo, uma barra de status com as coordenadas do ponteiro e a escala.

Percorra os registros no mapa, adicione seus próprios arquivos (KML, Shapefile, GeoJSON) ou serviços WMS / WMTS, meça distâncias e áreas e faça capturas de tela.`,
    },
    dataMatrixExport: {
      title: `Exportar dados como matriz`,
      description: `Em **Dados > Explorador**, selecione uma entidade múltipla (p. ex. as espécies de cada registro), clique em **Exportar** e escolha **Exportar como: Matriz de dados** para obter uma tabela com uma linha por espécie (ou qualquer outro atributo) e uma coluna por registro, com o valor escolhido nas células (p. ex. cobertura).

Este é o formato exigido por ferramentas de análise de vegetação como **Turboveg**, **Juice** e **Synbiosys**. Defina um filtro no Explorador para exportar apenas alguns registros.`,
    },
    mobilePreview: {
      title: 'Visualização do inquérito no Arena Mobile',
      description: `No designer de formulários, abra o menu ao lado do botão **Visualizar** e escolha **Visualizar (móvel)** para experimentar o inquérito em rascunho tal como aparece no **Arena Mobile**, num telefone ou tablet, na orientação retrato ou paisagem.

A visualização é executada no navegador: algumas funcionalidades de um dispositivo real (p. ex. mapas e câmara) não estão disponíveis.`,
    },
    requiredIf: {
      title: 'Atributos obrigatórios por condição',
      description: `No designer de formulários, na aba **Validações** de um atributo, escolha **Obrigatório quando a condição é atendida** e escreva a condição: o atributo será obrigatório somente quando a condição for verdadeira.

Durante a entrada de dados, o erro "Valor obrigatório" é exibido somente quando a condição é atendida.`,
    },
    themeSelector: {
      title: 'Tema claro e escuro',
      description: `Use o menu **Tema** no cabeçalho (também na página de login) para alternar entre o tema **Claro** e **Escuro**, ou seguir o **Padrão do sistema**.`,
    },
    surveyCompare: {
      title: 'Comparar e atualizar inventários',
      description: `No **Painel**, use **Funções avançadas > Comparar / atualizar a partir de arquivo** para comparar este inventário com um exportado de outro servidor Arena (p. ex. um servidor de testes) ou com outro inventário deste servidor.

Revise as diferenças e aplique apenas as alterações selecionadas: elas ficam salvas como rascunho até a publicação do inventário.`,
    },
    usersBackup: {
      title: 'Backup e restauração de usuários',
      description: `Em **Usuários**, use **Backup / Restaurar** para exportar todos os usuários, com seus papéis nos inventários e grupos de usuários, e restaurá-los em outro servidor Arena.

Antes de restaurar, você pode escolher o que fazer com cada usuário.`,
    },
    samplingPointDataWhisp: {
      title: 'Análise Whisp dos pontos amostrais',
      description: `Na categoria de **Dados de Ponto Amostral**, use **Gerar análise Whisp** para analisar todas as localizações dos pontos amostrais com o **Open Foris Whisp**.

A análise é executada em segundo plano e os resultados são salvos em uma nova categoria.`,
    },
    dashboardUpgrade: {
      title: 'Um novo painel',
      description: `O **Painel** tem um novo visual: registros e colaboradores num relance, um mapa dos dados coletados e a tendência dos registros adicionados ao longo do tempo.`,
    },
    clearNonApplicableValues: {
      title: 'Valores não relevantes são apagados',
      description: `Durante a entrada de dados, quando uma alteração torna outros campos não relevantes, seus valores são apagados, após a sua confirmação.

Os administradores do inventário podem manter o comportamento anterior com **Manter os valores dos atributos não relevantes** (**Informações do inventário > Segurança**).`,
    },
    systemLogs: {
      title: 'Registos do sistema',
      description: `Em **Administração do sistema > Registos do sistema**, acompanhe em tempo real os registos do servidor, com filtros por texto e nível.`,
    },
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
      title: 'Importar inventários e dados do ODK',
      description: `Crie um novo inventário a partir de um **formulário ODK** (XForm, .xml): em **Início > Novo inventário > Importar**, selecione **ODK (.xml)** como **Origem** e clique em **Iniciar importação**. As perguntas do formulário tornam-se atributos, as repetições (repeats) entidades múltiplas e as listas de opções categorias, com as etiquetas em todas as línguas do formulário. Antes de publicar, defina os atributos-chave da entidade raiz e corrija os erros indicados por **Publicar**, se existirem.

Depois, importe os dados recolhidos com o **ODK Collect** em **Dados > Importação de dados > ODK / ODK Collect**: um ficheiro .zip com uma pasta por submissão (exportação do ODK Briefcase). As submissões já importadas são ignoradas.`,
    },
    positionTracking: {
      title: 'Rastreamento de posição: registre o caminho percorrido em campo',
      description: `Marque **Rastreamento de posição** na aba **Básico** de um atributo **Geoespacial** único: no **Arena Mobile**, o valor do atributo é o caminho percorrido pelo usuário enquanto preenche o registro, gravado por meio do rastreamento da posição do dispositivo.

O caminho não pode ser editado manualmente. A opção se aplica somente ao Arena Mobile.`,
    },
    dynamicEnumerator: {
      title: 'Enumeração dinâmica de entidades',
      description: `Use uma **expressão** para escolher que itens da categoria geram as linhas de uma entidade múltipla enumerada: p. ex. \`unique(plot.land_use)\` cria uma linha apenas para os usos do solo presentes nas parcelas.`,
    },
  },
}
