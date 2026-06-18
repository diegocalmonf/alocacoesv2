/* ===================== constantes de domínio ===================== */
// Tipos de atividade (categorias macro) — substituem a antiga lista fixa ATIVIDADES.
// O cadastro de atividades (REG.atividades) vincula cada item a um destes tipos.
const TIPOS_ATIVIDADE=[
  {id:"discovery",  nome:"Discovery",    icone:"🔍"},
  {id:"implantacao",nome:"Implantação",  icone:"🚀"},
  {id:"interna",    nome:"Interna",      icone:"🏢"},
  {id:"service",    nome:"Service",      icone:"🔧"},
  {id:"ausencia",   nome:"Ausência",     icone:"🌴"},
];
const TIPO_LABEL=t=>{const x=TIPOS_ATIVIDADE.find(y=>y.id===t);return x?x.nome:t;};
// Compatibilidade: atividade legada (string) → tipo da nova taxonomia
function tipoLegado(nome){
  if(!nome)return "implantacao";
  const n=nome.toLowerCase();
  if(/daily|weekly/.test(n))return "interna";
  if(/feriado|f[ée]rias|atestado|folga|aus[êe]ncia/.test(n))return "ausencia";
  if(/interna|capacita|onboarding|rh/.test(n))return "interna";
  return "implantacao";
}
// Compatibilidade projeto × atividade.
// Um projeto de tipo `tipoProj` pode receber uma atividade de tipo `tipoAtv` quando:
//  - são do mesmo tipo (Implantação→Implantação), OU
//  - a atividade é Discovery e o projeto é de Implantação — pois todo projeto de
//    implantação passa pela fase de Discovery (etapa 1 da Esteira). Assim o mesmo
//    projeto fica disponível tanto para atividades de Discovery quanto de Implantação.
function projetoCompativelComAtividade(tipoProj, tipoAtv){
  const tp=tipoProj||"implantacao";
  if(tp===tipoAtv)return true;
  if(tipoAtv==="discovery" && tp==="implantacao")return true;
  return false;
}
const ATIVIDADES=["Daily","Implantação","Interna"]; // mantido para compatibilidade
const SEGMENTACOES=["Essential","Enterprise","Migração"];
// Categoria de segmentação por nível (metal tiers). Campo opcional em projetos — compat: ausência = sem categoria.
const CATEGORIAS=["Platina","Ouro","Prata","Bronze"];
const STATUSES=["Não iniciado","Em andamento","Estabilização","Congelado","Concluído","Churn"];
/* ===== Squads dos analistas =====
   Valor armazenado = label exibido (campo opcional a.squad). Squads novas só precisam
   ser adicionadas aqui (ordem define as colunas do dashboard de Squads). */
const SQUADS=["Discovery","Logística","Monitoramento","Frota","Backoffice","Estabilização"];
const SQUAD_META={
  "Discovery":     {color:"#EA580C",bg:"#FFF7ED",bd:"#FDBA74",ico:"search",            desc:"Atendimento inicial, levantamento de necessidade, escopo e preparação."},
  "Logística":     {color:"#F59E0B",bg:"#FFFBEB",bd:"#FDE68A",ico:"truck",             desc:"Fluxos logísticos, coletas, entregas, documentos e operação."},
  "Monitoramento": {color:"#0F766E",bg:"#F0FDFA",bd:"#99F6E4",ico:"activity",          desc:"Tracking, eventos, visibilidade operacional e monitoramento."},
  "Frota":         {color:"#475569",bg:"#F8FAFC",bd:"#CBD5E1",ico:"bus",               desc:"Veículos, motoristas, manutenção, agregados e gestão de frota."},
  "Backoffice":    {color:"#5B6EE1",bg:"#EEF2FF",bd:"#C7D2FE",ico:"layout-panel-left", desc:"Financeiro, fiscal, faturamento, integrações e regras administrativas."},
  "Estabilização": {color:"#16A34A",bg:"#F0FDF4",bd:"#BBF7D0",ico:"life-buoy",         desc:"Operação estabilizada, suporte contínuo e evolução da operação."}
};
const SQUAD_SEM_LABEL="Sem squad";
function squadMeta(s){return SQUAD_META[s]||{color:"#94A3B8",bg:"#F1F5F9",bd:"#CBD5E1",ico:"users",desc:"Analistas ainda não atribuídos a uma squad."};}
// Go-Live: situações específicas e modalidades
const GOLIVE_SITUACOES=["Planejado","Confirmado","Em execução","Realizado","Adiado","Cancelado"];
const GOLIVE_MODALIDADES=["Remoto","Presencial","Híbrido"];
/* ===== Esteira de Projetos: etapas em ordem =====
   'field' é o campo de data de INÍCIO da etapa no objeto do projeto.
   A etapa Go-Live é especial: usa goLivePrevisto/goLiveAjustado (previsto) e
   goLiveRealizado (realizado), que já existem no modelo. */
const ETAPAS=[
  {id:"discovery",    label:"Discovery",          field:"dtDiscovery",    ico:"search",         fase:"pre"},
  {id:"cadastros",    label:"Cadastros Básicos", field:"dtCadBasicos",   ico:"clipboard-list", fase:"pre"},
  {id:"logistica",    label:"Logística",         field:"dtLogistica",    ico:"truck",          fase:"pre"},
  {id:"backoffice",   label:"Backoffice",        field:"dtBackoffice",   ico:"layout-panel-left", fase:"pre"},
  {id:"golive",       label:"Go-Live",           field:"goLiveRealizado", glPrev:true,         ico:"rocket",        fase:"golive"},
  {id:"hypercare",    label:"Hypercare",         field:"dtHypercare",    ico:"heart-pulse",    fase:"pos"},
  {id:"monitoramento",label:"Monitoramento",     field:"dtMonitoramento",ico:"activity",       fase:"pos"},
  {id:"frota",        label:"Frota",             field:"dtFrota",        ico:"bus",            fase:"pos"},
  {id:"sustentacao",  label:"Sustentação",       field:"dtSustentacao",  ico:"life-buoy",      fase:"pos"},
];
const ETAPA_BY_ID=Object.fromEntries(ETAPAS.map((e,i)=>[e.id,{...e,ordem:i}]));
// Campos de data que a esteira gerencia em cada projeto (para auditoria/persistência)
const ESTEIRA_DATE_FIELDS=ETAPAS.filter(e=>!e.glPrev).map(e=>e.field).concat(["goLivePrevisto","goLiveAjustado","goLiveRealizado"]);
/* ===== Discovery · ritos da fase de Discovery =====
   Mesma ideia das ETAPAS, porém detalhando os RITUAIS internos do Discovery.
   Os ritos DEFINITIVOS serão informados depois — esta lista é apenas um ponto
   de partida e pode ser substituída/estendida livremente (ordem = colunas do dashboard).
   Cada rito tem: id (chave estável — não renomear após uso), label, ico (lucide), desc.
   Por projeto, as datas de cada rito ficam em p.dscRitos[ritoId]; a situação em
   p.dscSituacao; e o rito atual (override manual) em p.dscRitoAtual ("" = automático). */
const DISCOVERY_RITOS=[
  {id:"kickoff_interno", label:"Kickoff Interno",     ico:"flag",              desc:"Alinhamento interno da equipe antes do contato com o cliente."},
  {id:"kickoff_externo", label:"Kickoff Externo",     ico:"handshake",         desc:"Reunião de abertura com o cliente."},
  {id:"asis_log",        label:"As Is Logística",     ico:"truck",             desc:"Levantamento AS-IS de Logística (cenário atual)."},
  {id:"asis_back",       label:"As Is Backoffice",    ico:"layout-panel-left", desc:"Levantamento AS-IS de Backoffice (cenário atual)."},
  {id:"asis_frota",      label:"As Is Frota",         ico:"bus",               desc:"Levantamento AS-IS de Frota (cenário atual)."},
  {id:"criacao_base",    label:"Criação de Base",     ico:"folder-plus",       desc:"Criação da base inicial do cliente."},
  {id:"tratativa_asis",  label:"Tratativa As Is Loop",ico:"repeat",            desc:"Tratativa e refinamento iterativo do AS-IS (loop)."},
  {id:"bbp",             label:"Elaboração BBP",      ico:"file-text",         desc:"Elaboração do Business Blueprint (desenho da solução)."},
  {id:"tarefas_devcs",   label:"Tarefas Dev/CS",      ico:"code",              desc:"Levantamento e abertura de tarefas para Dev/CS."},
  {id:"prep_base",       label:"Preparação Base",     ico:"database",          desc:"Preparação da base de dados do cliente."},
  {id:"apres_bbp",       label:"Apresentação BBP",    ico:"presentation",      desc:"Apresentação do BBP ao cliente."},
  {id:"csat",            label:"CSAT Enviado",        ico:"smile", tipo:"simnao", desc:"Envio da pesquisa de satisfação (CSAT) do discovery — Sim / Não."},
  {id:"rep_bbp",         label:"Repasse BBP",         ico:"forward",           desc:"Repasse do BBP para a equipe de implantação."},
];
const DISCOVERY_RITO_BY_ID=Object.fromEntries(DISCOVERY_RITOS.map((r,i)=>[r.id,{...r,ordem:i}]));
// Situações possíveis para o acompanhamento do Discovery de um projeto.
const DISCOVERY_SITUACOES=["Não iniciado","Em andamento","Aguardando cliente","Pausado","Concluído","Cancelado"];
// "Livre" é o único placeholder do sistema (slot sem projeto). Tudo o que era hardcoded
// (Daily, Weekly, Capacitação, Férias, Feriado etc) virou cadastro de Atividades.
const SPECIALS=["Livre"];
const SLOTS=[
  {id:"Slot1",time:"08h30 – 09h00"},{id:"Slot2",time:"09h00 – 11h00"},{id:"Slot3",time:"11h00 – 12h00"},
  {id:"Almoço",time:"12h00 – 13h30",lunch:true},
  {id:"Slot4",time:"13h30 – 15h30"},{id:"Slot5",time:"15h30 – 17h30"},{id:"Slot6",time:"17h30 – 18h00"},
];
const DOW=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MONTHS=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const PALETTE=["#E55810","#C04A0E","#B8400A","#8a3a0c","#6b6b6b","#4A4A4A","#A66A2C","#D14F12","#9B9B9B"];
function colorFor(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return PALETTE[h%PALETTE.length];}

/* ===================== estado ===================== */
const ALLOC_KEY="alocacoes:v1", REG_KEY="alocacoes:cadastros:v1", CFG_KEY="alocacoesFirebaseConfig";
let DATA={};                                  // chave -> {atividade, cliente}
let REG={lideres:[],analistas:[],projetos:[],feriados:[],gps:[],lideresInativos:{},gpsInativos:{},lideresEmails:{},gpsEmails:{},atividades:[]};// fonte única de cadastros
let consultor=null, weekStart=null, editing=null;
let viewMode="analista";   // "analista" | "geral"
let period="semana";       // "dia" | "semana" | "mes"
let refDate=null;          // dia de referência (para dia/mês)
let form={atividade:"Implantação", cliente:"", outro:""};
const key=(c,iso,slot)=>c+"__"+iso+"__"+slot;

/* ===================== CAMADA DE PRÉ-ALOCAÇÃO (previsto) · Fase 1 =====================
   Camada PARALELA ao DATA (realizado), com a MESMA chave key(c,iso,slot).
   Mantém o invariante "ausência de dado = nada planejado": um slot sem registro
   em PREV simplesmente não tem previsto. Persistida em nó próprio por buckets de
   mês (alocacoes/previsto/<YYYY-MM>) — NUNCA toca em alocacoes/state nem /data.
   O registro de previsto reaproveita a forma do DATA (atividade, cliente=projeto),
   acrescido de `origem` (de onde veio: "manual" | "projeto:<nome>"). */
let PREV={};                                  // key(c,iso,slot) -> {atividade, cliente, origem, obs, obsAt, obsBy}
const PREV_KEY="alocacoes:previsto:v1";       // espelho local (localStorage)
const PREV_DATA_PATH="alocacoes/previsto";    // /<YYYY-MM> = [ {c,iso,slot,...} ]  (mesmo formato de prevToArray)

/* ===================== FIREBASE (mesmo molde da Capacitação) =====================
   A apiKey Web do Firebase é pública por design; a segurança vem das Regras do
   Realtime Database. Como o projeto será NOVO, os campos vêm vazios: ao abrir,
   o app pede a configuração (⚙ Conexão) e só conecta após colar o firebaseConfig. */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAeiPviiLVOXdOgatd6nROflZnKZ2AMyIw",
  authDomain: "alocacoesnstech.firebaseapp.com",
  // databaseURL do Realtime Database. Se o seu banco foi criado em outra região
  // (ex.: us-central1), o Console mostra algo como:
  //   https://alocacoesnstech-default-rtdb.<regiao>.firebasedatabase.app
  // Ajuste aqui (ou em ⚙ Conexão) se o valor abaixo não bater com o do Console.
  databaseURL: "https://alocacoesnstech-default-rtdb.firebaseio.com",
  projectId: "alocacoesnstech",
  storageBucket: "alocacoesnstech.firebasestorage.app",
  messagingSenderId: "1052875424301",
  appId: "1:1052875424301:web:2f7700a17b7af40a66eea4"
};
const firebaseConfig = JSON.parse(localStorage.getItem(CFG_KEY) || "null") || DEFAULT_FIREBASE_CONFIG;
const DB_PATH        = "alocacoes/state";   // { reg, alloc:[...] }
const USERS_PATH     = "alocacoes/users";   // /{uid} = {email, role, linkedAnalyst, linkedLider, createdAt}
const AUDIT_PATH     = "alocacoes/audit";   // trilha de auditoria (push de eventos)
const ATAS_PATH      = "alocacoes/atas";    // /<YYYY-MM>/<idAta> = {ata} (windowed)
/* =========================================================================
   AUTH_ENABLED — LIGA/DESLIGA do login (use false durante desenvolvimento local)
   - false: app abre direto, sem tela de login, com perfil "admin" embutido.
            Os dados ainda sincronizam com o Firebase (se configurado), mas
            qualquer pessoa que abrir o app entra como admin. NÃO publique
            o app em produção com isto desligado.
   - true : fluxo normal de login (Firebase Auth), com perfis e escopos.
   ========================================================================= */
const AUTH_ENABLED = true;
const ADMIN_PRINCIPAL_EMAIL = "diego.rodrigues@nstech.com.br"; // sempre admin
function isAdminEmail(email){return !!email && email.toLowerCase()===ADMIN_PRINCIPAL_EMAIL.toLowerCase();}
const ALLOWED_EMAIL_DOMAIN  = "";           // ex.: "nstech.com.br" para restringir

let _db=null, _auth=null, _fbReady=false, _initialLoadDone=false, _syncStarted=false;
let _currentUser=null, _currentRole="leitura", _linkedAnalyst="", _linkedLider="", _linkedGp="", _currentPerms={};
let _usersCache={}, _usersStarted=false, _secondaryApp=null;

/* Modo de visão para Líder/GP:
   "meus"  = só vê o próprio escopo (padrão)
   "geral" = vê tudo, mas em SOMENTE LEITURA (edição continua bloqueada)
   Para admin/gestor/analista/leitura essa flag é ignorada. */
let _viewMode="meus";
function podeAlternarVisao(){return isLider()||isGp();}
function ehVisaoGeral(){return podeAlternarVisao() && _viewMode==="geral";}
// "Em visão geral" tudo é somente leitura, mesmo que o role normalmente permita editar.
function ehSomenteLeitura(){return ehVisaoGeral() || _currentRole==="leitura" || _currentRole==="analista";}

/* Perfis:
   admin    → controla tudo, gerencia usuários, vê todos
   gestor   → vê e edita todos os analistas (coordenação)
   lider    → vê e edita só os analistas da sua equipe (vínculo líder)
   analista → vê só a própria grade (somente leitura) */
const ROLE_LABELS={admin:"Administrador",gestor:"Gestor",lider:"Líder",gp:"Gerente de Projetos",analista:"Analista",leitura:"Somente leitura"};
const ROLES_ATRIBUIVEIS=["gestor","lider","gp","analista","admin"];
function isAdmin(){return _currentRole==="admin";}
function isGestor(){return _currentRole==="gestor";}
function isLider(){return _currentRole==="lider";}
function isGp(){return _currentRole==="gp";}

/* =========================================================================
   PERMISSÕES POR AÇÃO (matriz dinâmica)
   -------------------------------------------------------------------------
   Cada "ação" do sistema (uma tela/recurso navegável) tem, por usuário, um
   de três níveis:
     "none"  → sem acesso (não vê o card/menu nem consegue abrir diretamente)
     "read"  → somente leitura (consulta, mas não cria/edita/exclui/importa/salva)
     "edit"  → edição (executa alterações normalmente)

   O modelo é DINÂMICO: para acrescentar uma ação nova no futuro basta
   adicionar uma entrada em ACTIONS (+ um default por perfil em ACTION_DEFAULTS)
   e apontar os "gates" da tela para canViewAction()/canEditAction(). Nenhuma
   lógica de permissão precisa ser reescrita.

   Compatibilidade: o nível efetivo de um usuário é o override explícito
   gravado em users/$uid/perms[ação]; quando AUSENTE ("herdar"), cai no
   default do perfil. Usuários antigos (sem 'perms') continuam funcionando
   exatamente como antes — nenhuma migração é necessária.
   ========================================================================= */
const ACTIONS = [
  {id:"grade",      label:"Grade de alocação",    icon:"layout-grid",       desc:"Capacidade e alocação por período"},
  {id:"prealoc",    label:"Pré-alocação (Previsto)", icon:"calendar-plus",  desc:"Aba Previsto do projeto · grava previsto + realizado"},
  {id:"esteira",    label:"Esteira de Projetos",  icon:"route",             desc:"Tabela e edição de etapas"},
  {id:"discovery",  label:"Esteira de Discovery", icon:"search",            desc:"Linha do tempo e ritos do Discovery"},
  {id:"torre",      label:"Torre de controle",    icon:"radar",             desc:"Painéis de Esteira + Discovery", readOnly:true},
  {id:"relatorios", label:"Relatórios",           icon:"file-bar-chart-2",  desc:"Alocação, squads, go-lives, mapa", readOnly:true},
  {id:"kpis",       label:"KPIs",                 icon:"line-chart",        desc:"Indicadores executivos", readOnly:true},
  {id:"atas",       label:"Atas",                 icon:"file-signature",    desc:"Geração e controle das atas dos slots"},
  {id:"cadastros",  label:"Ações & Cadastros",    icon:"settings-2",        desc:"Analistas, projetos, atividades, rituais"},
];
const ACTION_BY_ID = Object.fromEntries(ACTIONS.map(a=>[a.id,a]));
const ACTION_LEVELS = ["none","read","edit"];
const ACTION_LEVEL_LABELS = {none:"Sem acesso", read:"Somente leitura", edit:"Edição"};
// Default por perfil — reproduz o comportamento histórico (antes da matriz):
//  • grade: editavam admin/gestor; demais consultavam.
//  • esteira: editavam admin/gestor/líder/gp; analista/leitura consultavam.
//  • discovery: editavam admin/gestor (+ analista da squad Discovery, tratado à parte).
//  • torre/relatórios/kpis: telas de leitura, visíveis a todos.
//  • cadastros: só admin (gestão de usuários permanece restrita ao admin à parte).
const ACTION_DEFAULTS = {
  grade:      {admin:"edit", gestor:"edit", lider:"read", gp:"read", analista:"read", leitura:"read"},
  prealoc:    {admin:"edit", gestor:"edit", lider:"read", gp:"read", analista:"none", leitura:"none"},
  esteira:    {admin:"edit", gestor:"edit", lider:"edit", gp:"edit", analista:"read", leitura:"read"},
  discovery:  {admin:"edit", gestor:"edit", lider:"read", gp:"read", analista:"read", leitura:"read"},
  torre:      {admin:"read", gestor:"read", lider:"read", gp:"read", analista:"read", leitura:"read"},
  relatorios: {admin:"read", gestor:"read", lider:"read", gp:"read", analista:"read", leitura:"read"},
  kpis:       {admin:"read", gestor:"read", lider:"read", gp:"read", analista:"read", leitura:"read"},
  atas:       {admin:"edit", gestor:"edit", lider:"edit", gp:"read", analista:"read", leitura:"read"},
  cadastros:  {admin:"edit", gestor:"none", lider:"none", gp:"none", analista:"none", leitura:"none"},
};
function _normLevel(v){ return (v==="none"||v==="read"||v==="edit") ? v : null; }
// Nível default de uma ação para um perfil (papel).
function defaultActionLevel(role, actionId){
  const d = ACTION_DEFAULTS[actionId] || {};
  return _normLevel(d[role]) || "none";
}
// Nível efetivo de uma ação para UM usuário (objeto do _usersCache) — usado na matriz e no menu.
function userActionLevel(user, actionId){
  const role = (user && user.role) || "leitura";
  if(role === "admin") return "edit";              // admin tem tudo (não trava a si mesmo)
  const ov = _normLevel(user && user.perms && user.perms[actionId]);
  if(ov) return ov;
  return defaultActionLevel(role, actionId);
}
// Nível efetivo da ação para o usuário LOGADO (gate de UI).
function actionLevel(actionId){
  if(isAdmin()) return "edit";
  const ov = _normLevel(_currentPerms && _currentPerms[actionId]);
  if(ov) return ov;
  return defaultActionLevel(_currentRole, actionId);
}
function canViewAction(actionId){ return actionLevel(actionId) !== "none"; }
function canEditAction(actionId){ return actionLevel(actionId) === "edit"; }

function canEditCadastros(){return canEditAction("cadastros");}
function canViewCadastros(){return canViewAction("cadastros");}
function canViewUsers(){return isAdmin()||isGestor();}
// projetos sob a gerência do GP logado (linkedGp)
function projetosDoGpLogado(){
  if(!isGp()||!_linkedGp)return [];
  return REG.projetos.filter(p=>p.gp===_linkedGp).map(p=>p.nome);
}
// analistas que aparecem em projetos sob a gerência do GP logado (ativos)
function analistasDoGpLogado(){
  if(!isGp()||!_linkedGp)return [];
  const projs=projetosDoGpLogado();
  const set=new Set();
  REG.projetos.filter(p=>projs.includes(p.nome)).forEach(p=>(p.analistas||[]).forEach(n=>set.add(n)));
  return Array.from(set);
}
// true se a alocação 'r' pertence a um PROJETO de OUTRO GP. Quando o GP está no escopo
// "Meus", ele só deve enxergar os projetos sob a sua gerência — slots de projetos de
// outros GPs (que aparecem porque o analista é compartilhado) ficam ocultos/indisponíveis.
// Atividades internas, ausências, Discovery genérico e slots livres NÃO são ocultados.
function projForaDoEscopoGp(r){
  if(!isGp() || ehVisaoGeral() || !_linkedGp) return false; // só GP no escopo "Meus"
  const cli = r && (typeof r==="string" ? r : r.cliente);
  if(!cli || cli==="Livre") return false;
  const p = (REG.projetos||[]).find(x=>x.nome===cli);
  if(!p) return false;                       // não é projeto cadastrado → mostra normal
  return (p.gp||"") !== _linkedGp;            // projeto de outro GP → oculta
}
// --- Escopo do LÍDER (baseado no cadastro de PROJETOS, espelhando o GP) ---
// Projetos em que o usuário logado é o LÍDER no cadastro de projetos.
function projetosDoLiderLogado(){
  if(!isLider()||!_linkedLider)return [];
  return REG.projetos.filter(p=>p.lider===_linkedLider).map(p=>p.nome);
}
// Analistas que aparecem (roster) nos projetos liderados pelo usuário logado.
function analistasDoLiderLogado(){
  if(!isLider()||!_linkedLider)return [];
  const projs=projetosDoLiderLogado();
  const set=new Set();
  REG.projetos.filter(p=>projs.includes(p.nome)).forEach(p=>(p.analistas||[]).forEach(n=>set.add(n)));
  return Array.from(set);
}
// true se a alocação 'r' pertence a um PROJETO de OUTRO líder. No escopo "Meus", o
// líder enxerga apenas os projetos em que é o líder; slots de projetos de outros
// líderes (analista compartilhado) ficam ocultos. Atividades internas, ausências e
// slots livres NÃO são ocultados.
function projForaDoEscopoLider(r){
  if(!isLider() || ehVisaoGeral() || !_linkedLider) return false; // só líder no escopo "Meus"
  const cli = r && (typeof r==="string" ? r : r.cliente);
  if(!cli || cli==="Livre") return false;
  const p = (REG.projetos||[]).find(x=>x.nome===cli);
  if(!p) return false;                       // não é projeto cadastrado → mostra normal
  return (p.lider||"") !== _linkedLider;     // projeto de outro líder → oculta
}
// Verificação unificada de "slot fora do escopo atual" (líder OU GP, escopo "Meus").
function foraDoEscopoAtual(r){ return projForaDoEscopoGp(r) || projForaDoEscopoLider(r); }
function canEditAlloc(nome,iso){
  // Em "visão geral" (Líder/GP), tudo é somente leitura — independente do role.
  if(ehVisaoGeral())return false;
  // Permissão por ação: sem nível de edição na Grade, ninguém altera slots.
  if(!canEditAction("grade"))return false;
  // bloqueio por desligamento: não permite alocar em datas a partir do desligamento
  const a=analistaObj(nome);
  if(a && a.ativo===false){
    const corte=a.desligamento||a.inativadoEm;
    if(!corte || (iso && iso>=corte)) return false; // inativo sem data, ou data >= corte
  }
  // Escopo "Meus" de Líder/GP: mesmo com permissão de edição, só editam analistas
  // dos próprios projetos (filtro de ESCOPO — não de nível de permissão).
  if(isLider())return analistasDoLiderLogado().includes(nome);
  if(isGp())return analistasDoGpLogado().includes(nome);
  // Demais perfis (admin, gestor, analista, leitura): a matriz de permissão por ação
  // (canEditAction("grade")) já decidiu acima. Quem chegou aqui tem grade:edit efetivo.
  return true;
}
function visibleAnalysts(refIso){
  // refIso opcional: se informado, inclui analistas que estavam ATIVOS naquela data
  // (para visões históricas). Sem refIso: apenas ativos no momento (telas operacionais).
  let all;
  if(refIso){
    all=REG.analistas.filter(a=>isAtivoEm(a,refIso)).map(a=>a.nome).sort((x,y)=>x.localeCompare(y,"pt"));
  }else{
    all=analistaNomes(); // só ativos
  }
  if(isAdmin()||isGestor())return all;
  // Em "visão geral", Líder/GP enxergam tudo (somente leitura via ehSomenteLeitura()).
  if(ehVisaoGeral())return all;
  if(isLider())return all.filter(n=>analistasDoLiderLogado().includes(n));
  if(isGp()){const seus=analistasDoGpLogado();return all.filter(n=>seus.includes(n));}
  if(_linkedAnalyst&&all.includes(_linkedAnalyst))return [_linkedAnalyst];
  return [];
}

/* ===== Filtro "Projetos" da Grade =====================================
   Estado e helpers do filtro por projeto. Quando ativo (gradeProjFilter != ""),
   a Grade mostra APENAS os analistas que possuem ao menos um slot alocado
   naquele projeto. É um filtro ADICIONAL, aplicado SOBRE o escopo de
   visibilidade (Meus/Geral, perfil) — nunca amplia o que o usuário pode ver.
   ===================================================================== */
let gradeProjFilter = ""; // "" = todos os projetos
// Conjunto de analistas (nomes) com ao menos um slot alocado no projeto informado.
function analistasComSlotNoProjeto(proj){
  const set=new Set();
  if(!proj) return set;
  for(const k in DATA){
    const r=DATA[k];
    if(r && r.cliente===proj){ set.add(k.split("__")[0]); }
  }
  return set;
}
// Lista de analistas da GRADE: escopo de visibilidade + filtro de projeto (se houver).
function gradeAnalysts(refIso){
  let ns=visibleAnalysts(refIso);
  if(gradeProjFilter){
    const noProj=analistasComSlotNoProjeto(gradeProjFilter);
    ns=ns.filter(n=>noProj.has(n));
  }
  return ns;
}
// Projetos oferecidos no seletor do filtro, limitados ao escopo do usuário.
function projetosParaFiltroGrade(){
  let nomes;
  if(isAdmin()||isGestor()||ehVisaoGeral()){
    nomes=(REG.projetos||[]).filter(p=>isAtivo(p)).map(p=>p.nome);
  }else if(isLider()){
    nomes=projetosDoLiderLogado();
  }else if(isGp()){
    nomes=projetosDoGpLogado();
  }else if(_linkedAnalyst){
    nomes=(typeof projetosDoAnalista==="function"?projetosDoAnalista(_linkedAnalyst):[]);
  }else{
    nomes=(REG.projetos||[]).filter(p=>isAtivo(p)).map(p=>p.nome);
  }
  return Array.from(new Set(nomes)).sort((a,b)=>a.localeCompare(b,"pt"));
}
// Conjunto de analistas que o usuário PODE ver (qualquer data, ativos ou não),
// usado pela visão compacta por projeto — que percorre todo o histórico.
function analistasVisiveisTodos(){
  const all=(REG.analistas||[]).map(a=>a.nome);
  if(isAdmin()||isGestor()||ehVisaoGeral()) return new Set(all);
  if(isLider()) return new Set(analistasDoLiderLogado());
  if(isGp())    return new Set(analistasDoGpLogado());
  if(_linkedAnalyst) return new Set([_linkedAnalyst]);
  return new Set();
}
// Todas as células (analista/data/slot) alocadas no projeto, dentro do escopo do
// usuário, em QUALQUER data. Ordenadas por analista, depois data, depois slot.
function gradeProjetoCells(proj){
  const perm=analistasVisiveisTodos();
  const out=[];
  for(const k in DATA){
    const r=DATA[k];
    if(!r || r.cliente!==proj) continue;
    const p=k.split("__"); const nome=p[0], iso=p[1], slot=p[2];
    if(!perm.has(nome)) continue;
    if(foraDoEscopoAtual(r)) continue; // não revela projeto de outro GP
    out.push({nome,iso,slot,r});
  }
  const slotOrd=s=>{const i=SLOTS.findIndex(x=>x.id===s);return i<0?99:i;};
  out.sort((a,b)=> a.nome.localeCompare(b.nome,"pt") || a.iso.localeCompare(b.iso) || slotOrd(a.slot)-slotOrd(b.slot));
  return out;
}

try{
  if(firebaseConfig && firebaseConfig.databaseURL){
    firebase.initializeApp(firebaseConfig);
    _db=firebase.database(); _auth=firebase.auth();
  }
}catch(e){ console.warn("Firebase não configurado — rodando local:",e); }

/* badge de sincronização (na sidebar, junto à versão — canto inferior esquerdo) */
function setSyncBadge(state){
  let b=document.getElementById("syncBadge");
  if(!b){ // fallback: cria dentro do bloco de usuário da sidebar
    const host=document.querySelector(".sb-user .uinfo")||document.body;
    b=document.createElement("div");b.id="syncBadge";b.className="syncline";host.appendChild(b);
  }
  if(!b._wired){b._wired=true;b.title="Clique para configurar a nuvem";b.onclick=openCfg;}
  const map={online:["🟢 Sincronizado","#dcfce7","#166534"],offline:["🔴 Sem conexão","#fee2e2","#991b1b"],erro:["⚠️ Erro ao salvar","#fef3c7","#92400e"],local:["⚪ Sem nuvem","#f3f4f6","#374151"]};
  const[txt,bg,fg]=map[state]||map.local; b.textContent=txt; b.style.background=bg; b.style.color=fg;
}

/* ===================== persistência (local + nuvem) ===================== */
function lsSaveLocal(){
  try{localStorage.setItem(REG_KEY,JSON.stringify(REG));localStorage.setItem(ALLOC_KEY,JSON.stringify(DATA));}catch(e){}
}
function sanitizeForFirebase(obj){return JSON.parse(JSON.stringify(obj,(k,v)=>v===undefined?null:v));}
// DATA é um mapa com chaves que podem conter "." (ex.: "Diego M.") — proibidas no RTDB.
// Por isso gravamos como ARRAY de registros e remontamos o mapa na leitura.
function allocToArray(map){
  // Serializa um mapa DATA num array para o Firebase, preservando TODOS os campos
  // do registro (atividade, cliente, obs, obsAt, obsBy, obsPendente, feriado, ...).
  const _D = map || DATA;
  return Object.entries(_D).map(([k,v])=>{
    const i=k.split("__");
    const o={c:i[0], iso:i[1], slot:i[2]};
    if(v && typeof v==="object"){
      // Copia campos conhecidos quando existirem (omitir undefined evita ruído no Firebase)
      if(v.atividade!=null)   o.atividade   = v.atividade;
      if(v.cliente!=null)     o.cliente     = v.cliente;
      if(v.obs!=null)         o.obs         = v.obs;
      if(v.obsAt!=null)       o.obsAt       = v.obsAt;
      if(v.obsBy!=null)       o.obsBy       = v.obsBy;
      if(v.obsPendente!=null) o.obsPendente = v.obsPendente;
      if(v.feriado!=null)     o.feriado     = v.feriado;
    }else if(typeof v==="string"){
      o.cliente = v; // compat com registros legados
    }
    return o;
  });
}
function arrayToAlloc(arr){
  // Reconstrói o mapa DATA a partir do array salvo, restaurando todos os campos.
  const m={};
  (arr||[]).forEach(r=>{
    if(!r||!r.c||!r.iso||!r.slot)return;
    const reg={};
    if(r.atividade!=null)   reg.atividade   = r.atividade;
    if(r.cliente!=null)     reg.cliente     = r.cliente;
    if(r.obs!=null)         reg.obs         = r.obs;
    if(r.obsAt!=null)       reg.obsAt       = r.obsAt;
    if(r.obsBy!=null)       reg.obsBy       = r.obsBy;
    if(r.obsPendente!=null) reg.obsPendente = r.obsPendente;
    if(r.feriado!=null)     reg.feriado     = r.feriado;
    m[key(r.c,r.iso,r.slot)] = reg;
  });
  return m;
}
/* --- Previsto: serialização espelhada do alloc (array p/ RTDB; chaves com "." proibidas) --- */
function prevToArray(map){
  const _P = map || PREV;
  return Object.entries(_P).map(([k,v])=>{
    const i=k.split("__");
    const o={c:i[0], iso:i[1], slot:i[2]};
    if(v && typeof v==="object"){
      if(v.atividade!=null) o.atividade = v.atividade;
      if(v.cliente!=null)   o.cliente   = v.cliente;   // = projeto (mesma forma do DATA)
      if(v.origem!=null)    o.origem    = v.origem;
      if(v.linha!=null)     o.linha     = v.linha;
      if(v.obs!=null)       o.obs       = v.obs;
      if(v.obsAt!=null)     o.obsAt     = v.obsAt;
      if(v.obsBy!=null)     o.obsBy     = v.obsBy;
    }else if(typeof v==="string"){ o.cliente = v; }
    return o;
  });
}
function arrayToPrev(arr){
  const m={};
  (arr||[]).forEach(r=>{
    if(!r||!r.c||!r.iso||!r.slot)return;
    const reg={};
    if(r.atividade!=null) reg.atividade = r.atividade;
    if(r.cliente!=null)   reg.cliente   = r.cliente;
    if(r.origem!=null)    reg.origem    = r.origem;
    if(r.linha!=null)     reg.linha     = r.linha;
    if(r.obs!=null)       reg.obs       = r.obs;
    if(r.obsAt!=null)     reg.obsAt     = r.obsAt;
    if(r.obsBy!=null)     reg.obsBy     = r.obsBy;
    m[key(r.c,r.iso,r.slot)] = reg;
  });
  return m;
}
function lsSavePrev(){ try{ localStorage.setItem(PREV_KEY, JSON.stringify(PREV)); }catch(e){} }
/* Acessores públicos da camada previsto (preservam "ausência = nada planejado").
   Em Fase 1 ninguém os chama ainda; são a API para as Fases 3/4. */
function prevGet(c,iso,slot){ return PREV[key(c,iso,slot)] || null; }
function prevSet(c,iso,slot,reg){ PREV[key(c,iso,slot)] = reg; persistPrev(); }
function prevDel(c,iso,slot){ delete PREV[key(c,iso,slot)]; persistPrev(); }
let _pt=null;
function persist(){
  lsSaveLocal();
  if(!_db||!_fbReady||!_initialLoadDone)return;
  clearTimeout(_pt);
  _pt=setTimeout(()=>{
    if(ALLOC_WINDOWED_READ){
      // MODO JANELA: NUNCA sobrescreve o monólito a partir do DATA parcial.
      // Grava só o registro (state/reg) e os buckets dos meses presentes no DATA.
      Promise.all([
        _db.ref(DB_PATH+"/reg").set(sanitizeForFirebase(REG)),
        Promise.resolve(_writeWindowBuckets())
      ]).then(()=>{ setSyncBadge("online"); try{ if(typeof _publishAlocSnapshot==='function') _publishAlocSnapshot(); }catch(e){} })
        .catch(err=>{ setSyncBadge("erro"); if(err&&err.code==="PERMISSION_DENIED")alert("Sem permissão para salvar (verifique as Regras do Firebase ou seu perfil)."); });
      return;
    }
    _db.ref(DB_PATH).set(sanitizeForFirebase({reg:REG,alloc:allocToArray()}))
      .then(()=>{setSyncBadge("online"); try{ if(typeof _publishAlocSnapshot==='function') _publishAlocSnapshot(); }catch(e){} if(ALLOC_DUALWRITE){ try{ _dualWriteBuckets(); }catch(e){ console.warn("[buckets] dual-write:",e); } }})
      .catch(err=>{setSyncBadge("erro");if(err&&err.code==="PERMISSION_DENIED")alert("Sem permissão para salvar (verifique as Regras do Firebase ou seu perfil).");});
  },150);
}
// As duas funções antigas agora roteiam para a persistência local+nuvem
function saveAlloc(){persist();}
function saveReg(){persist();}

/* --- Previsto: persistência por buckets de mês (alocacoes/previsto/<YYYY-MM>) ---
   Sempre bucket-based (nó greenfield, sem monólito legado). Grava só os meses que
   mudaram (diff por JSON) e remove os que ficaram vazios. Falha de previsto é
   SILENCIOSA (console.warn) — não dispara alertas nem trava o realizado. */
function _prevPorMes(){
  const byMonth={};
  Object.entries(PREV).forEach(([k, r])=>{
    const m = (k.split("__")[1]||"").slice(0,7); 
    if(!m) return;
    byMonth[m] = byMonth[m] || {};
    const limpo = {};
    if(r.atividade!=null) limpo.atividade = r.atividade;
    if(r.cliente!=null)   limpo.cliente = r.cliente;
    if(r.origem!=null)    limpo.origem = r.origem;
    if(r.linha!=null)     limpo.linha = r.linha;
    byMonth[m][k] = limpo;
  });
  return byMonth;
}
let _ptPrev=null, _lastPrevBucketJSON={};
function persistPrev(){
  lsSavePrev();
  if(!_db||!_fbReady||!_initialLoadDone)return;
  clearTimeout(_ptPrev);
  _ptPrev=setTimeout(()=>{
    const byMonth=_prevPorMes();
    const updates={};
    Object.keys(byMonth).forEach(m=>{
      const js=JSON.stringify(byMonth[m]);
      if(_lastPrevBucketJSON[m]!==js){ updates[m]=byMonth[m]; _lastPrevBucketJSON[m]=js; }
    });
    Object.keys(_lastPrevBucketJSON).forEach(m=>{
      if(!(m in byMonth)){ updates[m]=null; delete _lastPrevBucketJSON[m]; }
    });
    const chaves=Object.keys(updates);
    if(!chaves.length) return;
    _db.ref(PREV_DATA_PATH).update(sanitizeForFirebase(updates))
      .then(()=>{ try{ console.debug("[previsto] write:", chaves.join(", ")); }catch(e){} })
      .catch(e=>console.warn("[previsto] write falhou (verifique Regras de "+PREV_DATA_PATH+"):", e));
  },150);
}

/* ===================== FASE 4 · PASSO 1: backfill para buckets por mês =====================
   Espelha o DATA atual em um nó NOVO (alocacoes/data/<YYYY-MM>), sem tocar em
   alocacoes/state nem no read/persist de produção. 100% não-destrutivo e idempotente.
   Objetivo: preparar a leitura por janela de período (passos seguintes), validável
   em preview antes de qualquer mudança no caminho de leitura/escrita.            */
const ALLOC_DATA_PATH = "alocacoes/data";          // /<YYYY-MM> = [ {c,iso,slot,...} ]  (mesmo formato de allocToArray)
function _mesDe(iso){ return (iso||"").slice(0,7); } // "YYYY-MM-DD" -> "YYYY-MM"
function _allocPorMes(){
  const byMonth={};
  Object.entries(DATA).forEach(([k, r])=>{
    const m = (k.split("__")[1]||"").slice(0,7); 
    if(!m) return;
    byMonth[m] = byMonth[m] || {};
    const limpo = {};
    if(r.atividade!=null) limpo.atividade = r.atividade;
    if(r.cliente!=null)   limpo.cliente = r.cliente;
    if(r.obs!=null)       limpo.obs = r.obs;
    if(r.obsAt!=null)     limpo.obsAt = r.obsAt;
    if(r.obsBy!=null)     limpo.obsBy = r.obsBy;
    if(r.feriado!=null)   limpo.feriado = r.feriado;
    byMonth[m][k] = limpo;
  });
  return byMonth;
}
// Executar manualmente (console) como admin: migrarAllocParaBuckets()
function migrarAllocParaBuckets(){
  if(!_db){ console.warn("[buckets] sem conexão Firebase"); return Promise.reject(new Error("no db")); }
  if(typeof _currentRole!=="undefined" && _currentRole && _currentRole!=="admin"){
    console.warn("[buckets] apenas admin pode rodar o backfill"); return Promise.reject(new Error("forbidden"));
  }
  const byMonth=_allocPorMes();
  const meses=Object.keys(byMonth).length, regs=allocToArray().length;
  console.log(`[buckets] iniciando backfill: ${regs} registros em ${meses} meses…`);
  // update() em alocacoes/data: cada chave = mês; grava só o nó NOVO, nunca alocacoes/state.
  return _db.ref(ALLOC_DATA_PATH).update(sanitizeForFirebase(byMonth))
    .then(()=>{ console.log(`[buckets] backfill OK: ${regs} registros gravados em ${meses} bucket(s) sob ${ALLOC_DATA_PATH}/`); return {meses,regs}; })
    .catch(e=>{ console.warn("[buckets] backfill falhou (verifique as Regras do Firebase para "+ALLOC_DATA_PATH+"):", e); throw e; });
}
// Conferência: compara a contagem do monólito com a dos buckets (read-only).
function conferirBuckets(){
  if(!_db){ console.warn("[buckets] sem conexão"); return; }
  return _db.ref(ALLOC_DATA_PATH).once("value").then(s=>{
    const v=s.val()||{}; let totalBuckets=0; const porMes={};
    Object.keys(v).forEach(m=>{ const n=(Array.isArray(v[m])?v[m]:Object.values(v[m]||{})).length; porMes[m]=n; totalBuckets+=n; });
    const totalMonolito=allocToArray().length;
    console.log(`[buckets] monólito=${totalMonolito} · buckets=${totalBuckets}`, porMes);
    if(totalMonolito!==totalBuckets) console.warn("[buckets] divergência — rode migrarAllocParaBuckets() de novo");
    return {totalMonolito,totalBuckets,porMes};
  });
}
/* Backup local (download JSON) — somente leitura, não altera nada. Admin.
   baixarBackup()        -> alocacoes/state (o monólito; essencial antes do flip)
   baixarBackup("data")  -> alocacoes/data  (os buckets)
   baixarBackup("*")     -> alocacoes inteiro (state+data+users+audit; pode ser grande) */
function baixarBackup(no){
  if(!_db){ console.warn("[backup] sem conexão"); return Promise.reject(new Error("no db")); }
  if(typeof _currentRole!=="undefined" && _currentRole && _currentRole!=="admin"){
    console.warn("[backup] apenas admin"); return Promise.reject(new Error("forbidden"));
  }
  const path = (no===undefined) ? "alocacoes/state" : (no==="*" ? "alocacoes" : "alocacoes/"+no);
  return _db.ref(path).once("value").then(s=>{
    const data=s.val();
    const ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download="backup-"+path.replace(/\//g,"_")+"-"+ts+".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
    const n=(data&&Array.isArray(data.alloc))?(data.alloc.length+" registros (alloc)"):"OK";
    console.log("[backup] baixado:", path, "·", n);
    return data;
  }).catch(e=>{ console.warn("[backup] falhou:",e); throw e; });
}
/* ROLLBACK seguro: reconstrói o monólito alocacoes/state/alloc a partir de TODOS os
   buckets (que contêm as edições feitas em modo janela). Rode ANTES de voltar
   ALLOC_WINDOWED_READ para false, para não perder as edições do período com janela.
   Sequência de rollback: (1) com a janela ainda LIGADA, rode reconstruirMonolitoDosBuckets();
   (2) confirme no console; (3) só então faça deploy com ALLOC_WINDOWED_READ=false. Admin. */
function reconstruirMonolitoDosBuckets(){
  if(!_db){ console.warn("[rollback] sem conexão"); return Promise.reject(new Error("no db")); }
  if(typeof _currentRole!=="undefined" && _currentRole && _currentRole!=="admin"){
    console.warn("[rollback] apenas admin"); return Promise.reject(new Error("forbidden"));
  }
  console.log("[rollback] reconstruindo state/alloc a partir de todos os buckets…");
  return _lerTodosBuckets().then(full=>{
    const arr=allocToArray(full);
    return _db.ref(DB_PATH+"/alloc").set(sanitizeForFirebase(arr)).then(()=>{
      console.log("[rollback] state/alloc reconstruído:", arr.length, "registros. Agora é seguro desligar ALLOC_WINDOWED_READ (deploy com false) e recarregar.");
      return {regs:arr.length};
    });
  }).catch(e=>{ console.warn("[rollback] falhou:", e); throw e; });
}

/* ===================== FASE 4 · PASSO 2: dual-write nos buckets =====================
   Quando ALLOC_DUALWRITE=true, cada persist() bem-sucedido espelha no nó NOVO
   alocacoes/data/<YYYY-MM>, gravando SÓ os meses que mudaram (diff por JSON).
   Default OFF -> persist() é byte-idêntico ao de hoje. Ligar só em staging:
   no console, `ALLOC_DUALWRITE=true` (runtime, sem redeploy) e validar com conferirBuckets().
   Nunca toca em alocacoes/state. */
let ALLOC_DUALWRITE = false;
let _lastBucketJSON = {};      // mês -> JSON do array já espelhado (p/ gravar só o que mudou)
function _dualWriteBuckets(){
  if(!_db) return;
  const byMonth=_allocPorMes();
  const updates={};
  // meses novos/alterados
  Object.keys(byMonth).forEach(m=>{
    const js=JSON.stringify(byMonth[m]);
    if(_lastBucketJSON[m]!==js){ updates[m]=byMonth[m]; _lastBucketJSON[m]=js; }
  });
  // meses que ficaram vazios desde o último espelhamento -> remover bucket
  Object.keys(_lastBucketJSON).forEach(m=>{
    if(!(m in byMonth)){ updates[m]=null; delete _lastBucketJSON[m]; }
  });
  const chaves=Object.keys(updates);
  if(!chaves.length) return;   // nada mudou nos meses
  return _db.ref(ALLOC_DATA_PATH).update(sanitizeForFirebase(updates))
    .then(()=>{ try{ console.debug("[buckets] dual-write:", chaves.join(", ")); }catch(e){} })
    .catch(e=>{ console.warn("[buckets] dual-write falhou:", e); });
}

/* ===================== FASE 4 · PASSO 3 (fundação dormente): leitura por janela =====================
   Quando ALLOC_WINDOWED_READ=true (default OFF -> leitura é a de hoje), o app carrega
   só os meses visíveis (buckets) em vez de todo o alloc. Os recursos que precisam do
   histórico inteiro (renomeações, relatórios, KPIs, snapshot) chamam _garantirHistoricoCompleto().
   Esta fundação fica pronta e testável; o "flip" do read (passo 3b) é ativado só em staging. */
/* ⚠️ CUTOVER (v1.49.0): leitura por janela LIGADA. Só faça deploy desta versão em
   PRODUÇÃO depois de validar na cópia isolada (RUNBOOK-janela.md, etapa D). É mão única:
   não fique ligando/desligando — para reverter, use reconstruirMonolitoDosBuckets() ANTES
   de voltar para false. */
let ALLOC_WINDOWED_READ = true;
let _histCompleto = true;          // sem janela, DATA já é o histórico completo
const _janelaListeners = {};       // "YYYY-MM" -> ref Firebase (para desanexar)
// Meses (YYYY-MM) cobertos pelo período visível atual.
function mesesVisiveis(){
  const ms=new Set();
  try{ periodDays().forEach(d=>ms.add(toISO(d).slice(0,7))); }catch(e){}
  return [...ms].sort();
}
// Carrega o histórico completo sob demanda (a partir do monólito ainda existente),
// para os recursos que varrem todo o DATA. No-op quando não há janela ativa.
function _garantirHistoricoCompleto(){
  if(!ALLOC_WINDOWED_READ || _histCompleto || !_db) return Promise.resolve();
  return _lerTodosBuckets().then(full=>{
    Object.keys(full).forEach(k=>{ if(!(k in DATA)) DATA[k]=full[k]; });
    _histCompleto=true;
  }).catch(e=>{ console.warn("[janela] histórico completo:", e); });
}
// Lê TODOS os buckets (alocacoes/data) e devolve um mapa DATA completo.
// Fallback: se buckets vazios, usa o monólito alocacoes/state/alloc.
function _lerTodosBuckets(){
  if(!_db) return Promise.resolve({});
  return _db.ref(ALLOC_DATA_PATH).once("value").then(s=>{
    const v=s.val()||{}; 
    const mapResult = {};
    Object.keys(v).forEach(m=>{ 
      const mesData = v[m];
      if (Array.isArray(mesData)) {
         Object.assign(mapResult, arrayToAlloc(mesData));
      } else {
         Object.assign(mapResult, mesData);
      }
    });
    if(Object.keys(mapResult).length) return mapResult;
    return _db.ref(DB_PATH+"/alloc").once("value").then(s2=>arrayToAlloc(s2.val()||[]));
  });
}


/* ===================== Leitura otimizada por período (Relatórios/KPIs) =====================
   Evita baixar todo o histórico: identifica os buckets mensais necessários em
   alocacoes/data/<YYYY-MM>, baixa somente estes meses e filtra os dias exatos. */
function aplicarDatasPadrao(idInicio, idFim){
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const primeiroDia = `${ano}-${mes}-01`;
  const ultimoDiaObj = new Date(ano, hoje.getMonth() + 1, 0);
  const ultimoDia = `${ano}-${mes}-${String(ultimoDiaObj.getDate()).padStart(2, "0")}`;
  const ini = document.getElementById(idInicio);
  const fim = document.getElementById(idFim);
  if(ini) ini.value = primeiroDia;
  if(fim) fim.value = ultimoDia;
}

function _lerBucketsPorPeriodo(dataInicioStr, dataFimStr){
  if(!_db) return Promise.resolve({});
  if(!dataInicioStr || !dataFimStr) return Promise.resolve({});

  const mesesAlvo = new Set();
  let atual = new Date(dataInicioStr + "T00:00:00");
  const fim = new Date(dataFimStr + "T23:59:59");

  while(atual <= fim){
    mesesAlvo.add(atual.toISOString().slice(0, 7));
    atual.setMonth(atual.getMonth() + 1);
  }

  const mapResult = {};
  const promises = Array.from(mesesAlvo).map(m => {
    return _db.ref(ALLOC_DATA_PATH + "/" + m).once("value").then(s => {
      const v = s.val() || {};
      if(Array.isArray(v)) Object.assign(mapResult, arrayToAlloc(v));
      else Object.assign(mapResult, v);
    });
  });

  return Promise.all(promises).then(() => mapResult);
}

function filtrarDadosPorDataExata(dadosBrutos, dataInicioStr, dataFimStr){
  const dadosFiltrados = {};
  Object.keys(dadosBrutos || {}).forEach(k => {
    const dataIso = (k.split("__")[1] || "");
    if(dataIso >= dataInicioStr && dataIso <= dataFimStr){
      dadosFiltrados[k] = dadosBrutos[k];
    }
  });
  return dadosFiltrados;
}

function _lerBucketsPrevPorPeriodo(dataInicioStr, dataFimStr){
  if(!_db) return Promise.resolve({});

  const mesesAlvo = new Set();
  let atual = new Date(dataInicioStr + "T00:00:00");
  const fim = new Date(dataFimStr + "T23:59:59");

  while(atual <= fim){
    mesesAlvo.add(atual.toISOString().slice(0, 7));
    atual.setMonth(atual.getMonth() + 1);
  }

  const mapResult = {};
  const promises = Array.from(mesesAlvo).map(m => {
    return _db.ref(PREV_DATA_PATH + "/" + m).once("value").then(s => {
      const v = s.val() || {};
      if(Array.isArray(v)) Object.assign(mapResult, arrayToPrev(v));
      else Object.assign(mapResult, v);
    });
  });

  return Promise.all(promises).then(() => mapResult);
}

function filtrarPrevPorDataExata(dadosBrutos, dataInicioStr, dataFimStr){
  const dadosFiltrados = {};
  Object.keys(dadosBrutos || {}).forEach(k => {
    const dataIso = (k.split("__")[1] || "");
    if(dataIso >= dataInicioStr && dataIso <= dataFimStr){
      dadosFiltrados[k] = dadosBrutos[k];
    }
  });
  return dadosFiltrados;
}

function _limparPeriodoCarregadoNoPrev(inicio, fim){
  Object.keys(PREV || {}).forEach(k => {
    const iso = (k.split("__")[1] || "");
    if(iso >= inicio && iso <= fim) delete PREV[k];
  });
}

function _idsPeriodoPainel(tipo){
  if(tipo === "relatorios") return ["repPeriodoDataInicio", "repPeriodoDataFim"];
  if(tipo === "kpis") return ["kpiPeriodoDataInicio", "kpiPeriodoDataFim"];
  return ["relatorioDataInicio", "relatorioDataFim"];
}
function _painelAberto(){
  if(el("kpiOverlay") && el("kpiOverlay").classList.contains("open")) return "kpis";
  if(el("repOverlay") && el("repOverlay").classList.contains("open")) return "relatorios";
  return "";
}
function _limparPeriodoCarregadoNoData(inicio, fim){
  Object.keys(DATA || {}).forEach(k => {
    const iso = (k.split("__")[1] || "");
    if(iso >= inicio && iso <= fim) delete DATA[k];
  });
}
function _setLoadingPainel(tipo, msg){
  const id = tipo === "kpis" ? "kpiBody" : "repBody";
  const b = el(id);
  if(b) b.innerHTML = `<div class="loading">${msg || "Carregando dados do período…"}</div>`;
}


/* ===================== Leitura sob demanda · Torre e Conflitos ===================== */
let _torreDadosCarregados = false;
let _torrePeriodoCarregado = "";
let _torreViewCarregada = "";
let _torrePrevistoCarregado = false;
let _conflitosDadosCarregados = false;
let _conflitosPeriodoCarregado = "";

function _htmlSobDemanda(titulo){
  return `<div class="rep-empty"><b>Nenhum dado foi baixado ainda.</b><br>${titulo || "Escolha o período e clique em <b>Aplicar Filtro</b> para carregar somente os buckets necessários."}</div>`;
}
function _setLoadingTorre(msg){
  const b = el("torreBody");
  if(b) b.innerHTML = `<div class="loading">${msg || "Carregando dados do período…"}</div>`;
}
function _torreFiltroHtml(){
  _torreAlertInitPeriodo();
  _torreAdInitPeriodo();
  if(!torreEstDe || !torreEstAte){ const h=new Date(); torreEstDe=toISO(h); torreEstAte=toISO(addDays(h,90)); }
  if(!torreDscDe || !torreDscAte){ const h=new Date(); torreDscDe=toISO(addDays(h,-30)); torreDscAte=toISO(addDays(h,90)); }
  let de = torreAlertDe, ate = torreAlertAte;
  if(torreView === "aderencia"){ de = torreAdDe; ate = torreAdAte; }
  else if(torreView === "esteira"){ de = torreEstDe; ate = torreEstAte; }
  else if(torreView === "discovery"){ de = torreDscDe; ate = torreDscAte; }
  return `<div class="filtros-periodo" data-painel-periodo="torre" style="margin:0 0 14px 0">
    <span>Período de Análise:</span>
    <input type="date" id="torrePeriodoDataInicio" value="${enc(de || '')}">
    <span class="ate">até</span>
    <input type="date" id="torrePeriodoDataFim" value="${enc(ate || '')}">
    <button class="btn filtro-aplicar" onclick="atualizarTorreAtiva()"><i data-lucide="filter"></i> Aplicar Filtro</button>
  </div>`;
}
function _torrePrecisaCarga(){
  return ["alertas","alertasDetalhados","aderencia"].includes(torreView);
}
function _torreProntaParaRender(){
  if(!_torrePrecisaCarga()) return true;
  const periodo = (torreView === "aderencia" ? (torreAdDe + "|" + torreAdAte) : (torreAlertDe + "|" + torreAlertAte));
  const precisaPrev = torreView === "aderencia";
  return _torreDadosCarregados && _torrePeriodoCarregado === periodo && _torreViewCarregada === torreView && (!precisaPrev || _torrePrevistoCarregado);
}
function _marcarTorrePendente(){
  _torreDadosCarregados = false;
  _torrePeriodoCarregado = "";
  _torreViewCarregada = "";
  _torrePrevistoCarregado = false;
}
function atualizarTorreAtiva(){
  const ini = el("torrePeriodoDataInicio"), fimEl = el("torrePeriodoDataFim");
  const inicio = ini && ini.value, fim = fimEl && fimEl.value;
  if(!inicio || !fim){ alert("Por favor, selecione as datas de início e fim."); return Promise.resolve({}); }
  if(inicio > fim){ alert("A data inicial não pode ser maior que a data final."); return Promise.resolve({}); }
  if(torreView === "esteira"){
    torreEstDe = inicio; torreEstAte = fim; torreEstFiltroAplicado = true;
    estPeriodoDe = inicio; estPeriodoAte = fim; estFiltroAplicado = true;
    renderTorre();
    return Promise.resolve({});
  }
  if(torreView === "discovery"){
    torreDscDe = inicio; torreDscAte = fim; torreDscFiltroAplicado = true;
    dscRecebDe = inicio; dscRecebAte = fim; dscFiltroAplicado = true;
    renderTorre();
    return Promise.resolve({});
  }
  if(torreView === "aderencia"){ torreAdDe = inicio; torreAdAte = fim; }
  else { torreAlertDe = inicio; torreAlertAte = fim; }
  _setLoadingTorre("Carregando somente os buckets do período selecionado…");
  const precisaPrev = torreView === "aderencia";
  return Promise.all([
    _lerBucketsPorPeriodo(inicio, fim),
    precisaPrev ? _lerBucketsPrevPorPeriodo(inicio, fim) : Promise.resolve(null)
  ]).then(([dadosBrutos, prevBrutos])=>{
    const dadosFinais = filtrarDadosPorDataExata(dadosBrutos, inicio, fim);
    _limparPeriodoCarregadoNoData(inicio, fim);
    Object.assign(DATA, dadosFinais);
    if(prevBrutos){
      const prevFinais = filtrarPrevPorDataExata(prevBrutos, inicio, fim);
      _limparPeriodoCarregadoNoPrev(inicio, fim);
      Object.assign(PREV, prevFinais);
      _torrePrevistoCarregado = true;
    }else{
      _torrePrevistoCarregado = false;
    }
    _torreDadosCarregados = true;
    _torrePeriodoCarregado = inicio + "|" + fim;
    _torreViewCarregada = torreView;
    renderTorre();
  }).catch(e=>{
    console.error("Erro ao carregar Torre por período:", e);
    const b=el("torreBody"); if(b) b.innerHTML = `<div class="rep-empty">Erro ao carregar dados do período.</div>`;
  });
}
function _htmlConflitosSobDemanda(){
  return `<div class="confl-empty"><i data-lucide="filter"></i><div style="margin-top:8px"><b>Nenhum dado foi baixado ainda.</b><br>Escolha o período e clique em <b>Aplicar Filtro</b> para carregar previsto e realizado somente dos buckets necessários.</div></div>`;
}
function carregarConflitosPorPeriodo(){
  const ini = el("conflitosPeriodoDataInicio"), fimEl = el("conflitosPeriodoDataFim");
  const inicio = ini && ini.value, fim = fimEl && fimEl.value;
  if(!inicio || !fim){ alert("Por favor, selecione as datas de início e fim."); return Promise.resolve({}); }
  if(inicio > fim){ alert("A data inicial não pode ser maior que a data final."); return Promise.resolve({}); }
  const body=el("conflitosBody"); if(body) body.innerHTML = `<div class="loading">Carregando previsto e realizado do período…</div>`;
  return Promise.all([_lerBucketsPorPeriodo(inicio, fim), _lerBucketsPrevPorPeriodo(inicio, fim)]).then(([dadosBrutos, prevBrutos])=>{
    const dadosFinais = filtrarDadosPorDataExata(dadosBrutos, inicio, fim);
    const prevFinais = filtrarPrevPorDataExata(prevBrutos, inicio, fim);
    _limparPeriodoCarregadoNoData(inicio, fim); Object.assign(DATA, dadosFinais);
    _limparPeriodoCarregadoNoPrev(inicio, fim); Object.assign(PREV, prevFinais);
    _conflitosDadosCarregados = true;
    _conflitosPeriodoCarregado = inicio + "|" + fim;
    renderConflitos(); lucideRefresh();
  }).catch(e=>{
    console.error("Erro ao carregar conflitos por período:", e);
    if(body) body.innerHTML = `<div class="rep-empty">Erro ao carregar dados do período.</div>`;
  });
}

function atualizarPainelAtivo(tipo){
  tipo = tipo || _painelAberto();
  const [idInicio, idFim] = _idsPeriodoPainel(tipo);
  const inicioEl = document.getElementById(idInicio) || document.getElementById("relatorioDataInicio");
  const fimEl = document.getElementById(idFim) || document.getElementById("relatorioDataFim");
  const inicio = inicioEl && inicioEl.value;
  const fim = fimEl && fimEl.value;

  if(!inicio || !fim){ alert("Por favor, selecione as datas de início e fim."); return Promise.resolve({}); }
  if(inicio > fim){ alert("A data inicial não pode ser maior que a data final."); return Promise.resolve({}); }

  _setLoadingPainel(tipo);

  const precisaPrevisto = (tipo === "relatorios" && repTab === "aderencia");
  const cargaRealizado = _lerBucketsPorPeriodo(inicio, fim);
  const cargaPrevisto = precisaPrevisto ? _lerBucketsPrevPorPeriodo(inicio, fim) : Promise.resolve(null);

  return Promise.all([cargaRealizado, cargaPrevisto]).then(([dadosBrutos, prevBrutos]) => {
    const dadosFinais = filtrarDadosPorDataExata(dadosBrutos, inicio, fim);
    _limparPeriodoCarregadoNoData(inicio, fim);
    Object.assign(DATA, dadosFinais);

    if(prevBrutos){
      const prevFinais = filtrarPrevPorDataExata(prevBrutos, inicio, fim);
      _limparPeriodoCarregadoNoPrev(inicio, fim);
      Object.assign(PREV, prevFinais);
      _repPrevistoCarregado = true;
    }else if(tipo === "relatorios"){
      _repPrevistoCarregado = false;
    }

    if(tipo === "kpis"){
      kpiFrom = inicio; kpiTo = fim; kpiPeriodMode = "custom";
      if(typeof renderKPIs === "function") renderKPIs(dadosFinais);
    }else if(tipo === "relatorios"){
      repFrom = inicio; repTo = fim; repPeriodMode = "custom";
      _repDadosCarregados = true;
      _repPeriodoCarregado = inicio + "|" + fim;
      _repTabCarregada = repTab;
      if(typeof renderReports === "function") renderReports(dadosFinais);
    }else{
      if(typeof renderKPIs === "function" && el("kpiOverlay") && el("kpiOverlay").classList.contains("open")) renderKPIs(dadosFinais);
      if(typeof renderReports === "function" && el("repOverlay") && el("repOverlay").classList.contains("open")) renderReports(dadosFinais);
    }
    try{ lucideRefresh(); }catch(e){ try{ lucide.createIcons(); }catch(_){} }
    return dadosFinais;
  }).catch(e => {
    console.error("Erro ao puxar dados filtrados: ", e);
    const id = tipo === "kpis" ? "kpiBody" : "repBody";
    const b = el(id);
    if(b) b.innerHTML = `<div class="rep-empty" style="color:#a33"><b>Erro ao carregar dados filtrados.</b><br><code>${enc(e.message || String(e))}</code></div>`;
    return {};
  });
}
// Writer de buckets em modo janela: grava só os meses presentes no DATA que mudaram.
// NUNCA remove meses ausentes (ausência = fora da janela, não exclusão).
function _writeWindowBuckets(){
  if(!_db) return;
  const byMonth=_allocPorMes();
  const updates={};
  Object.keys(byMonth).forEach(m=>{
    const js=JSON.stringify(byMonth[m]);
    if(_lastBucketJSON[m]!==js){ updates[m]=byMonth[m]; _lastBucketJSON[m]=js; }
  });
  const chaves=Object.keys(updates);
  if(!chaves.length) return;
  return _db.ref(ALLOC_DATA_PATH).update(sanitizeForFirebase(updates))
    .then(()=>{ try{ console.debug("[janela] write:", chaves.join(", ")); }catch(e){} })
    .catch(e=>{ console.warn("[janela] write falhou:", e); });
}
// Anexa/atualiza listeners ao vivo dos meses da janela e desanexa os que saíram.
// (Usado pelo passo 3b; dormente enquanto ALLOC_WINDOWED_READ=false.)
function _carregarJanela(meses){
  if(!_db) return;
  const alvo=new Set(meses||mesesVisiveis());
  const mesDe=k=>(k.split("__")[1]||"").slice(0,7);
  const podarFora = !_histCompleto;
  Object.keys(_janelaListeners).forEach(m=>{
    if(!alvo.has(m)){
      try{ _janelaListeners[m].off(); }catch(e){}
      delete _janelaListeners[m];
      if(podarFora){ Object.keys(DATA).forEach(k=>{ if(mesDe(k)===m) delete DATA[k]; }); }
    }
  });
  alvo.forEach(m=>{
    if(_janelaListeners[m]) return;
    const ref=_db.ref(ALLOC_DATA_PATH+"/"+m);
    _janelaListeners[m]=ref;
    
    ref.once("value", s => {
      const v = s.val();
      if(v && !Array.isArray(v)) Object.assign(DATA, v);
      else if(v && Array.isArray(v)) Object.assign(DATA, arrayToAlloc(v));
      try{ if(typeof telaAtual!=="undefined" && telaAtual==="grade" && typeof renderAll==="function") renderAll(); }catch(e){}
      
      ref.on("child_added", child => { DATA[child.key] = child.val(); });
      ref.on("child_changed", child => { DATA[child.key] = child.val(); try{ if(typeof telaAtual!=="undefined" && telaAtual==="grade") renderAll(); }catch(e){} });
      ref.on("child_removed", child => { delete DATA[child.key]; try{ if(typeof telaAtual!=="undefined" && telaAtual==="grade") renderAll(); }catch(e){} });
    });
  });
}

/* --- Previsto: leitura por janela (espelha _carregarJanela, porém SILENCIOSA) ---
   Mantém PREV sincronizado com os meses visíveis. Em Fase 1 o callback NÃO
   re-renderiza (a grade ainda não lê PREV); as Fases 2+ ligam o render. --- */
let _histCompletoPrev=true;
const _janelaListenersPrev={};
function _lerTodosBucketsPrev(){
  if(!_db) return Promise.resolve({});
  return _db.ref(PREV_DATA_PATH).once("value").then(s=>{
    const v=s.val()||{}; 
    const mapResult = {};
    Object.keys(v).forEach(m=>{ 
      const mesData = v[m];
      if (Array.isArray(mesData)) {
         Object.assign(mapResult, arrayToPrev(mesData));
      } else {
         Object.assign(mapResult, mesData);
      }
    });
    return mapResult;
  });
}
function _garantirHistoricoCompletoPrev(){
  if(_histCompletoPrev || !_db) return Promise.resolve();
  return _lerTodosBucketsPrev().then(full=>{
    Object.keys(full).forEach(k=>{ if(!(k in PREV)) PREV[k]=full[k]; });
    _histCompletoPrev=true;
  }).catch(e=>{ console.warn("[previsto] histórico completo:", e); });
}
function _carregarJanelaPrev(meses){
  if(!_db) return;
  const alvo=new Set(meses||mesesVisiveis());
  const mesDe=k=>(k.split("__")[1]||"").slice(0,7);
  const podarFora = !_histCompletoPrev;
  Object.keys(_janelaListenersPrev).forEach(m=>{
    if(!alvo.has(m)){
      try{ _janelaListenersPrev[m].off(); }catch(e){}
      delete _janelaListenersPrev[m];
      if(podarFora){ Object.keys(PREV).forEach(k=>{ if(mesDe(k)===m) delete PREV[k]; }); }
    }
  });
  alvo.forEach(m=>{
    if(_janelaListenersPrev[m]) return;
    const ref=_db.ref(PREV_DATA_PATH+"/"+m);
    _janelaListenersPrev[m]=ref;
    
    ref.once("value", s => {
      const v = s.val();
      if(v && !Array.isArray(v)) Object.assign(PREV, v);
      else if(v && Array.isArray(v)) Object.assign(PREV, arrayToPrev(v));
      
      ref.on("child_added", child => { PREV[child.key] = child.val(); });
      ref.on("child_changed", child => { PREV[child.key] = child.val(); });
      ref.on("child_removed", child => { delete PREV[child.key]; });
    });
  });
}
// Inicia a sincronização da camada previsto (chamado por startDataSync).
function _startPrevSync(){
  _histCompletoPrev=false;          // a partir daqui PREV é parcial (só a janela)
  _carregarJanelaPrev(mesesVisiveis());
}
// Conferência read-only dos buckets de previsto (console, admin).
function conferirPrevBuckets(){
  if(!_db){ console.warn("[previsto] sem conexão"); return; }
  return _db.ref(PREV_DATA_PATH).once("value").then(s=>{
    const v=s.val()||{}; let total=0; const porMes={};
    Object.keys(v).forEach(m=>{ const n=(Array.isArray(v[m])?v[m]:Object.values(v[m]||{})).length; porMes[m]=n; total+=n; });
    console.log("[previsto] buckets total="+total, porMes);
    return {total,porMes};
  });
}

/* ===================== datas ===================== */
function parseISO(s){const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d,12,0,0);}
function toISO(dt){return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");}
function addDays(dt,n){const x=new Date(dt);x.setDate(x.getDate()+n);return x;}
function monday(dt){const x=new Date(dt);return addDays(x,-((x.getDay()+6)%7));}
function fmtDM(dt){return String(dt.getDate()).padStart(2,"0")+"/"+String(dt.getMonth()+1).padStart(2,"0");}

/* ===================== período / navegação ===================== */
// Dias considerados conforme o período selecionado.
function periodDays(){
  if(period==="dia")return [new Date(refDate)];
  if(period==="semana")return [0,1,2,3,4].map(i=>addDays(weekStart,i));
  // mês: todos os dias úteis do mês de refDate (sábado/domingo são ocultados, não fazem parte da operação)
  const y=refDate.getFullYear(),m=refDate.getMonth();
  const last=new Date(y,m+1,0).getDate();
  return Array.from({length:last},(_,i)=>new Date(y,m,i+1,12,0,0)).filter(d=>{const w=d.getDay();return w>=1&&w<=5;});
}
function periodWorkDays(){ // só úteis (seg-sex), usado em métricas
  return periodDays().filter(d=>{const w=d.getDay();return w>=1&&w<=5;});
}
function shiftPeriod(dir){
  // Regra de negócio: a GRADE é de planejamento — não navega para o passado.
  // O piso é o período atual (hoje / semana de hoje / mês de hoje).
  if(dir<0 && estaNoPisoOuAntes(dir)) return; // bloqueia ir para trás além do atual
  if(period==="dia"){
    refDate=addDays(refDate,dir);
    // pula sábado/domingo: avança para próxima segunda (ou recua para sexta anterior)
    while(refDate.getDay()===0||refDate.getDay()===6) refDate=addDays(refDate,dir>=0?1:-1);
  }
  else if(period==="semana"){weekStart=addDays(weekStart,dir*7);refDate=new Date(weekStart);}
  else {refDate=new Date(refDate.getFullYear(),refDate.getMonth()+dir,1,12,0,0);}
}
// true se, ao recuar (dir<0), o período resultante cairia ANTES do período atual
function estaNoPisoOuAntes(dir){
  const hoje=new Date();
  if(period==="dia"){
    const alvo=addDays(refDate,dir);
    return toISO(alvo) < toISO(hoje);                 // compara só a DATA (sem hora)
  }
  if(period==="semana"){
    const alvoWs=addDays(weekStart,dir*7);
    return toISO(monday(alvoWs)) < toISO(monday(hoje)); // compara só a DATA (sem hora)
  }
  // mês
  const alvoM=new Date(refDate.getFullYear(),refDate.getMonth()+dir,1);
  const mesAtual=new Date(hoje.getFullYear(),hoje.getMonth(),1);
  return alvoM < mesAtual;
}
// true se já estamos NO período atual (para desabilitar visualmente a seta "‹")
function noPisoAtual(){
  const hoje=new Date();
  if(period==="dia"){
    return toISO(refDate) <= toISO(hoje);             // compara só a DATA
  }
  if(period==="semana"){
    // usa weekStart (semana exibida), igual ao bloqueio em estaNoPisoOuAntes
    return toISO(monday(weekStart)) <= toISO(monday(hoje));
  }
  return (refDate.getFullYear()<hoje.getFullYear()) ||
         (refDate.getFullYear()===hoje.getFullYear() && refDate.getMonth()<=hoje.getMonth());
}
// true se o período atualmente exibido CONTÉM o dia de hoje
function ehPeriodoAtual(){
  const hoje=new Date(), h0=new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate());
  if(period==="dia")return toISO(refDate)===toISO(hoje);
  if(period==="semana")return toISO(monday(weekStart))===toISO(monday(hoje));
  return refDate.getFullYear()===hoje.getFullYear() && refDate.getMonth()===hoje.getMonth();
}
function periodLabel(){
  if(period==="dia"){return `<small>${DOW[refDate.getDay()]}</small>${fmtDM(refDate)}`;}
  if(period==="semana"){const e=addDays(weekStart,4);return `<small>${MONTHS[weekStart.getMonth()]}</small>${fmtDM(weekStart)} – ${fmtDM(e)}`;}
  return `<small>mês</small>${MONTHS[refDate.getMonth()]}/${refDate.getFullYear()}`;
}

/* ===================== categoria → cor ===================== */
// Resolve a atividade cadastrada pelo nome (se existir)
function atividadeObj(nome){return (REG.atividades||[]).find(a=>a.nome===nome)||null;}
function atividadesAtivas(){return (REG.atividades||[]).filter(a=>a.ativo!==false).slice().sort(byNome);}
function atividadesAtivasPorTipo(tipo){return atividadesAtivas().filter(a=>a.tipo===tipo).sort(byNome);}

// Resolve a categoria visual (cor do chip). Aceita uma string (compat) OU o registro inteiro {cliente, atividade}.
// Prioriza a atividade cadastrada (que tem tipo conhecido); só cai no cliente se a atividade não resolver.

// Um slot só é "Livre" quando não tem NADA lançado: sem atividade real ou só o placeholder "Livre".
// Atividades reais (Daily, Férias, Atendimento, Treinamento etc) NUNCA contam como Livre,
// mesmo que o cliente esteja "Livre" (caso normal de atividades Interna/Service/Ausência).
function ehSlotLivre(r){
  if(!r)return true;                       // sem registro = livre
  if(!r.cliente && !r.atividade)return true; // ambos vazios = livre
  const atv=(r.atividade||"").trim();
  const cli=(r.cliente||"").trim();
  // Tem atividade real? não é livre. ("Livre" como atividade só vem do importador, é placeholder)
  if(atv && atv!=="Livre")return false;
  // Sem atividade, mas cliente é um projeto cadastrado? não é livre (alocação só com cliente)
  if(cli && cli!=="Livre" && (REG.projetos||[]).some(p=>p.nome===cli))return false;
  return true; // resto: livre
}
function categoria(reg){
  // Aceita string legada (apenas cliente) ou objeto completo
  let cli="", atv="";
  if(reg==null||reg==="") return "empty";
  if(typeof reg==="string"){cli=reg;}
  else{cli=reg.cliente||""; atv=reg.atividade||"";}
  if(!cli && !atv) return "empty";
  if(cli==="Livre" && !atv) return "c-livre";

  // 1) Tenta resolver pela atividade (fonte mais confiável)
  if(atv){
    const ativ=atividadeObj(atv);
    if(ativ){
      if(ativ.tipo==="ausencia")  return "c-aus";
      if(ativ.tipo==="interna")   return "c-rot";
      if(ativ.tipo==="service")   return "c-svc";
      if(ativ.tipo==="discovery") return "c-dsc";
      if(ativ.tipo==="implantacao") return "c-proj";
    }
  }
  // 2) Tenta pelo cliente como nome de atividade
  const ativ2=atividadeObj(cli);
  if(ativ2){
    if(ativ2.tipo==="ausencia")  return "c-aus";
    if(ativ2.tipo==="interna")   return "c-rot";
    if(ativ2.tipo==="service")   return "c-svc";
    if(ativ2.tipo==="discovery") return "c-dsc";
    return "c-proj";
  }
  // 3) Tenta pelo cliente como nome de projeto
  const proj=(REG.projetos||[]).find(p=>p.nome===cli);
  if(proj){
    if(proj.tipo==="ausencia")  return "c-aus";
    if(proj.tipo==="interna")   return "c-rot";
    if(proj.tipo==="service")   return "c-svc";
    if(proj.tipo==="discovery") return "c-dsc";
    return "c-proj";
  }
  // 4) Cliente é "Livre" sem nada que dê pista → fica livre
  if(cli==="Livre") return "c-livre";
  // 5) Fallback legado por nome (Daily, feriado, etc)
  if(cli==="Daily"||cli==="Weekly") return "c-rot";
  if(/feriado|férias|ferias|corpus christi/i.test(cli)) return "c-aus";
  if(/capacita|onboarding|procedimentos rh|interna/i.test(cli)) return "c-int";
  return "c-proj";
}
// Resumo do que um analista faz num dia: projeto/atividade dominante + nº de itens distintos.
function resumoDia(nome,iso,fer){
  const work=SLOTS.filter(s=>!s.lunch);
  const cont={}; let preenchidos=0, proj=0;
  work.forEach(s=>{const r=DATA[key(nome,iso,s.id)];
    if(r&&r.cliente&&r.cliente!=="Livre"){preenchidos++;cont[r.cliente]=(cont[r.cliente]||0)+1;if(categoria(r)==="c-proj")proj++;}});
  const itens=Object.keys(cont);
  if(!itens.length){
    if(fer&&fer[iso])return {label:fer[iso],cat:"c-aus",extra:0};
    return {label:"Livre",cat:"c-livre",extra:0};
  }
  // dominante = mais frequente (desempate: projeto antes de rotina/interna)
  itens.sort((a,b)=>(cont[b]-cont[a])||((categoria({cliente:b})==="c-proj")-(categoria({cliente:a})==="c-proj")));
  const top=itens[0];
  const cat=itens.length>1 && proj>0 && categoria({cliente:top})!=="c-proj" ? "c-mix" : (itens.length>1 ? "c-mix" : categoria({cliente:top}));
  return {label:top,cat:cat,extra:itens.length-1};
}

/* ===================== seed ===================== */
function seedReg(){
  REG.lideres=["Bruno","Haniel","Adriano","Diego","Sena"];
  const lid={"André":"Bruno","Bruno Souza":"Haniel","Dutra":"Bruno","Emerson":"Haniel","Flores":"Adriano","Guilherme Vale":"Adriano","Lucivandro":"Haniel","Marcelo":"Bruno","Mario":"Bruno","Marlon":"Bruno","Diego M.":"Haniel","Thomas":"Diego","Fabio":"Diego","Denise":"Diego","Felipe Lima":"Diego","Tadeu":"Diego"};
  const nomes=["Adolfo","André","Bruno Souza","Denise","Diego M.","Dutra","Emerson","Fabio","Felipe Lima","Flores","Guilherme Vale","Iago","Jean","Leo","Lucivandro","Marcelo","Mario","Marlon","Tadeu","Thomas"];
  REG.analistas=nomes.map(n=>({nome:n,lider:lid[n]||""}));
  REG.projetos=[
    ["Cootravale","Enterprise","Estabilização","WELLEN SANTOS","Haniel",["Adolfo"]],
    ["Taborda","Essential","Estabilização","EDUARDO SABATINO","Haniel",["Bruno Souza"]],
    ["FSJ","Enterprise","Estabilização","MARCOS PESSOTTO","Haniel",["André"]],
    ["Martinelli","Migração","Estabilização","EDUARDO SABATINO","Haniel",["Flores","Marlon"]],
    ["Tiriva","Essential","Concluído","GIOVANNI DENARDI","Haniel",["Bruno Souza"]],
    ["TransVila","Enterprise","Em andamento","EDUARDO SABATINO","Haniel",["Emerson"]],
    ["Carazzo","Migração","Em andamento","GIOVANNI DENARDI","Bruno",["Mario"]],
    ["Borrota","Migração","Em andamento","GIOVANNI DENARDI","Bruno",["Mario"]],
    ["Seda Transportes","Migração","Em andamento","GIOVANNI DENARDI","Bruno",["André"]],
    ["Transbom","Essential","Em andamento","EDUARDO SABATINO","Haniel",["Bruno Souza"]],
    ["Tag Transportes","Essential","Em andamento","DEIVID FIORIN","Sena",["André"]],
    ["Colaus Logistica","Essential","Concluído","DEIVID FIORIN","Sena",["Emerson"]],
    ["FLX","Essential","Em andamento","GIOVANNI DENARDI","Sena",["Lucivandro"]],
    ["Rodoxico","Essential","Concluído","GIOVANNI DENARDI","Sena",["André"]],
    ["FAT Log","Essential","Em andamento","DEIVID FIORIN","Sena",["Mario","Marlon"]],
    ["Fantinato","Essential","Em andamento","DEIVID FIORIN","Sena",["Dutra"]],
    ["IG Transp.","Essential","Em andamento","WELINGTON SCHIMITZ","Sena",["Marlon"]],
    ["Consigas","Essential","Em andamento","WELLEN SANTOS","Sena",["Lucivandro"]],
  ].map(([nome,seg,st,gp,lider,an])=>({nome,tipo:"implantacao",segmentacao:seg,status:st,gp,lider,analistas:an}));
  // Projetos guarda-chuva: concentram alocações que não são de implantação de cliente
  REG.projetos.push(
    {nome:"Atividades Internas",tipo:"interna",   segmentacao:"Essential",status:"Em andamento",gp:"",lider:"",analistas:[]},
    {nome:"Ausências",           tipo:"ausencia", segmentacao:"Essential",status:"Em andamento",gp:"",lider:"",analistas:[]},
    {nome:"Services",            tipo:"service",  segmentacao:"Essential",status:"Em andamento",gp:"",lider:"",analistas:[]},
    {nome:"Discovery",           tipo:"discovery",segmentacao:"Essential",status:"Em andamento",gp:"",lider:"",analistas:[]},
  );
  REG.feriados=[
    {data:"2026-04-03",nome:"Sexta-feira Santa"},
    {data:"2026-04-21",nome:"Tiradentes"},
    {data:"2026-05-01",nome:"Dia do Trabalho"},
    {data:"2026-06-04",nome:"Corpus Christi"},
  ];
  REG.gps=["EDUARDO SABATINO","GIOVANNI DENARDI","DEIVID FIORIN","WELLEN SANTOS","MARCOS PESSOTTO","WELINGTON SCHIMITZ"];
  REG.atividades=seedAtividades();
}
// Cadastro semente de atividades (exemplos do prompt, todas ativas)
function seedAtividades(){
  const hoje=new Date().toISOString();
  const mk=(nome,tipo,obs=false)=>({nome,tipo,ativo:true,exigeObs:obs,createdAt:hoje,createdBy:"sistema",updatedAt:hoje,updatedBy:"sistema"});
  return [
    // Internas (rotinas administrativas, reuniões, capacitação)
    mk("Daily","interna"),
    mk("Weekly","interna"),
    mk("Reunião interna","interna"),
    mk("Capacitação","interna"),
    mk("Capacitação Interna","interna"),
    mk("Onboarding","interna"),
    mk("Procedimentos RH","interna"),
    // Implantação (atividades-fim com cliente)
    mk("Implantação","implantacao"),
    mk("Treinamento com cliente","implantacao",true),
    mk("Treinamento de cadastros","implantacao",true),
    mk("Treinamento logístico","implantacao",true),
    mk("Treinamento backoffice","implantacao",true),
    mk("Parametrização do sistema","implantacao"),
    mk("Validação de ambiente","implantacao"),
    mk("Homologação","implantacao",true),
    mk("Go Live","implantacao",true),
    mk("Pós Go Live","implantacao",true),
    // Discovery (mapeamento de processos pré-implantação, após kickoff e BBP)
    mk("Reunião de Kickoff","discovery",true),
    mk("BBP — Business Blueprint","discovery",true),
    mk("Mapeamento de processos","discovery",true),
    mk("Levantamento de integrações","discovery",true),
    mk("Workshop com cliente","discovery",true),
    mk("Documentação Discovery","discovery"),
    // Service (atendimento ao cliente já implantado)
    mk("Atendimento Service","service",true),
    mk("Suporte ao cliente","service",true),
    mk("Análise de chamado","service"),
    mk("Ajuste/correção pós-implantação","service",true),
    // Ausências
    mk("Férias","ausencia"),
    mk("Atestado","ausencia",true),
    mk("Folga","ausencia"),
    mk("Banco de horas","ausencia"),
    mk("Ausência justificada","ausencia",true),
    mk("Feriado","ausencia"),
  ];
}
// Histórico inicial — o que construímos juntos até aqui
function seedAlloc(){
  // Ancorar a semente na SEMANA ATUAL (segunda-feira de hoje), nunca numa data fixa
  // no passado. Uma data fixa passada deixava weekStart fora de sincronia com refDate
  // (hoje), travando a navegação de semana para quem abre o app sem cache local.
  const start=monday(new Date());
  const plano={
    Slot1:{a:"Daily",c:["Daily","Daily","Daily","Daily","Daily"]},
    Slot2:{a:"Implantação",c:["IG Transp.","IG Transp.","IG Transp.","IG Transp.","IG Transp."]},
    Slot3:{a:"Interna",c:["Livre","Weekly","Livre","Weekly","Livre"]},
    Slot4:{a:"Implantação",c:["Martinelli","Martinelli","Martinelli","Livre","Livre"]},
    Slot5:{a:"Implantação",c:["Livre","Livre","FAT Log","FAT Log","Livre"]},
  };
  for(const slot in plano)plano[slot].c.forEach((cli,i)=>{DATA[key("Marlon",toISO(addDays(start,i)),slot)]={atividade:plano[slot].a,cliente:cli};});
  consultor="Marlon"; weekStart=start;
}

/* ===================== helpers de cadastro ===================== */
const el=id=>document.getElementById(id);
/* ----- Inativação: helpers ----- */
// Considera "ativo agora" se a flag for true OU se ainda não foi setada (default = true)
const isAtivo=item=>!item||item.ativo!==false;
// Versão atual do app (hardcoded — atualizar a cada release significativa)
const APP_VERSION = "1.66.0";
function versaoAtual(){return APP_VERSION;}
// Para uso histórico: o item estava ativo em determinada data (string ISO)?
function isAtivoEm(item,iso){
  if(!item) return true;
  if(item.ativo!==false) return true;                 // ativo agora → sempre conta
  const corte=item.desligamento||item.inativadoEm;    // data de desligamento (se houver)
  if(!corte) return false;                            // inativo sem data → trate como inativo desde sempre
  return iso < corte;                                 // o período é anterior ao desligamento
}
const analistaObj=n=>REG.analistas.find(a=>a.nome===n);
// Líderes e GPs: nomes ficam em arrays simples; a inativação é registrada em
// mapas paralelos REG.lideresInativos / REG.gpsInativos no formato { nome: desligISO | true }
function _inativObj(nome,mapa){
  const v=(mapa||{})[nome];
  if(v===undefined) return {nome,ativo:true,desligamento:null};
  return {nome,ativo:false,desligamento:(typeof v==="string"?v:null)};
}
const liderObj=n=>_inativObj(n,REG.lideresInativos);
const gpObj=n=>_inativObj(n,REG.gpsInativos);
// helpers de e-mail nos cadastros
const emailAnalista=n=>{const a=REG.analistas.find(x=>x.nome===n);return (a&&a.email)||"";};
const emailLider=n=>((REG.lideresEmails||{})[n])||"";
const emailGp=n=>((REG.gpsEmails||{})[n])||"";
// busca um analista pelo e-mail (case-insensitive)
function analistaPorEmail(email){
  if(!email)return null;
  const e=email.toLowerCase();
  return REG.analistas.find(a=>(a.email||"").toLowerCase()===e)||null;
}
function liderPorEmail(email){
  if(!email)return null;
  const e=email.toLowerCase();
  const m=REG.lideresEmails||{};
  for(const k in m){if((m[k]||"").toLowerCase()===e)return k;} return null;
}
function gpPorEmail(email){
  if(!email)return null;
  const e=email.toLowerCase();
  const m=REG.gpsEmails||{};
  for(const k in m){if((m[k]||"").toLowerCase()===e)return k;} return null;
}
function emailValido(e){return !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}

// Ordenação padrão do sistema (pt-BR, ignorando maiúsculas/minúsculas e acentos).
// Usada em selects, cadastros e listas operacionais para manter tudo previsível.
function cmpAlpha(a,b){return String(a||"").localeCompare(String(b||""),"pt-BR",{sensitivity:"base",numeric:true});}
function byNome(a,b){return cmpAlpha(a&&a.nome,b&&b.nome);}
function sortAlpha(arr){return (arr||[]).slice().sort(cmpAlpha);}

const analistaNomes=(incluirInativos=false)=>REG.analistas.filter(a=>incluirInativos||isAtivo(a)).map(a=>a.nome).sort(cmpAlpha);
const projetoNomes=(incluirInativos=false)=>REG.projetos.filter(p=>incluirInativos||isAtivo(p)).map(p=>p.nome).sort(cmpAlpha);
const liderDe=n=>{const a=REG.analistas.find(x=>x.nome===n);return a?a.lider:"";};
const squadDe=n=>{const a=REG.analistas.find(x=>x.nome===n);return (a&&a.squad)||"";};
// Renderiza um chip de squad (vazio se não houver squad). `sm` deixa o chip menor.
function squadChipHTML(squad, sm){
  if(!squad)return "";
  const m=squadMeta(squad);
  return `<span class="squad-chip${sm?' sm':''}" style="--sq-color:${m.color};--sq-bg:${m.bg};--sq-bd:${m.bd}"><span class="dot"></span>${enc(squad)}</span>`;
}
const projetosDoAnalista=n=>REG.projetos.filter(p=>(p.analistas||[]).includes(n)).map(p=>p.nome).sort(cmpAlpha);
// Líderes/GPs ativos (estruturas simples: array de nomes, com listas paralelas de inativos)
const lideresAtivos=()=>sortAlpha((REG.lideres||[]).filter(l=>!(REG.lideresInativos||{})[l]));
const gpsAtivos=()=>sortAlpha((REG.gps||[]).filter(g=>!(REG.gpsInativos||{})[g]));
function statusBadge(s){const m={"Em andamento":"b-ema","Estabilização":"b-est","Concluído":"b-con","Não iniciado":"b-nao","Congelado":"b-cgl","Churn":"b-chr"};return `<span class="badge ${m[s]||'b-nao'}">${s||'—'}</span>`;}
// Selo de categoria (segmentação por nível) com cores metálicas. Vazio = sem categoria.
function categoriaBadge(c){if(!c)return "";const cls={Platina:"b-cat-platina",Ouro:"b-cat-ouro",Prata:"b-cat-prata",Bronze:"b-cat-bronze"}[c]||"b-cat-prata";return `<span class="badge b-cat ${cls}" title="Categoria: ${c}"><i class="cat-dot"></i>${c}</span>`;}
function feriadosMap(){const m={};(REG.feriados||[]).forEach(f=>{if(f.data)m[f.data]=f.nome;});return m;}

/* renomear: migra todas as referências */
function renameAnalista(old,nv){
  if(old===nv)return;
  REG.analistas.forEach(a=>{if(a.nome===old)a.nome=nv;});
  REG.projetos.forEach(p=>{p.analistas=(p.analistas||[]).map(x=>x===old?nv:x);});
  Object.keys(DATA).forEach(k=>{if(k.startsWith(old+"__")){DATA[nv+k.slice(old.length)]=DATA[k];delete DATA[k];}});
  if(consultor===old)consultor=nv;
  try{ _renomearAtasDoAnalista(old,nv); }catch(e){ console.warn("[atas] rename:",e); }
}
function renameLider(old,nv){
  if(old===nv)return;
  REG.lideres=REG.lideres.map(x=>x===old?nv:x);
  REG.analistas.forEach(a=>{if(a.lider===old)a.lider=nv;});
  REG.projetos.forEach(p=>{if(p.lider===old)p.lider=nv;});
}
function renameProjeto(old,nv){
  if(old===nv)return;
  REG.projetos.forEach(p=>{if(p.nome===old)p.nome=nv;});
  Object.values(DATA).forEach(v=>{if(v.cliente===old)v.cliente=nv;});
}
function renameGp(old,nv){
  if(old===nv)return;
  REG.gps=(REG.gps||[]).map(x=>x===old?nv:x);
  REG.projetos.forEach(p=>{if(p.gp===old)p.gp=nv;});
}

/* ===================== Atas · infra de dados (Fase 2) =====================
   Persistência windowed: alocacoes/atas/<YYYY-MM>/<idAta>.
   - idAta opaco; o vínculo com o slot é o campo slotKey (analista__iso__slot).
   - Lookup por slot: lê o bucket do mês e indexa por slotKey (cache em memória).
   - "Livre = ausência de dado": ata é nó próprio; NUNCA grava nada no slot.
   - O slotKey embute o nome do analista (igual às chaves de DATA); rename de
     analista é propagado às atas já gravadas por _renomearAtasDoAnalista().      */
let _atasCache = {};   // slotKey -> ata (+ _id,_mes) já lidos da nuvem
let _atasMeses = {};   // "YYYY-MM" -> true (bucket já carregado nesta sessão)

function _ataNovoId(){ return "ATA_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7); }

function _carregarAtasMes(mes){
  if(!_db) return Promise.resolve({});
  return _db.ref(ATAS_PATH+"/"+mes).once("value").then(s=>{
    const v=s.val()||{};
    Object.keys(v).forEach(id=>{ const a=v[id]; if(a&&a.slotKey) _atasCache[a.slotKey]=Object.assign({_id:id,_mes:mes},a); });
    _atasMeses[mes]=true;
    return v;
  }).catch(e=>{ console.warn("[atas] leitura falhou (verifique as Regras do Firebase para "+ATAS_PATH+"):",e); return {}; });
}
function _ataDoSlot(slotKey){ return _atasCache[slotKey]||null; }

// Propaga rename de analista nas atas já gravadas. Assíncrono, cloud-only,
// fire-and-forget — nunca bloqueia/qubra o rename em memória.
function _renomearAtasDoAnalista(old,nv){
  if(!_db || old===nv) return;
  _db.ref(ATAS_PATH).once("value").then(s=>{
    const all=s.val(); if(!all) return;
    const updates={};
    Object.keys(all).forEach(mes=>{
      const bucket=all[mes]||{};
      Object.keys(bucket).forEach(id=>{
        const a=bucket[id]; if(!a) return;
        if(a.slotKey && a.slotKey.indexOf(old+"__")===0){
          a.slotKey = nv + a.slotKey.slice(old.length);
          if(a.analista===old) a.analista=nv;
          updates[mes+"/"+id]=a;
        }
      });
    });
    if(Object.keys(updates).length){
      _db.ref(ATAS_PATH).update(sanitizeForFirebase(updates))
        .then(()=>{ _atasCache={}; _atasMeses={}; })   // invalida cache p/ releitura
        .catch(e=>console.warn("[atas] propagação de rename falhou:",e));
    }
  }).catch(()=>{});
}

/* ===================== render grade ===================== */
// Monta o HTML de um chip de alocação, com ícone/tooltip de observação se houver
// Indicador de ata no chip do slot (grade). Só aparece quando a atividade exige ata.
// Dois estados: "emitida" (existe registro de ata) e "pendente" (obrigatória sem ata).
// SVG inline (não depende de lucideRefresh, que não roda após a grade).
function _ataIndicadorHTML(slotKey, r){
  const atv = r ? atividadeObj(r.atividade) : null;
  if(!(atv && atv.exigeAta)) return "";
  const folha='<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><polyline points="14 2 14 8 20 8"/>';
  const svg=(extra)=>`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${folha}${extra||""}</svg>`;
  const ata = slotKey ? _ataDoSlot(slotKey) : null;
  if(ata){
    const st = ata.envioConfirmado?"enviada":(ata.impressa?"impressa":"gerada");
    const lbl = {gerada:"Ata gerada",impressa:"Ata impressa (bloqueada)",enviada:"Ata enviada"}[st]||"Ata emitida";
    return `<span class="ata-ind emitida" title="${lbl}">${svg('<path d="m9 15 2 2 4-4"/>')}</span>`;
  }
  return `<span class="ata-ind pendente" title="Ata pendente (obrigatória)">${svg()}</span>`;
}
function chipHTML(cat,r,classe,slotKey){
  classe=classe||"chip";
  const obs=(r&&r.obs)?String(r.obs).trim():"";
  const cli=r.cliente||"";
  const atv=r.atividade||"";
  // Quando o cliente é "Livre" mas a atividade dá significado ao slot (Discovery, Interna, etc),
  // mostra a ATIVIDADE como destaque do chip (não "Livre"), pois "Livre" sozinho é só placeholder.
  const semProjeto = !cli || cli==="Livre";
  const usaAtv = semProjeto && atv;
  const labelTopo = usaAtv ? atv : cli;
  const labelSub  = usaAtv ? (cat==="c-livre"?"":"") : atv;
  const titulo=obs?enc((cli||"—")+" — "+(atv||"")+"\n📝 "+obs):"";
  const icone=obs?'<span class="obs-mark" title="Há observação neste slot">📝</span>':"";
  const ind=_ataIndicadorHTML(slotKey, r);
  if(cat==="c-livre")
    return `<div class="${classe} ${cat}"${titulo?` title="${titulo}"`:""}><span class="cli">${enc(labelTopo||"Livre")}</span>${icone}${ind}</div>`;
  return `<div class="${classe} ${cat}"${titulo?` title="${titulo}"`:""}><span class="cli">${enc(labelTopo)}</span>${labelSub?`<span class="atv">${enc(labelSub)}</span>`:""}${icone}${ind}</div>`;
}
// Chip neutro para um slot ocupado por projeto de OUTRO GP (escopo "Meus" do GP).
// Mostra que o analista está indisponível, sem revelar o projeto/cliente alheio.
function chipForaEscopoHTML(classe){
  classe=classe||"chip";
  return `<div class="${classe} c-fora" title="Indisponível · alocado em projeto de outro GP"><span class="cli">Outro projeto</span></div>`;
}

/* ===================== FASE 2 · Detecção e visualização previsto × realizado =====================
   Lê as DUAS camadas (DATA=realizado, PREV=previsto) pela MESMA chave e classifica
   cada célula. 100% read-only — não grava nada. A resolução de conflitos é Fase 4. */
let _showPrevisto = true;   // toggle da camada previsto na grade
function _normProj(s){ return String(s==null?"":s).trim().toLowerCase(); }
// Conteúdo "real" = registro que NÃO é slot livre. O placeholder "Livre"
// (cliente/atividade = "Livre") e a ausência de registro contam como vazio,
// para não vazarem como previsto/realizado/alocação nas métricas de aderência.
function _temConteudo(r){ return !!r && !ehSlotLivre(r); }
// Estados possíveis: "vazio" | "previsto" | "extra" | "confirmado" | "conflito"
//  • previsto   = planejado, sem realizado
//  • extra      = realizado sem previsto (fora do plano)
//  • confirmado = previsto e realizado no MESMO projeto
//  • conflito   = previsto e realizado em projetos DIFERENTES
function statusCelula(nome, iso, slot){
  const real = DATA[key(nome,iso,slot)] || null;
  const prev = PREV[key(nome,iso,slot)] || null;
  const tR = _temConteudo(real), tP = _temConteudo(prev);
  if(!tR && !tP) return "vazio";
  if(tP && !tR)  return "previsto";
  if(tR && !tP)  return "extra";
  if(_normProj(real.cliente)!==_normProj(prev.cliente)) return "conflito";
  return _normProj(real.atividade)===_normProj(prev.atividade) ? "confirmado" : "atividadeDivergente";
}
// Ghost chip para slot com previsto e SEM realizado (planejado, não realizado).
function ghostChipHTML(nome, iso, slot, classe){
  classe=classe||"chip";
  const p = PREV[key(nome,iso,slot)];
  if(!p) return `<div class="${classe} empty"><span class="plus">+</span></div>`;
  if(foraDoEscopoAtual(p)) return `<div class="${classe} previsto fora" title="Previsto · projeto de outro escopo"><span class="cli">Previsto</span></div>`;
  const venc = iso < toISO(new Date());   // previsto no passado e ainda não realizado
  const semProj = !p.cliente || p.cliente==="Livre";
  const cli = semProj ? (p.atividade||"Previsto") : p.cliente;
  const sub = (!semProj && p.atividade) ? p.atividade : "";
  const tt  = "Previsto"+(venc?" · não realizado":"")+": "+((p.cliente||"—")+(p.atividade?(" — "+p.atividade):""));
  return `<div class="${classe} previsto${venc?" venc":""}" title="${enc(tt)}"><span class="pv-tag">previsto</span><span class="cli">${enc(cli)}</span>${sub?`<span class="atv">${enc(sub)}</span>`:""}</div>`;
}
// Injeta um marcador de canto no chip do realizado (conflito/confirmado/extra).
function comMarcador(innerHTML, st, nome, iso, slot){
  let m="";
  if(st==="conflito"){
    const p=PREV[key(nome,iso,slot)]||{}, r=DATA[key(nome,iso,slot)]||{};
    const tt="Conflito · Previsto: "+(p.cliente||"—")+" · Realizado: "+(r.cliente||"—");
    m=`<span class="cell-flag conf" title="${enc(tt)}">!</span>`;
  }else if(st==="confirmado"){
    m='<span class="cell-flag ok" title="Confirmado · previsto = realizado">✓</span>';
  }else if(st==="extra"){
    m='<span class="cell-flag extra" title="Realizado fora do plano (sem previsto)"></span>';
  }else if(st==="atividadeDivergente"){
    const p=PREV[key(nome,iso,slot)]||{}, r=DATA[key(nome,iso,slot)]||{};
    const tt="Atividade divergente · Previsto: "+(p.atividade||"—")+" · Realizado: "+(r.atividade||"—");
    m=`<span class="cell-flag warn" title="${enc(tt)}">~</span>`;
  }else return innerHTML;
  return innerHTML.replace(/<\/div>\s*$/, m+"</div>");
}
// Decorador único usado pelas 3 visões da grade. Não altera o realizado; só
// adiciona ghost (quando vazio) ou marcador de canto (quando ocupado).
function _decorarPrevisto(nome, iso, slot, inner, cat, fn, locked, classe){
  if(!_showPrevisto || !canViewAction("prealoc")) return inner;
  const st=statusCelula(nome,iso,slot);
  if(cat==="empty" && !fn && st==="previsto") return ghostChipHTML(nome,iso,slot,classe);
  if(cat!=="empty" && !locked && (st==="conflito"||st==="confirmado"||st==="extra"||st==="atividadeDivergente")) return comMarcador(inner,st,nome,iso,slot);
  return inner;
}
// Conta conflitos presentes na memória atual (janela carregada) — para o badge.
function _contarConflitosMem(){
  let n=0;
  Object.keys(PREV).forEach(k=>{
    const i=k.split("__"); if(i.length<3) return;
    if(statusCelula(i[0],i[1],i[2])==="conflito") n++;
  });
  return n;
}
// Coleta a lista completa de conflitos + previstos vencidos (não realizados),
// respeitando o escopo do perfil logado. Requer histórico completo (chamador garante).
function _coletarConflitos(){
  const hoje=toISO(new Date());
  const out=[];
  Object.keys(PREV).forEach(k=>{
    const i=k.split("__"); if(i.length<3) return;
    const c=i[0], iso=i[1], slot=i[2];
    const st=statusCelula(c,iso,slot);
    if(st!=="conflito" && st!=="previsto") return;
    const prev=PREV[k]||{}, real=DATA[k]||{};
    if(foraDoEscopoAtual(prev) || foraDoEscopoAtual(real)) return;   // não vaza escopo
    if(st==="previsto" && iso>=hoje) return;                         // previsto futuro não é pendência
    out.push({c, iso, slot, st,
      prevProj:prev.cliente||"", realProj:real.cliente||"",
      prevAtv:prev.atividade||"", realAtv:real.atividade||""});
  });
  return out.sort((a,b)=> a.iso<b.iso?-1 : a.iso>b.iso?1 : (a.c<b.c?-1:a.c>b.c?1:(a.slot<b.slot?-1:1)));
}
function renderConsultorSelect(){
  const ns=gradeAnalysts();
  if(!ns.includes(consultor))consultor=ns[0]||null;
  const sel=el("selConsultor");
  sel.innerHTML=ns.length?ns.map(c=>`<option ${c===consultor?"selected":""}>${c}</option>`).join(""):`<option>—</option>`;
  sel.disabled=ns.length<=1;  // analista (1) fica travado no próprio nome
}
// Popula o seletor do filtro "Projetos" da Grade (escopado ao perfil do usuário).
function renderProjFilter(){
  const sel=el("selProjFilter"); if(!sel) return;
  const projs=projetosParaFiltroGrade();
  // se o projeto selecionado deixou de estar disponível no escopo, limpa o filtro
  if(gradeProjFilter && !projs.includes(gradeProjFilter)) gradeProjFilter="";
  const opts=[`<option value="">Todos os projetos</option>`]
    .concat(projs.map(n=>`<option value="${enc(n)}" ${n===gradeProjFilter?"selected":""}>${enc(n)}</option>`));
  sel.innerHTML=opts.join("");
  // destaca visualmente quando há filtro ativo
  const field=el("projFilterField");
  if(field) field.classList.toggle("filtro-ativo", !!gradeProjFilter);
}
function renderControls(){
  // mostra/esconde o seletor de consultor (só na visão por analista)
  el("consultorField").classList.toggle("hidden",viewMode==="geral");
  renderProjFilter();
  el("navLabel").textContent={dia:"Dia",semana:"Semana",mes:"Mês"}[period];
  el("weekLabel").innerHTML=periodLabel();
  el("tagText").textContent="Implantação · "+(viewMode==="geral"?"Visão Geral":"Por Analista")+" · "+{dia:"Dia",semana:"Semana",mes:"Mês"}[period];
  // marca os toggles ativos
  el("viewSeg").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.v===viewMode));
  el("periodSeg").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.p===period));
  const pvSeg=el("previstoSeg"); if(pvSeg) pvSeg.querySelectorAll("button").forEach(b=>b.classList.toggle("on", (b.dataset.pv==="on")===_showPrevisto));
  { const verPrev=canViewAction("prealoc");
    const pvField=el("previstoField"); if(pvField) pvField.style.display=verPrev?"":"none";
    const confBtn=el("conflitosBtn"); if(confBtn) confBtn.style.display=verPrev?"":"none";
    const gpb=el("gerarPrevBtn"); if(gpb) gpb.style.display="none"; }   // aposentado: a aba Previsto do projeto substitui o gerador automático
  try{ _atualizarBadgeConflitos(); }catch(e){}
  // bloqueio do passado na grade de planejamento: desabilita a seta "‹" no piso atual
  const prev=el("prevWk");
  if(prev){
    const noPiso=noPisoAtual();
    prev.disabled=noPiso;
    prev.style.opacity=noPiso?".3":"";
    prev.style.cursor=noPiso?"not-allowed":"";
    prev.title=noPiso?"Planejamento é do período atual em diante (o passado fica no histórico)":"Anterior";
  }
}
function renderHeader(){
  if(viewMode==="geral"){
    const ns=gradeAnalysts();
    el("avatar").textContent="∑";
    el("consultorName").textContent="Visão Geral";
    el("liderLine").innerHTML=`<b>${ns.length}</b> analista(s) ${isLider()?("· equipe "+_linkedLider):isGp()?("· projetos do GP "+_linkedGp):"visíveis"}`;
    return;
  }
  if(!consultor){el("avatar").textContent="—";el("consultorName").textContent="Sem analistas";el("liderLine").textContent="";return;}
  el("avatar").textContent=(consultor.trim()[0]||"?").toUpperCase();
  el("consultorName").textContent=consultor;
  const l=liderDe(consultor);
  const sq=squadDe(consultor);
  el("liderLine").innerHTML=(l?`Líder de implantação: <b>${l}</b>`:`<span style="color:var(--faint)">Sem líder vinculado</span>`)+(sq?` &nbsp;${squadChipHTML(sq,true)}`:"");
  try{ el("liderLine").innerHTML += capacBadgeFor(consultor); lucideRefresh(); }catch(e){}
}
/* Fase 3 — varredura única de escopo. Computa filled/livre/proj/projs para um
   conjunto de analistas no período atual. Duas otimizações sobre o laço por célula:
   (1) projeto verificado por Set.has() — O(1) — no lugar de REG.projetos.some() — O(P);
   (2) foraDoEscopoAtual memoizado por nome de projeto: o resultado depende só de
       r.cliente durante um render, e muitas células compartilham o mesmo projeto,
       então cada projeto roda o REG.projetos.find() interno uma só vez.
   Retorna também total/wdays/work para os chamadores não recomputarem. */
function _scanEscopo(analistas){
  const work=SLOTS.filter(s=>!s.lunch);
  const wdays=periodWorkDays().map(toISO);
  const projSet=new Set((REG.projetos||[]).map(p=>p.nome));
  const foraCache=new Map(); // nome do projeto -> bool (cache por render)
  const fora=r=>{
    const cli=r.cliente;
    if(foraCache.has(cli)) return foraCache.get(cli);
    const v=foraDoEscopoAtual(r);
    foraCache.set(cli,v);
    return v;
  };
  let filled=0,livre=0,proj=0;const projs=new Set();
  for(const n of analistas){
    for(const iso of wdays){
      for(const s of work){
        const r=DATA[key(n,iso,s.id)];
        if(ehSlotLivre(r)){livre++;continue;}
        filled++;
        const cli=r.cliente;
        if(cli && cli!=="Livre" && projSet.has(cli) && !fora(r)){ proj++; projs.add(cli); }
      }
    }
  }
  return {filled,livre,proj,projs,total:analistas.length*wdays.length*work.length,wdays,work};
}
function renderStats(){
  if(viewMode==="geral"){
    const ns=gradeAnalysts();
    const {filled,livre,projs,total}=_scanEscopo(ns);
    el("stats").innerHTML=[[ns.length,"Analistas"],[total?Math.round(filled/total*100)+"%":"—","Ocupação"],[projs.size,"Projetos ativos"],[livre,"Slots livres"]]
      .map(([n,l])=>`<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("");
    return;
  }
  if(!consultor){el("stats").innerHTML="";return;}
  const {filled,livre,proj,projs,wdays,work}=_scanEscopo([consultor]);
  el("stats").innerHTML=[[filled+"/"+(wdays.length*work.length),"Slots preench."],[proj,"Em projeto"],[projs.size,"Projetos"],[livre,"Livres"]]
    .map(([n,l])=>`<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("");
  _atualizaContextoSidebar();
}

// Atualiza o contador da sidebar com os números do escopo atual (estilo OPUS "159 alocações · 2 proj")
function _atualizaContextoSidebar(){
  const e=el("sbContext"); if(!e)return;
  try{
    const {filled,projs}=_scanEscopo(gradeAnalysts()); // allocCount == filled (slots preenchidos)
    e.textContent=`${filled.toLocaleString("pt-BR")} alocação(ões) · ${projs.size} projeto(s)`;
  }catch(err){e.textContent="";}
}

/* ---- Visão POR ANALISTA: Slot (linhas) × dias do período (colunas) ---- */
function renderBoardAnalista(){
  if(!consultor){el("boardHost").innerHTML=`<div class="loading">Cadastre um analista em <b>Ações</b> para começar.</div>`;return;}
  const todayISO=toISO(new Date());
  const days=periodDays();
  const fer=feriadosMap();
  // largura mínima por coluna: cresce conforme o período (mês precisa de scroll horizontal)
  const dayW = period==="mes" ? 78 : (period==="semana" ? 0 : 0);
  const slotW = 128;
  // largura total da tabela quando precisamos forçar scroll (mês). Na semana, mantém 100%.
  const tableMin = dayW ? (slotW + dayW*days.length) : 0;
  const tableStyle = tableMin ? `min-width:${tableMin}px;table-layout:fixed` : "table-layout:fixed";
  const colHStyle = dayW ? `min-width:${dayW}px;width:${dayW}px` : "";
  let head=`<th class="col-slot slot-h"><div class="sname">Slot</div><div class="stime">Horário</div></th>`;
  days.forEach(d=>{const iso=toISO(d);const isT=iso===todayISO;const fn=fer[iso];const wknd=d.getDay()===0||d.getDay()===6;
    head+=`<th class="day-h${isT?" is-today":""}${fn?" is-holiday":""}" style="${colHStyle}${wknd?';background:#f0f0f0':''}"><div class="dow">${DOW[d.getDay()]}</div><div class="dnum">${fmtDM(d)}</div>${fn?`<div class="ferlabel">⚑ ${fn}</div>`:""}</th>`;});
  let body="";
  SLOTS.forEach(s=>{
    if(s.lunch){body+=`<tr class="lunch"><td>·</td><td colspan="${days.length}">Almoço · ${s.time}</td></tr>`;return;}
    body+=`<tr><td class="slot-label"><div class="sname">${s.id}</div><div class="stime mono">${s.time}</div></td>`;
    days.forEach(d=>{const iso=toISO(d);const isT=iso===todayISO;const fn=fer[iso];const wknd=d.getDay()===0||d.getDay()===6;
      const r=DATA[key(consultor,iso,s.id)];const cat=categoria(r);
      let inner, locked=false;
      if(cat!=="empty" && foraDoEscopoAtual(r)){inner=chipForaEscopoHTML("chip");locked=true;}
      else if(cat!=="empty")inner=chipHTML(cat,r,"chip",key(consultor,iso,s.id));
      else if(fn)inner=`<div class="chip c-aus"><span class="cli">${fn}</span><span class="atv">Feriado</span></div>`;
      else inner=`<div class="chip empty"><span class="plus">+</span></div>`;
      inner=_decorarPrevisto(consultor,iso,s.id,inner,cat,fn,locked,"chip");
      body+=`<td class="cell${isT?" is-today-col":""}${fn?" is-holiday-col":""}${wknd?" wknd":""}${locked?" locked":""}" data-nome="${enc(consultor)}" data-iso="${iso}" data-slot="${s.id}"${locked?' data-locked="1"':""}>${inner}</td>`;});
    body+=`</tr>`;
  });
  el("boardHost").innerHTML=`<div class="board" style="overflow:auto"><table style="${tableStyle}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/* ---- Visão GERAL · DIA: Analista (linhas) × Slot (colunas), editável ---- */
function renderGeralDia(){
  const ns=gradeAnalysts(toISO(refDate));
  const iso=toISO(refDate);const fer=feriadosMap();const fn=fer[iso];const work=SLOTS.filter(s=>!s.lunch);
  let head=`<th class="gcorner">Analista</th>`;
  work.forEach(s=>head+=`<th class="col-slot-h">${s.id}<div class="stime">${s.time}</div></th>`);
  let body="";
  if(!ns.length)body=`<tr class="gemptyrow"><td colspan="${work.length+1}">${gradeProjFilter?("Nenhum analista alocado no projeto "+enc(gradeProjFilter)+" dentro do seu escopo."):"Nenhum analista visível para o seu perfil."}</td></tr>`;
  ns.forEach(n=>{
    const l=liderDe(n);
    body+=`<tr><td class="ganalyst"><div class="gn"><span class="gav" style="background:${colorFor(n)}">${(n[0]||'?').toUpperCase()}</span>${n}</div>${l?`<div class="gl">${l}</div>`:""}</td>`;
    work.forEach(s=>{const r=DATA[key(n,iso,s.id)];const cat=categoria(r);
      let inner, locked=false;
      if(cat!=="empty" && foraDoEscopoAtual(r)){inner=chipForaEscopoHTML("gchip");locked=true;}
      else if(cat!=="empty")inner=chipHTML(cat,r,"gchip",key(n,iso,s.id));
      else if(fn)inner=`<div class="gchip c-aus"><span class="cli">${fn}</span></div>`;
      else inner=`<div class="gchip empty"></div>`;
      inner=_decorarPrevisto(n,iso,s.id,inner,cat,fn,locked,"gchip");
      body+=`<td class="gcell${locked?" locked":""}" data-nome="${enc(n)}" data-iso="${iso}" data-slot="${s.id}"${locked?' data-locked="1"':""}>${inner}</td>`;});
    body+=`</tr>`;
  });
  const cap=fn?` · ⚑ ${fn}`:"";
  el("boardHost").innerHTML=`<div class="gboard"><table class="gmx"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
    <div style="font-size:11.5px;color:var(--faint);padding:8px 4px 0">Clique numa célula para alocar · ${DOW[refDate.getDay()]}, ${fmtDM(refDate)}${cap}</div>`;
}

/* ---- Visão GERAL · SEMANA/MÊS: para cada analista, a grade COMPLETA de Slot × Dias ----
   (mesmo formato da visão Por Analista, repetida por analista visível, empilhada) */
function renderGeralResumo(){
  const days=periodDays();
  // inclui quem estava ativo em qualquer dia do período (usa o último dia como corte)
  const refIso = days.length?toISO(days[days.length-1]):toISO(refDate);
  const ns=gradeAnalysts(refIso);
  const fer=feriadosMap();
  const todayISO=toISO(new Date());
  // largura mínima por coluna: igual à visão por analista (mês precisa de scroll horizontal)
  const dayW = period==="mes" ? 78 : 0;
  const slotW = 128;
  const tableMin = dayW ? (slotW + dayW*days.length) : 0;
  const tableStyle = tableMin ? `min-width:${tableMin}px;table-layout:fixed` : "table-layout:fixed";
  const colHStyle = dayW ? `min-width:${dayW}px;width:${dayW}px` : "";

  if(!ns.length){
    el("boardHost").innerHTML=`<div class="loading">${gradeProjFilter?("Nenhum analista alocado no projeto <b>"+enc(gradeProjFilter)+"</b> dentro do seu escopo."):"Nenhum analista visível para o seu perfil."}</div>`;
    return;
  }
  // monta um <section> por analista; cada section traz a mesma grade Slot × Dias
  let html="";
  ns.forEach(n=>{
    const l=liderDe(n);
    // cabeçalho do bloco do analista
    let head=`<th class="col-slot slot-h"><div class="sname">Slot</div><div class="stime">Horário</div></th>`;
    days.forEach(d=>{const iso=toISO(d);const isT=iso===todayISO;const fn=fer[iso];const wknd=d.getDay()===0||d.getDay()===6;
      head+=`<th class="day-h${isT?" is-today":""}${fn?" is-holiday":""}" style="${colHStyle}${wknd?';background:#f0f0f0':''}"><div class="dow">${DOW[d.getDay()]}</div><div class="dnum">${fmtDM(d)}</div>${fn?`<div class="ferlabel">⚑ ${fn}</div>`:""}</th>`;});
    // corpo: SLOTS × dias (idêntico à visão Por Analista, mas com data-nome=N)
    let body="";
    SLOTS.forEach(s=>{
      if(s.lunch){body+=`<tr class="lunch"><td>·</td><td colspan="${days.length}">Almoço · ${s.time}</td></tr>`;return;}
      body+=`<tr><td class="slot-label"><div class="sname">${s.id}</div><div class="stime mono">${s.time}</div></td>`;
      days.forEach(d=>{const iso=toISO(d);const isT=iso===todayISO;const fn=fer[iso];const wknd=d.getDay()===0||d.getDay()===6;
        const r=DATA[key(n,iso,s.id)];const cat=categoria(r);
        let inner, locked=false;
        if(cat!=="empty" && foraDoEscopoAtual(r)){inner=chipForaEscopoHTML("chip");locked=true;}
        else if(cat!=="empty")inner=chipHTML(cat,r,"chip",key(n,iso,s.id));
        else if(fn)inner=`<div class="chip c-aus"><span class="cli">${fn}</span><span class="atv">Feriado</span></div>`;
        else inner=`<div class="chip empty"><span class="plus">+</span></div>`;
        inner=_decorarPrevisto(n,iso,s.id,inner,cat,fn,locked,"chip");
        body+=`<td class="cell${isT?" is-today-col":""}${fn?" is-holiday-col":""}${wknd?" wknd":""}${locked?" locked":""}" data-nome="${enc(n)}" data-iso="${iso}" data-slot="${s.id}"${locked?' data-locked="1"':""}>${inner}</td>`;
      });
      body+=`</tr>`;
    });
    html+=`<section class="analyst-block">
      <div class="analyst-header">
        <span class="gav" style="background:${colorFor(n)}">${(n[0]||'?').toUpperCase()}</span>
        <div><div class="an-nome">${enc(n)}</div>${l?`<div class="an-lider">Líder: ${enc(l)}</div>`:""}${squadDe(n)?`<div class="an-squad">${squadChipHTML(squadDe(n),true)}</div>`:""}</div>
      </div>
      <div class="board" style="overflow:auto"><table style="${tableStyle}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
    </section>`;
  });
  el("boardHost").innerHTML=html;
  // clique em qualquer célula abre o modal de alocação para o analista correto
  // (na visão Geral, openAlloc pede confirmação antes de editar — escolha do produto)
}

/* ---- Visão COMPACTA por projeto: só os analistas e slots do projeto filtrado ----
   Acionada quando o filtro "Projetos" da Grade está ativo. Ignora o layout de
   calendário (período/visão) e lista, por analista, apenas as células onde o
   projeto aparece — em qualquer data. Analistas sem o projeto não aparecem. */
function renderGradeProjetoCompacta(){
  const host=el("boardHost"); if(!host) return;
  const proj=gradeProjFilter;
  // A visão varre todo o histórico; em modo janela, garante que o DATA está completo.
  if(ALLOC_WINDOWED_READ && !_histCompleto){
    host.innerHTML=`<div class="loading">Carregando histórico completo do projeto…</div>`;
    _garantirHistoricoCompleto().then(()=>{ if(gradeProjFilter===proj) renderBoard(); });
    return;
  }
  const cells=gradeProjetoCells(proj);
  if(!cells.length){
    host.innerHTML=`<div class="proj-compact"><div class="pc-empty">
      <i data-lucide="folder-search" style="width:30px;height:30px;opacity:.5"></i><br>
      Nenhuma alocação do projeto <b>${enc(proj)}</b> dentro do seu escopo.</div></div>`;
    lucideRefresh(); return;
  }
  // agrupa por analista (cells já vem ordenado por analista→data→slot)
  const porAnalista=new Map();
  cells.forEach(c=>{ if(!porAnalista.has(c.nome)) porAnalista.set(c.nome,[]); porAnalista.get(c.nome).push(c); });
  const anoAtual=new Date().getFullYear();
  let blocos="";
  porAnalista.forEach((lista,nome)=>{
    const l=liderDe(nome), sq=squadDe(nome);
    let chips="";
    lista.forEach(c=>{
      const d=parseISO(c.iso);
      const ano=d.getFullYear();
      const dataLbl=`<span class="dow">${DOW[d.getDay()]}</span> ${fmtDM(d)}${ano!==anoAtual?("/"+String(ano).slice(2)):""}`;
      const cat=categoria(c.r);
      chips+=`<button type="button" class="pc-cell" data-nome="${enc(nome)}" data-iso="${c.iso}" data-slot="${enc(c.slot)}">
        <div class="pc-cell-when">${dataLbl} · <b>${enc(c.slot)}</b></div>
        ${chipHTML(cat,c.r,"gchip",key(nome,c.iso,c.slot))}
      </button>`;
    });
    blocos+=`<section class="pc-analyst">
      <div class="pc-an-head">
        <span class="gav" style="background:${colorFor(nome)}">${(nome[0]||'?').toUpperCase()}</span>
        <div class="pc-an-info">
          <div class="pc-an-nome">${enc(nome)}</div>
          <div class="pc-an-sub">${l?`Líder: ${enc(l)}`:""}${l&&sq?" · ":""}${sq?squadChipHTML(sq,true):""}</div>
        </div>
        <div class="pc-an-count">${lista.length} ${lista.length===1?"slot":"slots"}</div>
      </div>
      <div class="pc-cells">${chips}</div>
    </section>`;
  });
  host.innerHTML=`<div class="proj-compact">
    <div class="pc-head">
      <div class="pc-title"><i data-lucide="folder-kanban"></i>Projeto: <b>${enc(proj)}</b></div>
      <div class="pc-meta">${porAnalista.size} ${porAnalista.size===1?"analista":"analistas"} · ${cells.length} ${cells.length===1?"alocação":"alocações"}</div>
    </div>
    <div class="pc-note">Mostrando todas as alocações deste projeto (todas as datas). A navegação de período não se aplica neste modo — limpe o filtro para voltar à grade.</div>
    ${blocos}
  </div>`;
  lucideRefresh();
}

/* Fase 2 — delegação de evento única no #boardHost. O host é estável (só o innerHTML
   muda entre renders), então UM listener no container cobre todas as células de todas
   as visões (.cell, .gcell, .pc-cell) sem reanexar milhares de handlers a cada render.
   closest() trata também cliques nos elementos-filho (chips) dentro da célula. */
let _boardDelegationInstalled=false;
function _ensureBoardDelegation(){
  if(_boardDelegationInstalled) return;
  const host=el("boardHost"); if(!host) return;
  host.addEventListener("click",ev=>{
    const c=ev.target.closest(".cell,.gcell,.pc-cell");
    if(!c || !host.contains(c)) return;
    if(c.dataset.locked) return; // .pc-cell nunca tem data-locked → no-op seguro
    openAlloc(dec(c.dataset.nome), c.dataset.iso, c.dataset.slot);
  });
  _boardDelegationInstalled=true;
}
function renderBoard(){
  _ensureBoardDelegation();
  if(gradeProjFilter){ renderGradeProjetoCompacta(); return; }
  if(viewMode==="geral"){ if(period==="dia")renderGeralDia(); else renderGeralResumo(); }
  else renderBoardAnalista();
}
/* Corpo síncrono do render. Não chamar diretamente em fluxos normais — use renderAll()
   (que coalesce múltiplas chamadas em um único frame). Disponível para casos pontuais
   que precisem do DOM já atualizado no mesmo tick. */
function _renderAllNow(){if(ALLOC_WINDOWED_READ){try{_carregarJanela(mesesVisiveis());}catch(e){}}try{_carregarJanelaPrev(mesesVisiveis());}catch(e){}try{_carregarAtasJanela(mesesVisiveis());}catch(e){}renderControls();renderHeader();renderStats();renderBoard();updateVersionLabel();try{renderHome();}catch(e){}lucideRefresh();}
// Carrega as atas dos meses visíveis (uma vez por mês) e re-renderiza só o board
// quando chegar dado novo, para os indicadores aparecerem sem recarregar tudo.
function _carregarAtasJanela(meses){
  if(!_db || !Array.isArray(meses)) return;
  const faltam=meses.filter(m=>!_atasMeses[m]);
  if(!faltam.length) return;
  Promise.all(faltam.map(m=>_carregarAtasMes(m))).then(()=>{ try{ renderBoard(); }catch(e){} });
}
/* Coalescência: uma rajada de chamadas (carga inicial de buckets, child_changed em
   sequência, re-entrância via _carregarJanela) vira um único render por frame.
   Maior ganho de performance da Fase 1. */
let _renderAllPending=false;
function renderAll(){
  if(_renderAllPending) return;
  _renderAllPending=true;
  const run=()=>{ _renderAllPending=false; try{ _renderAllNow(); }catch(e){ console.warn("[render] renderAll:",e); } };
  if(typeof requestAnimationFrame==="function") requestAnimationFrame(run);
  else setTimeout(run,16);
}

/* ===================== ROTEADOR DE TELAS (Fase 1) =====================
   Home (Visão geral) é o landing; a Grade passa a ser uma tela/ação.
   Demais telas (Esteira, Discovery, Relatórios, KPIs, Ações) seguem como
   overlays nesta fase — abertas pelos seus handlers atuais. */
let telaAtual = "home";
let torreView = "panorama";
function setActiveNav(t){
  try{ document.querySelectorAll(".sb-link[data-nav]").forEach(l=>l.classList.toggle("active", l.dataset.nav===t)); }catch(e){}
}
/* Telas-página são mutuamente exclusivas: abrir uma fecha as outras (uma por vez). */
function _fecharOutrasTelas(exceto){
  ["esteiraOverlay","discoveryOverlay","repOverlay","kpiOverlay","actOverlay","atasOverlay"].forEach(function(id){
    if(id!==exceto){ try{ var o=el(id); if(o) o.classList.remove("open"); }catch(e){} }
  });
}
function irPara(t){
  const m = el("appMain"); if(!m) return;
  if(!["home","grade","torre","esteira","discovery"].includes(t)) t = "home";
  // Guarda de permissão: telas que são "ações" exigem pelo menos leitura.
  // Bloqueia acesso direto (atalho, histórico, chamada por código) a quem não tem acesso.
  if(t!=="home" && !canViewAction(t)){
    try{ toast && toast("Você não tem acesso a esta ação."); }catch(e){}
    t = "home";
  }
  // fecha as páginas-overlay sempre que navega
  _fecharOutrasTelas(t==="esteira"?"esteiraOverlay":(t==="discovery"?"discoveryOverlay":null));
  m.dataset.screen = t; // 'esteira'/'discovery' deixam o appMain vazio atrás da página-overlay
  if(t === "grade"){ try{ ensureCapIntegration(); }catch(e){} }
  if(t === "home"){ try{ renderHome(); }catch(e){} }
  else if(t === "torre"){ try{ renderTorre(); }catch(e){} }
  else if(t === "esteira"){ try{ openEsteira(); }catch(e){ console.warn("[nav] esteira:",e); } }
  else if(t === "discovery"){ try{ openDiscovery(); }catch(e){ console.warn("[nav] discovery:",e); } }
  telaAtual = t;
  setActiveNav(t);
  try{ window.scrollTo(0,0); }catch(e){}
}
/* Torre de Controle: consolida os dashboards de Esteira e Discovery (Fase 2).
   Reaproveita renderEsteiraDashboard/renderDiscoveryDashboard via host parametrizado. */
function irTorre(v){
  if(torreView !== v) _marcarTorrePendente();
  torreView = v;
  const tabs = el("torreTabs");
  if(tabs) tabs.querySelectorAll("button").forEach(b=>b.classList.toggle("on", b.dataset.tv===v));
  renderTorre();
}
function renderTorre(){
  const host = el("torreBody"); if(!host) return;
  if(torreView === "esteira"){
    host.innerHTML = _torreFiltroHtml() + `<div id="torreEstHost"></div>`;
    if(!torreEstFiltroAplicado){ el("torreEstHost").innerHTML = _htmlSobDemanda("Escolha o período e clique em <b>Aplicar Filtro</b> para carregar o dashboard da Esteira somente com os projetos que possuem datas no período selecionado."); lucideRefresh(); return; }
    try{ renderEsteiraDashboard(el("torreEstHost")); }catch(e){ console.warn("[torre] esteira:",e); }
  } else if(torreView === "discovery"){
    host.innerHTML = _torreFiltroHtml() + `<div id="torreDscHost"></div>`;
    if(!torreDscFiltroAplicado){ el("torreDscHost").innerHTML = _htmlSobDemanda("Escolha o período e clique em <b>Aplicar Filtro</b> para carregar a Linha do Tempo Discovery somente com recebimentos no período selecionado."); lucideRefresh(); return; }
    try{ renderDiscoveryDashboard(el("torreDscHost")); }catch(e){ console.warn("[torre] discovery:",e); }
  } else if(torreView === "alertas"){
    host.innerHTML = _torreFiltroHtml() + `<div id="torreAlertHost"></div>`;
    if(!_torreProntaParaRender()){ el("torreAlertHost").innerHTML = _htmlSobDemanda("Escolha o período e clique em <b>Aplicar Filtro</b> para carregar somente as alocações necessárias para Alertas."); lucideRefresh(); return; }
    try{ renderTorreAlertas(el("torreAlertHost")); }catch(e){ console.warn("[torre] alertas:",e); }
  } else if(torreView === "alertasDetalhados"){
    host.innerHTML = _torreFiltroHtml() + `<div id="torreAlertHost"></div>`;
    if(!_torreProntaParaRender()){ el("torreAlertHost").innerHTML = _htmlSobDemanda("Escolha o período e clique em <b>Aplicar Filtro</b> para carregar somente as alocações necessárias para Alertas detalhados."); lucideRefresh(); return; }
    try{ renderTorreAlertasDetalhados(el("torreAlertHost")); }catch(e){ console.warn("[torre] alertas detalhados:",e); }
  } else if(torreView === "aderencia"){
    host.innerHTML = _torreFiltroHtml() + `<div id="torreAderenciaHost"></div>`;
    if(!_torreProntaParaRender()){ el("torreAderenciaHost").innerHTML = _htmlSobDemanda("Escolha o período e clique em <b>Aplicar Filtro</b> para carregar realizado e previsto somente dos buckets necessários para Aderência."); lucideRefresh(); return; }
    try{ renderTorreAderencia(el("torreAderenciaHost")); }catch(e){ console.warn("[torre] previsto x realizado:",e); }
  } else {
    host.innerHTML =
      `<div class="torre-section"><div class="torre-section-h"><i data-lucide="route"></i>Esteira de projetos</div><div id="torreEstHost"></div></div>`+
      `<div class="torre-section"><div class="torre-section-h"><i data-lucide="search"></i>Linha do tempo · Discovery</div><div id="torreDscHost"></div></div>`+
      `<div class="torre-section"><div class="torre-section-h"><i data-lucide="git-compare-arrows"></i>BI · Previsto × Realizado</div><div id="torreAderenciaHost"></div></div>`+
      `<div class="torre-section"><div class="torre-section-h"><i data-lucide="shield-alert"></i>Alertas operacionais</div><div id="torreAlertHost"></div></div>`;
    if(torreEstFiltroAplicado){ try{ renderEsteiraDashboard(el("torreEstHost")); }catch(e){ console.warn("[torre] esteira:",e); } }
    else el("torreEstHost").innerHTML = _htmlSobDemanda("Abra a aba Esteira, escolha o período e clique em <b>Aplicar Filtro</b>.");
    if(torreDscFiltroAplicado){ try{ renderDiscoveryDashboard(el("torreDscHost")); }catch(e){ console.warn("[torre] discovery:",e); } }
    else el("torreDscHost").innerHTML = _htmlSobDemanda("Abra a aba Discovery, escolha o período e clique em <b>Aplicar Filtro</b>.");
    el("torreAderenciaHost").innerHTML = _htmlSobDemanda("Abra a aba BI Previsto × Realizado V2, escolha o período e clique em <b>Aplicar Filtro</b>.");
    el("torreAlertHost").innerHTML = _htmlSobDemanda("Abra a aba Alertas, escolha o período e clique em <b>Aplicar Filtro</b>.");
  }
  lucideRefresh();
}

let torreAlertDe="", torreAlertAte="", torreAlertCrit="todos";
let torreEstDe="", torreEstAte="", torreEstFiltroAplicado=false;
let torreDscDe="", torreDscAte="", torreDscFiltroAplicado=false;
function _torreAlertInitPeriodo(){
  if(torreAlertDe && torreAlertAte) return;
  const hoje=new Date();
  torreAlertDe=toISO(hoje);
  torreAlertAte=toISO(addDays(hoje,45));
}
function _torreAlertDateLabel(iso){
  if(!iso)return "—";
  try{const d=parseISO(iso);return fmtDM(d)+"/"+d.getFullYear();}catch(e){return iso;}
}
function _torreDiasAte(iso){
  try{
    const hoje=parseISO(toISO(new Date()));
    const alvo=parseISO(iso);
    return Math.round((alvo-hoje)/86400000);
  }catch(e){ return 9999; }
}
function _torreDataEtapaProjeto(p,e){
  if(!p||!e)return "";
  /* Regra oficial da Torre:
     - Go-Live usa a coluna Go-Live realizado.
     - Demais etapas usam a data prevista da própria etapa. */
  return e.id==="golive" ? (p.goLiveRealizado||"") : (p[e.field]||"");
}
function _torreIsDiaUtil(iso){
  if(!iso)return false;
  const d=parseISO(iso);
  const wd=d.getDay();
  if(wd===0||wd===6)return false;
  return !feriadosMap()[iso];
}
function _torreProximaEtapa(ev){
  const p=ev.projeto;
  const idx=ETAPAS.findIndex(e=>e.id===ev.etapa.id);
  if(idx<0)return null;
  for(let i=idx+1;i<ETAPAS.length;i++){
    const e=ETAPAS[i];
    const iso=_torreDataEtapaProjeto(p,e);
    if(iso && iso>ev.iso) return {etapa:e,iso};
  }
  return null;
}
function _torrePeriodoEtapa(ev){
  const inicio=ev.iso;
  const prox=_torreProximaEtapa(ev);
  let fim=inicio;
  if(prox&&prox.iso>inicio){
    fim=toISO(addDays(parseISO(prox.iso),-1));
  }
  const dias=[];
  let d=parseISO(inicio), lim=parseISO(fim);
  while(d<=lim){
    const iso=toISO(d);
    if(_torreIsDiaUtil(iso))dias.push(iso);
    d=addDays(d,1);
  }
  /* Se a etapa cair em fim de semana/feriado e não houver dia útil no intervalo,
     mantém necessidade mínima 1 para não deixar a data sem validação. */
  if(!dias.length && inicio) dias.push(inicio);
  return {inicio,fim,proxima:prox,diasUteis:dias,necessarios:dias.length};
}
function _torreAlocacoesProjetoPeriodo(projetoNome, dias){
  const setDias=new Set(dias||[]);
  const alocs=[];
  Object.keys(DATA||{}).forEach(k=>{
    const parts=k.split("__");
    if(parts.length<3) return;
    const analista=parts[0], data=parts[1], slot=parts.slice(2).join("__");
    if(!setDias.has(data)) return;
    const reg=DATA[k];
    if(!reg || reg.cliente!==projetoNome) return;
    alocs.push({analista,data,slot,reg});
  });
  return alocs;
}
function _torreResumoAlocacoesProjetoPeriodo(alocs){
  const porDia={};
  (alocs||[]).forEach(a=>{
    if(!porDia[a.data]) porDia[a.data]=[];
    porDia[a.data].push(`${a.analista}: ${_torreSlotNome(a.slot)}`);
  });
  return Object.keys(porDia).sort().map(d=>`${_torreAlertDateLabel(d)}: ${porDia[d].join(", ")}`).join(" | ");
}
function _torreClassificarAlerta(ev, alocs, conflitos, periodo){
  const dias=_torreDiasAte(ev.iso);
  const diasCobertos=new Set((alocs||[]).map(a=>a.data)).size;
  const slots=(alocs||[]).length;
  const necessarios=(periodo&&periodo.necessarios)||1;
  if((conflitos||[]).length) return {criticidade:"crit", tipo:"Conflito de slot", dias, diasCobertos, slots, necessarios, motivo:"Existe sobreposição no mesmo analista, mesma data e mesmo slot."};
  if(!diasCobertos){
    if(dias<=7) return {criticidade:"crit", tipo:"Sem cobertura", dias, diasCobertos, slots, necessarios, motivo:`Etapa sem nenhum dia coberto no período. Necessário: ${necessarios} dia(s) útil(eis) com ao menos 1 slot por dia.`};
    if(dias<=20) return {criticidade:"warn", tipo:"Atenção 20 dias", dias, diasCobertos, slots, necessarios, motivo:`Etapa sem cobertura na grade dentro da janela preventiva de 20 dias. Necessário: ${necessarios} dia(s) útil(eis) com ao menos 1 slot por dia.`};
    if(dias<=45) return {criticidade:"plan", tipo:"Planejamento", dias, diasCobertos, slots, necessarios, motivo:`Etapa futura sem cobertura definida. Necessário previsto: ${necessarios} dia(s) útil(eis) com ao menos 1 slot por dia.`};
    return {criticidade:"plan", tipo:"Planejamento", dias, diasCobertos, slots, necessarios, motivo:`Etapa futura sem cobertura definida. Necessário previsto: ${necessarios} dia(s) útil(eis) com ao menos 1 slot por dia.`};
  }
  if(diasCobertos<necessarios){
    return {criticidade:"warn", tipo:"Cobertura parcial", dias, diasCobertos, slots, necessarios, motivo:`Cobertura parcial da etapa: ${diasCobertos}/${necessarios} dia(s) útil(eis) coberto(s). A regra mínima é 1 slot por dia útil do período.`};
  }
  return {criticidade:"ok", tipo:"Coberto", dias, diasCobertos, slots, necessarios, motivo:`Projeto possui cobertura mínima da etapa: ${diasCobertos}/${necessarios} dia(s) útil(eis) coberto(s).`};
}
function _torreCritLabel(c){
  return c==="crit"?"Crítico":c==="warn"?"Atenção":c==="plan"?"Planejamento":"OK";
}
function _torreIsProjetoOperacional(p){
  const t=(p&&p.tipo)||"implantacao";
  return t!=="interna" && t!=="ausencia" && t!=="service" && isAtivo(p);
}
function _torreIsProjetoNome(nome){
  if(!nome||nome==="Livre")return false;
  const p=(REG.projetos||[]).find(x=>x.nome===nome);
  return !!(p && _torreIsProjetoOperacional(p));
}
function _torreEventosEsteira(){
  const de=torreAlertDe||"0000-00-00", ate=torreAlertAte||"9999-99-99";
  const eventos=[];
  (REG.projetos||[]).filter(_torreIsProjetoOperacional).forEach(p=>{
    ETAPAS.forEach(e=>{
      let iso="", origem="";
      /* Regra da Torre de Controle:
         - Demais etapas: considera somente o campo de data preenchido da etapa.
         - Go-Live: considera exclusivamente a coluna Go-Live realizado.
         A cobertura/conflito é sempre apurada pela grade de alocações (DATA),
         nunca pelo campo analistas do cadastro do projeto. */
      iso=_torreDataEtapaProjeto(p,e);
      origem=e.id==="golive"?"Realizado":"Previsto";
      if(!iso || iso<de || iso>ate) return;
      eventos.push({projeto:p, etapa:e, iso, origem});
    });
  });
  return eventos.sort((a,b)=>(a.iso>b.iso?1:a.iso<b.iso?-1:0)||(a.projeto.nome||"").localeCompare(b.projeto.nome||""));
}
function _torreSlotsAnalistaDia(analista, iso){
  const work=SLOTS.filter(s=>!s.lunch);
  return work.map(s=>({slot:s.id, reg:DATA[key(analista, iso, s.id)]})).filter(x=>x.reg&&x.reg.cliente&&x.reg.cliente!=="Livre");
}
function _torreAlocacoesProjetoDia(projetoNome, iso){
  const alocs=[];
  Object.keys(DATA||{}).forEach(k=>{
    const parts=k.split("__");
    if(parts.length<3) return;
    const analista=parts[0], data=parts[1], slot=parts.slice(2).join("__");
    if(data!==iso) return;
    const reg=DATA[k];
    if(!reg || reg.cliente!==projetoNome) return;
    alocs.push({analista, slot, reg});
  });
  return alocs;
}
function _torreAnalistasAlocadosProjetoDia(projetoNome, iso){
  return [...new Set(_torreAlocacoesProjetoDia(projetoNome, iso).map(a=>a.analista).filter(Boolean))];
}
function _torreSlotNome(slotId){
  const s=(SLOTS||[]).find(x=>x.id===slotId);
  if(!s) return slotId || "—";
  const nome=s.nome||s.name||s.label||s.id||slotId||"Slot";
  return `${nome}${s.time?" ("+s.time+")":""}`;
}
function _torreResumoAlocacoesProjetoDia(projetoNome, iso){
  const alocs=_torreAlocacoesProjetoDia(projetoNome, iso);
  const porAnalista={};
  alocs.forEach(a=>{
    if(!porAnalista[a.analista]) porAnalista[a.analista]=[];
    porAnalista[a.analista].push(a.slot);
  });
  return Object.keys(porAnalista).sort().map(an=>`${an}: ${porAnalista[an].map(_torreSlotNome).join(", ")}`).join(" | ");
}
function _torreConflitosMesmoSlotProjetoDia(projetoNome, iso){
  /* Regra corrigida:
     A grade de alocações é a fonte oficial e cada alocação ocupa um único slot.
     É permitido o mesmo analista atender projetos/clientes diferentes no mesmo dia,
     desde que em slots diferentes. Portanto, NÃO é conflito apenas existir outro
     projeto no mesmo dia.

     Como a estrutura DATA é chaveada por analista + data + slot, só haveria conflito
     real se a mesma chave trouxesse mais de um projeto operacional. No modelo atual
     isso não deve ocorrer, pois cada chave guarda um único registro; mantemos a
     função retornando vazio para impedir falso positivo por dia. */
  return [];
}
function gerarAlertasTorre(){
  const linhas=[];
  _torreEventosEsteira().forEach(ev=>{
    const p=ev.projeto, dataFmt=_torreAlertDateLabel(ev.iso);
    const periodo=_torrePeriodoEtapa(ev);
    const alocs=_torreAlocacoesProjetoPeriodo(p.nome, periodo.diasUteis);
    const analistas=[...new Set(alocs.map(a=>a.analista).filter(Boolean))];
    const resumoSlots=_torreResumoAlocacoesProjetoPeriodo(alocs);
    const conflitos=[]; /* DATA é chaveada por analista + data + slot; outros slots no dia são permitidos. */
    const cls=_torreClassificarAlerta(ev, alocs, conflitos, periodo);
    const diasTxt=cls.dias<0?`${Math.abs(cls.dias)} dia(s) em atraso`:`faltam ${cls.dias} dia(s)`;
    const proxTxt=periodo.proxima?` Próxima etapa: ${periodo.proxima.etapa.label} em ${_torreAlertDateLabel(periodo.proxima.iso)}.`:"";
    const periodoTxt=`Período analisado: ${_torreAlertDateLabel(periodo.inicio)} até ${_torreAlertDateLabel(periodo.fim)}.${proxTxt}`;

    if(!alocs.length){
      const acao=cls.criticidade==="crit"
        ? "Ação imediata: alocar ao menos 1 slot por dia útil do período da etapa ou revisar as datas da esteira."
        : cls.criticidade==="warn"
          ? "Planejar alocação antes da execução para evitar que o alerta vire crítico."
          : "Acompanhar no planejamento de capacidade e reservar agenda antes da janela de 20 dias.";
      linhas.push({criticidade:cls.criticidade, tipo:cls.tipo, projeto:p.nome, cliente:p.gp||"—", etapa:ev.etapa.label, data:ev.iso, dataFmt, periodo:`${periodo.inicio} a ${periodo.fim}`, dias:cls.dias, necessarios:cls.necessarios, cobertos:cls.diasCobertos, slots:cls.slots, analista:"—", detalhe:`${cls.motivo} ${periodoTxt} ${diasTxt}.`, acao});
      return;
    }

    if(cls.criticidade==="warn"){
      linhas.push({criticidade:"warn", tipo:cls.tipo, projeto:p.nome, cliente:p.gp||"—", etapa:ev.etapa.label, data:ev.iso, dataFmt, periodo:`${periodo.inicio} a ${periodo.fim}`, dias:cls.dias, necessarios:cls.necessarios, cobertos:cls.diasCobertos, slots:cls.slots, analista:analistas.join(", "), detalhe:`${cls.motivo} ${periodoTxt} Slots encontrados: ${cls.slots}. ${resumoSlots?"Alocações: "+resumoSlots+". ":""}${diasTxt}.`, acao:"Reforçar a grade para cobrir os dias úteis faltantes da etapa."});
      return;
    }

    linhas.push({criticidade:"ok", tipo:"Coberto", projeto:p.nome, cliente:p.gp||"—", etapa:ev.etapa.label, data:ev.iso, dataFmt, periodo:`${periodo.inicio} a ${periodo.fim}`, dias:cls.dias, necessarios:cls.necessarios, cobertos:cls.diasCobertos, slots:cls.slots, analista:analistas.join(", "), detalhe:`${cls.motivo} ${periodoTxt} Slots encontrados: ${cls.slots}. ${resumoSlots?"Alocações: "+resumoSlots+". ":""}Alocações do mesmo analista em outros slots do dia são permitidas.`, acao:"Sem ação necessária."});
  });
  return linhas;
}
function _torreAlertResumo(r){
  const nec=Number(r.necessarios)||0, cob=Number(r.cobertos)||0;
  if(r.criticidade==="crit") return r.tipo==="Conflito de slot" ? "Conflito" : "Sem alocação";
  if(r.criticidade==="warn") return cob>0 ? `Faltam ${Math.max(nec-cob,0)} dia(s)` : "Sem cobertura";
  if(r.criticidade==="plan") return "Planejar agenda";
  return `Cobertura ${nec?Math.min(100,Math.round((cob/nec)*100)):100}%`;
}
function _torreAlertPct(r){
  const nec=Number(r.necessarios)||0, cob=Number(r.cobertos)||0;
  return nec?Math.min(100,Math.round((cob/nec)*100)):100;
}
function _torreAlertRowButton(idx){
  return `<button class="alert-detail-btn" onclick="abrirDetalheAlertaTorre(${idx})"><i data-lucide="eye"></i>Ver detalhes</button>`;
}
function _torreAlertRenderKpis(todas){
  const crit=todas.filter(r=>r.criticidade==="crit").length, warn=todas.filter(r=>r.criticidade==="warn").length, plan=todas.filter(r=>r.criticidade==="plan").length, ok=todas.filter(r=>r.criticidade==="ok").length;
  const proximos20=todas.filter(r=>r.criticidade!=="ok" && Number(r.dias)>=0 && Number(r.dias)<=20).length;
  const goLives20=todas.filter(r=>r.etapa==="Go-Live" && Number(r.dias)>=0 && Number(r.dias)<=20).length;
  const reqTotal=todas.reduce((a,r)=>a+(Number(r.necessarios)||0),0);
  const cobTotal=todas.reduce((a,r)=>a+(Number(r.cobertos)||0),0);
  const coberturaPct=reqTotal?Math.round((cobTotal/reqTotal)*100):100;
  return `<div class="alert-kpis">
      <div class="alert-card crit"><div class="l">Crítico</div><div class="n">${crit}</div><div class="s">Até 7 dias sem cobertura no período</div></div>
      <div class="alert-card warn"><div class="l">Atenção</div><div class="n">${warn}</div><div class="s">Até 20 dias ou cobertura parcial</div></div>
      <div class="alert-card plan"><div class="l">Planejamento</div><div class="n">${plan}</div><div class="s">21 a 45 dias sem cobertura definida</div></div>
      <div class="alert-card ok"><div class="l">Cobertos</div><div class="n">${ok}</div><div class="s">Etapas com dias úteis cobertos</div></div>
      <div class="alert-card info"><div class="l">Próximos 20 dias</div><div class="n">${proximos20}</div><div class="s">Alertas preventivos dentro da janela</div></div>
      <div class="alert-card info"><div class="l">Go-Lives 20 dias</div><div class="n">${goLives20}</div><div class="s">Go-Lives realizados/previstos na janela</div></div>
      <div class="alert-card ok"><div class="l">Cobertura etapas</div><div class="n">${coberturaPct}%</div><div class="s">Dias úteis cobertos x previstos</div></div>
    </div>`;
}
function _torreAlertRenderFiltros(){
  return `<div class="alert-filters">
        <div class="f"><label>De</label><input type="date" id="torreAlertDe" value="${enc(torreAlertDe)}"></div>
        <div class="f"><label>Até</label><input type="date" id="torreAlertAte" value="${enc(torreAlertAte)}"></div>
        <div class="f"><label>Criticidade</label><select id="torreAlertCrit"><option value="todos" ${torreAlertCrit==="todos"?"selected":""}>Todos</option><option value="crit" ${torreAlertCrit==="crit"?"selected":""}>Crítico</option><option value="warn" ${torreAlertCrit==="warn"?"selected":""}>Atenção</option><option value="plan" ${torreAlertCrit==="plan"?"selected":""}>Planejamento</option><option value="ok" ${torreAlertCrit==="ok"?"selected":""}>OK</option></select></div>
        <div class="spacer"></div><button class="btn" onclick="exportarAlertasTorre()"><i data-lucide="download"></i>Exportar CSV</button>
      </div>`;
}
function _torreAlertBindFiltros(host, detalhado){
  const de=el("torreAlertDe"), ate=el("torreAlertAte"), critSel=el("torreAlertCrit");
  const rerender=()=>detalhado?renderTorreAlertasDetalhados(host):renderTorreAlertas(host,false);
  if(de)de.onchange=()=>{torreAlertDe=de.value;rerender();};
  if(ate)ate.onchange=()=>{torreAlertAte=ate.value;rerender();};
  if(critSel)critSel.onchange=()=>{torreAlertCrit=critSel.value;rerender();};
}
function abrirDetalheAlertaTorre(idx){
  const rows=gerarAlertasTorre().filter(r=>torreAlertCrit==="todos" || r.criticidade===torreAlertCrit);
  const r=rows[idx]; if(!r) return;
  let ov=el("torreAlertDetailOverlay");
  if(!ov){
    ov=document.createElement("div"); ov.id="torreAlertDetailOverlay"; ov.className="overlay";
    ov.innerHTML=`<div class="modal" style="max-width:760px"><div class="modal-h"><div><div class="t"><i data-lucide="shield-alert"></i>Detalhes do alerta</div><div class="s">Análise da cobertura da etapa pela grade de alocações</div></div><button class="x" onclick="fecharDetalheAlertaTorre()"><i data-lucide="x"></i></button></div><div class="modal-b" id="torreAlertDetailBody"></div><div class="modal-f"><button class="btn primary" onclick="fecharDetalheAlertaTorre()">Fechar</button></div></div>`;
    document.body.appendChild(ov);
  }
  const body=el("torreAlertDetailBody");
  if(body) body.innerHTML=`<div class="alert-modal-body">
    <div class="alert-modal-item"><div class="k">Criticidade</div><div class="v"><span class="alert-badge ${r.criticidade}">${_torreCritLabel(r.criticidade)}</span> ${enc(r.tipo||"")}</div></div>
    <div class="alert-modal-item"><div class="k">Projeto</div><div class="v"><b>${enc(r.projeto||"—")}</b><br><span style="color:var(--fn-faint)">GP: ${enc(r.cliente||"—")}</span></div></div>
    <div class="alert-modal-item"><div class="k">Etapa/Data</div><div class="v">${enc(r.etapa||"—")}<br><span class="mono">${enc(r.dataFmt||r.data||"—")}</span></div></div>
    <div class="alert-modal-item"><div class="k">Período</div><div class="v mono">${enc(r.periodo||"—")}</div></div>
    <div class="alert-modal-item"><div class="k">Cobertura</div><div class="v"><b>${enc(String(r.cobertos||0))}/${enc(String(r.necessarios||0))}</b> dia(s) útil(eis)<br>${enc(String(r.slots||0))} slot(s) encontrado(s)</div></div>
    <div class="alert-modal-item"><div class="k">Analistas alocados</div><div class="v">${enc(r.analista||"—")}</div></div>
    <div class="alert-modal-item full"><div class="k">Descrição completa</div><div class="v">${enc(r.detalhe||"—")}</div></div>
    <div class="alert-modal-item full"><div class="k">Ação recomendada</div><div class="v">${enc(r.acao||"—")}</div></div>
  </div>`;
  ov.classList.add("open"); lucideRefresh();
}
function fecharDetalheAlertaTorre(){ const ov=el("torreAlertDetailOverlay"); if(ov) ov.classList.remove("open"); }
function renderTorreAlertasDetalhados(host){
  if(!host)return;
  _torreAlertInitPeriodo();
  const todas=gerarAlertasTorre();
  const filtradas=todas.filter(r=>torreAlertCrit==="todos" || r.criticidade===torreAlertCrit);
  const linhaHtml=filtradas.map((r,i)=>{
    const pct=_torreAlertPct(r);
    return `<tr>
      <td><span class="alert-badge ${r.criticidade}">${_torreCritLabel(r.criticidade)}</span><div class="sub">${enc(r.tipo)}</div></td>
      <td><div class="nm">${enc(r.projeto)}</div><div class="sub">GP: ${enc(r.cliente||"—")}</div></td>
      <td>${enc(r.etapa)}<div class="sub mono">${enc(r.dataFmt)}</div><div class="sub">${enc(r.periodo||"")}</div></td>
      <td><b>${enc(String(r.cobertos||0))}/${enc(String(r.necessarios||0))}</b><div class="alert-progress ${r.criticidade}"><i style="width:${pct}%"></i></div><div class="sub">${enc(String(r.slots||0))} slot(s)</div></td>
      <td>${enc(r.analista||"—")}</td>
      <td><div class="alert-desc" title="${enc(r.detalhe||"")}">${enc(r.detalhe||"")}</div></td>
      <td>${_torreAlertRowButton(i)}</td>
    </tr>`;
  }).join("");
  host.innerHTML=`${_torreAlertRenderKpis(todas)}
    <div class="rep-actions"><div class="left"><b>Alertas detalhados</b> · descrição limitada em 2 linhas para manter a tabela compacta.</div><button class="btn sm" onclick="irTorre('alertas')"><i data-lucide="list-filter"></i>Ver visão compacta</button></div>
    ${_torreAlertRenderFiltros()}
    <div class="alert-table-wrap">${filtradas.length?`<table class="alert-table"><thead><tr><th>Criticidade</th><th>Projeto</th><th>Etapa/Data</th><th>Cobertura</th><th>Analista(s)</th><th>Descrição do alerta</th><th>Detalhes</th></tr></thead><tbody>${linhaHtml}</tbody></table>`:`<div class="alert-empty"><i data-lucide="check-circle-2" style="width:30px;height:30px;color:var(--fn-teal);margin-bottom:8px"></i><br>Nenhum alerta encontrado para o filtro selecionado.</div>`}</div>`;
  _torreAlertBindFiltros(host,true); lucideRefresh();
}
function renderTorreAlertas(host, compacto){
  if(!host)return;
  _torreAlertInitPeriodo();
  const todas=gerarAlertasTorre();
  const filtradas=todas.filter(r=>torreAlertCrit==="todos" || r.criticidade===torreAlertCrit);
  const linhaHtml=filtradas.map((r,i)=>{
    const pct=_torreAlertPct(r);
    return `<tr>
      <td><span class="alert-smart ${r.criticidade}">${_torreCritLabel(r.criticidade)} · ${enc(_torreAlertResumo(r))}</span><div class="sub">${enc(r.tipo)}</div></td>
      <td><div class="nm">${enc(r.projeto)}</div><div class="sub">GP: ${enc(r.cliente||"—")}</div></td>
      <td>${enc(r.etapa)}<div class="sub mono">${enc(r.dataFmt)}</div></td>
      <td><b>${enc(String(r.cobertos||0))}/${enc(String(r.necessarios||0))}</b><div class="alert-progress ${r.criticidade}"><i style="width:${pct}%"></i></div><div class="sub">${enc(String(r.slots||0))} slot(s)</div></td>
      <td>${enc(r.analista||"—")}</td>
      <td>${_torreAlertRowButton(i)}</td>
    </tr>`;
  }).join("");
  host.innerHTML=`
    ${_torreAlertRenderKpis(todas)}
    ${compacto?`<div class="rep-actions"><div class="left">Período monitorado: <b>${_torreAlertDateLabel(torreAlertDe)}</b> até <b>${_torreAlertDateLabel(torreAlertAte)}</b> · Atenção com antecedência de 20 dias</div><button class="btn sm" onclick="irTorre('alertas')"><i data-lucide="shield-alert"></i>Ver relatório completo</button></div>`:`
      <div class="rep-actions"><div class="left"><b>Visão compacta</b> · badge inteligente por alerta. Use “Alertas detalhados” para a descrição completa.</div><button class="btn sm" onclick="irTorre('alertasDetalhados')"><i data-lucide="file-text"></i>Alertas detalhados</button></div>
      ${_torreAlertRenderFiltros()}`}
    <div class="alert-table-wrap">${filtradas.length?`<table class="alert-table compact"><thead><tr><th>Alerta</th><th>Projeto</th><th>Etapa/Data</th><th>Cobertura</th><th>Analista(s)</th><th>Detalhes</th></tr></thead><tbody>${linhaHtml}</tbody></table>`:`<div class="alert-empty"><i data-lucide="check-circle-2" style="width:30px;height:30px;color:var(--fn-teal);margin-bottom:8px"></i><br>Nenhum alerta encontrado para o filtro selecionado.</div>`}</div>`;
  if(!compacto) _torreAlertBindFiltros(host,false);
  lucideRefresh();
}

/* Torre de controle · BI Previsto × Realizado
   Cruza a camada PREV (planejado) com DATA (realizado), por analista/data/slot. */
let torreAdDe="", torreAdAte="", torreAdStatus="todos";
function _torreAdInitPeriodo(){
  if(torreAdDe && torreAdAte) return;
  const hoje=new Date();
  torreAdDe=toISO(addDays(hoje,-30));
  torreAdAte=toISO(addDays(hoje,30));
}
function _torreAdLabelStatus(s){
  return ({confirmado:"Confirmado",naoRealizado:"Não realizado",conflito:"Realizado divergente",atividadeDivergente:"Atividade divergente",extra:"Extra",reprogramado:"Reprogramado",planejadoFuturo:"Planejado futuro"})[s]||s;
}
function _torreAdBadgeClass(s){
  if(s==="confirmado") return "ok";
  if(s==="extra"||s==="planejadoFuturo") return "info";
  if(s==="atividadeDivergente"||s==="reprogramado") return "warn";
  return "bad";
}
function _torreAdTemRealizadoMesmoProjetoFora(c, iso, slot, projeto){
  if(!projeto) return false;
  const alvo=_normProj(projeto);
  return Object.keys(DATA||{}).some(k=>{
    const i=k.split("__"); if(i.length<3) return false;
    if(i[0]!==c) return false;
    const dist=Math.abs((new Date(i[1]+"T00:00:00")-new Date(iso+"T00:00:00"))/86400000);
    if(dist>5) return false;
    if(i[1]===iso && i[2]===slot) return false;
    const r=DATA[k]||{};
    return _normProj(r.cliente)===alvo;
  });
}
function _torreAdRows(){
  _torreAdInitPeriodo();
  const hoje=toISO(new Date());
  const keys=new Set([].concat(Object.keys(PREV||{}),Object.keys(DATA||{})));
  const rows=[];
  keys.forEach(k=>{
    const i=k.split("__"); if(i.length<3) return;
    const c=i[0], iso=i[1], slot=i[2];
    if(iso<torreAdDe || iso>torreAdAte) return;
    const prev=PREV[k]||{}, real=DATA[k]||{};
    const temP=_temConteudo(prev), temR=_temConteudo(real);
    if(!temP && !temR) return;
    if(foraDoEscopoAtual(prev) || foraDoEscopoAtual(real)) return;
    // projetoRef = projeto REAL referenciado (ignora "Livre" = atividade sem projeto atribuído).
    const projetoRef = (temP && prev.cliente && prev.cliente!=="Livre") ? prev.cliente
                     : (temR && real.cliente && real.cliente!=="Livre") ? real.cliente : "";
    // Só projetos operacionais reais entram na aderência. "Livre"/sem projeto NÃO é computado
    // (mesma regra dos slots livres: previsto×realizado é métrica de projeto).
    if(!_torreIsProjetoNome(projetoRef)) return;
    let st=statusCelula(c,iso,slot);
    if(st==="previsto"){
      if(iso>=hoje) st="planejadoFuturo";
      else if(_torreAdTemRealizadoMesmoProjetoFora(c,iso,slot,prev.cliente)) st="reprogramado";
      else st="naoRealizado";
    }
    rows.push({analista:c,iso,slot,status:st,temPrev:temP,temReal:temR,prevProj:prev.cliente||"",prevAtv:prev.atividade||"",realProj:real.cliente||"",realAtv:real.atividade||"",projeto:projetoRef});
  });
  return rows.sort((a,b)=>a.iso.localeCompare(b.iso)||a.analista.localeCompare(b.analista,"pt")||a.slot.localeCompare(b.slot));
}
function _torreAdKpis(rows){
  const n=s=>rows.filter(r=>r.status===s).length;
  const previsto=rows.filter(r=>r.temPrev).length;
  const realizado=rows.filter(r=>r.temReal).length;
  const confirmado=n("confirmado"), naoRealizado=n("naoRealizado"), conflito=n("conflito"), extra=n("extra"), atv=n("atividadeDivergente"), reprog=n("reprogramado"), futuro=n("planejadoFuturo");
  const ader=previsto?Math.round((confirmado/previsto)*100):100;
  const desvioBase=previsto+extra;
  const desvio=desvioBase?Math.round(((naoRealizado+conflito+extra+atv+reprog)/desvioBase)*100):0;
  return {previsto,realizado,confirmado,naoRealizado,conflito,extra,atv,reprog,futuro,ader,desvio};
}
function _torreAdAgg(rows, campo){
  const m={};
  rows.forEach(r=>{
    const k=r[campo]||"—"; if(!m[k]) m[k]={nome:k,total:0,previsto:0,confirmado:0,desvios:0};
    m[k].total++; if(r.temPrev)m[k].previsto++; if(r.status==="confirmado")m[k].confirmado++; if(!["confirmado","planejadoFuturo"].includes(r.status))m[k].desvios++;
  });
  return Object.values(m).map(x=>Object.assign(x,{ader:x.previsto?Math.round((x.confirmado/x.previsto)*100):0})).sort((a,b)=>b.desvios-a.desvios||a.nome.localeCompare(b.nome,"pt"));
}
function _torreAdBars(items, tipo){
  const max=Math.max(1,...items.map(x=>tipo==="ader"?x.ader:x.desvios));
  return items.slice(0,10).map(x=>{
    const val=tipo==="ader"?x.ader:x.desvios;
    const w=Math.max(3,Math.round((val/max)*100));
    return `<div class="pvbi-bar"><div class="nm" title="${enc(x.nome)}">${enc(x.nome)}</div><div class="track"><i class="fill" style="width:${w}%"></i></div><div class="num">${tipo==="ader"?val+"%":val}</div></div>`;
  }).join("") || `<div class="alert-empty">Sem dados para o período.</div>`;
}
function _torreAdRenderKpis(k){
  return `<div class="alert-kpis">
    <div class="alert-card info"><div class="l">Previsto</div><div class="n">${k.previsto}</div><div class="s">Slots planejados no período</div></div>
    <div class="alert-card ok"><div class="l">Confirmado</div><div class="n">${k.confirmado}</div><div class="s">Previsto e realizado iguais</div></div>
    <div class="alert-card crit"><div class="l">Não realizado</div><div class="n">${k.naoRealizado}</div><div class="s">Previsto vencido sem execução</div></div>
    <div class="alert-card warn"><div class="l">Divergente</div><div class="n">${k.conflito+k.atv}</div><div class="s">Projeto ou atividade diferente</div></div>
    <div class="alert-card info"><div class="l">Extra</div><div class="n">${k.extra}</div><div class="s">Realizado sem previsão</div></div>
    <div class="alert-card warn"><div class="l">Reprogramado</div><div class="n">${k.reprog}</div><div class="s">Mesmo projeto em outro slot/dia</div></div>
    <div class="alert-card ok"><div class="l">Aderência</div><div class="n">${k.ader}%</div><div class="s">Confirmado ÷ previsto</div></div>
    <div class="alert-card crit"><div class="l">Desvio operacional</div><div class="n">${k.desvio}%</div><div class="s">Desvios ÷ previsto + extras</div></div>
  </div>`;
}
function _torreAdFiltros(){
  return `<div class="alert-filters">
    <div class="f"><label>De</label><input type="date" id="torreAdDe" value="${enc(torreAdDe)}"></div>
    <div class="f"><label>Até</label><input type="date" id="torreAdAte" value="${enc(torreAdAte)}"></div>
    <div class="f"><label>Status</label><select id="torreAdStatus"><option value="todos" ${torreAdStatus==="todos"?"selected":""}>Todos</option><option value="confirmado" ${torreAdStatus==="confirmado"?"selected":""}>Confirmado</option><option value="naoRealizado" ${torreAdStatus==="naoRealizado"?"selected":""}>Não realizado</option><option value="conflito" ${torreAdStatus==="conflito"?"selected":""}>Realizado divergente</option><option value="atividadeDivergente" ${torreAdStatus==="atividadeDivergente"?"selected":""}>Atividade divergente</option><option value="extra" ${torreAdStatus==="extra"?"selected":""}>Extra</option><option value="reprogramado" ${torreAdStatus==="reprogramado"?"selected":""}>Reprogramado</option><option value="planejadoFuturo" ${torreAdStatus==="planejadoFuturo"?"selected":""}>Planejado futuro</option></select></div>
    <div class="spacer"></div><button class="btn" onclick="exportarTorreAderencia()"><i data-lucide="download"></i>Exportar CSV</button>
  </div>`;
}
function _torreAdBind(host, compacto){
  const rerender=()=>renderTorreAderencia(host,compacto);
  const de=el("torreAdDe"), ate=el("torreAdAte"), st=el("torreAdStatus");
  if(de)de.onchange=()=>{torreAdDe=de.value;rerender();};
  if(ate)ate.onchange=()=>{torreAdAte=ate.value;rerender();};
  if(st)st.onchange=()=>{torreAdStatus=st.value;rerender();};
}

function _torreAdClassScore(v){ return v>=85?"ok":(v>=65?"warn":"bad"); }
function _torreAdFmtPct(a,b){ return b?Math.round((a/b)*100):0; }
function _torreAdWeekKey(iso){
  const d=parseISO(iso); const day=(d.getDay()+6)%7; const monday=addDays(d,-day);
  return fmtDM(monday)+"/"+monday.getFullYear();
}
function _torreAdScore(k){
  // Score executivo com pesos simples: aderência positiva e penalização por desvios críticos.
  const base=k.ader;
  const penal=(k.conflito*3)+(k.naoRealizado*3)+(k.atv*2)+(k.reprog*1)+(k.extra*1);
  const denom=Math.max(1,k.previsto+k.extra);
  return Math.max(0,Math.min(100,Math.round(base-(penal/denom*25))));
}
function _torreAdInsights(rows,k,porAnalista,porProjeto){
  const topA=porAnalista[0], topP=porProjeto[0];
  const out=[];
  if(k.ader<70) out.push("Aderência abaixo de 70%: revisar planejamento semanal e bloqueios de agenda.");
  else if(k.ader<85) out.push("Aderência em atenção: há espaço para reduzir trocas de projeto e reprogramações.");
  else out.push("Aderência saudável: a maior parte do previsto está sendo cumprida.");
  if(k.naoRealizado>0) out.push(k.naoRealizado+" slot(s) previsto(s) vencidos sem execução: priorizar tratativa com GP/líder.");
  if(k.extra>0) out.push(k.extra+" slot(s) extra(s): indica demanda não planejada entrando na operação.");
  if(topA && topA.desvios>0) out.push("Maior concentração por analista: "+topA.nome+" com "+topA.desvios+" desvio(s).");
  if(topP && topP.desvios>0) out.push("Projeto mais crítico: "+topP.nome+" com "+topP.desvios+" desvio(s).");
  return out.slice(0,5);
}
function _torreAdStack(k){
  const total=Math.max(1,k.confirmado+k.naoRealizado+k.conflito+k.atv+k.extra+k.reprog+k.futuro);
  const segs=[
    ["ok",k.confirmado,"Confirmado"],["bad",k.naoRealizado+k.conflito,"Crítico"],["warn",k.atv+k.reprog,"Atenção"],["info",k.extra,"Extra"],["future",k.futuro,"Futuro"]
  ];
  return `<div class="pvbi-stack">${segs.map(x=>x[1]?`<i class="${x[0]}" title="${enc(x[2]+': '+x[1])}" style="width:${Math.max(2,Math.round(x[1]/total*100))}%"></i>`:"").join("")}</div>
  <div class="pvbi-legend2"><span><i class="ok"></i>Confirmado ${k.confirmado}</span><span><i class="bad"></i>Crítico ${k.naoRealizado+k.conflito}</span><span><i class="warn"></i>Atenção ${k.atv+k.reprog}</span><span><i class="info"></i>Extra ${k.extra}</span><span><i class="future"></i>Futuro ${k.futuro}</span></div>`;
}
function _torreAdTrend(rows){
  const m={};
  rows.forEach(r=>{ const w=_torreAdWeekKey(r.iso); if(!m[w])m[w]={semana:w,prev:0,conf:0,desv:0}; if(r.temPrev)m[w].prev++; if(r.status==="confirmado")m[w].conf++; if(!["confirmado","planejadoFuturo"].includes(r.status))m[w].desv++; });
  return Object.values(m).map(x=>Object.assign(x,{ader:_torreAdFmtPct(x.conf,x.prev)}));
}
function _torreAdTrendHtml(rows){
  const t=_torreAdTrend(rows).slice(-8);
  if(!t.length)return `<div class="alert-empty">Sem tendência no período.</div>`;
  return `<table class="pvbi-table-mini"><thead><tr><th>Semana</th><th class="num">Prev.</th><th class="num">Conf.</th><th class="num">Desv.</th><th class="num">Ader.</th></tr></thead><tbody>${t.map(x=>`<tr><td>${enc(x.semana)}</td><td class="num">${x.prev}</td><td class="num">${x.conf}</td><td class="num">${x.desv}</td><td class="num">${x.ader}%</td></tr>`).join("")}</tbody></table>`;
}
function _torreAdHeatmap(rows){
  const dias=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
  const slots=SLOTS.filter(s=>!s.lunch).map(s=>s.id);
  const nomes=Object.fromEntries(SLOTS.map(s=>[s.id,s.name||s.id]));
  const m={}; dias.forEach(d=>slots.forEach(sl=>m[d+sl]=0));
  rows.forEach(r=>{ if(["confirmado","planejadoFuturo"].includes(r.status))return; const d=parseISO(r.iso); const dn=dias[(d.getDay()+6)%7]; m[dn+r.slot]=(m[dn+r.slot]||0)+1; });
  const max=Math.max(1,...Object.values(m));
  return `<div class="pvbi-heat"><div></div>${slots.map(sl=>`<div class="h">${enc(nomes[sl]||sl)}</div>`).join("")}${dias.map(d=>`<div class="d">${d}</div>${slots.map(sl=>{const v=m[d+sl]||0; const cls=v===0?"":(v/max>.66?"lv3":(v/max>.33?"lv2":"lv1")); return `<div class="box ${cls}" title="${d} · ${enc(nomes[sl]||sl)}: ${v} desvio(s)">${v||""}</div>`;}).join("")}`).join("")}</div>`;
}
function _torreAdMatrix(items){
  const rows=items.slice(0,8);
  if(!rows.length)return `<div class="alert-empty">Sem dados para ranking.</div>`;
  return `<table class="pvbi-table-mini"><thead><tr><th>Nome</th><th class="num">Prev.</th><th class="num">Conf.</th><th class="num">Desv.</th><th class="num">Ader.</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${enc(x.nome)}</td><td class="num">${x.previsto}</td><td class="num">${x.confirmado}</td><td class="num">${x.desvios}</td><td class="num">${x.ader}%</td></tr>`).join("")}</tbody></table>`;
}
function renderTorreAderencia(host, compacto){
  if(!host) return; _torreAdInitPeriodo();
  const all=_torreAdRows();
  const rows=all.filter(r=>torreAdStatus==="todos"||r.status===torreAdStatus);
  const k=_torreAdKpis(all);
  const score=_torreAdScore(k);
  const porAnalista=_torreAdAgg(all,"analista");
  const porProjeto=_torreAdAgg(all,"projeto");
  const insights=_torreAdInsights(all,k,porAnalista,porProjeto);
  const statusPills=["confirmado","naoRealizado","conflito","atividadeDivergente","extra","reprogramado","planejadoFuturo"].map(s=>`<span class="pvbi-pill ${_torreAdBadgeClass(s)}">${_torreAdLabelStatus(s)}: ${all.filter(r=>r.status===s).length}</span>`).join("");
  const linhas=rows.slice(0, compacto?8:300).map(r=>`<tr><td class="mono">${enc(_torreAlertDateLabel(r.iso))}<div class="sub">${enc(_torreSlotNome(r.slot))}</div></td><td><div class="nm">${enc(r.analista)}</div></td><td>${enc(r.prevProj||"—")}<div class="sub">${enc(r.prevAtv||"—")}</div></td><td>${enc(r.realProj||"—")}<div class="sub">${enc(r.realAtv||"—")}</div></td><td><span class="pvbi-status-badge ${_torreAdBadgeClass(r.status)}">${_torreAdLabelStatus(r.status)}</span></td></tr>`).join("");
  host.innerHTML=`
    <div class="pvbi-hero">
      <div><div class="eyebrow">Torre de controle · V2</div><h2>BI executivo de aderência entre alocação prevista e realizada</h2><p>Compara a camada planejada com a execução por analista, data e slot. O objetivo é mostrar aderência, rupturas de agenda, extras e necessidade de replanejamento.</p></div>
      <div class="pvbi-score ${_torreAdClassScore(score)}"><div class="lbl">Score operacional</div><div class="n">${score}</div><div class="sub">Aderência ${k.ader}% · Desvio ${k.desvio}%</div></div>
    </div>
    ${_torreAdRenderKpis(k)}
    ${compacto?`<div class="pvbi-actions"><div class="left">Resumo executivo dos últimos 30 dias e próximos 30 dias.</div><button class="btn sm" onclick="irTorre('aderencia')"><i data-lucide="git-compare-arrows"></i>Abrir painel completo V2</button></div>`:`<div class="pvbi-actions"><div class="left"><b>Leitura gerencial:</b> use filtros para investigar período e status.</div>${_torreAdFiltros()}</div>`}
    <div class="pvbi-exec-grid">
      <div class="pvbi-exec-card"><h3><i data-lucide="sparkles"></i>Diagnóstico automático</h3><ul>${insights.map(x=>`<li>${enc(x)}</li>`).join("")}</ul></div>
      <div class="pvbi-exec-card"><h3><i data-lucide="activity"></i>Distribuição operacional</h3>${_torreAdStack(k)}<div class="pvbi-status" style="margin-top:10px">${statusPills}</div></div>
      <div class="pvbi-exec-card"><h3><i data-lucide="trending-up"></i>Tendência semanal</h3>${_torreAdTrendHtml(all)}</div>
    </div>
    <div class="pvbi-layout"><div class="pvbi-chart"><h3><i data-lucide="users"></i>Analistas com mais desvios</h3>${_torreAdBars(porAnalista,"desvio")}</div><div class="pvbi-chart"><h3><i data-lucide="briefcase"></i>Projetos com mais desvios</h3>${_torreAdBars(porProjeto,"desvio")}</div></div>
    <div class="pvbi-layout"><div class="pvbi-chart"><h3><i data-lucide="table-2"></i>Matriz por analista</h3>${_torreAdMatrix(porAnalista)}</div><div class="pvbi-chart"><h3><i data-lucide="flame"></i>Mapa de calor dos desvios</h3>${_torreAdHeatmap(all)}<div class="pvbi-note">Quanto mais escuro, maior a concentração de desvios por dia da semana e slot.</div></div></div>
    <div class="pvbi-chart" style="margin-bottom:14px"><h3><i data-lucide="info"></i>Regras de cálculo</h3><div class="pvbi-mini"><b>Desvio operacional</b> = não realizados + conflitos + atividade divergente + extras + reprogramados. <b>Extra</b> = realizado sem previsto. <b>Não realizado</b> = previsto vencido sem execução. <b>Reprogramado</b> = mesmo projeto realizado pelo mesmo analista em outro slot ou em até 5 dias. <b>Aderência</b> = confirmados ÷ previstos.</div></div>
    <div class="alert-table-wrap">${rows.length?`<table class="alert-table compact"><thead><tr><th>Data/Slot</th><th>Analista</th><th>Previsto</th><th>Realizado</th><th>Status</th></tr></thead><tbody>${linhas}</tbody></table>`:`<div class="alert-empty"><i data-lucide="check-circle-2" style="width:30px;height:30px;color:var(--fn-teal);margin-bottom:8px"></i><br>Nenhum cruzamento encontrado para o filtro selecionado.</div>`}</div>`;
  if(!compacto) _torreAdBind(host,compacto); lucideRefresh();
}

function exportarTorreAderencia(){
  _torreAdInitPeriodo();
  const rows=_torreAdRows().filter(r=>torreAdStatus==="todos"||r.status===torreAdStatus);
  const cols=["iso","slot","analista","prevProj","prevAtv","realProj","realAtv","status"];
  const csv=[cols.join(";")].concat(rows.map(r=>cols.map(c=>'"'+String(r[c]||"").replace(/"/g,'""')+'"').join(";"))).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="torre-previsto-realizado.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}

function exportarAlertasTorre(){
  const rows=gerarAlertasTorre().filter(r=>torreAlertCrit==="todos" || r.criticidade===torreAlertCrit);
  const cols=["criticidade","tipo","projeto","cliente","etapa","data","periodo","dias","necessarios","cobertos","slots","analista","detalhe","acao"];
  const csv=[cols.join(";")].concat(rows.map(r=>cols.map(c=>'"'+String(r[c]||"").replace(/"/g,'""')+'"').join(";"))).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="torre-alertas-operacionais.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function renderHome(){ lucideRefresh(); /* Fase 4: auto-cobre icones em qualquer caminho */
  const host = el("homeCards"); if(!host) return;
  const nA = ((typeof REG==="object" && REG && REG.analistas) || []).length;
  const nP = ((typeof REG==="object" && REG && REG.projetos)  || []).length;
  // CTA "Incluir alocação" só para quem tem edição na Grade.
  try{ const cta=document.querySelector("#screenHome .home-cta"); if(cta) cta.style.display = canEditAction("grade") ? "" : "none"; }catch(e){}
  const cards = [
    {action:"torre",      act:"irPara('torre')",            ic:"radar",            t:"Torre de controle",          d:"Esteira + Discovery num só painel",        m: nP+" projetos"},
    {action:"grade",      act:"irPara('grade')",            ic:"layout-grid",      t:"Grade de alocação",          d:"Capacidade e alocação por período",        m: nA+" analistas"},
    {action:"esteira",    act:"irPara('esteira')",          ic:"route",            t:"Esteira de projetos",        d:"Tabela e edição de etapas",                m:"abrir"},
    {action:"discovery",  act:"irPara('discovery')",        ic:"search",           t:"Linha do tempo · Discovery", d:"Tabela e edição dos ritos",                m:"abrir"},
    {action:"relatorios", act:"el('reportsBtn').click()",   ic:"file-bar-chart-2", t:"Relatórios",                 d:"Alocação, squads, go-lives, mapa",         m:"abrir"},
    {action:"kpis",       act:"el('kpisBtn').click()",      ic:"line-chart",       t:"KPIs",                       d:"Indicadores executivos",                   m:"abrir"},
    {action:"atas",       act:"openAtasReport()",           ic:"file-signature",   t:"Atas",                       d:"Controle e indicadores das atas",          m:"abrir"},
    {action:"cadastros",  act:"el('acoesBtn').click()",     ic:"settings-2",       t:"Ações & cadastros",          d:"Analistas, projetos, usuários, rituais",   m:"abrir"},
    {action:"nsforma", always:true, act:"window.open('https://capacitacaonstech.vercel.app','_blank','noopener')", ic:"graduation-cap", t:"NS Forma",         d:"Plataforma de capacitação NSTECH",         m:"abrir"},
  ].filter(c=>c.always || canViewAction(c.action));
  host.innerHTML = cards.map(c=>`
    <button class="home-card" onclick="${c.act}">
      <div class="hc-head"><div class="hc-ic"><i data-lucide="${c.ic}"></i></div>
        <div><div class="hc-t">${c.t}</div><div class="hc-d">${c.d}</div></div></div>
      <div class="hc-m">${c.m}</div>
    </button>`).join("");
  const sub = el("homeSub"); if(sub) sub.textContent = nA+" analistas · "+nP+" projetos";
}
// Throttle do createIcons: um agendamento por frame, evita varrer o DOM múltiplas
// vezes dentro do mesmo ciclo de render. Performance crítica em grades grandes.
let _lucidePending=false;
function lucideRefresh(){
  if(_lucidePending) return;
  _lucidePending=true;
  requestAnimationFrame(()=>{
    _lucidePending=false;
    try{ if(window.lucide) lucide.createIcons(); }catch(e){}
  });
}
// observer: sempre que markup mudar dentro de áreas que usam ícones, refazemos
/* Fase 4: o MutationObserver global (que varria o document.body inteiro a cada
   mutacao) foi removido. Os icones sao cobertos pelas chamadas explicitas a
   lucideRefresh() em cada funcao de render. */

/* ===================== modal alocar ===================== */
// Constrói o select de Projeto. Lista APENAS projetos cadastrados, separados em
// "do analista" e "outros", filtrados pelo tipo da atividade atualmente selecionada
// (se Discovery → projetos Discovery e Implantação; se Implantação → só projetos Implantação).
/* ===================== modal CONSULTA do slot ===================== */
// Ao clicar num slot, abre modal somente leitura com os dados.
// Edição de slot existente é feita pelo botão "Alterar/Sobrescrever" que
// abre o modal de Incluir alocação pré-preenchido.
function openAlloc(nomeOuIso,isoOuSlot,slotOuUndef){
  let nome,iso,slot;
  if(slotOuUndef===undefined){ nome=consultor; iso=nomeOuIso; slot=isoOuSlot; }
  else { nome=nomeOuIso; iso=isoOuSlot; slot=slotOuUndef; }
  if(!nome)return;
  const podeEditar=canEditAlloc(nome,iso);
  const r=DATA[key(nome,iso,slot)];
  const d=parseISO(iso);
  el("mTitle").innerHTML=`<i data-lucide="info"></i>${enc(nome)} · ${enc(slot)}`;
  const subBase=DOW[d.getDay()]+", "+fmtDM(d)+"/"+d.getFullYear()+" · "+(SLOTS.find(s=>s.id===slot)||{}).time;
  el("mSub").textContent=subBase;
  const body=el("consultBody");
  if(!r){
    body.innerHTML=`<div class="rep-empty" style="padding:30px 10px;background:var(--paper);border-radius:var(--r-md)">
      <i data-lucide="circle-dashed" style="width:32px;height:32px;color:var(--faint);margin-bottom:8px"></i><br>
      <b>Slot livre</b><br><span style="font-size:12.5px;color:var(--muted)">Nenhuma alocação registrada</span></div>`;
  }else{
    const ativ=atividadeObj(r.atividade);
    const tipo=ativ?TIPO_LABEL(ativ.tipo):"—";
    const tipoIcone=ativ?(TIPOS_ATIVIDADE.find(t=>t.id===ativ.tipo)||{icone:"•"}).icone:"";
    const cli=(r.cliente && r.cliente!=="Livre")?r.cliente:"—";
    // Gerente de Projeto e Líder vêm do cadastro do projeto (Esteira), não do slot.
    // Mantém "Livre = ausência de dado": nada é gravado no slot, só consultado.
    const projCad = cli!=="—" ? REG.projetos.find(x=>x.nome===cli) : null;
    const gpNome = projCad && projCad.gp ? String(projCad.gp) : "";
    const liderNome = projCad && projCad.lider ? String(projCad.lider) : "";
    const gpLiderHTML = projCad ? `
        <div class="cs-it cs-full cs-person"><div class="cs-l">Gerente de Projeto</div><div class="cs-v" style="${gpNome?"":"color:var(--faint);font-style:italic"}">${gpNome?enc(gpNome):"— (não definido)"}</div></div>
        <div class="cs-it cs-full cs-person"><div class="cs-l">Líder de Projeto</div><div class="cs-v" style="${liderNome?"":"color:var(--faint);font-style:italic"}">${liderNome?enc(liderNome):"— (não definido)"}</div></div>` : "";
    const obsTxt=r.obs?String(r.obs):"";
    const obsAud=(r.obsBy||r.obsAt)?`<div class="hint" style="margin-top:6px;font-size:11px">Última alteração da observação por <b>${enc(r.obsBy||"—")}</b> em ${enc((r.obsAt||"").replace("T"," ").slice(0,16))}</div>`:"";
    const pend=r.obsPendente?`<div style="background:#f6ecd6;border:1px solid #e6d2a6;color:#b07a1e;padding:8px 10px;border-radius:8px;font-size:12px;margin-bottom:8px"><b>⚠ Observação pendente</b> — atividade exige observação, ainda sem texto.</div>`:"";
    const fer=r.feriado?`<div style="background:var(--aus-bg);border:1px solid var(--aus-bd);color:#4a4a4a;padding:8px 10px;border-radius:8px;font-size:12px;margin-bottom:8px">🌴 Slot criado pela <b>propagação automática de feriado</b>.</div>`:"";
    body.innerHTML=`${fer}${pend}
      <div class="cs-grid">
        <div class="cs-it"><div class="cs-l">Atividade</div><div class="cs-v"><b>${enc(r.atividade||"—")}</b>${tipo!=="—"?` <span class="badge-small" style="background:#fff;border:1px solid var(--line2)">${tipoIcone} ${enc(tipo)}</span>`:""}</div></div>
        <div class="cs-it"><div class="cs-l">Projeto / Cliente</div><div class="cs-v">${enc(cli)}</div></div>${gpLiderHTML}
        <div class="cs-it cs-full"><div class="cs-l">Observação</div><div class="cs-v" style="white-space:pre-wrap;${obsTxt?"":"color:var(--faint);font-style:italic"}">${obsTxt?enc(obsTxt):"— (sem observação)"}</div>${obsAud}</div>
      </div>`;
  }
  // Botão "Alterar/Sobrescrever" só para administradores e gestores
  const aObj=analistaObj(nome);
  const corteDeslig=aObj&&aObj.ativo===false?(aObj.desligamento||aObj.inativadoEm):null;
  const bloqueadoPorDeslig = corteDeslig && iso>=corteDeslig;
  const podeAlterar = canIncluirAlocacao() && !bloqueadoPorDeslig;
  el("mAlterar").style.display = podeAlterar ? "" : "none";
  el("mAlterar").onclick = ()=>{closeAlloc(); openIncluirAloc({analista:nome, iso, slot, prefill:r||null});};
  // "Liberar slot": só aparece quando há algo lançado E o usuário pode alterar.
  // Devolve o slot para "Livre" removendo o registro (apagar a chave = ausência = livre).
  el("mLiberar").style.display = (podeAlterar && r) ? "" : "none";
  el("mLiberar").onclick = ()=>liberarSlot(nome, iso, slot);
  // ── Botão ATA (Fase 2): aparece quando a atividade exige ata OU já existe ata p/ o slot ──
  const ataBtn=el("mAta");
  if(ataBtn){
    const podeVer=canViewAction("atas");
    const atvAta=r?atividadeObj(r.atividade):null;
    const exigeAta=!!(atvAta&&atvAta.exigeAta);
    if(r && podeVer && exigeAta){ ataBtn.style.display=""; ataBtn.innerHTML='<i data-lucide="file-signature"></i>Gerar ATA'; }
    else { ataBtn.style.display="none"; }
    ataBtn.onclick=()=>{ closeAlloc(); openAta(nome, iso, slot); };
    if(r && podeVer){                                  // refina de forma assíncrona se já existe ata
      const mes=_mesDe(iso), kk=key(nome,iso,slot);
      const done=_atasMeses[mes]?Promise.resolve():_carregarAtasMes(mes).then(()=>{});
      done.then(()=>{
        if(!el("overlay").classList.contains("open")) return;  // modal já foi fechado
        const ex=_ataDoSlot(kk);
        if(ex){ ataBtn.style.display=""; ataBtn.innerHTML='<i data-lucide="file-text"></i>Visualizar ATA'; }
        else if(exigeAta){ ataBtn.style.display=""; ataBtn.innerHTML='<i data-lucide="file-signature"></i>Gerar ATA'; }
        else { ataBtn.style.display="none"; }
        lucideRefresh();
      });
    }
  }
  el("overlay").classList.add("open");
  lucideRefresh();
}
function closeAlloc(){el("overlay").classList.remove("open");}

// Libera um slot ocupado, devolvendo-o ao estado "Livre".
// Caso de uso: atividade lançada foi cancelada pelo cliente e o analista
// deve voltar a aparecer como disponível naquele slot.
function liberarSlot(nome, iso, slot){
  if(!canIncluirAlocacao()){
    alert("Apenas administradores e gestores podem liberar slots.");return;
  }
  const k=key(nome,iso,slot);
  const antigo=DATA[k];
  if(!antigo){ closeAlloc(); return; } // já está livre
  const d=parseISO(iso);
  const quando=`${fmtDM(d)}/${d.getFullYear()} · ${slot}`;
  const resumo=`${antigo.atividade||"—"}${antigo.cliente&&antigo.cliente!=="Livre"?" · "+antigo.cliente:""}`;
  if(!confirm(`Liberar este slot de ${nome} (${quando})?\n\nLançamento atual: ${resumo}\n\nO slot voltará a aparecer como LIVRE. Esta ação fica registrada na auditoria.`))return;
  delete DATA[k];
  audit("allocation.delete", k, antigo, null, {note:"Slot liberado (atividade cancelada) — voltou a Livre"});
  saveAlloc(); renderAll(); closeAlloc();
}

/* ===================== Atas · tela de geração/consulta (Fase 2) =====================
   - Abre por slot (botão "Gerar/Visualizar ATA" no modal de consulta).
   - Autopreenche cliente/data/slot/atividade/analista; gp/líder vêm AO VIVO do
     cadastro do projeto enquanto a ata não está impressa (na impressão, Fase 3,
     congelam). Campos digitáveis: tarefas, pendências, observações, e-mails.
   - Ata impressa abre em MODO CONSULTA (read-only) — sempre acessível.            */
let _ataCtx=null;   // {nome,iso,slot,cliente,atividade,gp,lider,horario,ata,mes}

function openAta(nome, iso, slot){
  if(!canViewAction("atas")){ alert("Você não tem acesso às Atas."); return; }
  const mes=_mesDe(iso);
  const pronto=_atasMeses[mes]?Promise.resolve():_carregarAtasMes(mes).then(()=>{});
  pronto.then(()=>{
    _renderAtaForm(nome, iso, slot, _ataDoSlot(key(nome,iso,slot)));
    const o=el("ataOverlay"); if(o)o.classList.add("open");
    lucideRefresh();
  });
}
function closeAta(){ const o=el("ataOverlay"); if(o)o.classList.remove("open"); _ataCtx=null; }

function _participantesRowsHTML(arr, podeEditar){
  const dis=podeEditar?"":"disabled";
  if(!arr||!arr.length) return `<div class="hint" style="padding:6px 8px">Nenhum participante.${podeEditar?' Use “Adicionar participante”.':''}</div>`;
  return arr.map((p,i)=>`<div class="ptc-row" data-idx="${i}">
    <input type="text" class="ptc-nome" value="${enc(p.nome||'')}" placeholder="Nome" ${dis}>
    <input type="text" class="ptc-cargo" value="${enc(p.cargo||'')}" placeholder="Cargo" ${dis}>
    <input type="text" class="ptc-empresa" value="${enc(p.empresa||'')}" placeholder="Empresa" ${dis}>
    ${podeEditar?`<button class="btn ptc-del" type="button" data-idx="${i}" title="Remover participante"><i data-lucide="trash-2"></i></button>`:`<span></span>`}
  </div>`).join("");
}
// Lê as linhas na ORDEM do DOM, SEM filtrar vazias (alinha índices durante a edição).
function _lerParticipantesDOM(){
  const host=el("ataParticipantes"); if(!host)return [];
  return [...host.querySelectorAll(".ptc-row")].map(r=>{
    const g=s=>{const e=r.querySelector(s);return e?e.value.trim():"";};
    return {nome:g(".ptc-nome"),cargo:g(".ptc-cargo"),empresa:g(".ptc-empresa")};
  });
}
function _renderAtaParticipantes(){
  const host=el("ataParticipantes"); if(!host||!_ataCtx)return;
  host.innerHTML=_participantesRowsHTML(_ataCtx.participantes||[], !!_ataCtx.podeEditar);
  lucideRefresh();
}

function _renderAtaForm(nome, iso, slot, ata){
  const r=DATA[key(nome,iso,slot)]||null;
  const cliente=(r&&r.cliente&&r.cliente!=="Livre")?r.cliente:((ata&&ata.cliente)||"");
  const atividade=(r&&r.atividade)||(ata&&ata.atividade)||"";
  const projCad=cliente?REG.projetos.find(x=>x.nome===cliente):null;
  const impressa=!!(ata&&ata.impressa);
  const gp = impressa ? (ata.gp||"") : (projCad&&projCad.gp||"");        // congelado se impressa; senão ao vivo
  const lider = impressa ? (ata.lider||"") : (projCad&&projCad.lider||"");
  const horario=((SLOTS.find(s=>s.id===slot)||{}).time)||"";
  const d=parseISO(iso);
  const dataFmt=DOW[d.getDay()]+", "+fmtDM(d)+"/"+d.getFullYear();
  const podeEditar=canEditAction("atas") && !impressa;

  _ataCtx={nome,iso,slot,cliente,atividade,gp,lider,horario,ata:ata||null,mes:_mesDe(iso),
    participantes:(ata&&Array.isArray(ata.participantes))?ata.participantes.map(p=>({nome:p.nome||"",cargo:p.cargo||"",empresa:p.empresa||""})):[],
    podeEditar};

  el("ataTitle").innerHTML=`<i data-lucide="file-signature"></i>ATA · ${enc(cliente||atividade||"slot")}`;
  el("ataSub").textContent=`${nome} · ${dataFmt} · ${slot} · ${horario}`;

  const contatos=(projCad&&Array.isArray(projCad.contatosCliente))?projCad.contatosCliente.filter(c=>c.ativo!==false&&c.email):[];
  const jaSug=(ata&&Array.isArray(ata.emailsSugeridos))?ata.emailsSugeridos:null;
  const tipoLabel={principal:"Principal",copia:"Cópia",opcional:"Opcional"};
  const emailRows=contatos.length
    ? contatos.map(c=>{
        const checked=jaSug?jaSug.includes(c.email):(c.tipo==="principal"||c.tipo==="copia");
        return `<label class="ata-mail ${podeEditar?"":"ro"}"><input type="checkbox" class="ata-mail-chk" data-email="${enc(c.email)}" ${checked?"checked":""} ${podeEditar?"":"disabled"}> <b>${enc(c.nome||c.email)}</b> <span class="ata-mail-meta">${enc(c.email)}${c.tipo?` · ${tipoLabel[c.tipo]||c.tipo}`:""}</span></label>`;
      }).join("")
    : `<div class="hint" style="padding:8px">Nenhum contato ativo no projeto. Cadastre na aba <b>Contato Cliente</b> do projeto para sugerir destinatários.</div>`;

  const ro=podeEditar?"":"readonly";
  const val=s=>enc((ata&&ata[s])||"");
  const banner = impressa
    ? `<div class="ata-banner lock"><i data-lucide="lock"></i> Ata <b>impressa</b> em ${enc((ata.printedAt||"").replace("T"," ").slice(0,16))}${ata.printedBy?` por ${enc(ata.printedBy)}`:""} — bloqueada para edição, disponível para consulta.</div>`
    : (ata?`<div class="ata-banner ok"><i data-lucide="check"></i> Ata gerada em ${enc((ata.createdAt||"").replace("T"," ").slice(0,16))}${ata.createdBy?` por ${enc(ata.createdBy)}`:""} · alterável enquanto não for impressa.</div>`:"");

  // ── Controle de envio (Fase 4): só após impressão. Confirmar envio é uma transição
  //    PERMITIDA em ata impressa (o bloqueio trava o conteúdo, não o registro de envio).
  const enviado=!!(ata&&ata.envioConfirmado);
  const podeConfirmar=canEditAction("atas");
  const sugeridos=(ata&&Array.isArray(ata.emailsSugeridos))?ata.emailsSugeridos:[];
  const confirmados=(ata&&Array.isArray(ata.emailsConfirmados))?ata.emailsConfirmados:[];
  const envioChecks = sugeridos.length
    ? sugeridos.map(e=>{ const ck=enviado?confirmados.includes(e):true;
        return `<label class="ata-mail"><input type="checkbox" class="ata-envio-chk" data-email="${enc(e)}" ${ck?"checked":""}> <span class="ata-mail-meta">${enc(e)}</span></label>`; }).join("")
    : `<div class="hint" style="padding:6px 8px">Sem e-mails sugeridos. Informe um destinatário abaixo ou confirme o envio sem registrar e-mails.</div>`;
  const sentBanner = enviado
    ? `<div class="ata-banner sent"><i data-lucide="mail-check"></i> Envio confirmado em ${enc((ata.sentAt||"").replace("T"," ").slice(0,16))}${ata.sentBy?` por ${enc(ata.sentBy)}`:""}${confirmados.length?` · para: ${enc(confirmados.join(" · "))}`:""}.</div>`
    : "";
  const envioSec = impressa ? `
    <div class="ata-sec ata-envio">
      <label class="ata-lbl">Controle de envio</label>
      ${sentBanner}
      ${podeConfirmar ? `
        ${enviado?`<button class="btn small" id="ataReenvio" type="button"><i data-lucide="pencil"></i>Atualizar envio</button>`:""}
        <div id="ataEnvioPanel" ${enviado?'style="display:none"':""}>
          <div class="hint" style="margin:6px 0 8px">Marque os destinatários para os quais a ata foi <b>efetivamente enviada</b> e confirme. Não há disparo automático de e-mail.</div>
          <div class="ata-mails" id="ataEnvioMails">${envioChecks}</div>
          <div class="ata-envio-extra"><input type="email" id="ataEnvioExtra" placeholder="Adicionar outro e-mail (opcional)"></div>
          <button class="btn primary" id="ataConfirmarEnvio" type="button"><i data-lucide="send"></i>${enviado?"Atualizar envio":"Confirmar envio"}</button>
        </div>`
      : (enviado ? "" : `<div class="hint" style="padding:6px 8px">Envio ainda não confirmado.</div>`)}
    </div>` : "";

  el("ataBody").innerHTML=`
    ${banner}
    <div class="ata-auto">
      <div class="ata-f"><span>Cliente / Projeto</span><b>${enc(cliente||"—")}</b></div>
      <div class="ata-f"><span>Atividade</span><b>${enc(atividade||"—")}</b></div>
      <div class="ata-f"><span>Data</span><b>${dataFmt}</b></div>
      <div class="ata-f"><span>Slot / Horário</span><b>${enc(slot)} · ${enc(horario||"—")}</b></div>
      <div class="ata-f"><span>Analista</span><b>${enc(nome)}</b></div>
      <div class="ata-f"><span>Gerente de Projeto</span><b>${gp?enc(gp):"— (não definido)"}</b></div>
      <div class="ata-f"><span>Líder de Projeto</span><b>${lider?enc(lider):"— (não definido)"}</b></div>
    </div>
    <div class="ata-sec"><label class="ata-lbl">Participantes <span class="lbl-soft">· nome, cargo, empresa</span></label>
      <div class="ptc-head"><div>Participante</div><div>Cargo</div><div>Empresa</div><div></div></div>
      <div id="ataParticipantes">${_participantesRowsHTML(_ataCtx.participantes, podeEditar)}</div>
      ${podeEditar?`<button class="btn small" id="ataAddParticipante" type="button"><i data-lucide="user-plus"></i>Adicionar participante</button>`:""}
    </div>
    <div class="ata-sec"><label class="ata-lbl">Tarefas Executadas</label>
      <textarea id="ataTarefas" rows="4" placeholder="Descreva as tarefas executadas no atendimento..." ${ro}>${val("tarefasExecutadas")}</textarea></div>
    <div class="ata-sec"><label class="ata-lbl">Pendências Apresentadas</label>
      <textarea id="ataPendencias" rows="4" placeholder="Pendências levantadas pelo cliente..." ${ro}>${val("pendenciasApresentadas")}</textarea></div>
    <div class="ata-sec"><label class="ata-lbl">Observações adicionais <span class="lbl-soft">· opcional</span></label>
      <textarea id="ataObs" rows="3" placeholder="Observações..." ${ro}>${val("observacoes")}</textarea></div>
    <div class="ata-sec"><label class="ata-lbl">E-mails sugeridos para envio <span class="lbl-soft">· sugestão, sem disparo automático</span></label>
      <div class="ata-mails" id="ataMails">${emailRows}</div></div>${envioSec}`;

  const btnSalvar=el("ataSalvar");
  if(btnSalvar) btnSalvar.style.display=podeEditar?"":"none";
  { const ap=el("ataAddParticipante"); if(ap) ap.addEventListener("click",()=>{ _ataCtx.participantes=_lerParticipantesDOM(); _ataCtx.participantes.push({nome:"",cargo:"",empresa:""}); _renderAtaParticipantes(); }); }
  { const host=el("ataParticipantes"); if(host) host.addEventListener("click",e=>{ const del=e.target.closest&&e.target.closest(".ptc-del"); if(!del)return; _ataCtx.participantes=_lerParticipantesDOM(); const i=+del.dataset.idx; if(i>=0&&i<_ataCtx.participantes.length){ _ataCtx.participantes.splice(i,1); _renderAtaParticipantes(); } }); }
  { const bc=el("ataConfirmarEnvio"); if(bc) bc.addEventListener("click", confirmarEnvioAta); }
  { const br=el("ataReenvio"); if(br) br.addEventListener("click", ()=>{ const p=el("ataEnvioPanel"); if(p)p.style.display=""; br.style.display="none"; lucideRefresh(); }); }
  const btnImprimir=el("ataImprimir");
  if(btnImprimir){
    if(impressa){                              // já impressa → 2ª via p/ quem visualiza
      const podeVer=canViewAction("atas");
      btnImprimir.style.display=podeVer?"":"none";
      btnImprimir.innerHTML='<i data-lucide="printer"></i>Imprimir 2ª via';
    } else if(canEditAction("atas") && ata){   // gerada e não impressa → imprimir e bloquear (precisa já existir)
      btnImprimir.style.display="";
      btnImprimir.innerHTML='<i data-lucide="printer"></i>Imprimir e bloquear';
    } else {                                   // ainda não salva (salve antes) ou sem permissão
      btnImprimir.style.display="none";
    }
  }
}

// Choke-point de gravação da ata. Blindagem de permissão + bloqueio pós-impressão
// na CAMADA DE GRAVAÇÃO (não só na UI).
// Monta o objeto da ata a partir do form atual (+ overrides). NÃO grava nem bloqueia.
// 'overrides' permite setar impressa/printedAt/printedBy no caminho de impressão.
function _montarAtaDoForm(ctx, existente, overrides){
  const agora=new Date().toISOString();
  const userTag=(_currentUser&&_currentUser.email)||"local";
  const slotKey=key(ctx.nome,ctx.iso,ctx.slot);
  const id=(existente&&existente._id)||_ataNovoId();
  const emails=[...document.querySelectorAll("#ataMails .ata-mail-chk:checked")].map(c=>c.dataset.email).filter(Boolean);
  const base = existente ? Object.assign({},existente) : {};
  delete base._id; delete base._mes;   // campos internos não vão pro Firebase
  const ata=Object.assign({}, base, {
    id, slotKey,
    cliente:ctx.cliente||"", atividade:ctx.atividade||"", data:ctx.iso, slot:ctx.slot, horario:ctx.horario||"",
    analista:ctx.nome, gp:ctx.gp||"", lider:ctx.lider||"",
    participantes:_lerParticipantesDOM().filter(p=>p.nome||p.cargo||p.empresa),
    tarefasExecutadas:(el("ataTarefas")?el("ataTarefas").value:"").trim(),
    pendenciasApresentadas:(el("ataPendencias")?el("ataPendencias").value:"").trim(),
    observacoes:(el("ataObs")?el("ataObs").value:"").trim(),
    emailsSugeridos:emails,
    emailsConfirmados:(existente&&existente.emailsConfirmados)||[],
    impressa:!!(existente&&existente.impressa),
    envioConfirmado:!!(existente&&existente.envioConfirmado),
    createdAt:(existente&&existente.createdAt)||agora,
    createdBy:(existente&&existente.createdBy)||userTag,
    updatedAt:agora, updatedBy:userTag,
    printedAt:(existente&&existente.printedAt)||"",
    printedBy:(existente&&existente.printedBy)||""
  }, overrides||{});
  // status derivado ("pendente" é virtual = ausência de registro)
  ata.status = ata.impressa ? (ata.envioConfirmado?"enviada":"impressa") : "gerada";
  return {ata, id, slotKey};
}
// Grava a ata (Firebase ou modo local) + atualiza cache + auditoria.
function _gravarAta(ata, id, slotKey, mes, existente, auditKind, onOk){
  const antesAudit = existente ? (function(){const c=Object.assign({},existente);delete c._id;delete c._mes;return c;})() : null;
  const aplicarLocal=()=>{ _atasCache[slotKey]=Object.assign({_id:id,_mes:mes},ata); audit(auditKind, id, antesAudit, ata); try{ renderBoard(); }catch(e){} };
  if(!_db){ aplicarLocal(); if(onOk)onOk(); return; }
  _db.ref(ATAS_PATH+"/"+mes+"/"+id).set(sanitizeForFirebase(ata))
    .then(()=>{ aplicarLocal(); if(onOk)onOk(); })
    .catch(e=>{ console.warn("[atas] gravação falhou (Regras do Firebase para "+ATAS_PATH+"?):",e); alert("Não foi possível salvar a ata. Verifique as permissões / Regras do Firebase para "+ATAS_PATH+"."); });
}

function salvarAta(){
  if(!canEditAction("atas")){ alert("Você está em modo somente leitura em Atas — geração e edição indisponíveis."); return; }
  const ctx=_ataCtx; if(!ctx) return;
  const existente=ctx.ata;
  if(existente && existente.impressa){ alert("Esta ata já foi impressa e está bloqueada para edição. Ela permanece disponível para consulta."); return; }
  const {ata,id,slotKey}=_montarAtaDoForm(ctx, existente, null);
  _gravarAta(ata, id, slotKey, ctx.mes, existente, "ata."+(existente?"update":"create"), ()=>{ if(!_db)alert("ATA salva (modo local — sem nuvem configurada)."); closeAta(); });
}

/* ===================== Atas · impressão e bloqueio (Fase 3) =====================
   Imprimir é a ação que BLOQUEIA a ata (regra: após impressão não pode mais ser
   alterada — mas continua consultável). Congela GP/líder no objeto, seta
   impressa/printedAt/printedBy, audita "ata.print" e dispara o layout imprimível.
   2ª via de ata já impressa: só re-renderiza/imprime, sem alterar estado.        */
function imprimirAta(){
  const ctx=_ataCtx; if(!ctx) return;
  const existente=ctx.ata;
  const jaImpressa=!!(existente && existente.impressa);

  if(jaImpressa){
    // 2ª via — quem pode visualizar pode reimprimir; não altera nada.
    if(!canViewAction("atas")){ alert("Você não tem acesso às Atas."); return; }
    _dispararImpressao(existente);
    return;
  }
  // Caminho de bloqueio: exige edição + confirmação (ação irreversível).
  if(!canEditAction("atas")){ alert("Você está em modo somente leitura em Atas — não é possível imprimir/bloquear."); return; }
  if(!confirm("Imprimir BLOQUEIA a ata para edição (ela continuará disponível para consulta e 2ª via). Deseja imprimir e bloquear?")) return;

  const agora=new Date().toISOString();
  const userTag=(_currentUser&&_currentUser.email)||"local";
  const {ata,id,slotKey}=_montarAtaDoForm(ctx, existente, {impressa:true, printedAt:agora, printedBy:userTag});
  _gravarAta(ata, id, slotKey, ctx.mes, existente, "ata.print", ()=>{
    // re-renderiza o form já em modo consulta (impressa) e dispara a impressão
    _renderAtaForm(ctx.nome, ctx.iso, ctx.slot, _atasCache[slotKey]);
    lucideRefresh();
    _dispararImpressao(_atasCache[slotKey]);
  });
}

function _ataPrintHTML(a){
  const d=parseISO(a.data); const dataFmt=DOW[d.getDay()]+", "+fmtDM(d)+"/"+d.getFullYear();
  const linhasMail=(a.emailsSugeridos&&a.emailsSugeridos.length)?a.emailsSugeridos.map(enc).join(" · "):"—";
  const campo=(label,val,multi)=>`<div class="apr-field${multi?" apr-multi":""}"><div class="apr-l">${label}</div><div class="apr-v">${val&&String(val).trim()?enc(val).replace(/\n/g,"<br>"):"—"}</div></div>`;
  const printedFmt=a.printedAt?(String(a.printedAt).replace("T"," ").slice(0,16)):"";
  const sentFmt=a.envioConfirmado&&a.sentAt?(String(a.sentAt).replace("T"," ").slice(0,16)):"";
  const sentLinha=sentFmt?`<div class="apr-foot">Envio confirmado por ${enc(a.sentBy||"—")} em ${enc(sentFmt)}${(a.emailsConfirmados&&a.emailsConfirmados.length)?` · para: ${enc(a.emailsConfirmados.join(" · "))}`:""}</div>`:"";
  const parts=(a.participantes&&a.participantes.length)
    ? `<table class="apr-ptc"><thead><tr><th>Participante</th><th>Cargo</th><th>Empresa</th></tr></thead><tbody>${a.participantes.map(p=>`<tr><td>${enc(p.nome||"—")}</td><td>${enc(p.cargo||"—")}</td><td>${enc(p.empresa||"—")}</td></tr>`).join("")}</tbody></table>`
    : `<div class="apr-v">—</div>`;
  return `
  <div class="apr-doc">
    <div class="apr-head">
      <div class="apr-brand">NS&nbsp;ALOC</div>
      <div class="apr-title">ATA DE ATENDIMENTO</div>
    </div>
    <div class="apr-grid">
      ${campo("Cliente / Projeto", a.cliente)}
      ${campo("Atividade", a.atividade)}
      ${campo("Data", dataFmt)}
      ${campo("Slot / Horário", (a.slot||"")+" · "+(a.horario||"—"))}
      ${campo("Analista", a.analista)}
      ${campo("Gerente de Projeto", a.gp)}
      ${campo("Líder de Projeto", a.lider)}
      ${campo("Status", a.envioConfirmado?"Enviada":"Impressa")}
    </div>
    <div class="apr-ptc-sec"><div class="apr-l">Participantes</div>${parts}</div>
    <div class="apr-block">
      ${campo("Tarefas Executadas", a.tarefasExecutadas, true)}
      ${campo("Pendências Apresentadas", a.pendenciasApresentadas, true)}
      ${campo("Observações", a.observacoes, true)}
      ${campo("E-mails sugeridos para envio", linhasMail, true)}
    </div>
    <div class="apr-sign">
      <div class="apr-sign-l"><div class="apr-line"></div>Analista — ${enc(a.analista||"")}</div>
      <div class="apr-sign-l"><div class="apr-line"></div>Cliente</div>
    </div>
    <div class="apr-foot">
      Gerada por ${enc(a.createdBy||"—")} em ${enc((a.createdAt||"").replace("T"," ").slice(0,16))}${printedFmt?` · Impressa por ${enc(a.printedBy||"—")} em ${enc(printedFmt)}`:""} · ID ${enc(a.id||"")}
    </div>${sentLinha}
  </div>`;
}
function _dispararImpressao(a){
  const host=el("ataPrint"); if(!host){ window.print(); return; }
  host.innerHTML=_ataPrintHTML(a);
  // pequeno atraso garante o paint do conteúdo antes do diálogo de impressão
  setTimeout(()=>{ try{ window.print(); }catch(e){ console.warn("[atas] print:",e); } }, 60);
}

/* ===================== Atas · controle de envio (Fase 4) =====================
   Confirmar envio é uma transição PERMITIDA em ata impressa (o bloqueio pós-impressão
   trava o conteúdo, não o registro de envio). Toca apenas os campos de envio:
   emailsConfirmados, envioConfirmado, sentAt/sentBy → status "enviada". Audita "ata.send".
   Re-confirmação atualiza a lista de destinatários (mantém o sentAt/sentBy originais).   */
function confirmarEnvioAta(){
  const ctx=_ataCtx; if(!ctx) return;
  const existente=ctx.ata;
  if(!canEditAction("atas")){ alert("Você não tem permissão para confirmar envio de atas."); return; }
  if(!existente || !existente.impressa){ alert("Confirme o envio somente após imprimir a ata."); return; }

  const checked=[...document.querySelectorAll("#ataEnvioMails .ata-envio-chk:checked")].map(c=>c.dataset.email);
  const extraInput=el("ataEnvioExtra"); const extra=extraInput?extraInput.value.trim():"";
  if(extra){ if(!/.+@.+\..+/.test(extra)){ alert("E-mail adicional inválido."); return; } if(!checked.includes(extra)) checked.push(extra); }
  const emailsConf=[...new Set(checked)].filter(Boolean);
  if(!emailsConf.length && !confirm("Nenhum e-mail marcado. Confirmar o envio mesmo assim (sem registrar destinatários)?")) return;

  const agora=new Date().toISOString();
  const userTag=(_currentUser&&_currentUser.email)||"local";
  const base=Object.assign({},existente); delete base._id; delete base._mes;
  const ata=Object.assign({}, base, {
    emailsConfirmados:emailsConf,
    envioConfirmado:true,
    sentAt:existente.sentAt||agora,    // 1ª confirmação fixa o momento do envio
    sentBy:existente.sentBy||userTag,
    updatedAt:agora, updatedBy:userTag
  });
  ata.status = ata.impressa ? (ata.envioConfirmado?"enviada":"impressa") : "gerada";
  _gravarAta(ata, existente._id, existente.slotKey, ctx.mes, existente, "ata.send", ()=>{
    _renderAtaForm(ctx.nome, ctx.iso, ctx.slot, _atasCache[existente.slotKey]); lucideRefresh();
  });
}

/* ===================== Atas · gestão executiva (Fase 5) =====================
   Visão "Atas": KPIs, rankings de pendência (analista/cliente/GP) e tabela, com
   filtro de período (buckets windowed) + escopo (cliente/analista/GP/status).
   "Obrigatória" = slot do período cuja atividade tem exigeAta=true. "Pendente" é
   virtual (obrigatória sem registro de ata). KPIs e rankings respeitam o filtro.   */
let _atasLinhas=[];
let _atasFiltro={cliente:"todos",analista:"todos",gp:"todos",status:"todos"};

function openAtasReport(){
  if(!canViewAction("atas")){ alert("Você não tem acesso às Atas."); return; }
  _fecharOutrasTelas("atasOverlay");
  const o=el("atasOverlay"); if(o)o.classList.add("open");
  try{ aplicarDatasPadrao("atasDataInicio","atasDataFim"); }catch(e){}
  _atasFiltro={cliente:"todos",analista:"todos",gp:"todos",status:"todos"};
  aplicarPeriodoAtas();
  lucideRefresh();
}
function closeAtasReport(){ const o=el("atasOverlay"); if(o)o.classList.remove("open"); }

function _mesesAtas(ini,fim){
  const set=[]; let a=new Date(ini+"T00:00:00"); const f=new Date(fim+"T00:00:00");
  while(a<=f){ set.push(a.toISOString().slice(0,7)); a.setMonth(a.getMonth()+1); }
  return set;
}
function _lerAtasPorPeriodo(ini,fim){
  if(!_db){ return Promise.resolve(Object.keys(_atasCache).map(k=>_atasCache[k]).filter(a=>a&&a.data>=ini&&a.data<=fim)); }
  const meses=_mesesAtas(ini,fim);
  return Promise.all(meses.map(m=>_db.ref(ATAS_PATH+"/"+m).once("value").then(s=>s.val()||{}).catch(()=>({}))))
    .then(buckets=>{
      const out=[];
      buckets.forEach(b=>Object.keys(b).forEach(id=>{ const a=b[id]; if(a&&a.data>=ini&&a.data<=fim){ out.push(Object.assign({_id:id},a)); if(a.slotKey)_atasCache[a.slotKey]=Object.assign({_id:id,_mes:String(a.data||"").slice(0,7)},a); } }));
      return out;
    });
}
function _lerAlocacoesAtas(ini,fim){
  if(_db) return _lerBucketsPorPeriodo(ini,fim).then(b=>filtrarDadosPorDataExata(b,ini,fim));
  return Promise.resolve(filtrarDadosPorDataExata(DATA,ini,fim));   // modo local: filtra DATA em memória
}
function aplicarPeriodoAtas(){
  const ini=el("atasDataInicio")?el("atasDataInicio").value:"";
  const fim=el("atasDataFim")?el("atasDataFim").value:"";
  if(!ini||!fim){ alert("Selecione as datas de início e fim."); return; }
  if(ini>fim){ alert("A data inicial não pode ser maior que a final."); return; }
  const body=el("atasBody"); if(body) body.innerHTML=`<div class="rep-empty" style="padding:30px">Carregando atas do período…</div>`;
  Promise.all([_lerAlocacoesAtas(ini,fim), _lerAtasPorPeriodo(ini,fim)]).then(function(res){
    _atasLinhas=_montarLinhasAtas(res[0]||{}, res[1]||[]);
    _popularFiltrosAtas();
    renderAtasReport();
    lucideRefresh();
  }).catch(function(e){ console.warn("[atas] relatório:",e); if(body)body.innerHTML=`<div class="rep-empty" style="padding:30px">Falha ao carregar. Verifique as Regras do Firebase para ${ATAS_PATH}.</div>`; });
}
function _montarLinhasAtas(aloc, atas){
  const ataPorSlot={}; atas.forEach(a=>{ if(a&&a.slotKey)ataPorSlot[a.slotKey]=a; });
  const linhas=[]; const usados={};
  Object.keys(aloc).forEach(k=>{
    const r=aloc[k]; if(!r)return;
    const atv=atividadeObj(r.atividade);
    if(!(atv&&atv.exigeAta))return;                       // só slots que exigem ata
    const p=k.split("__"); const analista=p[0], iso=p[1], slot=p[2];
    const cliente=(r.cliente&&r.cliente!=="Livre")?r.cliente:"";
    const proj=cliente?REG.projetos.find(x=>x.nome===cliente):null;
    const gp=proj&&proj.gp?proj.gp:"";
    const ata=ataPorSlot[k]||null;
    const status=ata?(ata.envioConfirmado?"enviada":(ata.impressa?"impressa":"gerada")):"pendente";
    linhas.push({slotKey:k, analista, iso, slot, atividade:r.atividade||"", cliente, gp, status, obrigatoria:true, ata});
    usados[k]=true;
  });
  atas.forEach(a=>{                                       // atas órfãs (atividade deixou de exigir após gerar)
    if(!a||!a.slotKey||usados[a.slotKey])return;
    const p=a.slotKey.split("__");
    const status=a.envioConfirmado?"enviada":(a.impressa?"impressa":"gerada");
    const proj=a.cliente?REG.projetos.find(x=>x.nome===a.cliente):null;
    linhas.push({slotKey:a.slotKey, analista:a.analista||p[0], iso:a.data||p[1], slot:a.slot||p[2], atividade:a.atividade||"", cliente:a.cliente||"", gp:a.gp||(proj&&proj.gp)||"", status, obrigatoria:false, ata:a});
    usados[a.slotKey]=true;
  });
  linhas.sort((x,y)=> String(y.iso||"").localeCompare(String(x.iso||"")) || String(x.analista||"").localeCompare(String(y.analista||"")));
  return linhas;
}
function _popularFiltrosAtas(){
  const host=el("atasFiltros"); if(!host)return;
  const uniq=arr=>[...new Set(arr.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
  const clientes=uniq(_atasLinhas.map(l=>l.cliente));
  const analistas=uniq(_atasLinhas.map(l=>l.analista));
  const gps=uniq(_atasLinhas.map(l=>l.gp));
  const status=[["todos","Todos"],["pendente","Pendente"],["gerada","Gerada"],["impressa","Impressa"],["enviada","Enviada"]];
  const opt=(arr,sel)=>`<option value="todos"${sel==="todos"?" selected":""}>Todos</option>`+arr.map(v=>`<option value="${enc(v)}"${sel===v?" selected":""}>${enc(v)}</option>`).join("");
  host.innerHTML=`
    <div class="f"><label>Cliente / Projeto</label><select id="atasFCliente">${opt(clientes,_atasFiltro.cliente)}</select></div>
    <div class="f"><label>Analista</label><select id="atasFAnalista">${opt(analistas,_atasFiltro.analista)}</select></div>
    <div class="f"><label>GP</label><select id="atasFGp">${opt(gps,_atasFiltro.gp)}</select></div>
    <div class="f"><label>Status</label><select id="atasFStatus">${status.map(s=>`<option value="${s[0]}"${_atasFiltro.status===s[0]?" selected":""}>${s[1]}</option>`).join("")}</select></div>
    <div class="spacer"></div>`;
  const bind=(id,k)=>{ const e=el(id); if(e)e.addEventListener("change",()=>{ _atasFiltro[k]=e.value; renderAtasReport(); }); };
  bind("atasFCliente","cliente"); bind("atasFAnalista","analista"); bind("atasFGp","gp"); bind("atasFStatus","status");
}
function renderAtasReport(){
  const body=el("atasBody"); if(!body)return;
  const f=_atasFiltro;
  const linhas=_atasLinhas.filter(l=>
    (f.cliente==="todos"||l.cliente===f.cliente) &&
    (f.analista==="todos"||l.analista===f.analista) &&
    (f.gp==="todos"||l.gp===f.gp) &&
    (f.status==="todos"||l.status===f.status));
  const obr=linhas.filter(l=>l.obrigatoria);
  const obrig=obr.length;
  const geradas=obr.filter(l=>l.ata).length;
  const pendentes=obr.filter(l=>l.status==="pendente").length;
  const impressas=linhas.filter(l=>l.ata&&l.ata.impressa).length;
  const enviadas=linhas.filter(l=>l.ata&&l.ata.envioConfirmado).length;
  const indice=obrig?Math.round(geradas/obrig*100):0;
  const acc=indice>=80?"accent-ok":indice>=50?"accent-warn":"accent-bad";
  const pend=obr.filter(l=>l.status==="pendente");
  const rank=campo=>{ const m={}; pend.forEach(l=>{const v=l[campo]||"—"; m[v]=(m[v]||0)+1;}); return Object.keys(m).map(k=>({nome:k,n:m[k]})).sort((a,b)=>b.n-a.n).slice(0,8); };
  const miniTab=(titulo,icone,rows)=>`<div style="flex:1;min-width:240px">
    <div class="kpi-group-title"><span class="ico">${icone}</span>${titulo}</div>
    ${rows.length?`<table class="rep-table"><thead><tr><th>Nome</th><th class="num">Pendentes</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${enc(r.nome)}</td><td class="num">${r.n}</td></tr>`).join("")}</tbody></table>`:`<div class="rep-empty">Sem pendências.</div>`}</div>`;
  const pill=s=>{ const cls={pendente:"sp-pend",gerada:"sp-ger",impressa:"sp-imp",enviada:"sp-env"}[s]||""; const lbl={pendente:"Pendente",gerada:"Gerada",impressa:"Impressa",enviada:"Enviada"}[s]||s; return `<span class="atas-pill ${cls}">${lbl}</span>`; };
  const rows=linhas.map(l=>{ const d=parseISO(l.iso); return `<tr>
      <td class="mono">${enc(fmtDM(d))}/${d.getFullYear()}<div class="sub">${enc(l.slot)}</div></td>
      <td>${enc(l.analista)}</td>
      <td>${enc(l.cliente||"—")}</td>
      <td>${enc(l.atividade||"—")}</td>
      <td>${enc(l.gp||"—")}</td>
      <td>${pill(l.status)}${l.obrigatoria?"":' <span class="atas-extra" title="Atividade não exige ata atualmente">extra</span>'}</td>
    </tr>`; }).join("");
  body.innerHTML=`
    <div class="kpi-group-title"><span class="ico">📋</span>Indicadores do período</div>
    <div class="kpi-grid" style="margin-bottom:18px">
      <div class="kpi-card accent-info"><div class="kpi-l">Slots com obrigação de ata</div><div class="kpi-n">${obrig}</div><div class="kpi-sub">Atividades marcadas como “gera ATA”</div></div>
      <div class="kpi-card accent-ok"><div class="kpi-l">Atas geradas</div><div class="kpi-n">${geradas}</div><div class="kpi-sub">de ${obrig} obrigatórias</div></div>
      <div class="kpi-card ${pendentes>0?'accent-bad':'accent-ok'}"><div class="kpi-l">Atas pendentes</div><div class="kpi-n">${pendentes}</div><div class="kpi-sub">obrigatórias sem geração</div></div>
      <div class="kpi-card ${acc}"><div class="kpi-l">Índice de geração</div><div class="kpi-n">${indice}<span class="unit">%</span></div><div class="kpi-sub">geradas ÷ obrigatórias</div></div>
      <div class="kpi-card accent-proj"><div class="kpi-l">Atas impressas</div><div class="kpi-n">${impressas}</div><div class="kpi-sub">bloqueadas para edição</div></div>
      <div class="kpi-card accent-info"><div class="kpi-l">Envio confirmado</div><div class="kpi-n">${enviadas}</div><div class="kpi-sub">atas com envio validado</div></div>
    </div>
    <div class="kpi-group-title"><span class="ico">🎯</span>Pendências por responsável</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:18px">
      ${miniTab("Analistas","👤",rank("analista"))}
      ${miniTab("Clientes / Projetos","🏢",rank("cliente"))}
      ${miniTab("GPs","🧭",rank("gp"))}
    </div>
    <div class="kpi-group-title"><span class="ico">🗂️</span>Atas do período <span style="font-size:11px;color:var(--fn-faint);font-weight:600;text-transform:none;letter-spacing:normal;margin-left:auto">${linhas.length} registro(s)</span></div>
    ${linhas.length?`<table class="rep-table"><thead><tr><th>Data</th><th>Analista</th><th>Cliente</th><th>Atividade</th><th>GP</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`:`<div class="rep-empty" style="padding:30px">Nenhuma ata ou obrigação de ata no período/escopo selecionado.</div>`}`;
  lucideRefresh();
}

/* ===================== modal INCLUIR ALOCAÇÃO ===================== */
let _incCtx=null; // {analista, iso, slot, prefill}
// Incluir/alterar/liberar alocação exige nível de EDIÇÃO na ação "Grade".
// O escopo (equipe/visão) continua restringindo QUAIS slots podem ser salvos
// via canEditAlloc(); aqui controlamos apenas o acesso à ação em si.
function canIncluirAlocacao(){return canEditAction("grade");}
function openIncluirAloc(opts){
  opts=opts||{};
  if(!canIncluirAlocacao()){
    alert("Apenas administradores e gestores podem incluir ou alterar alocações.");return;
  }
  _incCtx=opts;
  // Popula analistas — admin/gestor veem todos (não filtra por canEditAlloc, já é privilegiado)
  const sel=el("iAnalista");
  const todos=visibleAnalysts();
  sel.innerHTML=todos.map(n=>`<option ${n===opts.analista?"selected":""}>${enc(n)}</option>`).join("")||'<option disabled>Nenhum analista cadastrado</option>';
  // Data + slot
  el("iData").value = opts.iso || toISO(new Date());
  const slotsValidos=SLOTS.filter(s=>!s.lunch);
  el("iSlot").innerHTML=slotsValidos.map(s=>`<option value="${s.id}" ${s.id===opts.slot?"selected":""}>${s.id} · ${s.time}</option>`).join("");
  // Atividade + projeto + obs
  const r=opts.prefill||null;
  renderAtividadeSelectInc((r&&r.atividade)||"");
  buildClienteSelectInc((r&&r.cliente && r.cliente!=="Livre") ? r.cliente : "");
  el("iObs").value = (r&&r.obs)||"";
  atualizaCamposPorTipoInc();
  // Intervalo: padrão = data + 4 dias úteis
  const isoBase=el("iData").value;
  el("iRangeFrom").value=isoBase;
  try{ el("iRangeTo").value=toISO(addDays(monday(parseISO(isoBase)),4)); }catch(e){ el("iRangeTo").value=isoBase; }
  // Ritual: padrão = a partir da data base por ~8 semanas; dia da semana = o da data base (se útil)
  _ritualDows=new Set();
  try{
    const bd=parseISO(isoBase); const bwd=bd.getDay();
    if(bwd>=1&&bwd<=5)_ritualDows.add(bwd);
    el("iRitualFrom").value=isoBase;
    el("iRitualTo").value=toISO(addDays(bd,56));
  }catch(e){ el("iRitualFrom").value=isoBase; el("iRitualTo").value=isoBase; }
  el("iRitualCad").value="1";
  el("iRitualDows").querySelectorAll(".dow-chip").forEach(c=>c.classList.toggle("on",_ritualDows.has(+c.dataset.wd)));
  updateRitualPreview();
  // Avisos
  el("iAvisos").style.display="none"; el("iAvisos").innerHTML="";
  el("iBulkPanel").open=false;
  el("incOverlay").classList.add("open");
  lucideRefresh();
}
function closeIncluirAloc(){el("incOverlay").classList.remove("open");_incCtx=null;}

// Versões "Inc" das funções de suporte — operam nos campos i*
function tipoAtividadeSelecionadaInc(){
  const sel=el("iAtividade"); if(!sel)return null;
  const opt=sel.options[sel.selectedIndex]; if(!opt)return null;
  return opt.dataset.tipo || tipoLegado(sel.value);
}
function renderAtividadeSelectInc(selecionada){
  const sel=el("iAtividade"); if(!sel)return;
  // No incluir alocação não há projeto pré-selecionado — listamos TODAS as atividades agrupadas por tipo
  // O filtro projeto×atividade acontece dinamicamente quando o usuário escolhe o projeto.
  const grupos=TIPOS_ATIVIDADE.map(t=>{
    const its=atividadesAtivasPorTipo(t.id);
    if(!its.length)return "";
    const opts=its.map(a=>`<option value="${enc(a.nome)}" data-tipo="${t.id}" data-exige-obs="${a.exigeObs?1:0}" ${a.nome===selecionada?"selected":""}>${enc(a.nome)}</option>`).join("");
    return `<optgroup label="${t.icone} ${t.nome}">${opts}</optgroup>`;
  }).join("");
  sel.innerHTML=`<option value="">— Selecione a atividade —</option>`+grupos;
  if(selecionada)sel.value=selecionada;
}
function buildClienteSelectInc(sel){
  const tipoAtv=tipoAtividadeSelecionadaInc();
  let candidatos=projetoNomes().filter(p=>{
    if(!tipoAtv)return true;
    const obj=REG.projetos.find(x=>x.nome===p);
    return obj && projetoCompativelComAtividade(obj.tipo, tipoAtv);
  });
  // Para o analista selecionado, mostra "do analista" vs "outros"
  const an=el("iAnalista").value;
  const vinc=an?projetosDoAnalista(an).filter(p=>candidatos.includes(p)).sort(cmpAlpha):[];
  const outros=candidatos.filter(p=>!vinc.includes(p)).sort(cmpAlpha);
  let html=`<option value="">— Selecione o projeto —</option>`;
  if(vinc.length)  html+=`<optgroup label="Projetos do analista">`+vinc.map(i=>`<option ${i===sel?"selected":""}>${enc(i)}</option>`).join("")+`</optgroup>`;
  if(outros.length)html+=`<optgroup label="Outros projetos">`+outros.map(i=>`<option ${i===sel?"selected":""}>${enc(i)}</option>`).join("")+`</optgroup>`;
  if(!vinc.length && !outros.length)html+=`<option disabled>Nenhum projeto com este tipo cadastrado.</option>`;
  el("iCliente").innerHTML=html;
}
function atualizaCamposPorTipoInc(){
  const tipo=tipoAtividadeSelecionadaInc();
  const w=el("iClienteWrap");
  if(!w)return;
  const precisaProjeto=(tipo==="discovery"||tipo==="implantacao");
  w.style.display = precisaProjeto ? "" : "none";
  // label de obs
  const opt=el("iAtividade").options[el("iAtividade").selectedIndex];
  const exige = opt && opt.dataset.exigeObs==="1";
  el("iObsLabel").innerHTML = exige
    ? 'Observação do slot <b style="color:var(--proj)">(obrigatória para esta atividade)</b>'
    : 'Observação do slot <span style="color:var(--faint);font-weight:500">(opcional, máx. 1000)</span>';
}
function currentClienteInc(){
  const tipo=tipoAtividadeSelecionadaInc();
  if(tipo!=="discovery" && tipo!=="implantacao") return "Livre";
  return el("iCliente").value || "Livre";
}
function validarIncFields(){
  // Blindagem da camada de gravação: sem nível de EDIÇÃO na Grade, nenhuma
  // inclusão/alteração é permitida — mesmo que o modal tenha sido alcançado
  // por qualquer via (ex.: permissão revogada com o modal aberto).
  if(!canIncluirAlocacao()){alert("Você está em modo somente leitura na Grade — inclusão e alteração não estão disponíveis.");return null;}
  const an=el("iAnalista").value;
  if(!an){alert("Selecione um analista.");return null;}
  if(!el("iData").value){alert("Selecione a data.");return null;}
  // Bloqueia sábado e domingo — não fazem parte do calendário operacional
  const wd=parseISO(el("iData").value).getDay();
  if(wd===0||wd===6){alert("Sábado e domingo não fazem parte do calendário operacional. Escolha um dia útil (segunda a sexta).");return null;}
  if(!el("iSlot").value){alert("Selecione o slot.");return null;}
  if(!el("iAtividade").value){alert("Selecione a atividade.");return null;}
  const tipo=tipoAtividadeSelecionadaInc();
  const cli=currentClienteInc();
  if((tipo==="discovery"||tipo==="implantacao") && (!cli || cli==="Livre")){
    alert("Atividades de Discovery e Implantação exigem projeto.");return null;
  }
  // observação obrigatória?
  const opt=el("iAtividade").options[el("iAtividade").selectedIndex];
  const exige = opt && opt.dataset.exigeObs==="1";
  const obs=el("iObs").value.trim();
  if(exige && !obs){alert("Esta atividade exige observação. Preencha o campo antes de salvar.");el("iObs").focus();return null;}
  // Permissão final (analista pode estar inativo a partir de certa data)
  const iso=el("iData").value;
  if(!canEditAlloc(an,iso)){alert("Você não tem permissão para alocar este analista nesta data.");return null;}
  return {an,iso,slot:el("iSlot").value,atividade:el("iAtividade").value,cliente:cli,obs};
}
function montaRegistroInc(antigo, dados){
  const reg={atividade:dados.atividade, cliente:dados.cliente};
  if(dados.obs)reg.obs=dados.obs;
  const obsAntiga=(antigo&&antigo.obs)||"";
  if((dados.obs||"")!==obsAntiga){
    reg.obsAt=new Date().toISOString();
    reg.obsBy=(_currentUser&&_currentUser.email)||"local";
  }else if(antigo){
    if(antigo.obsAt)reg.obsAt=antigo.obsAt;
    if(antigo.obsBy)reg.obsBy=antigo.obsBy;
  }
  return reg;
}
/* ===================== Notificação de alocação por e-mail (v1.52.0) =====================
   Envia um e-mail quando uma alocação é realizada (slot único, dia, semana, intervalo, ritual).
   Canal: função serverless no Vercel (/api/notificar-alocacao) que dispara via Resend.
   A chave do Resend fica SOMENTE no servidor (env var no Vercel) — nunca no client.
   Destinatários: o analista alocado + o líder dele (resolvidos de REG).
   Respeita o flag por atividade: só envia se a atividade tiver enviaEmail===true (default: NÃO envia).
   Fire-and-forget: nunca lança, nunca bloqueia o saveAlloc(). */
const NOTIFY_ENDPOINT = "/api/notificar-alocacao"; // mesma origem do app no Vercel
const NOTIFY_ENABLED  = true;                       // desliga todo o envio se precisar
const NOTIFY_TOKEN    = "";                          // (opcional) mesmo valor de NOTIFY_TOKEN no Vercel

function _emailDoAnalista(nome){
  const a=(REG.analistas||[]).find(x=>x.nome===nome);
  return a && a.email ? String(a.email).trim() : "";
}
function _emailDoLiderDoAnalista(nome){
  const a=(REG.analistas||[]).find(x=>x.nome===nome);
  const lid=a && a.lider ? a.lider : "";
  return lid ? String(emailLider(lid)||"").trim() : "";
}
// true se a atividade está configurada para enviar e-mail (default: envia, p/ retrocompat)
// true só quando a atividade está explicitamente marcada p/ enviar (default: NÃO envia — demanda pendente)
function _atividadeEnviaEmail(nome){
  const atv=(typeof atividadeObj==="function")?atividadeObj(nome):null;
  return !!(atv && atv.enviaEmail===true);
}
function notificarAlocacao(o){
  try{
    if(!NOTIFY_ENABLED) return;
    if(!String(location.protocol).startsWith("http")) return; // ignora file:// / dev local
    const analista=o&&o.analista; if(!analista) return;
    if(!_atividadeEnviaEmail(o.atividade)) return;             // atividade marcada p/ NÃO enviar
    const to=[...new Set([_emailDoAnalista(analista), _emailDoLiderDoAnalista(analista)])]
      .filter(e=>/.+@.+\..+/.test(e));
    if(!to.length) return; // ninguém com e-mail cadastrado
    const proj=(o.projeto&&o.projeto!=="Livre")?o.projeto:"";
    const payload={
      to, tipo:o.tipo||"single", analista,
      atividade:o.atividade||"", projeto:proj,
      slot:o.slot||"", quando:o.quando||"", obs:o.obs||"",
      por:(_currentUser&&_currentUser.email)||"sistema"
    };
    const headers={"Content-Type":"application/json"};
    if(NOTIFY_TOKEN) headers["x-notify-token"]=NOTIFY_TOKEN;
    fetch(NOTIFY_ENDPOINT,{method:"POST",headers,body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
  }catch(_e){ /* nunca propaga */ }
}

function saveIncluirAloc(){
  const d=validarIncFields(); if(!d)return;
  const k=key(d.an,d.iso,d.slot);
  const antigo=DATA[k];
  if(antigo && !confirm(`Já existe uma alocação para ${d.an} em ${fmtDM(parseISO(d.iso))}/${parseISO(d.iso).getFullYear()} · ${d.slot}:\n\n${antigo.atividade||"—"} · ${antigo.cliente||"—"}\n\nDeseja sobrescrever?`))return;
  const novo=montaRegistroInc(antigo,d);
  DATA[k]=novo;
  audit(antigo?"allocation.update":"allocation.create", k, antigo||null, novo);
  notificarAlocacao({tipo:"single", analista:d.an, atividade:d.atividade, projeto:d.cliente, slot:d.slot, quando:`${fmtDM(parseISO(d.iso))}/${parseISO(d.iso).getFullYear()}`, obs:d.obs});
  saveAlloc(); renderAll();
  // pergunta se quer incluir outra
  if(confirm("Alocação salva.\n\nDeseja incluir OUTRA alocação?\n\n• OK: limpa data/slot e mantém analista/atividade/projeto preenchidos\n• Cancelar: fecha o modal")){
    // limpa só data e slot (mantém o resto preenchido para repetição)
    let novoDate=addDays(parseISO(d.iso),1);
    while(novoDate.getDay()===0||novoDate.getDay()===6) novoDate=addDays(novoDate,1); // pula fim de semana
    const novoIso=toISO(novoDate);
    el("iData").value=novoIso;
    el("iObs").value="";
    // mantém analista, atividade, projeto e demais
    el("iAvisos").innerHTML=`<i data-lucide="check-circle-2" class="icon-14"></i> Última alocação salva: ${enc(d.an)} · ${fmtDM(parseISO(d.iso))}/${parseISO(d.iso).getFullYear()} · ${d.slot}`;
    el("iAvisos").style.display="block";
    el("iAvisos").style.color="var(--ok)";
    lucideRefresh();
  }else{
    closeIncluirAloc();
  }
}

// Aplicar em lote (versão Inc)
function applyDayInc(){
  const d=validarIncFields(); if(!d)return;
  const slots=SLOTS.filter(s=>!s.lunch).map(s=>s.id);
  if(!confirm(`Aplicar "${d.atividade}" em todos os ${slots.length} slots do dia ${fmtDM(parseISO(d.iso))}/${parseISO(d.iso).getFullYear()} para ${d.an}?\n\nSlots já preenchidos serão sobrescritos.`))return;
  slots.forEach(sid=>{const antigo=DATA[key(d.an,d.iso,sid)]; DATA[key(d.an,d.iso,sid)]=montaRegistroInc(antigo,d);});
  audit("allocation.batch.day", `${d.an} · ${d.iso}`, null, {atividade:d.atividade, projeto:d.cliente, slots:slots.length}, {note:`Aplicação em lote · dia inteiro (${slots.length} slots)`});
  notificarAlocacao({tipo:"day", analista:d.an, atividade:d.atividade, projeto:d.cliente, slot:`Dia inteiro (${slots.length} slots)`, quando:`${fmtDM(parseISO(d.iso))}/${parseISO(d.iso).getFullYear()}`, obs:d.obs});
  saveAlloc(); renderAll();
  alert(`✅ ${slots.length} slots aplicados.`);
  closeIncluirAloc();
}
function applyWeekInc(){
  const d=validarIncFields(); if(!d)return;
  const ws=monday(parseISO(d.iso));
  for(let i=0;i<5;i++){const iso=toISO(addDays(ws,i));const antigo=DATA[key(d.an,iso,d.slot)];
    DATA[key(d.an,iso,d.slot)]=montaRegistroInc(antigo,Object.assign({},d,{iso}));}
  audit("allocation.batch.week", `${d.an} · ${d.slot}`, null, {atividade:d.atividade, projeto:d.cliente, semana:toISO(ws)}, {note:"Aplicação em lote · semana (5 dias)"});
  notificarAlocacao({tipo:"week", analista:d.an, atividade:d.atividade, projeto:d.cliente, slot:d.slot, quando:`Semana de ${fmtDM(ws)} (5 dias úteis)`, obs:d.obs});
  saveAlloc(); renderAll();
  alert(`✅ 5 dias úteis aplicados.`);
  closeIncluirAloc();
}
function applyRangeInc(){
  const d=validarIncFields(); if(!d)return;
  const from=el("iRangeFrom").value, to=el("iRangeTo").value;
  if(!from||!to){alert("Informe as datas De e Até.");return;}
  if(from>to){alert("A data De precisa ser anterior ou igual à data Até.");return;}
  const datas=[]; const a=parseISO(from), b=parseISO(to);
  for(let dt=new Date(a);dt<=b;dt=addDays(dt,1)){const w=dt.getDay();
    if(w>=1&&w<=5) datas.push(toISO(dt));}
  if(!datas.length){alert("O intervalo selecionado não contém dias úteis.");return;}
  if(!confirm(`Aplicar "${d.atividade}" no slot ${d.slot} para ${datas.length} dia(s) úteis (${fmtDM(parseISO(from))} → ${fmtDM(parseISO(to))}) de ${d.an}?\n\nSlots já preenchidos serão sobrescritos.`))return;
  datas.forEach(iso=>{const antigo=DATA[key(d.an,iso,d.slot)];
    DATA[key(d.an,iso,d.slot)]=montaRegistroInc(antigo,Object.assign({},d,{iso}));});
  audit("allocation.batch.range", `${d.an} · ${d.slot}`, null, {atividade:d.atividade, projeto:d.cliente, de:from, ate:to, dias:datas.length}, {note:`Aplicação em lote · intervalo (${datas.length} dias)`});
  notificarAlocacao({tipo:"range", analista:d.an, atividade:d.atividade, projeto:d.cliente, slot:d.slot, quando:`${fmtDM(parseISO(from))} → ${fmtDM(parseISO(to))} (${datas.length} dias úteis)`, obs:d.obs});
  saveAlloc(); renderAll();
  alert(`✅ ${datas.length} slots aplicados.`);
  closeIncluirAloc();
}

/* ===================== Ritual / recorrência (slot × dia da semana × semanas) =====================
   Permite alocar atividades recorrentes como a "weekly" (toda quarta no Slot3): escolhe-se o slot
   (campo iSlot acima), um ou mais dias da semana, a cadência (toda semana / quinzenal / a cada N)
   e o período. O sistema calcula as ocorrências e aplica a atividade/projeto/obs em cada uma. */
let _ritualDows=new Set();   // dias-da-semana selecionados (0=Dom..6=Sáb; só 1..5 são usados)

// Validação dos campos NÃO relacionados à data (analista, slot, atividade, projeto, obs).
// Reutilizada pelo ritual, que calcula suas próprias datas.
function validarIncBaseFields(){
  if(!canIncluirAlocacao()){alert("Você está em modo somente leitura na Grade — inclusão e alteração não estão disponíveis.");return null;}
  const an=el("iAnalista").value;
  if(!an){alert("Selecione um analista.");return null;}
  if(!el("iSlot").value){alert("Selecione o slot.");return null;}
  if(!el("iAtividade").value){alert("Selecione a atividade.");return null;}
  const tipo=tipoAtividadeSelecionadaInc();
  const cli=currentClienteInc();
  if((tipo==="discovery"||tipo==="implantacao") && (!cli || cli==="Livre")){
    alert("Atividades de Discovery e Implantação exigem projeto.");return null;
  }
  const opt=el("iAtividade").options[el("iAtividade").selectedIndex];
  const exige = opt && opt.dataset.exigeObs==="1";
  const obs=el("iObs").value.trim();
  if(exige && !obs){alert("Esta atividade exige observação. Preencha o campo antes de salvar.");el("iObs").focus();return null;}
  return {an, slot:el("iSlot").value, atividade:el("iAtividade").value, cliente:cli, obs};
}

// Calcula as datas (ISO) do ritual a partir dos dias-da-semana, cadência e intervalo.
function ritualDates(){
  const from=el("iRitualFrom").value, to=el("iRitualTo").value;
  if(!from||!to||from>to) return [];
  if(!_ritualDows.size) return [];
  const cad=Math.max(1, parseInt(el("iRitualCad").value,10)||1);
  const baseMon=monday(parseISO(from));
  const out=[]; const a=parseISO(from), b=parseISO(to);
  for(let dt=new Date(a); dt<=b; dt=addDays(dt,1)){
    const wd=dt.getDay();
    if(!_ritualDows.has(wd)) continue;          // só dias-da-semana escolhidos
    if(wd===0||wd===6) continue;                // nunca fim de semana
    const wkIdx=Math.round((monday(dt)-baseMon)/(7*86400000)); // semana relativa ao início
    if(wkIdx % cad !== 0) continue;             // respeita a cadência
    out.push(toISO(dt));
  }
  return out;
}

function ritualDowsLabel(){
  return [..._ritualDows].sort((x,y)=>x-y).map(w=>DOW[w]).join(", ") || "—";
}
function ritualCadLabel(){
  const cad=parseInt(el("iRitualCad").value,10)||1;
  return cad===1?"toda semana":cad===2?"quinzenal":`a cada ${cad} semanas`;
}

// Atualiza a prévia (quantas ocorrências e amostra de datas).
function updateRitualPreview(){
  const box=el("iRitualPreview"); if(!box)return;
  if(!_ritualDows.size){ box.innerHTML="Selecione os dias da semana para ver as ocorrências."; return; }
  const datas=ritualDates();
  if(!datas.length){ box.innerHTML="Nenhuma ocorrência no intervalo. Ajuste dias, cadência ou datas."; return; }
  const amostra=datas.slice(0,6).map(iso=>{const d=parseISO(iso);return DOW[d.getDay()]+" "+fmtDM(d);}).join(" · ");
  const resto=datas.length>6?` … (+${datas.length-6})`:"";
  box.innerHTML=`<b>${datas.length}</b> ocorrência(s) · ${ritualDowsLabel()} · ${ritualCadLabel()}<br>${amostra}${resto}`;
}

function applyRitualInc(){
  const d=validarIncBaseFields(); if(!d)return;
  if(!_ritualDows.size){alert("Selecione ao menos um dia da semana para o ritual.");return;}
  const from=el("iRitualFrom").value, to=el("iRitualTo").value;
  if(!from||!to){alert("Informe as datas De e Até do ritual.");return;}
  if(from>to){alert("A data De precisa ser anterior ou igual à data Até.");return;}
  const datas=ritualDates();
  if(!datas.length){alert("Nenhuma data corresponde ao ritual. Verifique dias da semana, cadência e intervalo.");return;}
  // Permissão por data (analista pode estar inativo a partir de certa data)
  const aplicaveis=datas.filter(iso=>canEditAlloc(d.an,iso));
  const bloqueadas=datas.length-aplicaveis.length;
  if(!aplicaveis.length){alert("Você não tem permissão para alocar este analista nas datas do ritual.");return;}
  if(!confirm(`Aplicar ritual "${d.atividade}"${d.cliente&&d.cliente!=="Livre"?" · "+d.cliente:""}\nSlot: ${d.slot}\nDias: ${ritualDowsLabel()} · ${ritualCadLabel()}\nPeríodo: ${fmtDM(parseISO(from))} → ${fmtDM(parseISO(to))}\n\n${aplicaveis.length} ocorrência(s) para ${d.an}.\nSlots já preenchidos serão sobrescritos.`))return;
  aplicaveis.forEach(iso=>{const antigo=DATA[key(d.an,iso,d.slot)];
    DATA[key(d.an,iso,d.slot)]=montaRegistroInc(antigo,Object.assign({},d,{iso}));});
  audit("allocation.batch.ritual", `${d.an} · ${d.slot}`, null,
    {atividade:d.atividade, projeto:d.cliente, dias:[..._ritualDows].sort((x,y)=>x-y), cadencia:parseInt(el("iRitualCad").value,10)||1, de:from, ate:to, ocorrencias:aplicaveis.length},
    {note:`Ritual · ${ritualDowsLabel()} · ${ritualCadLabel()} · ${aplicaveis.length} ocorrência(s)`});
  notificarAlocacao({tipo:"ritual", analista:d.an, atividade:d.atividade, projeto:d.cliente, slot:d.slot, quando:`Ritual ${ritualDowsLabel()} · ${fmtDM(parseISO(from))} → ${fmtDM(parseISO(to))} (${aplicaveis.length} ocorrência(s))`, obs:d.obs});
  saveAlloc(); renderAll();
  alert(`✅ Ritual aplicado em ${aplicaveis.length} ocorrência(s).`+(bloqueadas?`\n${bloqueadas} data(s) ignorada(s) por permissão/desligamento.`:""));
  closeIncluirAloc();
}


/* ===================== Ações: cadastros ===================== */
let actTab="", actEditing=null /* item ou {__new:true} */, actSearch="", actShowInativos=false;
let _cadastrosCarregados = {}; // tipo -> true; evita baixar o mesmo cadastro repetidamente na sessão
function openActions(){
  if(!canViewCadastros()){alert("Você não tem acesso a Ações & Cadastros.");return;}
  _fecharOutrasTelas("actOverlay");
  try{ensureCapIntegration();}catch(e){}
  actTab=""; actEditing=null; actSearch="";
  el("actOverlay").classList.add("open");
  renderActions();
}
function closeActions(){el("actOverlay").classList.remove("open");actEditing=null;}
function _regKeyPorCadastro(tab){
  return ({projetos:"projetos",analistas:"analistas",atividades:"atividades",lideres:"lideres",gps:"gps",feriados:"feriados"})[tab] || "";
}
function _carregarCadastroTipo(tab){
  if(!tab) return Promise.resolve();
  if(tab==="importar") return Promise.resolve();
  if(_cadastrosCarregados[tab]) return Promise.resolve();
  const body=el("actBody"); if(body) body.innerHTML=`<div class="loading">Buscando cadastro de ${enc(tab)}…</div>`;
  if(tab==="usuarios"){
    if(!_db){ _cadastrosCarregados[tab]=true; return Promise.resolve(); }
    return _db.ref(USERS_PATH).once("value").then(s=>{ _usersCache=s.val()||{}; _cadastrosCarregados[tab]=true; });
  }
  if(tab==="auditoria"){
    // A auditoria já possui leitura própria paginada/limitada; não força histórico de alocações.
    _cadastrosCarregados[tab]=true; return Promise.resolve();
  }
  const k=_regKeyPorCadastro(tab);
  if(!k || !_db){ _cadastrosCarregados[tab]=true; return Promise.resolve(); }
  return _db.ref(DB_PATH+"/reg/"+k).once("value").then(s=>{
    const v=s.val();
    if(v!=null) REG[k]=v;
    _cadastrosCarregados[tab]=true;
  }).catch(e=>{ console.warn("[cadastros] erro ao buscar "+tab, e); _cadastrosCarregados[tab]=true; });
}
function renderCadastroHome(){
  const b=el("actBody"); if(!b) return;
  const cards=[
    ["projetos","Projetos","briefcase","Cadastro de projetos, etapas, GP, líder e Go-Live"],
    ["analistas","Analistas","users","Cadastro de analistas, squads e vínculos"],
    ["atividades","Atividades","tag","Tipos de atividade, exigência de observação e regras"],
    ["lideres","Líderes","user-cog","Cadastro de líderes de implantação"],
    ["gps","Gerentes","user-check","Cadastro de gerentes de projeto"],
    ["feriados","Feriados","calendar-x","Calendário usado nas regras de dias úteis"],
  ];
  if(canViewUsers()) cards.push(["usuarios","Usuários","shield","Usuários e permissões por ação"]);
  if(isAdmin()) cards.push(["importar","Importar","upload","Importação de dados"]);
  if(isAdmin()) cards.push(["auditoria","Auditoria","history","Eventos recentes do sistema"]);
  b.innerHTML=`<div class="rep-empty" style="text-align:left"><b>Escolha um tipo de cadastro.</b><br>Nenhum cadastro é buscado ao abrir esta tela. O sistema consulta somente o tipo selecionado.</div>
    <div class="home-cards" style="padding:16px 0;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      ${cards.map(c=>`<button class="home-card" data-cadtab="${c[0]}" style="text-align:left"><div class="hc-ico"><i data-lucide="${c[2]}"></i></div><div class="hc-title">${enc(c[1])}</div><div class="hc-sub">${enc(c[3])}</div></button>`).join("")}
    </div>`;
  b.querySelectorAll("[data-cadtab]").forEach(btn=>btn.addEventListener("click",()=>{
    actTab=btn.dataset.cadtab; actEditing=null; actSearch="";
    _carregarCadastroTipo(actTab).then(renderActions);
  }));
  lucideRefresh();
}
function renderTabs(){
  // Agrupa as abas por seção (visual estilo OPUS)
  const grupos=[
    {label:"Operação", abas:[
      ["projetos","Projetos","briefcase",REG.projetos.length],
      ["analistas","Analistas","users",REG.analistas.length],
      ["atividades","Atividades","tag",(REG.atividades||[]).length],
    ]},
    {label:"Pessoas", abas:[
      ["lideres","Líderes","user-cog",REG.lideres.length],
      ["gps","Gerentes","user-check",(REG.gps||[]).length],
    ]},
    {label:"Calendário", abas:[
      ["feriados","Feriados","calendar-x",(REG.feriados||[]).length],
    ]},
  ];
  // Sessão Admin (condicional)
  const admin=[];
  if(canViewUsers())admin.push(["usuarios","Usuários","shield",Object.keys(_usersCache).length]);
  if(isAdmin())admin.push(["importar","Importar","upload","" ]);
  if(isAdmin())admin.push(["auditoria","Auditoria","history",""]);
  if(admin.length)grupos.push({label:"Administração", abas:admin});

  const html=grupos.map(g=>{
    const abasOrd=[...g.abas].sort((a,b)=>a[1].localeCompare(b[1],"pt",{sensitivity:"base"}));
    const itens=abasOrd.map(([id,lb,ico,n])=>`<button data-tab="${id}" class="${id===actTab?'on':''}"><i data-lucide="${ico}"></i><span>${lb}</span>${n!==""?`<span class="count">${n}</span>`:""}</button>`).join("");
    return `<div class="group-title">${g.label}</div>${itens}`;
  }).join("");
  el("actTabs").innerHTML=html;
  el("actTabs").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
    actTab=b.dataset.tab;actEditing=null;actSearch="";
    _carregarCadastroTipo(actTab).then(renderActions);
  }));
  lucideRefresh();
}
function renderActions(){renderTabs();lucideRefresh();if(!actTab){renderCadastroHome();return;}if(actTab==="usuarios"){renderUsers();return;}if(actTab==="importar"){renderImporter();return;}if(actTab==="auditoria"){renderAuditoria();return;}if(actEditing){renderForm();}else{renderList();}}

function renderList(){ lucideRefresh(); /* Fase 4: auto-cobre icones em qualquer caminho */
  const b=el("actBody");
  const addLabel={projetos:"+ Novo projeto",analistas:"+ Novo analista",lideres:"+ Novo líder",gps:"+ Novo gerente",atividades:"+ Nova atividade",feriados:"+ Novo feriado"}[actTab];
  let items, rows, total=0, ocultos=0;
  // Helper p/ marcar uma linha como inativa e mostrar selo
  const ina=(isAt)=>isAt?"":' inativo';
  const selo=(isAt)=>isAt?"":' <span class="badge b-inativo">Inativo</span>';
  if(actTab==="projetos"){
    items=REG.projetos.filter(p=>p.nome.toLowerCase().includes(actSearch)).slice().sort(byNome);
    total=items.length;
    if(!actShowInativos){ocultos=items.filter(p=>!isAtivo(p)).length;items=items.filter(p=>isAtivo(p));}
    rows=items.map(p=>{const col=colorFor(p.nome);const at=isAtivo(p);const t=TIPOS_ATIVIDADE.find(x=>x.id===(p.tipo||"implantacao"))||{nome:"—",icone:"•"};return `<div class="row${ina(at)}" data-nome="${enc(p.nome)}">
      <div class="av" style="background:${col}">${(p.nome[0]||'?').toUpperCase()}</div>
      <div class="main"><div class="nm">${p.nome}${selo(at)}</div>
      <div class="meta"><span class="badge" style="background:#f5f5f5;color:var(--muted);border:1px solid var(--line);font-weight:700">${t.icone} ${enc(t.nome)}</span><span class="badge b-seg">${p.segmentacao||'—'}</span>${p.categoria?categoriaBadge(p.categoria):''}${statusBadge(p.status)}
      <span>Líder: <b>${p.lider||'—'}</b></span><span>· GP: <b>${p.gp||'—'}</b></span><span>· ${(p.analistas||[]).length} analista(s)</span></div></div>
      <span class="chev">›</span></div>`;}).join("");
  }else if(actTab==="analistas"){
    items=REG.analistas.filter(a=>a.nome.toLowerCase().includes(actSearch)).slice().sort(byNome);
    total=items.length;
    if(!actShowInativos){ocultos=items.filter(a=>!isAtivo(a)).length;items=items.filter(a=>isAtivo(a));}
    rows=items.map(a=>{const np=projetosDoAnalista(a.nome).length;const at=isAtivo(a);return `<div class="row${ina(at)}" data-nome="${enc(a.nome)}">
      <div class="av" style="background:${colorFor(a.nome)}">${(a.nome[0]||'?').toUpperCase()}</div>
      <div class="main"><div class="nm">${a.nome}${selo(at)}</div>
      <div class="meta"><span>Squad: <b>${a.squad?enc(a.squad):'—'}</b></span><span>· Líder: <b>${a.lider||'—'}</b></span><span>· ${np} projeto(s)</span>${a.email?`<span>· ✉ ${enc(a.email)}</span>`:""}</div></div>
      <span class="chev">›</span></div>`;}).join("");
  }else if(actTab==="lideres"){
    items=sortAlpha(REG.lideres.filter(l=>l.toLowerCase().includes(actSearch)));
    total=items.length;
    const inativosL=REG.lideresInativos||{};
    if(!actShowInativos){ocultos=items.filter(l=>!!inativosL[l]).length;items=items.filter(l=>!inativosL[l]);}
    rows=items.map(l=>{const na=REG.analistas.filter(a=>a.lider===l && isAtivo(a)).length;const np=REG.projetos.filter(p=>p.lider===l && isAtivo(p)).length;const at=!inativosL[l];const em=emailLider(l);
      return `<div class="row${ina(at)}" data-nome="${enc(l)}">
      <div class="av" style="background:${colorFor(l)}">${(l[0]||'?').toUpperCase()}</div>
      <div class="main"><div class="nm">${l}${selo(at)}</div>
      <div class="meta"><span>${na} analista(s)</span><span>· ${np} projeto(s)</span>${em?`<span>· ✉ ${enc(em)}</span>`:""}</div></div>
      <span class="chev">›</span></div>`;}).join("");
  }else if(actTab==="atividades"){
    items=(REG.atividades||[]).filter(a=>a.nome.toLowerCase().includes(actSearch)).slice().sort(byNome);
    total=items.length;
    if(!actShowInativos){ocultos=items.filter(a=>a.ativo===false).length;items=items.filter(a=>a.ativo!==false);}
    // ordena alfabeticamente pelo nome da atividade
    items=items.slice().sort(byNome);
    rows=items.map(a=>{const at=a.ativo!==false;const t=TIPOS_ATIVIDADE.find(x=>x.id===a.tipo)||{icone:"•",nome:a.tipo||"—"};
      return `<div class="row${ina(at)}" data-nome="${enc(a.nome)}">
      <div class="av" style="background:${colorFor(a.nome)}">${t.icone}</div>
      <div class="main"><div class="nm">${enc(a.nome)}${selo(at)}</div>
      <div class="meta"><span><b>${enc(t.nome)}</b></span>${(a.slotsNecessarios!=null&&a.slotsNecessarios!=='')?`<span>· ${a.slotsNecessarios} slot(s)</span>`:''}${(a.etapa&&ETAPA_BY_ID[a.etapa])?`<span>· ${enc(ETAPA_BY_ID[a.etapa].label)}</span>`:''}${a.exigeObs?'<span>· exige observação</span>':''}${a.exigeAta?'<span>· gera ATA</span>':''}${a.enviaEmail===true?'<span>· com e-mail</span>':''}</div></div>
      <span class="chev">›</span></div>`;}).join("");
  }else if(actTab==="feriados"){
    const sorted=(REG.feriados||[]).filter(f=>f.nome.toLowerCase().includes(actSearch)).slice().sort((a,b)=>(a.data||"").localeCompare(b.data||""));
    rows=sorted.map(f=>{const d=parseISO(f.data);const dd=String(d.getDate()).padStart(2,"0");
      return `<div class="row" data-idx="${REG.feriados.indexOf(f)}">
      <div class="av" style="background:var(--aus)">${dd}</div>
      <div class="main"><div class="nm">${f.nome}</div>
      <div class="meta"><span>${DOW[d.getDay()]}, ${fmtDM(d)}/${d.getFullYear()}</span></div></div>
      <span class="chev">›</span></div>`;}).join("");
  }else{
    items=sortAlpha((REG.gps||[]).filter(g=>g.toLowerCase().includes(actSearch)));
    total=items.length;
    const inativosG=REG.gpsInativos||{};
    if(!actShowInativos){ocultos=items.filter(g=>!!inativosG[g]).length;items=items.filter(g=>!inativosG[g]);}
    rows=items.map(g=>{const np=REG.projetos.filter(p=>p.gp===g && isAtivo(p)).length;const at=!inativosG[g];const em=emailGp(g);
      return `<div class="row${ina(at)}" data-nome="${enc(g)}">
      <div class="av" style="background:${colorFor(g)}">${(g[0]||'?').toUpperCase()}</div>
      <div class="main"><div class="nm">${g}${selo(at)}</div>
      <div class="meta"><span>${np} projeto(s) gerenciado(s)</span>${em?`<span>· ✉ ${enc(em)}</span>`:""}</div></div>
      <span class="chev">›</span></div>`;}).join("");
  }
  const podeTogglar = actTab!=="feriados";
  const toggleHTML = podeTogglar
    ? `<label class="show-inativos"><input type="checkbox" id="toggleInativos" ${actShowInativos?'checked':''}> Mostrar inativos${ocultos?` (${ocultos})`:""}</label>`
    : "";
  b.innerHTML=`<div class="act-toolbar"><h3>${{projetos:'Projetos',analistas:'Analistas',lideres:'Líderes',gps:'Gerentes de Projeto (GP)',atividades:'Atividades',feriados:'Feriados'}[actTab]}</h3>
      ${canEditCadastros()?`<button class="btn primary sm" id="actAdd"><i data-lucide="plus"></i>${addLabel}</button>`:""}
      <input class="search" id="actSearch" placeholder="Buscar…" value="${enc(actSearch)}">${toggleHTML}</div>
    <div class="list">${rows||`<div class="empty-state">${total>0&&ocultos>0?"Todos os registros estão inativos. Marque <b>Mostrar inativos</b> para vê-los.":'Nenhum registro'+(canEditCadastros()?'. Clique em "'+addLabel+'".':' para exibir.')}</div>`}</div>
    ${actTab==="projetos"&&isAdmin()?`<div class="danger-zone" style="margin-top:24px;border:1px solid #e8c9c4;background:#fbeceb;border-radius:13px;padding:14px 16px">
      <div style="font-family:'Inter';font-weight:700;font-size:13px;color:var(--danger);display:flex;align-items:center;gap:7px;margin-bottom:4px"><i data-lucide="alert-triangle"></i>Zona de risco</div>
      <div class="hint" style="margin-bottom:10px">Use esta opção apenas para limpar uma importação errada. <b>A ação é irreversível</b> e afeta toda a equipe imediatamente (sincroniza com a nuvem). Analistas, líderes, GPs e atividades permanecem.</div>
      <button class="btn danger" id="wipeProjetosAloc"><i data-lucide="eraser"></i>Apagar TODOS os projetos e alocações</button>
    </div>`:""}`;
  const s=el("actSearch");s.addEventListener("input",e=>{actSearch=e.target.value.toLowerCase();renderList();const f=el("actSearch");f.focus();f.setSelectionRange(f.value.length,f.value.length);});
  if(podeTogglar){el("toggleInativos").addEventListener("change",e=>{actShowInativos=e.target.checked;renderList();});}
  el("actAdd")&&el("actAdd").addEventListener("click",()=>{actEditing={__new:true};renderForm();});
  // Zona de risco — limpa todos os projetos e alocações
  const wipeBtn=el("wipeProjetosAloc");
  if(wipeBtn)wipeBtn.addEventListener("click",()=>{
    const nProj=(REG.projetos||[]).length;
    const nAloc=Object.keys(DATA||{}).length;
    if(!confirm(`Confirma apagar ${nProj} projeto(s) e ${nAloc} alocação(ões)?\n\nEsta ação é IRREVERSÍVEL e sincroniza com a nuvem imediatamente.`))return;
    const codigo=Math.random().toString(36).slice(2,6).toUpperCase();
    const resp=prompt(`Para confirmar, digite o código: ${codigo}`);
    if(resp!==codigo){alert("Código incorreto. Operação cancelada.");return;}
    REG.projetos=[]; DATA={};
    // remove referências de projetos nos analistas (vínculo projeto→analista já saiu junto)
    persist();
    renderConsultorSelect(); renderAll(); renderActions();
    alert(`Limpeza concluída: ${nProj} projeto(s) e ${nAloc} alocação(ões) removidos.`);
  });
  b.querySelectorAll(".row").forEach(r=>r.addEventListener("click",()=>{
    if(actTab==="feriados"){actEditing=REG.feriados[+r.dataset.idx];renderForm();return;}
    const nome=dec(r.dataset.nome);
    if(actTab==="projetos")      actEditing=REG.projetos.find(p=>p.nome===nome);
    else if(actTab==="analistas")actEditing=REG.analistas.find(a=>a.nome===nome);
    else if(actTab==="atividades")actEditing=(REG.atividades||[]).find(a=>a.nome===nome);
    else /* lideres, gps — guardam só strings; o form lida pelo nome */
      actEditing={nome};
    renderForm();
  }));
}

/* ===================== Aba Previsto no cadastro do projeto · dirigido por ATIVIDADE (Fase 2) =====================
   Fluxo: cada linha = analista + slot + atividade (do cadastro) + data de início.
   A DURAÇÃO vem de slotsNecessarios da atividade (em dias úteis). O término é calculado
   pulando sábados/domingos/feriados. A próxima linha encadeia: início = término anterior + 1 dia útil.
   Cada início é EDITÁVEL: preencher = trava (manual) aquela linha; vazio = re-encadeia. Alterar/
   reordenar uma linha recalcula as seguintes em cascata.
   TRAVA: incluir/editar linhas NÃO grava na grade. Só o botão "Aplicar alocações previstas"
   escreve o previsto (PREV) + realizado nos slots livres (DATA), reconciliando o que mudou.
   Persistência: p.previstoLinhas (com o projeto, via saveReg) + p.previstoAplicadoEm (timestamp). */
let _prevTabLinhas=[];
let _pvProj=null;

function _pvDurAtiv(atvNome){
  const a=(REG.atividades||[]).find(x=>x.nome===atvNome);
  const n=a&&a.slotsNecessarios!=null&&a.slotsNecessarios!==''?parseInt(a.slotsNecessarios,10):NaN;
  return (Number.isFinite(n)&&n>0)?n:1;   // sem previsão de slots → 1 dia útil
}
function _ehDiaUtil(dt){ const fer=feriadosMap(); return dt.getDay()!==0&&dt.getDay()!==6&&!fer[toISO(dt)]; }
function _proxDiaUtil(dt){ let d=new Date(dt),g=0; while(!_ehDiaUtil(d)&&g++<400)d=addDays(d,1); return d; }
// ISO do n-ésimo dia útil contando INCLUSIVO a partir de iniISO.
function _avancaDiasUteis(iniISO,n){
  let d=_proxDiaUtil(parseISO(iniISO)); let c=1,g=0;
  while(c<Math.max(1,n)&&g++<3000){ d=_proxDiaUtil(addDays(d,1)); c++; }
  return toISO(d);
}
// Âncora = data de início da PRIMEIRA etapa preenchida no cadastro do projeto.
function _pvAncora(p){ for(const e of ETAPAS){ const v=p&&p[e.field]; if(v) return v; } return ""; }

function _diasUteisEntre(ini,fim){
  const fer=feriadosMap(); const out=[];
  let d=parseISO(ini); const end=parseISO(fim);
  let guard=0;
  while(d<=end && guard++<2000){ const iso=toISO(d); const wknd=(d.getDay()===0||d.getDay()===6); if(!wknd && !fer[iso]) out.push(iso); d=addDays(d,1); }
  return out;
}
function _pvExpandir(l){ return (l.ini&&l.fim)?_diasUteisEntre(l.ini,l.fim).map(iso=>({iso, k:key(l.an,iso,l.slot)})):[]; }
function _pvNovoId(){ return "L"+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function _garantirHistoricoTudo(){
  return Promise.resolve()
    .then(()=>(typeof _garantirHistoricoCompleto==="function") ? _garantirHistoricoCompleto() : null)
    .then(()=>(typeof _garantirHistoricoCompletoPrev==="function") ? _garantirHistoricoCompletoPrev() : null);
}
function _prevLinhasOverlap(){
  const L=_prevTabLinhas||[]; const pares=[];
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){
    const a=L[i],b=L[j];
    if(a.an===b.an && a.slot===b.slot && a.ini&&b.ini&&a.fim&&b.fim && a.ini<=b.fim && b.ini<=a.fim) pares.push([i,j]);
  }
  return pares;
}
// Recalcula início/fim de TODAS as linhas em cascata (ordem do array).
function _pvRecalcChain(p){
  const L=p&&p.previstoLinhas||[]; let cursorFim=null;
  L.forEach((l,i)=>{
    l.slots=_pvDurAtiv(l.atv);
    let ini;
    if(l.iniManual && l.ini) ini=l.ini;
    else if(cursorFim) ini=toISO(_proxDiaUtil(addDays(parseISO(cursorFim),1)));
    else ini=(i===0?(l.ini||_pvAncora(p)):"")||"";
    if(ini) ini=toISO(_proxDiaUtil(parseISO(ini)));
    l.ini=ini;
    l.fim=ini?_avancaDiasUteis(ini,l.slots):"";
    if(l.fim) cursorFim=l.fim;
  });
}

function _previstoTabHTML(p){
  const slots=SLOTS.filter(s=>!s.lunch);
  const team=(p.analistas||[]).filter(Boolean);
  const ativ=(REG.atividades||[]).filter(a=>a.ativo!==false);
  if(!p.nome){
    return `<div class="pv-proto-banner" style="background:#eef2ff;border-color:#c7d2fe;color:#3730a3"><i data-lucide="info"></i> Salve o projeto (aba “Dados do projeto”) antes de declarar o previsto — o nome do projeto é a referência das alocações.</div>`;
  }
  const ancora=_pvAncora(p);
  const optAtiv=ativ.map(a=>{const d=_pvDurAtiv(a.nome);return `<option value="${enc(a.nome)}" ${a.nome==="Implantação"?"selected":""}>${enc(a.nome)} · ${d} slot(s)</option>`;}).join("");
  return `
  <div class="pv-proto-banner"><i data-lucide="git-compare-arrows"></i> Monte a sequência de atividades: cada uma puxa a duração (<b>slots necessários</b>) do cadastro e calcula o término pulando fim de semana e feriado. A próxima encadeia no dia útil seguinte. <b>Nada vai pra grade</b> até clicar em <b>Aplicar alocações previstas</b>.</div>
  <div class="pv-incl">
    <div class="pvx-incl-grid">
      <div class="f"><label>Analista</label><select id="pvAn">${team.length?team.map(a=>`<option>${enc(a)}</option>`).join(""):'<option value="">— sem time vinculado —</option>'}</select></div>
      <div class="f"><label>Slot</label><select id="pvSlot">${slots.map(s=>`<option value="${s.id}">${s.id}</option>`).join("")}</select></div>
      <div class="f"><label>Atividade</label><select id="pvAtv">${optAtiv}</select></div>
      <div class="f"><label>Início <span class="lbl-soft">· vazio = encadeia</span></label><input type="date" id="pvIni" value="${enc(ancora||'')}"></div>
      <div class="f pv-incl-btn"><label>&nbsp;</label><button class="btn primary" id="pvAdd"><i data-lucide="plus"></i> Incluir</button></div>
    </div>
    <div id="pvWarn" class="pv-warn" style="display:none"></div>
    ${ancora?`<div class="pvx-prev">Âncora do projeto (1ª etapa preenchida): <b>${enc(ancora)}</b> — usada como início da 1ª atividade quando o campo fica vazio.</div>`:`<div class="pvx-prev">Sem data de etapa preenchida no projeto: informe o início da 1ª atividade manualmente.</div>`}
  </div>
  <div class="gp-lbl" style="margin-top:16px">Sequência de atividades previstas</div>
  <div id="pvLinhas"></div>
  <div id="pvResumo"></div>`;
}

function _renderPrevLinhas(){
  const host=el("pvLinhas"); if(!host)return;
  const resumo=el("pvResumo"), warn=el("pvWarn");
  const p=_pvProj;
  if(p) _pvRecalcChain(p);
  const L=_prevTabLinhas||[];
  if(!L.length){
    host.innerHTML=`<div class="hint" style="padding:10px">Nenhuma atividade incluída ainda. Use o formulário acima para montar a sequência.</div>`;
    if(resumo)resumo.innerHTML=""; if(warn)warn.style.display="none"; return;
  }
  const overlaps=_prevLinhasOverlap();
  const flagged=new Set(overlaps.flat());
  let totalSlots=0, termino="", inicio="";
  const head=`<div class="pvx-head"><div>#</div><div>Analista</div><div>Slot</div><div>Atividade</div><div>Início</div><div>Término</div><div>Slots</div><div>Ordem</div><div></div></div>`;
  const rows=L.map((l,idx)=>{
    totalSlots+=(l.slots||0);
    if(l.fim&&(!termino||l.fim>termino))termino=l.fim;
    if(l.ini&&(!inicio||l.ini<inicio))inicio=l.ini;
    const fimTxt=l.fim?`${fmtDM(parseISO(l.fim))}/${parseISO(l.fim).getFullYear()}`:"—";
    const autoCls=l.iniManual?"":"pvx-auto";
    return `<div class="pvx-row${flagged.has(idx)?" pvx-row-warn":""}">
      <div class="pvx-ord">${idx+1}</div>
      <div class="cr-an">${enc(l.an)}</div>
      <div>${enc(l.slot)}</div>
      <div>${enc(l.atv)}</div>
      <div class="${autoCls}"><input type="date" value="${enc(l.ini||'')}" data-idx="${idx}" class="pvx-ini" title="${l.iniManual?'Início manual (trava o encadeamento). Limpe para re-encadear.':'Início automático (encadeado). Preencha para travar.'}"></div>
      <div class="pvx-term">${fimTxt}</div>
      <div>${l.slots||0}</div>
      <div class="pvx-move"><button class="pvx-up" data-idx="${idx}" title="Subir">↑</button><button class="pvx-dn" data-idx="${idx}" title="Descer">↓</button></div>
      <button class="pvx-del" data-idx="${idx}">Remover</button>
    </div>`;
  }).join("");
  host.innerHTML=head+rows;
  host.querySelectorAll(".pvx-del").forEach(b=>b.addEventListener("click",()=>_pvRemoverLinha(+b.dataset.idx)));
  host.querySelectorAll(".pvx-up").forEach(b=>b.addEventListener("click",()=>_pvMover(+b.dataset.idx,-1)));
  host.querySelectorAll(".pvx-dn").forEach(b=>b.addEventListener("click",()=>_pvMover(+b.dataset.idx,1)));
  host.querySelectorAll(".pvx-ini").forEach(inp=>inp.addEventListener("change",()=>_pvSetIni(+inp.dataset.idx,inp.value)));
  const aplicado=p&&p.previstoAplicadoEm;
  const statusHTML=aplicado?`<span class="pvx-status ok">Aplicado em ${enc(String(aplicado).slice(0,16).replace("T"," "))}</span>`:`<span class="pvx-status pend">Pendente de aplicação</span>`;
  const terminoTxt=termino?`${fmtDM(parseISO(termino))}/${parseISO(termino).getFullYear()}`:"—";
  const inicioTxt=inicio?`${fmtDM(parseISO(inicio))}/${parseISO(inicio).getFullYear()}`:"—";
  if(resumo)resumo.innerHTML=`<div class="pvx-bar">
    <div class="pvx-term-box">Início previsto <b>${inicioTxt}</b> · Término previsto <b>${terminoTxt}</b> · <b>${totalSlots}</b> slot(s) · ${L.length} atividade(s)</div>
    <div style="display:flex;gap:10px;align-items:center">${statusHTML}<button class="btn primary" id="pvAplicar"><i data-lucide="check-check"></i> Aplicar alocações previstas</button></div>
  </div>${overlaps.length?`<div class="pv-warn" style="display:flex;margin-top:10px"><i data-lucide="alert-triangle"></i> ${overlaps.length} sobreposição(ões): mesmo analista/slot com datas que se cruzam.</div>`:""}`;
  const apBtn=el("pvAplicar"); if(apBtn)apBtn.addEventListener("click",()=>_pvAplicar(_pvProj));
  if(!canEditAction("prealoc")){ host.querySelectorAll("input,button").forEach(e=>e.disabled=true); const ap=el("pvAplicar"); if(ap)ap.disabled=true; }
  lucideRefresh();
}

/* ===================== Aba Contato Cliente (cadastro de projeto) =====================
   Contatos usados apenas como SUGESTÃO de envio da ATA — sem disparo automático.
   Modelo por contato: {nome, email, cargo, tipo, ativo}  · tipo ∈ principal|copia|opcional
   Campo opcional no projeto (p.contatosCliente=[]) — retrocompatível, sem migração. */
const CONTATO_TIPOS=[["principal","Principal"],["copia","Cópia"],["opcional","Opcional"]];
function _contatosTabHTML(p){
  const podeEditar=canEditAction("cadastros");
  return `
  <div class="pv-proto-banner"><i data-lucide="info"></i> Contatos do cliente usados apenas como <b>sugestão de envio</b> da ATA — nenhum e-mail é disparado automaticamente. <b>Principal</b> = destinatário · <b>Cópia</b> = Cc · <b>Opcional</b> = sugerido.</div>
  <div class="ct-head"><div>Nome</div><div>E-mail</div><div>Cargo / área</div><div>Tipo</div><div>Ativo</div><div></div></div>
  <div id="projContatoLista"></div>
  ${podeEditar
    ? `<div style="margin-top:12px"><button class="btn" id="ctAdd" type="button"><i data-lucide="plus"></i> Adicionar contato</button></div>`
    : `<div class="hint" style="margin-top:10px">Somente leitura — sem permissão de edição em Cadastros.</div>`}`;
}
function _renderContatos(p){
  const host=el("projContatoLista"); if(!host)return;
  const arr=Array.isArray(p.contatosCliente)?p.contatosCliente:[];
  const podeEditar=canEditAction("cadastros");
  const dis=podeEditar?"":"disabled";
  if(!arr.length){
    host.innerHTML=`<div class="hint" style="padding:10px">Nenhum contato cadastrado.${podeEditar?' Use “Adicionar contato”.':''}</div>`;
    return;
  }
  host.innerHTML=arr.map((c,i)=>`<div class="ct-row" data-idx="${i}">
    <input type="text"  class="ct-nome"  value="${enc(c.nome||'')}"  placeholder="Nome" ${dis}>
    <input type="email" class="ct-email" value="${enc(c.email||'')}" placeholder="email@cliente.com" ${dis}>
    <input type="text"  class="ct-cargo" value="${enc(c.cargo||'')}" placeholder="Cargo / área" ${dis}>
    <select class="ct-tipo" ${dis}>${CONTATO_TIPOS.map(t=>`<option value="${t[0]}" ${(c.tipo||'principal')===t[0]?'selected':''}>${t[1]}</option>`).join("")}</select>
    <label class="ct-ativo-wrap" title="Contato ativo"><input type="checkbox" class="ct-ativo" ${c.ativo!==false?'checked':''} ${dis}></label>
    ${podeEditar?`<button class="btn ct-del" type="button" data-idx="${i}" title="Remover contato"><i data-lucide="trash-2"></i></button>`:`<span></span>`}
  </div>`).join("");
  lucideRefresh();
}
// Lê as linhas do DOM na ORDEM exibida, SEM filtrar vazias (preserva alinhamento de índices
// durante a edição). O filtro de linhas vazias acontece só no Salvar do projeto.
function _lerContatosDOM(){
  const host=el("projContatoLista"); if(!host)return [];
  return [...host.querySelectorAll(".ct-row")].map(r=>{
    const g=s=>{const e=r.querySelector(s);return e?e.value:"";};
    const chk=r.querySelector(".ct-ativo");
    return {
      nome:(g(".ct-nome")||"").trim(),
      email:(g(".ct-email")||"").trim(),
      cargo:(g(".ct-cargo")||"").trim(),
      tipo:g(".ct-tipo")||"principal",
      ativo: chk ? !!chk.checked : true
    };
  });
}
function _bindContatoTab(p){
  if(!Array.isArray(p.contatosCliente)) p.contatosCliente=[];
  _renderContatos(p);
  const add=el("ctAdd");
  if(add)add.addEventListener("click",()=>{
    if(!canEditAction("cadastros"))return;
    p.contatosCliente=_lerContatosDOM(); // sincroniza edições atuais antes de acrescentar
    p.contatosCliente.push({nome:"",email:"",cargo:"",tipo:"principal",ativo:true});
    _renderContatos(p);
  });
  const host=el("projContatoLista");
  if(host)host.addEventListener("click",e=>{
    const del=e.target.closest(".ct-del"); if(!del)return;
    if(!canEditAction("cadastros"))return;
    p.contatosCliente=_lerContatosDOM(); // re-sincroniza (índices = ordem do DOM)
    const idx=+del.dataset.idx;
    if(idx>=0 && idx<p.contatosCliente.length){ p.contatosCliente.splice(idx,1); _renderContatos(p); }
  });
}

function _bindPrevistoTab(p, isNew){
  _pvProj=p;
  if(!Array.isArray(p.previstoLinhas)) p.previstoLinhas=[];
  _prevTabLinhas=p.previstoLinhas;
  const tabDados=el("projSubtabDados"), tabPrev=el("projSubtabPrev"), tabCont=el("projSubtabContato");
  const paneD=el("projPaneDados"), paneP=el("projPanePrev"), paneC=el("projPaneContato");
  function showTab(which){ // "dados" | "prev" | "contato"
    const isPrev=which==="prev", isCont=which==="contato", isDados=!isPrev&&!isCont;
    if(paneD)paneD.style.display=isDados?"":"none";
    if(paneP)paneP.style.display=isPrev?"":"none";
    if(paneC)paneC.style.display=isCont?"":"none";
    if(tabDados)tabDados.classList.toggle("on",isDados);
    if(tabPrev)tabPrev.classList.toggle("on",isPrev);
    if(tabCont)tabCont.classList.toggle("on",isCont);
    const f=el("actBody").querySelector(".modal-f"); if(f) f.style.display=isPrev?"none":"";  // rodapé Salvar vale p/ Dados e Contato, não p/ Previsto
    if(isPrev){
      const podeEditar=canEditAction("prealoc");
      ["pvAn","pvSlot","pvAtv","pvIni","pvAdd"].forEach(id=>{ const e=el(id); if(e) e.disabled=!podeEditar; });
    }
  }
  if(tabDados)tabDados.addEventListener("click",()=>showTab("dados"));
  if(tabPrev)tabPrev.addEventListener("click",()=>{ showTab("prev"); _renderPrevLinhas(); lucideRefresh(); });
  if(tabCont)tabCont.addEventListener("click",()=>{ showTab("contato"); lucideRefresh(); });
  const add=el("pvAdd");
  if(add)add.addEventListener("click",()=>{
    if(!canEditAction("prealoc")){ alert("Você não tem permissão de edição na Pré-alocação."); return; }
    if(!p.nome){ alert("Salve o projeto antes de declarar o previsto."); return; }
    const anEl=el("pvAn"); const an=anEl?anEl.value:"";
    const slot=el("pvSlot").value, atv=el("pvAtv").value, ini=el("pvIni").value;
    if(!an){alert("Este projeto não tem analistas vinculados. Vincule na aba “Dados do projeto”.");return;}
    if(!atv){alert("Selecione uma atividade.");return;}
    _pvAddLinha(p,{an,slot,atv,ini});
  });
  _renderPrevLinhas();
}

// Adiciona uma atividade à sequência (STAGING). NÃO grava na grade — só "Aplicar" grava.
function _pvAddLinha(p,dados){
  const ini=(dados.ini||"").trim();
  const l={id:_pvNovoId(), an:dados.an, slot:dados.slot, atv:dados.atv, ini, fim:"", slots:_pvDurAtiv(dados.atv), iniManual:!!ini, criadoEm:new Date().toISOString(), criadoPor:(_currentUser&&_currentUser.email)||"sistema"};
  p.previstoLinhas.push(l);
  if(p.previstoAplicadoEm) p.previstoAplicadoEm="";   // mudou a sequência → volta a "pendente"
  _pvRecalcChain(p);
  const i1=el("pvIni"); if(i1)i1.value="";            // limpa para a próxima encadear
  saveReg();
  _pvRenderWarn(p);
  _renderPrevLinhas();
}
// Remove a atividade da sequência (STAGING). Reaplique para refletir na grade.
function _pvRemoverLinha(idx){
  const p=_pvProj; if(!p||!Array.isArray(p.previstoLinhas))return;
  if(!canEditAction("prealoc")){ alert("Você não tem permissão de edição na Pré-alocação."); return; }
  p.previstoLinhas.splice(idx,1);
  if(p.previstoAplicadoEm) p.previstoAplicadoEm="";
  _pvRecalcChain(p); saveReg(); _renderPrevLinhas();
}
function _pvMover(idx,dir){
  const p=_pvProj; if(!p||!canEditAction("prealoc"))return;
  const L=p.previstoLinhas, j=idx+dir;
  if(j<0||j>=L.length)return;
  const t=L[idx]; L[idx]=L[j]; L[j]=t;
  if(p.previstoAplicadoEm) p.previstoAplicadoEm="";
  _pvRecalcChain(p); saveReg(); _renderPrevLinhas();
}
function _pvSetIni(idx,val){
  const p=_pvProj; if(!p||!canEditAction("prealoc"))return;
  const l=p.previstoLinhas[idx]; if(!l)return;
  if(val){ l.ini=val; l.iniManual=true; } else { l.iniManual=false; }
  if(p.previstoAplicadoEm) p.previstoAplicadoEm="";
  _pvRecalcChain(p); saveReg(); _renderPrevLinhas();
}
function _pvRenderWarn(p){ const warn=el("pvWarn"); if(!warn)return; const o=_prevLinhasOverlap(); if(o.length){warn.style.display="";warn.innerHTML=`<i data-lucide="alert-triangle"></i> ${o.length} sobreposição(ões) detectada(s).`;}else warn.style.display="none"; }

// APLICAR: grava previsto (PREV) + realizado nos livres (DATA), reconciliando o previsto
// de ORIGEM deste projeto (cria os novos, remove os que saíram da sequência). Previsto
// manual e de outros projetos é preservado; realizado editado à mão é preservado.
function _pvAplicar(p){
  if(!p){ p=_pvProj; }
  if(!canEditAction("prealoc")){ alert("Você não tem permissão de edição na Pré-alocação."); return; }
  if(!p||!p.nome){ alert("Salve o projeto antes de aplicar o previsto."); return; }
  _garantirHistoricoTudo().then(()=>{
    _pvRecalcChain(p);
    const linhas=(p.previstoLinhas||[]).filter(l=>l.ini&&l.fim);
    if(!linhas.length){ alert("Não há atividades com datas válidas para aplicar."); return; }
    const tagProj="projeto:"+p.nome;
    // Conjunto desejado de células
    const desired=new Map();   // k -> {atv, linha}
    linhas.forEach(l=>{ _pvExpandir(l).forEach(({k})=>{ if(!desired.has(k)) desired.set(k,{atv:l.atv, linha:l.id}); }); });
    // 1) Reconcilia: remove previsto de origem deste projeto que não é mais desejado
    let removidos=0, esvaziados=0;
    Object.keys(PREV).forEach(k=>{
      const pv=PREV[k];
      if(!pv || pv.origem!==tagProj) return;        // só o previsto DESTE projeto
      if(desired.has(k)) return;                     // ainda desejado
      const real=DATA[k];
      if(real && _normProj(real.cliente)===_normProj(p.nome) && (real.atividade||"")===(pv.atividade||"")){ delete DATA[k]; esvaziados++; }
      delete PREV[k]; removidos++;
    });
    // 2) Escreve o desejado
    let prevNovos=0, realNovos=0, ocupadoOutro=0;
    desired.forEach((v,k)=>{
      const pvAntes=PREV[k];
      if(!_temConteudo(pvAntes) || pvAntes.origem===tagProj){
        if(!_temConteudo(pvAntes)) prevNovos++;
        PREV[k]={cliente:p.nome, atividade:v.atv, origem:tagProj, linha:v.linha};
      }
      const real=DATA[k];
      if(!_temConteudo(real)){ DATA[k]={cliente:p.nome, atividade:v.atv}; realNovos++; }
      else if(_normProj(real.cliente)!==_normProj(p.nome)) ocupadoOutro++;
    });
    p.previstoAplicadoEm=new Date().toISOString();
    persist(); persistPrev();
    try{ audit("project.previsto.aplicar", p.nome, null, {linhas:linhas.length, prevNovos, realNovos, removidos, esvaziados}); }catch(e){}
    _renderPrevLinhas(); renderAll();
    let msg=`Alocações previstas aplicadas na grade de "${p.nome}":\n• ${desired.size} slot(s) previstos\n• ${realNovos} preenchido(s) no realizado (estavam livres)`;
    if(ocupadoOutro) msg+=`\n• ${ocupadoOutro} mantido(s) por já estarem ocupados por outro projeto (divergência)`;
    if(removidos) msg+=`\n• ${removidos} previsto(s) antigo(s) reconciliado(s)${esvaziados?` · ${esvaziados} realizado(s) revertido(s) a livre`:""}`;
    alert(msg);
  });
}

function renderForm(){ lucideRefresh(); /* Fase 4: auto-cobre icones em qualquer caminho */
  const b=el("actBody"), isNew=!!actEditing.__new;
  if(actTab==="projetos"){
    const p=isNew?{nome:"",tipo:"implantacao",segmentacao:"Essential",categoria:"",status:"Em andamento",gp:"",lider:"",analistas:[],goLivePrevisto:"",goLiveAjustado:"",goLiveRealizado:"",goLiveModalidade:"",goLiveSituacao:"Planejado",dtDiscovery:""}:actEditing;
    if(!p.tipo)p.tipo="implantacao"; // compat com projetos antigos
    b.innerHTML=`<div class="crumb"><button id="back">‹ Projetos</button>/ ${isNew?'Novo':enc(p.nome)}</div>
      <div class="proj-subtabs">
        <button class="proj-subtab on" id="projSubtabDados"><i data-lucide="folder"></i> Dados do projeto</button>
        ${canViewAction("prealoc")?`<button class="proj-subtab" id="projSubtabPrev"><i data-lucide="calendar-clock"></i> Previsto</button>`:""}
        <button class="proj-subtab" id="projSubtabContato"><i data-lucide="contact"></i> Contato Cliente</button>
      </div>
      <div id="projPaneDados">
      <div class="form-grid">
        <div class="f"><label>Nome do projeto</label><input type="text" id="f_nome" value="${enc(p.nome)}" placeholder="Ex.: Transbom"></div>
        <div class="f"><label>Tipo do projeto</label><select id="f_tipo">${TIPOS_ATIVIDADE.map(t=>`<option value="${t.id}" ${t.id===p.tipo?'selected':''}>${t.icone} ${t.nome}</option>`).join("")}</select></div>
        <div class="f"><label>Segmentação</label><select id="f_seg">${SEGMENTACOES.map(s=>`<option ${s===p.segmentacao?'selected':''}>${s}</option>`).join("")}</select></div>
        <div class="f full"><label>Categoria <span class="lbl-soft">· segmentação por nível</span></label>
          <div class="tier-pick" id="f_cat" role="radiogroup" aria-label="Categoria de segmentação">
            ${CATEGORIAS.map(c=>`<button type="button" class="tier-chip t-${c.toLowerCase()} ${c===(p.categoria||'')?'on':''}" data-cat="${c}" role="radio" aria-checked="${c===(p.categoria||'')?'true':'false'}">${c}</button>`).join("")}
          </div>
        </div>
        <div class="f"><label>Status</label><select id="f_status">${STATUSES.map(s=>`<option ${s===p.status?'selected':''}>${s}</option>`).join("")}</select></div>
        <div class="f"><label>GP (Gerente de Projeto)</label><select id="f_gp"><option value="">—</option>${(p.gp&&!gpsAtivos().includes(p.gp))?`<option selected>${enc(p.gp)} (inativo)</option>`:""}${gpsAtivos().map(g=>`<option ${g===p.gp?'selected':''}>${enc(g)}</option>`).join("")}</select></div>
        <div class="f"><label>Líder de implantação</label><select id="f_lider"><option value="">—</option>${(p.lider&&!lideresAtivos().includes(p.lider))?`<option selected>${enc(p.lider)} (inativo)</option>`:""}${lideresAtivos().map(l=>`<option ${l===p.lider?'selected':''}>${enc(l)}</option>`).join("")}</select></div>
        <div class="f"><label>Recebimento de Projetos</label><input type="date" id="f_dtReceb" value="${enc(p.dtRecebimento||'')}"></div>
        <div class="f full fsec"><span>Bloco Go-Live</span></div>
        <div class="f"><label>Go-Live previsto (original)</label><input type="date" id="f_glPrev" value="${enc(p.goLivePrevisto||'')}"></div>
        <div class="f"><label>Go-Live ajustado (replanejado)</label><input type="date" id="f_glAju" value="${enc(p.goLiveAjustado||'')}"></div>
        <div class="f"><label>Go-Live realizado</label><input type="date" id="f_glReal" value="${enc(p.goLiveRealizado||'')}"></div>
        <div class="f"><label>Modalidade</label><select id="f_glMod"><option value="">—</option>${GOLIVE_MODALIDADES.map(m=>`<option ${m===p.goLiveModalidade?'selected':''}>${m}</option>`).join("")}</select></div>
        <div class="f"><label>Situação do Go-Live</label><select id="f_glSit">${GOLIVE_SITUACOES.map(s=>`<option ${s===(p.goLiveSituacao||"Planejado")?'selected':''}>${s}</option>`).join("")}</select></div>
        <div class="f full fsec"><span>Esteira · Datas de início das etapas</span></div>
        <div class="f"><label>Etapa atual</label><select id="f_etapa"><option value="">Automática (pelas datas)</option>${ETAPAS.map(e=>`<option value="${e.id}" ${e.id===(p.etapaAtual||'')?'selected':''}>${e.label}</option>`).join("")}</select></div>
        <div class="f"><label>1 · Discovery</label><input type="date" id="f_dtDisc" value="${enc(p.dtDiscovery||'')}"></div>
        <div class="f"><label>2 · Cadastros básicos</label><input type="date" id="f_dtCad" value="${enc(p.dtCadBasicos||'')}"></div>
        <div class="f"><label>3 · Logística</label><input type="date" id="f_dtLog" value="${enc(p.dtLogistica||'')}"></div>
        <div class="f"><label>4 · Backoffice</label><input type="date" id="f_dtBack" value="${enc(p.dtBackoffice||'')}"></div>
        <div class="f"><label>6 · Hypercare</label><input type="date" id="f_dtHyper" value="${enc(p.dtHypercare||'')}"></div>
        <div class="f"><label>7 · Monitoramento</label><input type="date" id="f_dtMon" value="${enc(p.dtMonitoramento||'')}"></div>
        <div class="f"><label>8 · Frota</label><input type="date" id="f_dtFrota" value="${enc(p.dtFrota||'')}"></div>
        <div class="f"><label>9 · Sustentação</label><input type="date" id="f_dtSust" value="${enc(p.dtSustentacao||'')}"></div>
        <div class="f full"><label>Analistas no projeto (vínculo)</label>
          <div class="chk-grid" id="f_analistas">${analistaNomes().map(n=>{const on=(p.analistas||[]).includes(n);return `<label class="chk ${on?'sel':''}"><input type="checkbox" value="${enc(n)}" ${on?'checked':''}>${n}</label>`;}).join("")||'<div class="hint" style="padding:10px">Cadastre analistas primeiro.</div>'}${(p.analistas||[]).filter(n=>!analistaNomes().includes(n)).map(n=>`<label class="chk sel" style="opacity:.6"><input type="checkbox" value="${enc(n)}" checked>${enc(n)} (inativo)</label>`).join("")}</div>
          <div class="hint">O <b>tipo do projeto</b> limita quais atividades podem ser lançadas nele. O <b>bloco Go-Live</b> alimenta os relatórios de Gestão e Controle de Go-Lives (datas, situação, modalidade).</div>
        </div>
      </div></div>
      <div id="projPanePrev" style="display:none">${_previstoTabHTML(p)}</div>
      <div id="projPaneContato" style="display:none">${_contatosTabHTML(p)}</div>`;
    _bindPrevistoTab(p, isNew);
    _bindContatoTab(p);
    bindFormFooter(()=>{
      const nome=el("f_nome").value.trim();if(!nome)return;
      const analistas=[...b.querySelectorAll('#f_analistas input:checked')].map(i=>dec(i.value));
      const _catBtn=b.querySelector('#f_cat .tier-chip.on');
      const categoria=_catBtn?_catBtn.dataset.cat:"";
      const obj={nome,tipo:el("f_tipo").value,segmentacao:el("f_seg").value,categoria:categoria||"",status:el("f_status").value,gp:el("f_gp").value,lider:el("f_lider").value,analistas,contatosCliente:_lerContatosDOM().filter(c=>c.nome||c.email),dtRecebimento:el("f_dtReceb").value,goLivePrevisto:el("f_glPrev").value,goLiveAjustado:el("f_glAju").value,goLiveRealizado:el("f_glReal").value,goLiveModalidade:el("f_glMod").value,goLiveSituacao:el("f_glSit").value,etapaAtual:el("f_etapa").value,dtDiscovery:el("f_dtDisc").value,dtCadBasicos:el("f_dtCad").value,dtLogistica:el("f_dtLog").value,dtBackoffice:el("f_dtBack").value,dtHypercare:el("f_dtHyper").value,dtMonitoramento:el("f_dtMon").value,dtFrota:el("f_dtFrota").value,dtSustentacao:el("f_dtSust").value};
      if(isNew){REG.projetos.push(obj);audit("project.create",nome,null,obj);}
      else{
        const antes=Object.assign({},actEditing);
        if(actEditing.nome!==nome)renameProjeto(actEditing.nome,nome);
        Object.assign(actEditing,obj);
        const dif=_diff(antes,actEditing);
        if(dif)audit("project.update",nome,dif.antes,dif.depois);
      }
      finishForm();
    },isNew?null:()=>{const removido=Object.assign({},actEditing); REG.projetos=REG.projetos.filter(x=>x!==actEditing); audit("project.delete",removido.nome,removido,null); finishForm();});
    b.querySelectorAll('#f_analistas input').forEach(i=>i.addEventListener('change',e=>e.target.closest('.chk').classList.toggle('sel',e.target.checked)));
    b.querySelectorAll('#f_cat .tier-chip').forEach(ch=>ch.addEventListener('click',()=>{
      const was=ch.classList.contains('on');
      b.querySelectorAll('#f_cat .tier-chip').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-checked','false');});
      if(!was){ch.classList.add('on');ch.setAttribute('aria-checked','true');} // clicar de novo limpa a categoria (campo opcional)
    }));
  }
  else if(actTab==="analistas"){
    const a=isNew?{nome:"",lider:"",email:"",squad:"",ativo:true,desligamento:""}:actEditing;
    const inativo=a.ativo===false;
    b.innerHTML=`<div class="crumb"><button id="back">‹ Analistas</button>/ ${isNew?'Novo':enc(a.nome)}</div>
      <div class="form-grid">
        <div class="f"><label>Nome do analista</label><input type="text" id="f_nome" value="${enc(a.nome)}" placeholder="Ex.: Marlon"></div>
        <div class="f"><label>E-mail</label><input type="email" id="f_email" value="${enc(a.email||'')}" placeholder="marlon@empresa.com"></div>
        <div class="f"><label>Squad</label><select id="f_squad"><option value="">— ${enc(SQUAD_SEM_LABEL)} —</option>${SQUADS.map(s=>`<option ${s===(a.squad||'')?'selected':''}>${enc(s)}</option>`).join("")}${(a.squad&&!SQUADS.includes(a.squad))?`<option selected>${enc(a.squad)}</option>`:""}</select></div>
        <div class="f"><label>Líder (vínculo analista → líder)</label><select id="f_lider"><option value="">—</option>${(a.lider&&!lideresAtivos().includes(a.lider))?`<option selected>${enc(a.lider)} (inativo)</option>`:""}${lideresAtivos().map(l=>`<option ${l===a.lider?'selected':''}>${enc(l)}</option>`).join("")}</select></div>
        <div class="f"><label>Situação</label><select id="f_ativo"><option value="ativo" ${!inativo?'selected':''}>Ativo</option><option value="inativo" ${inativo?'selected':''}>Inativo (desligado)</option></select></div>
        <div class="f" id="f_deslig_wrap" style="${inativo?'':'display:none'}"><label>Data de desligamento</label><input type="date" id="f_deslig" value="${enc(a.desligamento||'')}"></div>
      </div>
      <div class="hint">O e-mail será usado para vincular automaticamente este analista a um usuário do sistema quando ele fizer login. A <b>squad</b> define o time operacional do analista e aparece nas telas e relatórios. Inativos somem das telas operacionais, mas as alocações já lançadas permanecem no histórico.${isNew?'':` · ${projetosDoAnalista(a.nome).length} projeto(s) vinculado(s).`}</div>`;
    el("f_ativo").addEventListener("change",e=>{el("f_deslig_wrap").style.display=e.target.value==="inativo"?"":"none";});
    bindFormFooter(()=>{
      const nome=el("f_nome").value.trim();if(!nome)return;
      const email=el("f_email").value.trim();
      if(!emailValido(email)){alert("E-mail em formato inválido.");return;}
      const ativo=el("f_ativo").value==="ativo";
      const squad=el("f_squad").value;
      const desligamento=ativo?"":(el("f_deslig").value||"");
      if(isNew){const novo={nome,email,squad,lider:el("f_lider").value,ativo,desligamento}; REG.analistas.push(novo); audit("analyst.create",nome,null,novo);}
      else{
        const antes=Object.assign({},actEditing);
        if(actEditing.nome!==nome)renameAnalista(actEditing.nome,nome);
        actEditing.nome=nome;actEditing.email=email;actEditing.squad=squad;actEditing.lider=el("f_lider").value;actEditing.ativo=ativo;actEditing.desligamento=desligamento;
        const dif=_diff(antes,actEditing); if(dif)audit("analyst.update",nome,dif.antes,dif.depois);
      }
      finishForm();
    },isNew?null:()=>{const r=Object.assign({},actEditing); REG.analistas=REG.analistas.filter(x=>x!==actEditing);REG.projetos.forEach(p=>p.analistas=(p.analistas||[]).filter(n=>n!==actEditing.nome));audit("analyst.delete",r.nome,r,null);finishForm();});
  }
  else if(actTab==="lideres"){
    const nome0=isNew?"":actEditing.nome;
    const lo=isNew?{ativo:true,desligamento:""}:liderObj(nome0);
    const inativo=lo.ativo===false;
    const emailAtual=isNew?"":emailLider(nome0);
    b.innerHTML=`<div class="crumb"><button id="back">‹ Líderes</button>/ ${isNew?'Novo':enc(nome0)}</div>
      <div class="form-grid">
        <div class="f"><label>Nome do líder</label><input type="text" id="f_nome" value="${enc(nome0)}" placeholder="Ex.: Haniel"></div>
        <div class="f"><label>E-mail</label><input type="email" id="f_email" value="${enc(emailAtual)}" placeholder="haniel@empresa.com"></div>
        <div class="f"><label>Situação</label><select id="f_ativo"><option value="ativo" ${!inativo?'selected':''}>Ativo</option><option value="inativo" ${inativo?'selected':''}>Inativo (desligado)</option></select></div>
        <div class="f" id="f_deslig_wrap" style="${inativo?'':'display:none'}"><label>Data de desligamento</label><input type="date" id="f_deslig" value="${enc(lo.desligamento||'')}"></div>
      </div>
      <div class="hint">O e-mail será usado para vincular automaticamente este líder a um usuário no login.${isNew?'':` · ${REG.analistas.filter(a=>a.lider===nome0).length} analista(s) e ${REG.projetos.filter(p=>p.lider===nome0).length} projeto(s) vinculados.`}</div>`;
    el("f_ativo").addEventListener("change",e=>{el("f_deslig_wrap").style.display=e.target.value==="inativo"?"":"none";});
    bindFormFooter(()=>{
      const nome=el("f_nome").value.trim();if(!nome)return;
      const email=el("f_email").value.trim();
      if(!emailValido(email)){alert("E-mail em formato inválido.");return;}
      if(isNew){if(!REG.lideres.includes(nome))REG.lideres.push(nome);}
      else{if(nome0!==nome)renameLider(nome0,nome);}
      // e-mail
      REG.lideresEmails=REG.lideresEmails||{};
      if(email)REG.lideresEmails[nome]=email; else delete REG.lideresEmails[nome];
      // situação
      REG.lideresInativos=REG.lideresInativos||{};
      if(el("f_ativo").value==="inativo"){REG.lideresInativos[nome]=el("f_deslig").value||true;}
      else{delete REG.lideresInativos[nome];}
      finishForm();
    },isNew?null:()=>{REG.projetos.forEach(p=>{if(p.lider===nome0)p.lider="";});REG.analistas.forEach(a=>{if(a.lider===nome0)a.lider="";});REG.lideres=REG.lideres.filter(x=>x!==nome0);if(REG.lideresInativos)delete REG.lideresInativos[nome0];if(REG.lideresEmails)delete REG.lideresEmails[nome0];finishForm();});
  }
  else if(actTab==="gps"){
    const nome0=isNew?"":actEditing.nome;
    const go=isNew?{ativo:true,desligamento:""}:gpObj(nome0);
    const inativo=go.ativo===false;
    const emailAtual=isNew?"":emailGp(nome0);
    b.innerHTML=`<div class="crumb"><button id="back">‹ Gerentes</button>/ ${isNew?'Novo':enc(nome0)}</div>
      <div class="form-grid">
        <div class="f"><label>Nome do gerente de projeto (GP)</label><input type="text" id="f_nome" value="${enc(nome0)}" placeholder="Ex.: Eduardo Sabatino"></div>
        <div class="f"><label>E-mail</label><input type="email" id="f_email" value="${enc(emailAtual)}" placeholder="eduardo@empresa.com"></div>
        <div class="f"><label>Situação</label><select id="f_ativo"><option value="ativo" ${!inativo?'selected':''}>Ativo</option><option value="inativo" ${inativo?'selected':''}>Inativo (desligado)</option></select></div>
        <div class="f" id="f_deslig_wrap" style="${inativo?'':'display:none'}"><label>Data de desligamento</label><input type="date" id="f_deslig" value="${enc(go.desligamento||'')}"></div>
      </div>
      <div class="hint">O e-mail será usado para vincular automaticamente este GP a um usuário no login.${isNew?'':` · ${REG.projetos.filter(p=>p.gp===nome0).length} projeto(s) sob este GP.`}</div>`;
    el("f_ativo").addEventListener("change",e=>{el("f_deslig_wrap").style.display=e.target.value==="inativo"?"":"none";});
    bindFormFooter(()=>{
      const nome=el("f_nome").value.trim();if(!nome)return;
      const email=el("f_email").value.trim();
      if(!emailValido(email)){alert("E-mail em formato inválido.");return;}
      if(isNew){if(!REG.gps.includes(nome))REG.gps.push(nome);}
      else{if(nome0!==nome)renameGp(nome0,nome);}
      REG.gpsEmails=REG.gpsEmails||{};
      if(email)REG.gpsEmails[nome]=email; else delete REG.gpsEmails[nome];
      REG.gpsInativos=REG.gpsInativos||{};
      if(el("f_ativo").value==="inativo"){REG.gpsInativos[nome]=el("f_deslig").value||true;}
      else{delete REG.gpsInativos[nome];}
      finishForm();
    },isNew?null:()=>{REG.projetos.forEach(p=>{if(p.gp===nome0)p.gp="";});REG.gps=REG.gps.filter(x=>x!==nome0);if(REG.gpsInativos)delete REG.gpsInativos[nome0];if(REG.gpsEmails)delete REG.gpsEmails[nome0];finishForm();});
  }
  else if(actTab==="atividades"){
    const a=isNew?{nome:"",tipo:"implantacao",ativo:true,exigeObs:false,exigeAta:false,slotsNecessarios:null,etapa:""}:actEditing;
    const userTag=(_currentUser&&_currentUser.email)||"local";
    const ativo=a.ativo!==false;
    b.innerHTML=`<div class="crumb"><button id="back">‹ Atividades</button>/ ${isNew?'Nova':enc(a.nome)}</div>
      <div class="form-grid">
        <div class="f full"><label>Nome da atividade</label><input type="text" id="f_nome" value="${enc(a.nome)}" placeholder="Ex.: Treinamento logístico"></div>
        <div class="f"><label>Tipo</label><select id="f_tipo">${TIPOS_ATIVIDADE.map(t=>`<option value="${t.id}" ${t.id===a.tipo?'selected':''}>${t.icone} ${t.nome}</option>`).join("")}</select></div>
        <div class="f"><label>Situação</label><select id="f_ativo"><option value="ativo" ${ativo?'selected':''}>Ativa</option><option value="inativo" ${!ativo?'selected':''}>Inativa</option></select></div>
        <div class="f"><label>Slots necessários <span class="lbl-soft">· por ocorrência</span></label><input type="number" id="f_slots" min="0" max="60" step="1" inputmode="numeric" value="${(a.slotsNecessarios!=null&&a.slotsNecessarios!=='')?enc(String(a.slotsNecessarios)):''}" placeholder="Ex.: 2"></div>
        <div class="f"><label>Etapa do projeto <span class="lbl-soft">· opcional</span></label><select id="f_atvEtapa"><option value="">— (nenhuma)</option>${ETAPAS.map(e=>`<option value="${e.id}" ${e.id===(a.etapa||'')?'selected':''}>${e.label}</option>`).join("")}</select></div>
        <div class="f full"><label><input type="checkbox" id="f_obs" ${a.exigeObs?'checked':''} style="margin-right:6px;vertical-align:middle"> Exige observação ao lançar no slot</label></div>
        <div class="f full"><label><input type="checkbox" id="f_ata" ${a.exigeAta?'checked':''} style="margin-right:6px;vertical-align:middle"> Obrigatório gerar ATA nos slots com esta atividade</label></div>
        <div class="f full"><label><input type="checkbox" id="f_atvEmail" ${a.enviaEmail===true?'checked':''} style="margin-right:6px;vertical-align:middle"> Enviar e-mail de notificação ao alocar esta atividade</label></div>
        <div class="f full"><label>Etapa de capacitação (de-para · opcional)</label><select id="f_capstage">${(typeof capStageSelectOptions==='function')?capStageSelectOptions(a.capTrack,a.capStage):'<option value="">— (nenhuma)</option>'}</select></div>
      </div>
      <div class="hint">Toda atividade pertence a um tipo (Interna · Implantação · Ausência). As atividades aparecem no modal de alocação agrupadas pelo tipo. ${isNew?'':`<br>Criado por ${enc(a.createdBy||'—')} em ${a.createdAt?enc(a.createdAt.slice(0,10)):'—'}${a.updatedBy?(' · última alteração por '+enc(a.updatedBy)+' em '+enc((a.updatedAt||'').slice(0,10))):''}.`}</div>`;
    bindFormFooter(()=>{
      const nome=el("f_nome").value.trim();if(!nome)return;
      const tipo=el("f_tipo").value;
      const ativoNovo=el("f_ativo").value==="ativo";
      const exigeObs=el("f_obs").checked;
      const exigeAta=el("f_ata")?el("f_ata").checked:false;
      const enviaEmail=el("f_atvEmail")?el("f_atvEmail").checked:false;
      const _slotsRaw=el("f_slots")?el("f_slots").value.trim():"";
      const slotsNecessarios=_slotsRaw===""?null:Math.max(0,parseInt(_slotsRaw,10)||0);
      const etapa=el("f_atvEtapa")?el("f_atvEtapa").value:"";
      const _capVal=(el("f_capstage")?el("f_capstage").value:"")||""; const _capP=_capVal?_capVal.split("\u241F"):["",""]; const capTrack=_capP[0]||""; const capStage=_capP[1]||"";
      const agora=new Date().toISOString();
      if(isNew){
        if((REG.atividades||[]).some(x=>x.nome.toLowerCase()===nome.toLowerCase())){alert("Já existe uma atividade com este nome.");return;}
        REG.atividades=REG.atividades||[];
        REG.atividades.push({nome,tipo,ativo:ativoNovo,exigeObs,exigeAta,enviaEmail,slotsNecessarios,etapa,capTrack,capStage,createdAt:agora,createdBy:userTag,updatedAt:agora,updatedBy:userTag});
      }else{
        // se renomeou, propaga nas alocações que apontavam pelo nome antigo
        if(actEditing.nome!==nome){
          Object.values(DATA).forEach(v=>{if(v.atividade===actEditing.nome)v.atividade=nome;});
          actEditing.nome=nome;
        }
        actEditing.tipo=tipo;actEditing.ativo=ativoNovo;actEditing.exigeObs=exigeObs;actEditing.exigeAta=exigeAta;actEditing.enviaEmail=enviaEmail;actEditing.slotsNecessarios=slotsNecessarios;actEditing.etapa=etapa;actEditing.capTrack=capTrack;actEditing.capStage=capStage;
        actEditing.updatedAt=agora;actEditing.updatedBy=userTag;
      }
      finishForm();
    },isNew?null:()=>{REG.atividades=(REG.atividades||[]).filter(x=>x!==actEditing);finishForm();});
  }
  else if(actTab==="feriados"){
    const f=isNew?{data:"",nome:""}:actEditing;
    b.innerHTML=`<div class="crumb"><button id="back">‹ Feriados</button>/ ${isNew?'Novo':enc(f.nome)}</div>
      <div class="form-grid">
        <div class="f"><label>Nome do feriado</label><input type="text" id="f_nome" value="${enc(f.nome)}" placeholder="Ex.: Corpus Christi"></div>
        <div class="f"><label>Data</label><input type="date" id="f_data" value="${enc(f.data)}"></div>
      </div>
      <div class="hint">${isNew
        ? '<b>Ao salvar</b>, o feriado será aplicado automaticamente em <b>todos os 6 slots</b> de <b>todos os analistas ativos</b> nesta data. Você poderá editar/desfazer manualmente slot a slot depois, se necessário.'
        : 'Alterar nome ou data deste feriado <b>não altera</b> as alocações já lançadas — ajustes nos slots, se preciso, devem ser feitos manualmente. Excluir o feriado também não remove as alocações de "Feriado" dos slots.'}</div>`;
    bindFormFooter(()=>{
      const nome=el("f_nome").value.trim(),data=el("f_data").value;if(!nome||!data)return;
      if(isNew){
        REG.feriados.push({data,nome});
        // Propaga automaticamente: marca todos os slots de todos os analistas ATIVOS nesta data como "Feriado"
        const sobrescritos = propagaFeriadoNosSlots(data, nome);
        if(sobrescritos>0){
          if(!confirm(`O feriado será aplicado em todos os analistas nesta data, mas há ${sobrescritos} slot(s) com alocação já existente.\n\nDeseja sobrescrever também esses slots?\n\n• OK: sobrescreve tudo\n• Cancelar: preserva alocações existentes e só preenche os slots vazios`)){
            // refaz com modo "preservar"
            REG.feriados=REG.feriados.filter(x=>x.data!==data||x.nome!==nome);
            REG.feriados.push({data,nome});
            propagaFeriadoNosSlots(data, nome, /*preservar=*/true);
          }
        }
      }else{
        actEditing.nome=nome; actEditing.data=data;
      }
      finishForm();
    },isNew?null:()=>{REG.feriados=REG.feriados.filter(x=>x!==actEditing);finishForm();});
  }
  el("back").addEventListener("click",()=>{actEditing=null;renderActions();});
}
// Propaga um feriado em todos os slots de todos os analistas ativos na data.
// Retorna a contagem de slots que tinham alocação existente (sobrescritos ou preservados).
// Se preservar=true, slots já preenchidos NÃO são sobrescritos (só completa os vazios).
function propagaFeriadoNosSlots(iso, nomeFeriado, preservar){
  // Se o feriado cai num sábado ou domingo, não propaga (fim de semana já é off)
  const wd=parseISO(iso).getDay();
  if(wd===0||wd===6){console.log(`[Feriados] "${nomeFeriado}" em ${iso} cai em fim de semana — propagação ignorada.`); return 0;}
  // Usa a atividade "Feriado" do cadastro se existir; senão usa o nome do feriado como atividade
  const atvObj=(REG.atividades||[]).find(a=>a.nome.toLowerCase()==="feriado" && a.ativo!==false);
  const atividade=atvObj?atvObj.nome:"Feriado";
  const cliente=nomeFeriado||"Feriado"; // cliente = nome do feriado (Corpus Christi, Independência etc)
  const slots=SLOTS.filter(s=>!s.lunch).map(s=>s.id);
  const analistas=REG.analistas.filter(a=>isAtivo(a)).map(a=>a.nome).sort(cmpAlpha);
  const agora=new Date().toISOString();
  const user=(_currentUser&&_currentUser.email)||"sistema";
  let sobrescritos=0, criados=0;
  analistas.forEach(nome=>{
    slots.forEach(sid=>{
      const k=key(nome,iso,sid);
      const existia=DATA[k];
      if(existia){
        sobrescritos++;
        if(preservar)return; // mantém o que estava lá
      }else{
        criados++;
      }
      DATA[k]={atividade,cliente,obs:nomeFeriado,obsAt:agora,obsBy:user,feriado:true};
    });
  });
  console.log(`[Feriados] "${nomeFeriado}" em ${iso}: ${criados} slot(s) criado(s), ${sobrescritos} sobrescrito(s)${preservar?' (preservados)':''}`);
  return sobrescritos;
}

function bindFormFooter(onSave,onDelete){
  const b=el("actBody");
  // Cadastros em SOMENTE LEITURA: sem Salvar/Excluir; campos desabilitados.
  if(!canEditCadastros()){
    b.querySelectorAll("input,select,textarea").forEach(i=>{ i.disabled=true; });
    const ro=document.createElement("div");
    ro.className="modal-f"; ro.style.margin="18px -20px -16px"; ro.style.borderRadius="0";
    ro.innerHTML=`<div style="flex:1;display:flex;align-items:center;gap:8px;color:var(--fn-blue,#1e40af);background:var(--fn-blue-bg,#eff6ff);border:1px solid var(--fn-blue-bd,#bfdbfe);border-radius:9px;padding:9px 12px;font-size:12.5px"><i data-lucide="eye"></i>Você está em <b>somente leitura</b> nos cadastros — alterações estão desabilitadas.</div>`;
    b.appendChild(ro); lucideRefresh();
    return;
  }
  const f=document.createElement("div");f.className="modal-f";f.style.margin="18px -20px -16px";f.style.borderRadius="0";
  f.innerHTML=`<button class="btn primary wide" id="f_save">Salvar</button>`+(onDelete?`<button class="btn danger" id="f_del">Excluir</button>`:"");
  b.appendChild(f);
  el("f_save").addEventListener("click",onSave);
  if(onDelete){const d=el("f_del");d.addEventListener("click",()=>{if(d.classList.contains("armed")){onDelete();}else{d.classList.add("armed");d.textContent="Confirmar exclusão";}});}
}
function finishForm(){saveReg();actEditing=null;renderConsultorSelect();renderActions();renderAll();}

/* escaping p/ atributos */
function enc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function dec(s){const t=document.createElement("textarea");t.innerHTML=s;return t.value;}

/* ===================== Ações: USUÁRIOS (admin gerencia, gestor visualiza) ===================== */
let _editingUserUid=null; // uid em modo edição (null = nenhum)

// Monta a matriz de permissões por ação para o card de edição do usuário.
function _permMatrixHTML(uid, u){
  const lblOf={"":"Herdar","none":"Sem acesso","read":"Leitura","edit":"Edição"};
  const clsOf={"":"lvl-inherit","none":"lvl-none","read":"lvl-read","edit":"lvl-edit"};
  const rows=ACTIONS.map(a=>{
    const stored=_normLevel(u && u.perms && u.perms[a.id]); // override explícito ou null
    const eff=userActionLevel(u, a.id);
    const levels=a.readOnly?["","none","read"]:["","none","read","edit"];
    const segBtns=levels.map(lv=>{
      const sel=(lv===(stored||""));
      return `<button type="button" data-lvl="${lv}" class="${sel?'on '+clsOf[lv]:''}">${lblOf[lv]}</button>`;
    }).join("");
    return `<div class="perm-row">
      <div class="perm-name"><i data-lucide="${a.icon}"></i><span>${enc(a.label)}</span><span class="pm-eff" data-efffor="${a.id}">· efetivo: ${ACTION_LEVEL_LABELS[eff]}</span></div>
      <div class="perm-seg" data-permaction="${a.id}" data-uid="${uid}">${segBtns}</div>
    </div>`;
  }).join("");
  return `<div class="perm-matrix" data-permgrid="${uid}">
    <div class="pm-head"><i data-lucide="shield-check"></i>Permissões por ação</div>
    <div class="pm-sub">Para cada ação: <b>Sem acesso</b> (não vê nem abre), <b>Leitura</b> (consulta sem alterar) ou <b>Edição</b> (altera normalmente). <b>Herdar</b> segue o padrão do perfil. Telas só de consulta não oferecem "Edição".</div>
    ${rows}
  </div>`;
}
// Lê a matriz do DOM e devolve só os overrides EXPLÍCITOS (Herdar é omitido).
function gatherPerms(uid){
  const out={};
  document.querySelectorAll(`.perm-seg[data-uid="${CSS.escape(uid)}"]`).forEach(seg=>{
    const aid=seg.dataset.permaction;
    const on=seg.querySelector("button.on");
    const lvl=on?on.dataset.lvl:"";
    if(lvl==="none"||lvl==="read"||lvl==="edit") out[aid]=lvl;
  });
  return out;
}
// Recalcula os rótulos "efetivo" ao vivo, considerando perfil + matriz atuais (não salvos).
function _recalcPermEff(uid){
  const roleSel=el("euRole_"+uid);
  const tmp={role:roleSel?roleSel.value:"leitura", perms:gatherPerms(uid)};
  const grid=document.querySelector(`.perm-matrix[data-permgrid="${CSS.escape(uid)}"]`);
  if(!grid)return;
  grid.querySelectorAll(".pm-eff[data-efffor]").forEach(eln=>{
    const eff=userActionLevel(tmp, eln.dataset.efffor);
    eln.textContent="· efetivo: "+ACTION_LEVEL_LABELS[eff];
  });
}
// Liga os cliques da matriz + onchange do perfil para o usuário em edição.
function bindPermMatrix(uid){
  document.querySelectorAll(`.perm-seg[data-uid="${CSS.escape(uid)}"]`).forEach(seg=>{
    seg.querySelectorAll("button").forEach(btn=>{
      btn.addEventListener("click",()=>{
        seg.querySelectorAll("button").forEach(b=>{b.classList.remove("on","lvl-inherit","lvl-none","lvl-read","lvl-edit");});
        const lv=btn.dataset.lvl;
        const cls={"":"lvl-inherit","none":"lvl-none","read":"lvl-read","edit":"lvl-edit"}[lv];
        btn.classList.add("on",cls);
        _recalcPermEff(uid);
      });
    });
  });
  const roleSel=el("euRole_"+uid);
  if(roleSel)roleSel.addEventListener("change",()=>{ euRoleEditChange(uid); _recalcPermEff(uid); });
}
// Mostra/esconde os campos de vínculo conforme o perfil escolhido na edição.
function euRoleEditChange(uid){
  const r=el("euRole_"+uid)?el("euRole_"+uid).value:"";
  const set=(id,on)=>{const w=el(id);if(w)w.style.display=on?"block":"none";};
  set("euAnaWrap_"+uid, r==="analista");
  set("euLidWrap_"+uid, r==="lider");
  set("euGpWrap_"+uid,  r==="gp");
}

function renderUsers(){
  const b=el("actBody");
  const podeGerenciar=isAdmin();
  const uids=Object.keys(_usersCache);
  const linhas=uids.map(uid=>{
    const u=_usersCache[uid]||{};
    const eu=uid===(_currentUser&&_currentUser.uid);
    const editing=_editingUserUid===uid;
    const vinc=u.role==="analista"&&u.linkedAnalyst?(" · "+u.linkedAnalyst):(u.role==="lider"&&u.linkedLider?(" · equipe "+u.linkedLider):(u.role==="gp"&&u.linkedGp?(" · GP "+u.linkedGp):""));
    const desde=u.createdAt?(" · desde "+String(u.createdAt).slice(0,10)):"";
    if(editing){
      // Modo edição inline: perfil + vínculo conforme o perfil
      const optRoles=ROLES_ATRIBUIVEIS.map(r=>`<option value="${r}" ${r===u.role?'selected':''}>${ROLE_LABELS[r]}</option>`).join("");
      const optStatus=USER_STATUSES.map(s=>`<option value="${s}" ${s===(u.status||"ativo")?'selected':''}>${USER_STATUS_LABELS[s]}</option>`).join("");
      const optAnalistas=`<option value="">—</option>`+analistaNomes().map(n=>`<option value="${enc(n)}" ${n===u.linkedAnalyst?'selected':''}>${enc(n)}</option>`).join("")+(u.linkedAnalyst&&!analistaNomes().includes(u.linkedAnalyst)?`<option value="${enc(u.linkedAnalyst)}" selected>${enc(u.linkedAnalyst)} (não cadastrado)</option>`:"");
      const optLideres=`<option value="">—</option>`+lideresAtivos().map(l=>`<option value="${enc(l)}" ${l===u.linkedLider?'selected':''}>${enc(l)}</option>`).join("")+(u.linkedLider&&!lideresAtivos().includes(u.linkedLider)?`<option value="${enc(u.linkedLider)}" selected>${enc(u.linkedLider)} (inativo)</option>`:"");
      const optGps=`<option value="">—</option>`+gpsAtivos().map(g=>`<option value="${enc(g)}" ${g===u.linkedGp?'selected':''}>${enc(g)}</option>`).join("")+(u.linkedGp&&!gpsAtivos().includes(u.linkedGp)?`<option value="${enc(u.linkedGp)}" selected>${enc(u.linkedGp)} (inativo)</option>`:"");
      return `<div class="row" style="cursor:default;flex-direction:column;align-items:stretch;gap:11px;background:var(--o-50);border:1px solid var(--orange-bd)">
        <div style="display:flex;align-items:center;gap:11px">
          <div class="av" style="background:${colorFor(u.email||uid)}">${((u.email||"?")[0]||"?").toUpperCase()}</div>
          <div class="main"><div class="nm">${enc(u.email||"(sem e-mail)")}${eu?' <span style="color:var(--faint);font-weight:600">· você</span>':''}</div>
          <div class="meta"><span>editando…</span></div></div>
        </div>
        <div class="form-grid" style="margin:0">
          <div class="f"><label>Perfil</label><select id="euRole_${uid}">${optRoles}</select></div>
          <div class="f"><label>Status</label><select id="euStatus_${uid}">${optStatus}</select></div>
          <div class="f" id="euAnaWrap_${uid}" style="display:${u.role==='analista'?'block':'none'}"><label>Analista vinculado</label><select id="euAna_${uid}">${optAnalistas}</select></div>
          <div class="f" id="euLidWrap_${uid}" style="display:${u.role==='lider'?'block':'none'}"><label>Equipe (líder)</label><select id="euLid_${uid}">${optLideres}</select></div>
          <div class="f" id="euGpWrap_${uid}" style="display:${u.role==='gp'?'block':'none'}"><label>GP vinculado</label><select id="euGp_${uid}">${optGps}</select></div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--fn-muted);cursor:pointer;padding:9px 11px;background:#fff;border:1px solid var(--line);border-radius:9px">
          <input type="checkbox" id="euForce_${uid}" ${u.forceChangePassword?"checked":""} style="width:16px;height:16px;cursor:pointer">
          <span><b>Forçar troca de senha no próximo login</b><br><span style="color:var(--fn-faint);font-size:11.5px;font-weight:500">Útil ao criar uma conta nova, ou quando suspeitar de compartilhamento da senha. O usuário verá um modal obrigatório.</span></span>
        </label>
        ${_permMatrixHTML(uid,u)}
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn ghost" data-cancel="${uid}">Cancelar</button>
          <button class="btn primary" data-save="${uid}">Salvar alterações</button>
        </div>
      </div>`;
    }
    const flag=u.forceChangePassword?` <span class="badge-small" style="color:var(--fn-orange);background:var(--fn-orange-bg);border-color:var(--fn-orange-bd)">trocar senha</span>`:"";
    const stBadge=statusBadgeUser(u.status||"ativo");
    const lastLog=u.lastLoginAt?_fmtLastSeen(u.lastLoginAt):"<span style='color:var(--fn-faint)'>nunca</span>";
    return `<div class="row" style="cursor:default">
      <div class="av" style="background:${colorFor(u.email||uid)}">${((u.email||"?")[0]||"?").toUpperCase()}</div>
      <div class="main"><div class="nm">${enc(u.email||"(sem e-mail)")}${eu?' <span style="color:var(--faint);font-weight:600">· você</span>':''}${flag} ${stBadge}</div>
      <div class="meta"><span>${ROLE_LABELS[u.role]||u.role||"—"}${enc(vinc)}${enc(desde)} · último acesso ${lastLog}</span></div></div>
      ${podeGerenciar?`<button class="btn sm" data-edit="${uid}" style="margin-right:6px"><i data-lucide="pencil"></i>Editar</button>`:""}
      ${podeGerenciar&&!eu?`<button class="btn danger sm" data-rem="${uid}"><i data-lucide="user-x"></i>Remover</button>`:""}</div>`;
  }).join("");
  let novo="";
  if(podeGerenciar){
    const optRoles=ROLES_ATRIBUIVEIS.map(r=>`<option value="${r}">${ROLE_LABELS[r]}</option>`).join("");
    const optAnalistas=analistaNomes().map(n=>`<option value="${enc(n)}">${enc(n)}</option>`).join("");
    const optLideres=lideresAtivos().map(l=>`<option value="${enc(l)}">${enc(l)}</option>`).join("");
    const optGps=gpsAtivos().map(g=>`<option value="${enc(g)}">${enc(g)}</option>`).join("");
    novo=`<div style="border:1px solid var(--line);border-radius:13px;padding:15px;margin-top:16px;background:#fff">
      <h3 style="font-family:'Inter';font-weight:700;font-size:15px;margin-bottom:4px">Cadastrar novo usuário</h3>
      <div class="hint" style="margin-bottom:12px">Cria a conta de login e já define o perfil. O usuário entra com e-mail e senha.</div>
      <div class="form-grid">
        <div class="f"><label>E-mail</label><input type="text" id="nuEmail" placeholder="pessoa@nstech.com.br"></div>
        <div class="f"><label>Senha provisória</label><input type="text" id="nuPass" placeholder="mín. 6 caracteres"></div>
        <div class="f"><label>Perfil</label><select id="nuRole" onchange="nuRoleChange()">${optRoles}</select></div>
        <div class="f" id="nuAnalistaWrap" style="display:none"><label>Analista vinculado</label><select id="nuAnalista"><option value="">—</option>${optAnalistas}</select></div>
        <div class="f" id="nuLiderWrap" style="display:none"><label>Equipe (líder)</label><select id="nuLider"><option value="">—</option>${optLideres}</select></div>
        <div class="f" id="nuGpWrap" style="display:none"><label>GP vinculado</label><select id="nuGp"><option value="">—</option>${optGps}</select></div>
      </div>
      <div class="cfg-status" id="nuStatus"></div>
      <button class="btn primary" id="nuCreate" style="margin-top:10px">Cadastrar usuário</button>
    </div>`;
  }
  // Bloco de vínculos automáticos PENDENTES (sugestões aguardando admin)
  const pendentes=Object.entries(_usersCache).filter(([uid,u])=>u && u.pendingLink && u.pendingLink.type && u.pendingLink.value);
  const pendentesBox = (podeGerenciar && pendentes.length) ? `
    <div style="background:var(--fn-amber-bg);border:1px solid var(--fn-amber-bd);border-radius:var(--r-md);padding:14px 16px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:8px">
        <i data-lucide="link" style="color:var(--fn-amber);width:18px;height:18px"></i>
        <b style="color:var(--fn-amber);font-size:13px">${pendentes.length} sugestão(ões) de vínculo aguardando aprovação</b>
      </div>
      <div style="font-size:11.5px;color:var(--fn-muted);margin-bottom:10px">O sistema detectou correspondência entre o e-mail do usuário e um cadastro (analista, líder ou GP). Confirme ou rejeite cada sugestão antes de aplicar.</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${pendentes.map(([uid,u])=>{
          const t=u.pendingLink.type, v=u.pendingLink.value;
          const tipoLabel={analista:"Analista",lider:"Líder",gp:"GP"}[t]||t;
          return `<div style="display:flex;align-items:center;gap:9px;background:#fff;padding:8px 11px;border-radius:8px;border:1px solid var(--line)">
            <div class="av" style="background:${colorFor(u.email||uid)};width:32px;height:32px;font-size:12px">${((u.email||"?")[0]||"?").toUpperCase()}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:600;color:var(--fn-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${enc(u.email||uid)}</div>
              <div style="font-size:11px;color:var(--fn-muted);margin-top:2px">→ <b>${enc(tipoLabel)}</b>: ${enc(v)} <span style="color:var(--fn-faint)">· ${enc(u.pendingLink.reason||"")}</span></div>
            </div>
            <button class="btn sm" data-acceptlink="${uid}" style="color:var(--fn-teal);border-color:var(--fn-teal)"><i data-lucide="check"></i>Aplicar</button>
            <button class="btn sm" data-rejectlink="${uid}"><i data-lucide="x"></i>Rejeitar</button>
          </div>`;
        }).join("")}
      </div>
    </div>` : "";

  b.innerHTML=`<div class="act-toolbar"><h3>Usuários e perfis</h3>
    ${_currentUser?`<button class="btn sm" id="meuTrocarSenha"><i data-lucide="key-round"></i>Trocar minha senha</button>`:""}
    </div>
    <div class="hint" style="margin-bottom:12px"><b>Administrador</b> controla tudo. <b>Gestor</b> vê/edita todos. <b>Líder</b> vê/edita a própria equipe. <b>GP</b> vê os projetos sob sua gerência. <b>Analista</b> vê só a própria grade. <br><b>Líder/GP</b> têm um toggle <b>Meus/Geral</b> no header — em "Geral" enxergam toda a operação <b>em somente leitura</b>. Edição continua restrita ao admin/gestor (e aos próprios dados de líder/GP). <br><b>Status</b> controla o acesso: <b>Convidado/Ativo</b> podem usar o sistema; <b>Bloqueado/Inativo/Desligado</b> são impedidos de logar.</div>
    ${pendentesBox}
    <div class="list">${linhas||'<div class="empty-state">Nenhum usuário registrado ainda.</div>'}</div>
    ${novo}`;
  // Handlers dos vínculos pendentes
  if(podeGerenciar && pendentes.length){
    b.querySelectorAll("[data-acceptlink]").forEach(btn=>btn.addEventListener("click",()=>aplicarVinculoPendente(btn.dataset.acceptlink)));
    b.querySelectorAll("[data-rejectlink]").forEach(btn=>btn.addEventListener("click",()=>rejeitarVinculoPendente(btn.dataset.rejectlink)));
  }
  if(_currentUser){
    const btn=el("meuTrocarSenha");
    if(btn)btn.addEventListener("click",()=>{
      _pwdMode="suggest";
      el("pwdInfo").style.display="block";
      el("pwdInfo").innerHTML="<b>Troca de senha pessoal.</b> Informe a senha atual e a nova senha desejada.";
      el("pwdLater").style.display="";
      el("pwdClose").style.display="";
      el("pwdCurrent").value=""; el("pwdNew").value=""; el("pwdConfirm").value="";
      el("pwdError").textContent="";
      el("pwdOverlay").classList.add("open");
      lucideRefresh();
    });
  }
  if(podeGerenciar){
    el("nuCreate")&&el("nuCreate").addEventListener("click",createUserByAdmin);
    b.querySelectorAll("[data-rem]").forEach(btn=>btn.addEventListener("click",()=>removeUserAccess(btn.dataset.rem)));
    b.querySelectorAll("[data-edit]").forEach(btn=>btn.addEventListener("click",()=>{_editingUserUid=btn.dataset.edit;renderUsers();}));
    b.querySelectorAll("[data-cancel]").forEach(btn=>btn.addEventListener("click",()=>{_editingUserUid=null;renderUsers();}));
    b.querySelectorAll("[data-save]").forEach(btn=>btn.addEventListener("click",()=>saveUserEdit(btn.dataset.save)));
    // matriz de permissões por ação (somente quando há usuário em edição)
    if(_editingUserUid && document.querySelector(`.perm-matrix[data-permgrid="${CSS.escape(_editingUserUid)}"]`)){
      bindPermMatrix(_editingUserUid);
    }
    // toggle dinâmico do vínculo conforme o perfil em modo edição
    b.querySelectorAll("[id^=euRole_]").forEach(sel=>sel.addEventListener("change",e=>{
      const uid=sel.id.split("_")[1]; const r=e.target.value;
      el("euAnaWrap_"+uid).style.display=r==="analista"?"block":"none";
      el("euLidWrap_"+uid).style.display=r==="lider"?"block":"none";
      el("euGpWrap_"+uid).style.display=r==="gp"?"block":"none";
    }));
    if(el("nuRole"))nuRoleChange();
  }
}

function saveUserEdit(uid){
  if(!isAdmin())return;
  const role=el("euRole_"+uid).value;
  const status=el("euStatus_"+uid)?el("euStatus_"+uid).value:"ativo";
  const linkedAnalyst=role==="analista"?(el("euAna_"+uid).value||""):"";
  const linkedLider  =role==="lider"   ?(el("euLid_"+uid).value||""):"";
  const linkedGp     =role==="gp"      ?(el("euGp_"+uid).value||"") :"";
  const force=el("euForce_"+uid)?el("euForce_"+uid).checked:false;
  // Matriz de permissões por ação — só overrides explícitos (Herdar é omitido).
  const permsObj=gatherPerms(uid);
  const temPerms=Object.keys(permsObj).length>0;
  // Firebase remove nós vazios; quando não há override, gravamos null para limpar.
  const perms=temPerms?permsObj:null;
  const update={role,status,linkedAnalyst,linkedLider,linkedGp,perms,forceChangePassword:force,updatedAt:new Date().toISOString(),updatedBy:(_currentUser&&_currentUser.email)||"admin"};
  if(!_db){ // modo local
    Object.assign(_usersCache[uid]||{},update);
    if(!temPerms && _usersCache[uid]) delete _usersCache[uid].perms;
    _editingUserUid=null; renderUsers();
    alert("Alterações salvas localmente (sem nuvem configurada).");
    return;
  }
  _db.ref(USERS_PATH+"/"+uid).update(update)
    .then(()=>{
      const antes={role:_usersCache[uid]&&_usersCache[uid].role, status:_usersCache[uid]&&_usersCache[uid].status, linkedAnalyst:_usersCache[uid]&&_usersCache[uid].linkedAnalyst, linkedLider:_usersCache[uid]&&_usersCache[uid].linkedLider, linkedGp:_usersCache[uid]&&_usersCache[uid].linkedGp, forceChangePassword:_usersCache[uid]&&_usersCache[uid].forceChangePassword, perms:_usersCache[uid]&&_usersCache[uid].perms||null};
      Object.assign(_usersCache[uid]||{},update);
      if(!temPerms && _usersCache[uid]) delete _usersCache[uid].perms; // espelha a limpeza local
      const depois={role:update.role, status:update.status, linkedAnalyst:update.linkedAnalyst, linkedLider:update.linkedLider, linkedGp:update.linkedGp, forceChangePassword:update.forceChangePassword, perms:perms};
      const dif=_diff(antes,depois);
      if(dif)audit("user.update", _usersCache[uid]&&_usersCache[uid].email||uid, dif.antes, dif.depois);
      _editingUserUid=null;renderUsers();
    })
    .catch(err=>{console.error("[Alocações] erro ao salvar usuário:",err);alert("Falha ao salvar: "+(err.message||err));});
}
function nuRoleChange(){
  const r=el("nuRole").value;
  el("nuAnalistaWrap").style.display=r==="analista"?"block":"none";
  el("nuLiderWrap").style.display=r==="lider"?"block":"none";
  el("nuGpWrap").style.display=r==="gp"?"block":"none";
}
// Cria usuário SEM deslogar o admin (app Firebase secundário) — molde da Capacitação
function createUserByAdmin(){
  if(!isAdmin()){alert("Apenas administradores podem criar usuários.");return;}
  const email=el("nuEmail").value.trim(), pass=el("nuPass").value, role=el("nuRole").value;
  const linkedAnalyst=role==="analista"?(el("nuAnalista").value||""):"";
  const linkedLider=role==="lider"?(el("nuLider").value||""):"";
  const linkedGp=role==="gp"?(el("nuGp").value||""):"";
  const st=el("nuStatus"); st.style.color="#a33";
  if(!email){st.textContent="Informe o e-mail.";return;}
  if(!pass||pass.length<6){st.textContent="A senha deve ter ao menos 6 caracteres.";return;}
  if(ALLOWED_EMAIL_DOMAIN && !email.toLowerCase().endsWith("@"+ALLOWED_EMAIL_DOMAIN.toLowerCase())){st.textContent="E-mail deve ser do domínio @"+ALLOWED_EMAIL_DOMAIN+".";return;}
  st.style.color="var(--muted)"; st.textContent="Criando usuário...";
  try{
    if(!_secondaryApp)_secondaryApp=firebase.initializeApp(firebaseConfig,"userCreator");
    const secAuth=_secondaryApp.auth();
    secAuth.createUserWithEmailAndPassword(email,pass)
      .then(cred=>_db.ref(USERS_PATH+"/"+cred.user.uid).set({email,role,linkedAnalyst,linkedLider,linkedGp,createdAt:new Date().toISOString()}).then(()=>secAuth.signOut()))
      .then(()=>{st.style.color="#2f7a4f";st.textContent="✅ "+email+" criado e habilitado para login.";el("nuEmail").value="";el("nuPass").value="";})
      .catch(e=>{st.style.color="#a33";st.textContent=traduzErroAuth(e.code)||("Erro: "+e.message);});
  }catch(e){st.style.color="#a33";st.textContent="Erro ao criar usuário: "+e.message;}
}
function removeUserAccess(uid){
  if(!isAdmin())return;
  if(uid===(_currentUser&&_currentUser.uid)){alert("Você não pode remover seu próprio acesso.");return;}
  const u=_usersCache[uid]||{};
  if(!confirm("Remover o acesso de "+(u.email||"este usuário")+"?\n\nIsso bloqueia o acesso aos dados. Para apagar a conta de login, use o Console do Firebase → Authentication.")) return;
  _db.ref(USERS_PATH+"/"+uid).remove().catch(e=>alert("Erro ao remover: "+e.message));
}

/* ===================== AUTENTICAÇÃO ===================== */
function showAuth(mode){
  const s=el("authScreen"); s.classList.add("show");
  const sub=el("authSubtitle"), f=el("authFields");
  if(mode==="loading"){sub.textContent="Verificando acesso...";f.style.display="none";}
  else if(mode==="config"){sub.textContent="Conexão com a nuvem ainda não configurada. Clique abaixo para configurar.";f.style.display="none";}
  else{sub.textContent="Entre com seu e-mail e senha";f.style.display="flex";}
}
function hideAuth(){el("authScreen").classList.remove("show");el("authError").textContent="";}
function authErr(m){el("authError").textContent=m||"";}
function setUserLabel(email){el("userLabel").textContent=email?("Conectado: "+email):"";el("logoutBtn").style.display=email?"":"none";}
function traduzErroAuth(code){
  const m={"auth/invalid-email":"E-mail inválido.","auth/missing-password":"Informe a senha.","auth/weak-password":"A senha precisa ter ao menos 6 caracteres.","auth/email-already-in-use":"Este e-mail já tem cadastro.","auth/invalid-credential":"E-mail ou senha incorretos.","auth/wrong-password":"Senha incorreta.","auth/user-not-found":"Usuário não encontrado.","auth/too-many-requests":"Muitas tentativas. Aguarde um pouco.","auth/operation-not-allowed":"Ative o login por E-mail/Senha no Console do Firebase."};
  return m[code]||("Erro: "+code);
}
function doLogin(){
  console.log("[Alocações] doLogin chamado.");
  const btn=el("authLoginBtn");
  if(!_auth){console.warn("[Alocações] _auth ausente — conexão não configurada");authErr("Configure a conexão primeiro (⚙).");return;}
  const email=el("authEmail").value.trim(), pass=el("authPass").value;
  console.log("[Alocações] tentando autenticar:", email, "| senha tem", pass.length, "caracteres");
  if(!email||!pass){authErr("Informe e-mail e senha.");return;}
  authErr("");
  // feedback visual: trava botão pra evitar duplo clique
  const txtOriginal=btn.textContent; btn.textContent="Entrando…"; btn.disabled=true;
  const liberaBtn=()=>{btn.textContent=txtOriginal; btn.disabled=false;};
  // timeout defensivo: se a chamada não responder em 15s, libera o botão e avisa
  const tmo=setTimeout(()=>{console.error("[Alocações] signIn não respondeu em 15s");authErr("Conexão lenta ou bloqueada. Tente novamente.");liberaBtn();},15000);
  _auth.signInWithEmailAndPassword(email,pass)
    .then(cred=>{clearTimeout(tmo);console.log("[Alocações] login OK:", cred.user&&cred.user.email);/* hideAuth virá via onAuthStateChanged */})
    .catch(err=>{clearTimeout(tmo);console.error("[Alocações] erro no login:", err.code, err.message);authErr(traduzErroAuth(err.code));liberaBtn();});
}
function doLogout(){if(_auth)_auth.signOut();}

// Registra o usuário em /users (o ADMIN_PRINCIPAL é sempre admin) e carrega o perfil
// === Status dos usuários do sistema ===
const USER_STATUSES = ["convidado","ativo","bloqueado","inativo","desligado"];
const USER_STATUS_LABELS = {
  convidado:"Convidado", ativo:"Ativo", bloqueado:"Bloqueado", inativo:"Inativo", desligado:"Desligado"
};
const USER_STATUS_COLORS = {
  convidado:["#8B5CF6","#F5F3FF","#DDD6FE"],
  ativo:    ["#14B8A6","#F0FDFA","#99F6E4"],
  bloqueado:["#DC2626","#FEF2F2","#FECACA"],
  inativo:  ["#64748B","#F8FAFC","#CBD5E1"],
  desligado:["#5a5a5a","#EEEEEE","#D5D5D5"],
};
function statusBadgeUser(s){
  const v=USER_STATUS_COLORS[s]||USER_STATUS_COLORS.ativo;
  return `<span class="badge-small" style="color:${v[0]};background:${v[1]};border-color:${v[2]};font-weight:700">${USER_STATUS_LABELS[s]||"—"}</span>`;
}
function podeLogar(perfil){
  // bloqueado/inativo/desligado → não consegue usar o sistema
  if(!perfil)return true; // primeira vez: passa (cadastra como ativo)
  const s=perfil.status||"ativo";
  return s==="ativo"||s==="convidado";
}

/* ============================================================
   AUDITORIA — registra eventos em /alocacoes/audit
   Cada evento: { ts, user, role, kind, target, before, after, source, note }
     - kind: tipo do evento (allocation.create, project.update, user.role-change…)
     - target: identificador do alvo (slot, nome do projeto, uid…)
     - before/after: valor anterior/novo (omitidos quando não fazem sentido)
     - source: "ui" (manual) | "import" (lote) | "system"
   Operação é fire-and-forget: falhas não bloqueiam o fluxo do usuário.
   ============================================================ */
function audit(kind, target, before, after, opts){
  if(!_db) return; // sem nuvem configurada → silencia
  try{
    const ev = {
      ts: new Date().toISOString(),
      user: (_currentUser && _currentUser.email) || "anon",
      uid:  (_currentUser && _currentUser.uid) || "",
      role: _currentRole || "",
      kind: kind || "unknown",
      target: target!=null ? String(target).slice(0,200) : "",
      source: (opts&&opts.source) || "ui",
      note:   (opts&&opts.note)   || ""
    };
    // before/after só vão se forem pequenos (proteção contra ruído gigante)
    const trim = v => {
      if(v==null) return null;
      try{ const s=JSON.stringify(v); return s.length>2000 ? (s.slice(0,2000)+"…") : v; }
      catch(e){ return String(v).slice(0,2000); }
    };
    if(before!==undefined) ev.before = trim(before);
    if(after !==undefined) ev.after  = trim(after);
    _db.ref(AUDIT_PATH).push(ev).catch(()=>{});
  }catch(e){ /* nunca propaga */ }
}
// Helper para diffs de objeto: produz {antes:{...só campos alterados...}, depois:{...}}
function _diff(oldObj, newObj){
  if(!oldObj && !newObj) return null;
  if(!oldObj) return {antes:null, depois:newObj};
  if(!newObj) return {antes:oldObj, depois:null};
  const a={}, b={};
  const keys = new Set([...Object.keys(oldObj||{}), ...Object.keys(newObj||{})]);
  keys.forEach(k=>{
    const ov=oldObj[k], nv=newObj[k];
    const eq = JSON.stringify(ov)===JSON.stringify(nv);
    if(!eq){ a[k]=ov; b[k]=nv; }
  });
  if(!Object.keys(a).length) return null; // nada mudou
  return {antes:a, depois:b};
}

// "há 2h", "há 3d", "ontem", "agora" — formato curto para a lista
function _fmtLastSeen(iso){
  if(!iso)return "<span style='color:var(--fn-faint)'>nunca</span>";
  try{
    const t=Date.parse(iso); if(!t)return "—";
    const diff=Date.now()-t;
    const min=Math.floor(diff/60000);
    if(min<2)return "<b style='color:var(--fn-teal)'>agora</b>";
    if(min<60)return `há ${min}min`;
    const h=Math.floor(min/60);
    if(h<24)return `há ${h}h`;
    const d=Math.floor(h/24);
    if(d===1)return "ontem";
    if(d<30)return `há ${d}d`;
    if(d<365)return `há ${Math.floor(d/30)}mes`;
    return `há ${Math.floor(d/365)}a`;
  }catch(e){return "—";}
}

// Aplica um vínculo pendente: copia pendingLink.value para o campo linked* certo,
// ajusta role conforme o tipo, e remove pendingLink.
function aplicarVinculoPendente(uid){
  if(!isAdmin())return;
  const u=_usersCache[uid]; if(!u||!u.pendingLink)return;
  const t=u.pendingLink.type, v=u.pendingLink.value;
  if(!confirm(`Aplicar vínculo?\n\n${u.email}\n→ ${t.toUpperCase()}: ${v}\n\nO perfil do usuário também será ajustado para "${t}" se atualmente estiver como "leitura".`))return;
  const update={pendingLink:null, updatedAt:new Date().toISOString(), updatedBy:(_currentUser&&_currentUser.email)||"admin"};
  if(t==="analista"){update.linkedAnalyst=v; if(u.role==="leitura")update.role="analista";}
  else if(t==="lider"){update.linkedLider=v; if(u.role==="leitura")update.role="lider";}
  else if(t==="gp"){update.linkedGp=v; if(u.role==="leitura")update.role="gp";}
  if(!_db){Object.assign(_usersCache[uid],update);renderUsers();return;}
  _db.ref(USERS_PATH+"/"+uid).update(update).then(()=>{Object.assign(_usersCache[uid],update);audit("user.pending-link.apply", u.email||uid, {pendingLink:u.pendingLink}, {type:t,value:v,role:update.role});renderUsers();})
    .catch(err=>alert("Falha ao aplicar vínculo: "+(err.message||err)));
}

function rejeitarVinculoPendente(uid){
  if(!isAdmin())return;
  const u=_usersCache[uid]; if(!u||!u.pendingLink)return;
  if(!confirm(`Rejeitar a sugestão de vínculo para ${u.email}?\n\nA sugestão será descartada. O usuário pode ser vinculado manualmente depois clicando em "Editar".`))return;
  const update={pendingLink:null, updatedAt:new Date().toISOString(), updatedBy:(_currentUser&&_currentUser.email)||"admin"};
  if(!_db){Object.assign(_usersCache[uid],update);renderUsers();return;}
  _db.ref(USERS_PATH+"/"+uid).update(update).then(()=>{Object.assign(_usersCache[uid],update);audit("user.pending-link.reject", u.email||uid, {pendingLink:u.pendingLink}, null);renderUsers();})
    .catch(err=>alert("Falha ao rejeitar: "+(err.message||err)));
}

/* ===== Integração com o CORE (controle de acesso central) =====
   Robusta e fail-safe: admin/root sempre entram; em caso de erro de
   leitura do CORE, LIBERA (não trava o sistema). Só bloqueia quando
   tem certeza de que a pessoa NÃO tem acesso liberado. */
const NSCORE_SYSTEM_ID  = "ns_alocacoes";
const NSCORE_ROOT_EMAIL = "diego.rodrigues@nstech.com.br";

function checarAcessoCore(user){
  return new Promise(function(resolve){
    // 1) sem usuário ou sem conexão: não trava (deixa o fluxo normal seguir)
    if(!user || !_db){ resolve(true); return; }
    // 2) admin-raiz: sempre entra
    // reusa a função nativa do ALOC para reconhecer o admin-raiz
    if(typeof isAdminEmail==="function" && isAdminEmail(user.email)){ resolve(true); return; }
    if(user.email && user.email.toLowerCase() === NSCORE_ROOT_EMAIL){ resolve(true); return; }
    var base = _db.ref("ns_core");
    // 3) admin do CORE? entra em qualquer sistema
    base.child("users/"+user.uid+"/role").once("value").then(function(rs){
      if(rs.val() === "admin"){ resolve(true); return null; }
      // 4) tem acesso liberado a este sistema?
      return base.child("access/"+user.uid+"/"+NSCORE_SYSTEM_ID).once("value").then(function(as){
        var node = as.val();
        resolve(!!node && node.allowed !== false);
      });
    }).catch(function(err){
      // 5) FAIL-SAFE: erro de leitura do CORE não pode derrubar o ALOC.
      //    Libera e registra no console (não bloqueia por falha técnica).
      console.warn("[CORE] leitura falhou, liberando por seguranca:", err && (err.code||err.message));
      resolve(true);
    });
  });
}

function mostrarSemAcesso(user){
  try{
    el("authScreen").classList.add("show");
    var sub = el("authSubtitle"), f = el("authFields");
    if(sub) sub.innerHTML = "Você não tem acesso ao <b>NS ALOC</b>.<br>Solicite a liberação a um administrador no Portal.";
    if(f) f.style.display = "none";
    setUserLabel("");
  }catch(e){ console.error(e); }
}

function registerAndLoadRole(user){
  const ref=_db.ref(USERS_PATH+"/"+user.uid);
  const ehRoot=isAdminEmail(user.email);
  const agora=new Date().toISOString();
  return ref.get().then(snap=>{
    if(snap.exists()){
      const u=snap.val();
      // Bloqueio por status: usuários inativos/bloqueados/desligados não conseguem usar
      if(!ehRoot && !podeLogar(u)){
        const lbl=USER_STATUS_LABELS[u.status]||"Bloqueado";
        alert(`Sua conta está com status "${lbl}". Procure um administrador para reativar o acesso.`);
        return firebase.auth().signOut().then(()=>{throw new Error("Conta "+lbl.toLowerCase());});
      }
      if(ehRoot&&u.role!=="admin"){_currentRole="admin";return ref.update({email:user.email,role:"admin",status:"ativo",lastLoginAt:agora,loginCount:(u.loginCount||0)+1}).then(()=>{applyRoleToUI();maybePromptPasswordChange(user,u);});}
      _currentRole=u.role||"leitura";
      _currentPerms=u.perms||{};
      _linkedAnalyst=u.linkedAnalyst||"";
      _linkedLider=u.linkedLider||"";
      _linkedGp=u.linkedGp||"";
      // Atualização leve: lastLoginAt + loginCount + email (se mudou)
      const update={lastLoginAt:agora, loginCount:(u.loginCount||0)+1};
      if(u.email!==user.email)update.email=user.email;
      if(!u.status)update.status="ativo"; // backfill para usuários antigos
      ref.update(update).catch(()=>{});
      autoDetectarVinculos(user); // tenta marcar vínculos pendentes
      applyRoleToUI();
      maybePromptPasswordChange(user,u);
      return;
    }
    // Primeiro cadastro: entra como ATIVO (não-pendente), por decisão de produto
    const role=ehRoot?"admin":"leitura"; _currentRole=role; _currentPerms={};
    const novoPerfil={email:user.email,role,status:"ativo",linkedAnalyst:"",linkedLider:"",linkedGp:"",createdAt:agora,lastLoginAt:agora,loginCount:1};
    return ref.set(novoPerfil)
      .then(()=>{autoDetectarVinculos(user);applyRoleToUI();maybePromptPasswordChange(user,novoPerfil);});
  }).catch(err=>{
    if(err && /Conta /.test(err.message||""))return; // já tratado acima
    console.warn("Perfil:",err);_currentRole=ehRoot?"admin":"leitura";applyRoleToUI();
  });
}
// Se o usuário não tem vínculos explícitos, tenta detectar pelo e-mail e
// grava como SUGESTÃO PENDENTE (pendingLink) para o admin revisar.
// O vínculo real só é aplicado quando o admin confirmar na tela de revisão.
function autoDetectarVinculos(user){
  if(!user||!user.email||!_currentUser)return;
  // se já tem algum vínculo explícito, não toca
  if(_linkedAnalyst||_linkedLider||_linkedGp)return;
  if(_currentRole==="admin"||_currentRole==="gestor")return; // perfis com visão total não precisam
  // Já existe sugestão pendente? não duplica
  const a=analistaPorEmail(user.email);
  if(a){
    _db.ref(USERS_PATH+"/"+user.uid).update({
      pendingLink:{type:"analista", value:a.nome, suggestedAt:new Date().toISOString(), reason:"e-mail bate com analista cadastrado"}
    }).catch(()=>{});
    return;
  }
  const l=liderPorEmail(user.email);
  if(l){
    _db.ref(USERS_PATH+"/"+user.uid).update({
      pendingLink:{type:"lider", value:l, suggestedAt:new Date().toISOString(), reason:"e-mail bate com líder cadastrado"}
    }).catch(()=>{});
    return;
  }
  const g=gpPorEmail(user.email);
  if(g){
    _db.ref(USERS_PATH+"/"+user.uid).update({
      pendingLink:{type:"gp", value:g, suggestedAt:new Date().toISOString(), reason:"e-mail bate com GP cadastrado"}
    }).catch(()=>{});
    return;
  }
}
/* ===== Troca de senha + primeiro login =====
   - Após login, verifica se o usuário precisa trocar a senha:
     * primeira vez logando (creationTime ≈ lastSignInTime), OU
     * flag forceChangePassword:true no perfil (admin marcou)
   - Mostra modal sugerindo. Se for por flag, modal não tem "agora não".
*/
let _pwdMode="suggest"; // "suggest" | "force"
function _ehPrimeiroLogin(user){
  if(!user||!user.metadata)return false;
  const c=Date.parse(user.metadata.creationTime||"")||0;
  const l=Date.parse(user.metadata.lastSignInTime||"")||0;
  if(!c||!l)return false;
  // Se a diferença for menor que 60 segundos, consideramos primeiro login
  return Math.abs(l-c)<60000;
}
function maybePromptPasswordChange(user, perfilSnap){
  try{
    const force = perfilSnap && perfilSnap.forceChangePassword===true;
    const primeiro = _ehPrimeiroLogin(user);
    if(!force && !primeiro)return;
    _pwdMode = force ? "force" : "suggest";
    // Mensagem informativa
    const info=el("pwdInfo");
    if(force){
      info.style.display="block";
      info.innerHTML='<b style="color:var(--fn-orange)">⚠ Troca de senha obrigatória.</b><br>Um administrador solicitou que você defina uma nova senha antes de continuar.';
      el("pwdLater").style.display="none";
      el("pwdClose").style.display="none";
    }else{
      info.style.display="block";
      info.innerHTML='<b>Primeiro acesso detectado.</b> Recomendamos definir uma nova senha pessoal — você pode pular e fazer depois.';
      el("pwdLater").style.display="";
      el("pwdClose").style.display="";
    }
    el("pwdCurrent").value=""; el("pwdNew").value=""; el("pwdConfirm").value="";
    el("pwdError").textContent="";
    el("pwdOverlay").classList.add("open");
    lucideRefresh();
  }catch(e){console.warn("[Senha] erro ao avaliar primeiro login:",e);}
}
function closePwdModal(){
  if(_pwdMode==="force"){alert("É necessário trocar a senha para continuar.");return;}
  el("pwdOverlay").classList.remove("open");
}
function laterPwdModal(){
  if(_pwdMode==="force")return;
  el("pwdOverlay").classList.remove("open");
}
function salvarNovaSenha(){
  const errEl=el("pwdError"); errEl.textContent="";
  const atual=el("pwdCurrent").value, nova=el("pwdNew").value, conf=el("pwdConfirm").value;
  if(!atual){errEl.textContent="Informe sua senha atual.";return;}
  if(!nova||nova.length<8){errEl.textContent="A nova senha precisa ter ao menos 8 caracteres.";return;}
  if(nova!==conf){errEl.textContent="A confirmação não confere com a nova senha.";return;}
  if(nova===atual){errEl.textContent="A nova senha deve ser diferente da atual.";return;}
  if(!_currentUser||!_auth){errEl.textContent="Sessão inválida — faça login novamente.";return;}
  const btn=el("pwdSave"); btn.disabled=true; btn.innerHTML='<i data-lucide="loader-2"></i>Atualizando...';
  lucideRefresh();
  // Reautentica com a senha atual e troca
  const cred=firebase.auth.EmailAuthProvider.credential(_currentUser.email,atual);
  _currentUser.reauthenticateWithCredential(cred)
    .then(()=>_currentUser.updatePassword(nova))
    .then(()=>{
      // Limpa flag forceChangePassword se existia
      return _db.ref(USERS_PATH+"/"+_currentUser.uid).update({forceChangePassword:false, passwordChangedAt:new Date().toISOString()});
    })
    .then(()=>{
      el("pwdOverlay").classList.remove("open");
      alert("✅ Senha atualizada com sucesso.");
    })
    .catch(err=>{
      console.error("[Senha] erro:",err);
      const msg=err.code==="auth/wrong-password" ? "Senha atual incorreta."
              : err.code==="auth/weak-password" ? "Senha muito fraca — use mais caracteres ou variações."
              : err.code==="auth/requires-recent-login" ? "Sessão expirada — saia e faça login novamente para trocar a senha."
              : ("Erro: "+(err.message||err.code||"desconhecido"));
      errEl.textContent=msg;
    })
    .finally(()=>{
      btn.disabled=false; btn.innerHTML='<i data-lucide="check"></i>Salvar nova senha';
      lucideRefresh();
    });
}

function applyRoleToUI(){
  // Controle direto de visibilidade (sem depender de classes no body, que podiam
  // ficar "presas" e esconder o botão mesmo para admin).
  const podeEditar=isAdmin()||isGestor()||isLider()||isGp();
  const ib=el("incluirAlocBtn"); if(ib) ib.style.display=canIncluirAlocacao()?"":"none";
  const rb=el("resetBtn"); if(rb) rb.style.display=(podeEditar&&canEditAction("grade"))?"":"none";
  // Visibilidade dos itens de menu por permissão de ação (dinâmica).
  applyActionMenuVisibility();
  // mantém as classes (caso algum estilo futuro use), mas elas não controlam mais o botão
  document.body.classList.toggle("ro-cadastros",!canEditCadastros());
  document.body.classList.toggle("ro-noedit",!podeEditar);
  el("roleLabel").textContent=ROLE_LABELS[_currentRole]||"—";
  // atualiza avatar da sidebar
  { const av=el("sbUserAv"); if(av){const e=(_currentUser&&_currentUser.email)||"?";av.textContent=(e[0]||"?").toUpperCase();} }
  // Toggle de Escopo (Meus / Geral) só aparece para Líder e GP
  aplicarEstadoViewMode();
  console.log("[Alocações] perfil resolvido:", _currentRole, "| e-mail:", _currentUser&&_currentUser.email, "| permissões:", _resumoPermsLog());
  renderConsultorSelect(); renderAll();
}

// Aplica a visibilidade de cada item de menu/atalho conforme a permissão de ação.
// Mapa: id do botão (ou seletor data-nav) → id da ação. Itens "none" somem.
function applyActionMenuVisibility(){
  const map = [
    {sel:'.sb-link[data-nav="grade"]',     action:"grade"},
    {sel:'.sb-link[data-nav="torre"]',     action:"torre"},
    {sel:'#esteiraBtn',                    action:"esteira"},
    {sel:'#discoveryBtn',                  action:"discovery"},
    {sel:'#reportsBtn',                    action:"relatorios"},
    {sel:'#kpisBtn',                       action:"kpis"},
    {sel:'#acoesBtn',                      action:"cadastros"},
  ];
  map.forEach(m=>{
    const vis = canViewAction(m.action);
    document.querySelectorAll(m.sel).forEach(eln=>{ eln.style.display = vis ? "" : "none"; });
  });
}
function _resumoPermsLog(){ try{ return ACTIONS.map(a=>a.id+":"+actionLevel(a.id)).join(" "); }catch(e){ return "?"; } }

// Mostra/esconde o toggle, sincroniza estado dos botões e faixa de aviso
function aplicarEstadoViewMode(){
  const w=el("scopeToggleWrap"); if(!w)return;
  if(podeAlternarVisao()){
    w.style.display="";
    const seg=el("scopeSeg"); if(seg)seg.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.vm===_viewMode));
    const bn=el("readonlyBanner"); if(bn)bn.style.display=ehVisaoGeral()?"":"none";
    document.body.classList.toggle("viewmode-geral", ehVisaoGeral());
  }else{
    w.style.display="none";
    _viewMode="meus";
    const bn=el("readonlyBanner"); if(bn)bn.style.display="none";
    document.body.classList.remove("viewmode-geral");
  }
  lucideRefresh();
}

/* ===================== SINCRONIZAÇÃO EM TEMPO REAL ===================== */
function startDataSync(){
  if(_syncStarted)return; _syncStarted=true;
  // Fase 3: integração de Capacitação (2º Firebase) NÃO conecta mais no boot.
  // É conectada sob demanda por ensureCapIntegration() ao abrir Grade / KPIs / Cadastros,
  // economizando download nas sessões que ficam na Home/Torre/Esteira/Discovery/Relatórios.
  if(ALLOC_WINDOWED_READ){ _startWindowedRegSync(); } else {
  _db.ref(DB_PATH).on("value",snap=>{
    const remote=snap.val();
    const valido=remote&&(remote.reg||Array.isArray(remote.alloc));
    _fbReady=true; _initialLoadDone=true;
    if(valido){
      if(remote.reg)REG=remote.reg;
      REG.lideres=REG.lideres||[];REG.analistas=REG.analistas||[];REG.projetos=REG.projetos||[];REG.feriados=REG.feriados||[];REG.gps=REG.gps||[];REG.lideresInativos=REG.lideresInativos||{};REG.gpsInativos=REG.gpsInativos||{};REG.lideresEmails=REG.lideresEmails||{};REG.gpsEmails=REG.gpsEmails||{};REG.atividades=REG.atividades&&REG.atividades.length?REG.atividades:seedAtividades();
      DATA=arrayToAlloc(remote.alloc);
      lsSaveLocal();
      renderConsultorSelect();renderAll();setSyncBadge("online");
    }else{
      // nuvem vazia: publica a base local (semente) como ponto de partida
      setSyncBadge("online");
      const temLocal=(REG.analistas&&REG.analistas.length)||Object.keys(DATA).length;
      if(temLocal)_db.ref(DB_PATH).set(sanitizeForFirebase({reg:REG,alloc:allocToArray()})).catch(e=>console.warn("seed nuvem:",e));
      renderConsultorSelect();renderAll();
    }
  },err=>{console.warn("Sem nuvem:",err);setSyncBadge("offline");});
  }
  try{ _startPrevSync(); }catch(e){ console.warn("[previsto] start:",e); }
  _db.ref(".info/connected").on("value",s=>setSyncBadge(s.val()?"online":"offline"));
  // lista de usuários (para a aba Usuários)
  if(!_usersStarted){_usersStarted=true;_db.ref(USERS_PATH).on("value",s=>{
    _usersCache=s.val()||{};
    // Mantém o nível de permissão do usuário logado sincronizado em tempo real:
    // se um admin alterar a matriz/perfil deste usuário, a UI reflete sem novo login.
    try{
      const me=_currentUser&&_usersCache[_currentUser.uid];
      if(me && !isAdminEmail(_currentUser.email)){
        const novoRole=me.role||"leitura", novosPerms=me.perms||{};
        const mudou = (novoRole!==_currentRole) || (JSON.stringify(novosPerms)!==JSON.stringify(_currentPerms));
        if(mudou){ _currentRole=novoRole; _currentPerms=novosPerms; applyRoleToUI(); }
      }
    }catch(e){}
    if(actTab==="usuarios"&&el("actOverlay").classList.contains("open"))renderActions();
  },e=>console.warn("users:",e));}
}
// MODO JANELA (passo 3b): registro ao vivo (state/reg) + alocações por janela (buckets).
// Não anexa o listener do alloc monolítico — é o que derruba o download inicial.
function _startWindowedRegSync(){
  _db.ref(DB_PATH+"/reg").on("value", s=>{
    const reg=s.val();
    _fbReady=true; _initialLoadDone=true;
    if(reg) REG=reg;
    REG.lideres=REG.lideres||[];REG.analistas=REG.analistas||[];REG.projetos=REG.projetos||[];REG.feriados=REG.feriados||[];REG.gps=REG.gps||[];REG.lideresInativos=REG.lideresInativos||{};REG.gpsInativos=REG.gpsInativos||{};REG.lideresEmails=REG.lideresEmails||{};REG.gpsEmails=REG.gpsEmails||{};REG.atividades=REG.atividades&&REG.atividades.length?REG.atividades:seedAtividades();
    lsSaveLocal();
    renderConsultorSelect(); renderAll(); setSyncBadge("online");
  }, err=>{ console.warn("Sem nuvem (reg):",err); setSyncBadge("offline"); });
  _histCompleto=false;            // a partir daqui DATA é parcial (só a janela), até alguém pedir histórico completo
  _carregarJanela(mesesVisiveis());
}

/* ===================== CONEXÃO (modal ⚙) ===================== */
function openCfg(){
  const c=JSON.parse(localStorage.getItem(CFG_KEY)||"null")||DEFAULT_FIREBASE_CONFIG;
  el("cfgApiKey").value=c.apiKey||"";el("cfgAuthDomain").value=c.authDomain||"";el("cfgDatabaseURL").value=c.databaseURL||"";
  el("cfgProjectId").value=c.projectId||"";el("cfgStorageBucket").value=c.storageBucket||"";el("cfgMessagingSenderId").value=c.messagingSenderId||"";el("cfgAppId").value=c.appId||"";
  el("cfgPaste").value="";
  const st=el("cfgStatus");st.textContent=_db?"✅ Conectado à nuvem.":"⚪ Ainda não configurado — cole o firebaseConfig do seu projeto novo.";st.style.color=_db?"#2f7a4f":"var(--muted)";
  el("cfgOverlay").classList.add("open");
}
function closeCfg(){el("cfgOverlay").classList.remove("open");}
function parseConfigText(){
  const txt=el("cfgPaste").value; if(!txt.trim())return;
  const get=k=>{const m=txt.match(new RegExp('"?'+k+'"?\\s*:\\s*"([^"]*)"'));return m?m[1]:null;};
  const fields={cfgApiKey:"apiKey",cfgAuthDomain:"authDomain",cfgDatabaseURL:"databaseURL",cfgProjectId:"projectId",cfgStorageBucket:"storageBucket",cfgMessagingSenderId:"messagingSenderId",cfgAppId:"appId"};
  let achou=false;
  for(const[id,k]of Object.entries(fields)){const v=get(k);if(v!==null){el(id).value=v;achou=true;}}
  if(achou){const st=el("cfgStatus");st.textContent="↧ Campos preenchidos. Confira o databaseURL e clique em Conectar e salvar.";st.style.color="#2f7a4f";}
}
function gatherCfg(){return {apiKey:el("cfgApiKey").value.trim(),authDomain:el("cfgAuthDomain").value.trim(),databaseURL:el("cfgDatabaseURL").value.trim(),projectId:el("cfgProjectId").value.trim(),storageBucket:el("cfgStorageBucket").value.trim(),messagingSenderId:el("cfgMessagingSenderId").value.trim(),appId:el("cfgAppId").value.trim()};}
function saveFirebaseConfig(){
  const cfg=gatherCfg();
  if(!cfg.databaseURL){const st=el("cfgStatus");st.textContent="⚠️ Informe ao menos o databaseURL (obrigatório).";st.style.color="#a33";return;}
  localStorage.setItem(CFG_KEY,JSON.stringify(cfg));
  alert("Configuração salva! O sistema vai recarregar para conectar à nuvem.");location.reload();
}
function clearFirebaseConfig(){
  if(!confirm("Remover a configuração de conexão deste aparelho?"))return;
  localStorage.removeItem(CFG_KEY);alert("Configuração removida. O sistema vai recarregar.");location.reload();
}
function copyMyConfig(){
  const cfg=gatherCfg(),st=el("cfgStatus");
  if(!cfg.databaseURL){st.textContent="⚠️ Preencha a config antes de copiar (databaseURL é obrigatório).";st.style.color="#a33";return;}
  const texto="const firebaseConfig = {\n"+Object.entries(cfg).map(([k,v])=>'  '+k+': "'+v+'"').join(",\n")+"\n};";
  const ok=()=>{st.textContent="📋 Config copiada! Envie para a equipe colar aqui.";st.style.color="#2f7a4f";};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(texto).then(ok,()=>{prompt("Copie:",texto);});
  else prompt("Copie:",texto);
}

/* ===================== RELATÓRIOS ===================== */
// Estado próprio dos relatórios (não interfere na grade principal)
let repTab="alocacao", repScope="todos", repPeriodMode="semana", repFrom=null, repTo=null;
let repProjetoSel=""; // projeto selecionado no Mapa de Projeto
let repSort={col:null, asc:false};
let _repDadosCarregados=false;       // Relatórios: abrir modal NÃO baixa dados
let _repPeriodoCarregado="";         // controle do período efetivamente baixado
let _repTabCarregada="";             // última aba consultada sob demanda
let _repPrevistoCarregado=false;      // aba Aderência precisa também dos buckets PREV

function _marcarRelatorioPendente(){
  _repDadosCarregados=false;
  _repPeriodoCarregado="";
  _repTabCarregada="";
  _repPrevistoCarregado=false;
}
function _htmlRelatorioSobDemanda(){
  return `<div class="rep-empty">
    <b>Nenhum dado foi baixado ainda.</b><br>
    Escolha o período e clique em <b>Aplicar Filtro</b> para carregar somente os buckets necessários deste relatório.
  </div>`;
}

function openReports(){
  if(!canViewAction("relatorios")){ alert("Você não tem acesso aos Relatórios."); return; }
  _fecharOutrasTelas("repOverlay");
  repTab="alocacao";
  _marcarRelatorioPendente();
  el("repOverlay").classList.add("open");
  aplicarDatasPadrao("repPeriodoDataInicio", "repPeriodoDataFim");
  repFrom = el("repPeriodoDataInicio") ? el("repPeriodoDataInicio").value : repFrom;
  repTo   = el("repPeriodoDataFim") ? el("repPeriodoDataFim").value : repTo;
  repPeriodMode="custom";
  renderReports();
}
function closeReports(){el("repOverlay").classList.remove("open");}

/* ===== Fase 2 · Modal de Conflitos previsto × realizado ===== */
function openConflitos(){
  if(!canViewAction("prealoc")){ alert("Você não tem acesso à Pré-alocação."); return; }
  _conflitosDadosCarregados = false;
  _conflitosPeriodoCarregado = "";
  el("conflitosOverlay").classList.add("open");
  aplicarDatasPadrao("conflitosPeriodoDataInicio", "conflitosPeriodoDataFim");
  const body=el("conflitosBody"); if(body) body.innerHTML = _htmlConflitosSobDemanda();
  lucideRefresh();
}
function closeConflitos(){ el("conflitosOverlay").classList.remove("open"); }
function renderConflitos(){
  const body=el("conflitosBody"); if(!body) return;
  const itens=_coletarConflitos();
  const nConf=itens.filter(x=>x.st==="conflito").length;
  const nPrev=itens.filter(x=>x.st==="previsto").length;
  if(!itens.length){
    body.innerHTML=`<div class="confl-empty"><i data-lucide="check-circle-2"></i><div style="margin-top:8px">Nenhum conflito e nenhum previsto vencido no seu escopo.</div></div>`;
    return;
  }
  const resumo=`<div class="rep-filters" style="gap:14px;font-size:12.5px">
    <span><b>${nConf}</b> conflito(s) · realizado em projeto diferente do previsto</span>
    <span><b>${nPrev}</b> previsto(s) vencido(s) · planejado e não realizado</span></div>`;
  const linhas=itens.map(x=>{
    const cls = x.st==="conflito" ? "is-conf" : "is-prev";
    const tag = x.st==="conflito"
      ? `<span class="cr-tag conf">conflito</span>`
      : `<span class="cr-tag prev">não realizado</span>`;
    const dataLbl = fmtDM(parseISO(x.iso))+"/"+parseISO(x.iso).getFullYear();
    const prevCel = (x.prevProj||"—")+(x.prevAtv?` · ${x.prevAtv}`:"");
    const realCel = x.st==="conflito" ? ((x.realProj||"—")+(x.realAtv?` · ${x.realAtv}`:"")) : "—";
    return `<div class="confl-row ${cls}">
      <div class="cr-an">${enc(x.c)}</div>
      <div>${dataLbl} · ${enc(x.slot)}</div>
      <div>${tag}</div>
      <div title="Previsto">▣ ${enc(prevCel)}</div>
      <div title="Realizado">● ${enc(realCel)}</div>
      <button class="cr-go" data-an="${enc(x.c)}" data-iso="${x.iso}">Ver na grade</button>
    </div>`;
  }).join("");
  body.innerHTML=resumo+`<div class="confl-list">${linhas}</div>`;
  body.querySelectorAll(".cr-go").forEach(b=>b.addEventListener("click",()=>irParaCelula(dec(b.dataset.an), b.dataset.iso)));
}
// Leva a grade até o analista/dia do conflito (Por analista · Dia).
function irParaCelula(nome, iso){
  closeConflitos();
  try{
    const d=parseISO(iso);
    refDate=d; weekStart=monday(d);
    viewMode="analista"; period="dia"; gradeProjFilter="";
    if(gradeAnalysts().includes(nome)) consultor=nome;
    irPara("grade");
    renderAll();
  }catch(e){ console.warn("[conflitos] navegar:",e); }
}
// Atualiza o badge de conflitos do header a partir da janela em memória.
function _atualizarBadgeConflitos(){
  const b=el("conflBadge"); if(!b) return;
  const n=_contarConflitosMem();
  if(n>0){ b.textContent=n; b.style.display=""; } else { b.style.display="none"; }
}

/* ===================== FASE 3 · Gerador de pré-alocação (previsto) =====================
   Cria o previsto do TIME do projeto a partir das datas-marco das ETAPAS.
   Regra v1 (toda configurável no modal, com preview obrigatório antes de gravar):
     • para cada etapa com data → todos os analistas do projeto, no DIA da etapa,
       em todos os slots úteis (default "dia inteiro"), pulando fim de semana/feriado;
     • cliente = nome do projeto; atividade = a selecionada; origem = "projeto:<nome>".
   Nunca toca no realizado (DATA). Idempotente: por padrão pula slot já previsto. */
const _gpState = { projeto:"", etapas:new Set(), slotMode:"dia", slotUnico:"Slot2", atividade:"Implantação", sobrescrever:false };
function _slotsUteis(){ return SLOTS.filter(s=>!s.lunch).map(s=>s.id); }
function _dataEtapa(p, eid){
  if(eid==="golive") return p.goLiveRealizado||p.goLiveAjustado||p.goLivePrevisto||"";
  const et=ETAPA_BY_ID[eid]; return et ? (p[et.field]||"") : "";
}
function _projetosVisiveis(){
  return (REG.projetos||[]).filter(p=>p&&p.nome).filter(p=>!foraDoEscopoAtual({cliente:p.nome}));
}
// Monta a lista de células-alvo classificadas (sem gravar).
function _gerarPrevistoPreview(){
  const p=(REG.projetos||[]).find(x=>x.nome===_gpState.projeto);
  if(!p) return {p:null,time:[],itens:[]};
  const time=(p.analistas||[]).filter(Boolean);
  const fer=feriadosMap();
  const slots = _gpState.slotMode==="dia" ? _slotsUteis() : [_gpState.slotUnico];
  const itens=[];
  [..._gpState.etapas].forEach(eid=>{
    const et=ETAPA_BY_ID[eid]; if(!et) return;
    const iso=_dataEtapa(p,eid); if(!iso) return;
    const d=parseISO(iso);
    const fimDeSemana=(d.getDay()===0||d.getDay()===6), feriado=!!fer[iso];
    time.forEach(a=>{
      slots.forEach(sid=>{
        const k=key(a,iso,sid);
        const jaPrev=PREV[k]||null, real=DATA[k]||null;
        let acao;
        if(fimDeSemana||feriado){ acao="bloqueado"; }
        else if(jaPrev){
          const igual=_normProj(jaPrev.cliente)===_normProj(_gpState.projeto);
          acao = igual ? "igual" : (_gpState.sobrescrever ? "sobrescreve" : "pula");
        } else acao="novo";
        const conflitaReal = !!(real && _temConteudo(real) && _normProj(real.cliente)!==_normProj(_gpState.projeto));
        itens.push({a,iso,sid,etapa:et.label,acao,conflitaReal,realProj:(real&&real.cliente)||"",fimDeSemana,feriado});
      });
    });
  });
  return {p,time,itens};
}
function _gpResumo(itens){
  const r={novo:0,sobrescreve:0,igual:0,pula:0,bloqueado:0,conflita:0};
  itens.forEach(it=>{ r[it.acao]=(r[it.acao]||0)+1; if(it.conflitaReal && (it.acao==="novo"||it.acao==="sobrescreve")) r.conflita++; });
  return r;
}
function _aplicarGeracao(){
  const pv=_gerarPrevistoPreview();
  const grava=pv.itens.filter(it=>it.acao==="novo"||it.acao==="sobrescreve");
  if(!grava.length){ alert("Nada a gravar com as opções atuais."); return; }
  if(!confirm(`Gerar ${grava.length} slot(s) de previsto para "${_gpState.projeto}"?`)) return;
  let nNovo=0,nSobr=0;
  grava.forEach(it=>{
    PREV[key(it.a,it.iso,it.sid)]={cliente:_gpState.projeto, atividade:_gpState.atividade, origem:"projeto:"+_gpState.projeto};
    if(it.acao==="novo")nNovo++; else nSobr++;
  });
  persistPrev();
  closeGerarPrev();
  renderAll();
  alert(`Pré-alocação gerada para "${_gpState.projeto}".\n• ${nNovo} novo(s)\n• ${nSobr} sobrescrito(s)`);
}
function openGerarPrev(){
  if(!canEditAction("grade")){ alert("Você não tem permissão de edição na Grade para gerar previsto."); return; }
  const vis=_projetosVisiveis();
  if(!_gpState.projeto || !vis.some(p=>p.nome===_gpState.projeto)) _gpState.projeto = vis[0]? vis[0].nome : "";
  _gpSyncEtapasPadrao();
  el("gerarPrevOverlay").classList.add("open");
  renderGerarPrev(); lucideRefresh();
}
function closeGerarPrev(){ el("gerarPrevOverlay").classList.remove("open"); }
// Marca por padrão todas as etapas que têm data no projeto atual.
function _gpSyncEtapasPadrao(){
  const p=(REG.projetos||[]).find(x=>x.nome===_gpState.projeto);
  _gpState.etapas=new Set();
  if(p) ETAPAS.forEach(e=>{ if(_dataEtapa(p,e.id)) _gpState.etapas.add(e.id); });
}
function renderGerarPrev(){
  const body=el("gerarPrevBody"); if(!body) return;
  const vis=_projetosVisiveis();
  if(!vis.length){ body.innerHTML=`<div class="confl-empty">Nenhum projeto no seu escopo.</div>`; return; }
  const p=(REG.projetos||[]).find(x=>x.nome===_gpState.projeto)||vis[0];
  const ativos=atividadesAtivas().map(a=>a.nome);
  if(!ativos.includes(_gpState.atividade)) _gpState.atividade = ativos.includes("Implantação")?"Implantação":(ativos[0]||"Implantação");
  const optProj=vis.map(x=>`<option value="${enc(x.nome)}" ${x.nome===p.nome?"selected":""}>${enc(x.nome)}</option>`).join("");
  const time=(p.analistas||[]).filter(Boolean);
  const etapasComData=ETAPAS.filter(e=>_dataEtapa(p,e.id));
  const etapasHTML = etapasComData.length
    ? etapasComData.map(e=>{
        const iso=_dataEtapa(p,e.id); const on=_gpState.etapas.has(e.id);
        const d=parseISO(iso); const wf=(d.getDay()===0||d.getDay()===6)||feriadosMap()[iso];
        return `<label class="gp-etapa${wf?" gp-warn":""}"><input type="checkbox" data-gpetapa="${e.id}" ${on?"checked":""}> <b>${enc(e.label)}</b> · ${fmtDM(d)}/${d.getFullYear()}${wf?' <span class="gp-warntag">fim de semana/feriado — será pulado</span>':""}</label>`;
      }).join("")
    : `<div class="hint">Este projeto não tem datas de etapa preenchidas na Esteira.</div>`;
  const optAtv=ativos.map(n=>`<option ${n===_gpState.atividade?"selected":""}>${enc(n)}</option>`).join("");
  const optSlot=_slotsUteis().map(s=>`<option value="${s}" ${s===_gpState.slotUnico?"selected":""}>${s}</option>`).join("");
  body.innerHTML=`
    <div class="gp-grid">
      <div class="f"><label>Projeto</label><div class="select-wrap"><select id="gpProj">${optProj}</select></div></div>
      <div class="f"><label>Atividade (aplicada a todos os slots)</label><div class="select-wrap"><select id="gpAtv">${optAtv}</select></div></div>
    </div>
    <div class="gp-block"><div class="gp-lbl">Time do projeto (${time.length})</div>
      <div class="gp-chips">${time.length?time.map(a=>`<span class="gp-chip">${enc(a)}</span>`).join(""):'<span class="hint">Sem analistas no cadastro do projeto.</span>'}</div></div>
    <div class="gp-block"><div class="gp-lbl">Etapas (datas-marco)</div><div class="gp-etapas">${etapasHTML}</div></div>
    <div class="gp-grid">
      <div class="f"><label>Slots</label>
        <div class="segctl" id="gpSlotSeg">
          <button data-sm="dia" class="${_gpState.slotMode==="dia"?"on":""}">Dia inteiro</button>
          <button data-sm="unico" class="${_gpState.slotMode==="unico"?"on":""}">Apenas 1 slot</button>
        </div>
      </div>
      <div class="f" id="gpSlotUnicoWrap" style="${_gpState.slotMode==="unico"?"":"display:none"}"><label>Slot</label><div class="select-wrap"><select id="gpSlotUnico">${optSlot}</select></div></div>
      <div class="f"><label>Slot já previsto</label>
        <div class="segctl" id="gpOverSeg">
          <button data-ov="0" class="${!_gpState.sobrescrever?"on":""}">Pular</button>
          <button data-ov="1" class="${_gpState.sobrescrever?"on":""}">Sobrescrever</button>
        </div>
      </div>
    </div>
    <div id="gpPreview"></div>`;
  // binds do formulário
  el("gpProj").addEventListener("change",e=>{ _gpState.projeto=e.target.value; _gpSyncEtapasPadrao(); renderGerarPrev(); lucideRefresh(); });
  el("gpAtv").addEventListener("change",e=>{ _gpState.atividade=e.target.value; renderGpPreview(); });
  body.querySelectorAll("[data-gpetapa]").forEach(c=>c.addEventListener("change",()=>{ const id=c.dataset.gpetapa; if(c.checked)_gpState.etapas.add(id); else _gpState.etapas.delete(id); renderGpPreview(); }));
  el("gpSlotSeg").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{ _gpState.slotMode=b.dataset.sm; renderGerarPrev(); lucideRefresh(); }));
  { const su=el("gpSlotUnico"); if(su) su.addEventListener("change",e=>{ _gpState.slotUnico=e.target.value; renderGpPreview(); }); }
  el("gpOverSeg").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{ _gpState.sobrescrever=(b.dataset.ov==="1"); renderGerarPrev(); lucideRefresh(); }));
  renderGpPreview();
}
function renderGpPreview(){
  const host=el("gpPreview"); if(!host) return;
  const pv=_gerarPrevistoPreview();
  const r=_gpResumo(pv.itens);
  const grava=r.novo+r.sobrescreve;
  const chips=[
    `<span class="gp-stat new"><b>${r.novo}</b> novo(s)</span>`,
    r.sobrescreve?`<span class="gp-stat ovr"><b>${r.sobrescreve}</b> sobrescrito(s)</span>`:"",
    r.igual?`<span class="gp-stat"><b>${r.igual}</b> já previsto(s)</span>`:"",
    r.pula?`<span class="gp-stat"><b>${r.pula}</b> pulado(s) · já tem previsto de outro projeto</span>`:"",
    r.bloqueado?`<span class="gp-stat"><b>${r.bloqueado}</b> em fim de semana/feriado (ignorado)</span>`:"",
    r.conflita?`<span class="gp-stat conf"><b>${r.conflita}</b> vai conflitar com realizado existente</span>`:"",
  ].filter(Boolean).join("");
  // amostra: agrupa por etapa+data (não listar centenas de slots)
  const porGrupo={};
  pv.itens.forEach(it=>{ const g=it.etapa+" · "+fmtDM(parseISO(it.iso)); (porGrupo[g]=porGrupo[g]||{total:0,novo:0,conf:0}).total++; if(it.acao==="novo"||it.acao==="sobrescreve")porGrupo[g].novo++; if(it.conflitaReal)porGrupo[g].conf++; });
  const linhas=Object.keys(porGrupo).map(g=>{ const x=porGrupo[g]; return `<div class="confl-row"><div class="cr-an">${enc(g)}</div><div>${pv.time.length} analista(s)</div><div>${x.novo} a gravar</div><div>${x.conf?`<span class="cr-tag conf">${x.conf} conflito(s)</span>`:'<span class="hint">—</span>'}</div></div>`; }).join("");
  host.innerHTML=`
    <div class="gp-lbl" style="margin-top:6px">Pré-visualização</div>
    <div class="gp-stats">${chips||'<span class="hint">Selecione ao menos uma etapa.</span>'}</div>
    <div class="confl-list" style="margin-top:8px">${linhas}</div>
    <div class="gp-actions">
      <button class="btn primary" id="gpConfirm" ${grava?"":"disabled"}><i data-lucide="check"></i> Gravar previsto (${grava})</button>
    </div>`;
  const cf=el("gpConfirm"); if(cf) cf.addEventListener("click",_aplicarGeracao);
  lucideRefresh();
}

// Sincroniza filtros do relatório com o período atual da grade (primeira abertura)
function syncRepRangeFromMain(){
  if(period==="dia"){repPeriodMode="dia";repFrom=toISO(refDate);repTo=toISO(refDate);}
  else if(period==="mes"){repPeriodMode="mes";const y=refDate.getFullYear(),m=refDate.getMonth();
    repFrom=toISO(new Date(y,m,1));repTo=toISO(new Date(y,m+1,0));}
  else {repPeriodMode="semana";repFrom=toISO(weekStart);repTo=toISO(addDays(weekStart,4));}
}

// Dias do período do relatório (úteis: seg-sex)
function repDays(){
  if(!repFrom||!repTo)return [];
  const a=parseISO(repFrom), b=parseISO(repTo); const out=[];
  for(let d=new Date(a); d<=b; d=addDays(d,1)){const w=d.getDay(); if(w>=1&&w<=5)out.push(new Date(d));}
  return out;
}
// Analistas dentro do escopo escolhido nos filtros + papel
// Escopos suportados: "todos" | "lider:X" | "analista:X" | "gp:X" | "tipoatv:T" (tipo de ATIVIDADE)
// ===== Escopo por TIPO DE ATIVIDADE =====
// Regra do sistema: o que dita relatórios/KPIs é o TIPO DA ATIVIDADE do slot, não o
// tipo do projeto (este é só um identificador). O mapa abaixo usa a MESMA classificação
// das colunas dos relatórios (categoria()), garantindo coerência entre filtro e contagem.
const _CAT2TIPO={"c-proj":"implantacao","c-dsc":"discovery","c-svc":"service","c-rot":"interna","c-int":"interna","c-aus":"ausencia"};
function tipoAtividadeDoSlot(r){ return _CAT2TIPO[categoria(r)] || null; }
// Set de ISO do período de relatório (para restringir o escopo por atividade ao período).
function _repDiasIso(){ try{ return new Set(repDays().map(toISO)); }catch(e){ return null; } }
// Analistas com ao menos 1 slot da atividade-tipo informada (no período, se diasIso for dado).
function _analistasComAtvTipo(tipo, diasIso){
  const set=new Set();
  for(const k in DATA){ const r=DATA[k]; if(!r||r.feriado) continue;
    const p=k.split("__"); if(diasIso && !diasIso.has(p[1])) continue;
    if(tipoAtividadeDoSlot(r)===tipo) set.add(p[0]);
  }
  return set;
}
function _aplicaEscopo(ns, escopo, diasIso){
  if(!escopo||escopo==="todos")return ns;
  if(escopo.startsWith("lider:")){const l=escopo.slice(6); return ns.filter(n=>liderDe(n)===l);}
  if(escopo.startsWith("squad:")){const s=escopo.slice(6); return ns.filter(n=>squadDe(n)===s);}
  if(escopo.startsWith("analista:")){const n=escopo.slice(9); return ns.includes(n)?[n]:[];}
  if(escopo.startsWith("gp:")){
    const g=escopo.slice(3);
    // analistas que participam de projetos sob esse GP
    const set=new Set();
    REG.projetos.filter(p=>p.gp===g).forEach(p=>(p.analistas||[]).forEach(a=>set.add(a)));
    return ns.filter(n=>set.has(n));
  }
  if(escopo.startsWith("tipoatv:")){
    // Filtro por TIPO DE ATIVIDADE: analistas que têm slot dessa atividade no período.
    const tipo=escopo.slice(8);
    const set=_analistasComAtvTipo(tipo, diasIso);
    return ns.filter(n=>set.has(n));
  }
  return ns;
}
function repAnalysts(){return _aplicaEscopo(visibleAnalysts(repTo||undefined), repScope, _repDiasIso());}
// Conta slots de um analista no período por categoria
function contarSlots(nome,dias,fer){
  const work=SLOTS.filter(s=>!s.lunch);
  const total=dias.length*work.length;
  // 5 buckets de tipo + livre + vazio. "dsc"=Discovery; "svc"=Service.
  let livre=0,proj=0,dsc=0,rot=0,intn=0,svc=0,aus=0,vazio=0;
  let feriadoAuto=0; // slots vindos de feriado automático (excluídos do total trabalhado)
  const projs={};
  const projsTipo={}; // {cliente: {implantacao,discovery,service}} — esforço por projeto separado por tipo de atividade
  const _bumpT=(cli,t)=>{ if(!cli||cli==="Livre")return; (projsTipo[cli]=projsTipo[cli]||{})[t]=(projsTipo[cli][t]||0)+1; };
  dias.forEach(d=>{const iso=toISO(d);const isFer=!!fer[iso];
    work.forEach(s=>{const r=DATA[key(nome,iso,s.id)];
      // Sem nada lançado (ou só placeholder Livre): conta como livre ou vazio dependendo do feriado
      if(ehSlotLivre(r)){
        if(!r){ if(isFer)aus++; else vazio++; }
        else livre++;
        return;
      }
      // Slots gerados automaticamente pela propagação de feriado: contam como ausência
      // mas em bucket separado para o KPI poder excluí-los da produtividade
      if(r.feriado){feriadoAuto++; aus++; return;}
      const c=categoria(r);
      if(c==="c-livre")livre++;
      else if(c==="c-proj"){proj++; if(r.cliente&&r.cliente!=="Livre"){projs[r.cliente]=(projs[r.cliente]||0)+1; _bumpT(r.cliente,"implantacao");}}
      else if(c==="c-dsc"){dsc++; if(r.cliente&&r.cliente!=="Livre"){projs[r.cliente]=(projs[r.cliente]||0)+1; _bumpT(r.cliente,"discovery");}}
      else if(c==="c-rot")rot++;
      else if(c==="c-int")intn++;
      else if(c==="c-svc"){svc++; if(r.cliente&&r.cliente!=="Livre"){projs[r.cliente]=(projs[r.cliente]||0)+1; _bumpT(r.cliente,"service");}}
      else if(c==="c-aus")aus++;
    });
  });
  // "Trabalhado" = slots em projeto + discovery + interna/rotina + service
  // (não conta livre, ausência, vazio nem feriado automático)
  const ocupado=proj+dsc+rot+intn+svc;
  const ocupBase=total-aus; // base útil exclui feriados E ausências
  const ocup=ocupBase>0?Math.round(ocupado/ocupBase*100):0;
  return {total,livre,proj,dsc,rot,intn,svc,aus,feriadoAuto,vazio,ocupado,ocup,projs,projsTipo};
}

/* tabs do relatório */
function renderReports(){ lucideRefresh(); /* Fase 4: auto-cobre icones em qualquer caminho */
  // Tabs
  const tabs=[["alocacao","Alocação por Analista"],["squads","Squads"],["mapa","Mapa de Slots"],["mapaproj","Mapa de Projeto"],["livres","Slots Livres"],["projetos","Alocação por Projetos"],["golive","Gestão de Go-Live"],["golivectrl","Controle de Go-Lives"],["ferias","Férias"],["pendobs","Pendências de obs."]]
    .concat(canViewAction("prealoc")?[["aderencia","Aderência ao Plano"]]:[])
    .sort((a,b)=>a[1].localeCompare(b[1],"pt",{sensitivity:"base"}));
  el("repTabs").innerHTML=tabs.map(([id,lb])=>`<button data-tab="${id}" class="${id===repTab?'on':''}">${lb}</button>`).join("");
  el("repTabs").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
    if(repTab!==b.dataset.tab){ _marcarRelatorioPendente(); }
    repTab=b.dataset.tab;repSort={col:null,asc:false};renderReports();
  }));
  // Filtros (período + escopo)
  const escopos=[["todos","Todos (no meu escopo)"]];
  if(isAdmin()||isGestor()){
    lideresAtivos().forEach(l=>escopos.push(["lider:"+l,"Equipe: "+l]));
    gpsAtivos().forEach(g=>escopos.push(["gp:"+g,"GP: "+g]));
    SQUADS.forEach(s=>escopos.push(["squad:"+s,"Squad: "+s]));
    TIPOS_ATIVIDADE.forEach(t=>escopos.push(["tipoatv:"+t.id, t.icone+" Tipo: "+t.nome]));
  }
  visibleAnalysts().forEach(n=>escopos.push(["analista:"+n,"Analista: "+n]));
  el("repFilters").innerHTML=`
    <div class="f"><label>Período</label>
      <select id="repMode">
        <option value="dia"      ${repPeriodMode==="dia"?"selected":""}>Dia</option>
        <option value="semana"   ${repPeriodMode==="semana"?"selected":""}>Semana</option>
        <option value="mes"      ${repPeriodMode==="mes"?"selected":""}>Mês</option>
        <option value="custom"   ${repPeriodMode==="custom"?"selected":""}>Personalizado</option>
      </select></div>
    <div class="f"><label>De</label><input type="date" id="repFrom" value="${repFrom||''}"></div>
    <div class="f"><label>Até</label><input type="date" id="repTo" value="${repTo||''}"></div>
    <div class="f"><label>Escopo</label>
      <select id="repScope">${escopos.map(([v,l])=>`<option value="${enc(v)}" ${v===repScope?"selected":""}>${enc(l)}</option>`).join("")}</select></div>
    <div class="spacer"></div>
    <div class="f"><label>&nbsp;</label><button class="btn" id="repExport">⬇ Exportar CSV</button></div>
    <div class="f"><label>&nbsp;</label><button class="btn" id="repPrint"><i data-lucide="printer"></i>Imprimir</button></div>`;
  // listeners de filtros
  el("repMode").addEventListener("change",e=>{
    repPeriodMode=e.target.value;
    if(repPeriodMode!=="custom"){ /* recalcula de/até com base no refDate atual */
      const r=refDate||new Date();
      if(repPeriodMode==="dia"){repFrom=toISO(r);repTo=toISO(r);}
      else if(repPeriodMode==="semana"){const ws=monday(r);repFrom=toISO(ws);repTo=toISO(addDays(ws,4));}
      else {const y=r.getFullYear(),m=r.getMonth();repFrom=toISO(new Date(y,m,1));repTo=toISO(new Date(y,m+1,0));}
    }
    const pIni=el("repPeriodoDataInicio"), pFim=el("repPeriodoDataFim");
    if(pIni) pIni.value=repFrom; if(pFim) pFim.value=repTo;
    _marcarRelatorioPendente();
    renderReports();
  });
  el("repFrom").addEventListener("change",e=>{repFrom=e.target.value;repPeriodMode="custom";const pIni=el("repPeriodoDataInicio"); if(pIni) pIni.value=repFrom; _marcarRelatorioPendente(); renderReports();});
  el("repTo").addEventListener("change",e=>{repTo=e.target.value;repPeriodMode="custom";const pFim=el("repPeriodoDataFim"); if(pFim) pFim.value=repTo; _marcarRelatorioPendente(); renderReports();});
  el("repScope").addEventListener("change",e=>{repScope=e.target.value;renderReports();});
  el("repExport").addEventListener("click",exportRepCSV);
  el("repPrint").addEventListener("click",imprimirRelatorio);

  const periodoAtual = (repFrom || "") + "|" + (repTo || "");
  const precisaPrevisto = repTab === "aderencia";
  if(!_repDadosCarregados || _repPeriodoCarregado !== periodoAtual || _repTabCarregada !== repTab || (precisaPrevisto && !_repPrevistoCarregado)){
    el("repBody").innerHTML = _htmlRelatorioSobDemanda();
    _lastRepRows=[];
    return;
  }

  // Corpo do relatório
  if(repTab==="alocacao")renderRepAlocacao();
  else if(repTab==="squads")renderRepSquads();
  else if(repTab==="mapa")renderRepMapa();
  else if(repTab==="mapaproj")renderRepMapaProjeto();
  else if(repTab==="livres")renderRepLivres();
  else if(repTab==="golivectrl")renderRepControleGoLives();
  else if(repTab==="golive")renderRepGoLive();
  else if(repTab==="ferias")renderRepFerias();
  else if(repTab==="pendobs")renderRepPendObs();
  else if(repTab==="aderencia")renderRepAderencia();
  else renderRepProjetos();
}

/* helper de ordenação de colunas clicáveis */
function applySort(rows){
  if(!repSort.col)return rows;
  const c=repSort.col, asc=repSort.asc;
  return rows.slice().sort((a,b)=>{const va=a[c],vb=b[c];
    if(va===vb)return 0;
    if(typeof va==="number"&&typeof vb==="number")return asc?va-vb:vb-va;
    return asc?String(va).localeCompare(String(vb),"pt"):String(vb).localeCompare(String(va),"pt");
  });
}
function thSort(col,label,cls){
  const s=repSort.col===col?("sorted"+(repSort.asc?" asc":"")):"";
  return `<th class="${cls||''} ${s}" data-sort="${col}">${label}</th>`;
}
function bindSort(){
  el("repBody").querySelectorAll("th[data-sort]").forEach(th=>th.addEventListener("click",()=>{
    const c=th.dataset.sort;
    if(repSort.col===c)repSort.asc=!repSort.asc; else {repSort.col=c;repSort.asc=false;}
    renderReports();
  }));
}
let _lastRepRows=[], _lastRepCols=[];
function exportRepCSV(){
  if(!_lastRepRows.length){alert("Nada para exportar.");return;}
  const sep=";";
  const lines=[ _lastRepCols.map(c=>'"'+String(c.label).replace(/"/g,'""')+'"').join(sep) ];
  _lastRepRows.forEach(r=>lines.push(_lastRepCols.map(c=>{
    const v=r[c.key];const s=v==null?"":String(v);
    return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }).join(sep)));
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="relatorio_"+repTab+"_"+(repFrom||"")+"_"+(repTo||"")+".csv";
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}

/* === Relatório 1: Alocação por Analista === */
function renderRepAlocacao(){
  const dias=repDays(), fer=feriadosMap();
  const ns=repAnalysts();
  if(!dias.length){el("repBody").innerHTML='<div class="rep-empty">Selecione um período válido.</div>';_lastRepRows=[];return;}
  if(!ns.length){el("repBody").innerHTML='<div class="rep-empty">Nenhum analista no escopo selecionado.</div>';_lastRepRows=[];return;}
  const rows=ns.map(n=>{const c=contarSlots(n,dias,fer);return {
    analista:n, lider:liderDe(n)||"—", squad:squadDe(n)||"—",
    total:c.total, projeto:c.proj, discovery:c.dsc, service:c.svc, rotina:c.rot, interna:c.intn,
    ausencia:c.aus, livre:c.livre, vazio:c.vazio,
    ocupado:c.ocupado, ocupacao:c.ocup
  };});
  // Totais
  const tot=rows.reduce((a,r)=>{["total","projeto","discovery","service","rotina","interna","ausencia","livre","vazio","ocupado"].forEach(k=>a[k]=(a[k]||0)+r[k]);return a;},{});
  const totalUtil=tot.total-tot.ausencia;
  const ocupGeral=totalUtil>0?Math.round(tot.ocupado/totalUtil*100):0;
  const sorted=applySort(rows);
  const trabalhado=tot.projeto+tot.discovery+tot.service+tot.rotina+tot.interna;
  const summary=`<div class="rep-summary">
    <div class="stat"><div class="n">${ns.length}</div><div class="l">Analistas</div></div>
    <div class="stat"><div class="n">${dias.length}</div><div class="l">Dias úteis</div></div>
    <div class="stat"><div class="n">${tot.total}</div><div class="l">Slots totais</div></div>
    <div class="stat"><div class="n">${ocupGeral}%</div><div class="l">Ocupação média</div></div>
    <div class="stat"><div class="n">${trabalhado}</div><div class="l">Trabalhados</div></div>
    <div class="stat"><div class="n">${tot.livre+tot.vazio}</div><div class="l">Livres + vazios</div></div></div>`;
  const head=`<tr>
    ${thSort("analista","Analista")}${thSort("squad","Squad")}${thSort("lider","Líder")}
    ${thSort("total","Total","num")}${thSort("projeto","Implant.","num")}${thSort("discovery","Discovery","num")}
    ${thSort("service","Service","num")}${thSort("rotina","Interna(rot.)","num")}${thSort("interna","Interna(cap.)","num")}
    ${thSort("ausencia","Ausência","num")}${thSort("livre","Livre","num")}
    ${thSort("vazio","Vazio","num")}${thSort("ocupacao","Ocupação","num")}</tr>`;
  const body=sorted.map(r=>`<tr>
    <td class="nm">${enc(r.analista)}</td><td>${r.squad==="—"?'—':squadChipHTML(r.squad,true)}</td><td>${enc(r.lider)}</td>
    <td class="num">${r.total}</td><td class="num">${r.projeto}</td><td class="num">${r.discovery}</td>
    <td class="num">${r.service}</td><td class="num">${r.rotina}</td><td class="num">${r.interna}</td>
    <td class="num">${r.ausencia}</td><td class="num">${r.livre}</td>
    <td class="num">${r.vazio}</td>
    <td class="num"><span class="pct">${r.ocupacao}%</span><div class="occ-bar"><i style="width:${r.ocupacao}%"></i></div></td>
  </tr>`).join("");
  el("repBody").innerHTML=`<div class="rep-actions"><div class="left">Período: <b>${fmtDM(parseISO(repFrom))} – ${fmtDM(parseISO(repTo))}</b> · ${dias.length} dia(s) útil(eis) · clique em uma coluna para ordenar</div></div>
    ${summary}<table class="rep-table"><thead>${head}</thead><tbody>${body}</tbody></table>`;
  bindSort();
  _lastRepCols=[{key:"analista",label:"Analista"},{key:"squad",label:"Squad"},{key:"lider",label:"Líder"},{key:"total",label:"Total"},{key:"projeto",label:"Implantação"},{key:"discovery",label:"Discovery"},{key:"service",label:"Service"},{key:"rotina",label:"Interna (rotina)"},{key:"interna",label:"Interna (cap.)"},{key:"ausencia",label:"Ausência"},{key:"livre",label:"Livre"},{key:"vazio",label:"Vazio"},{key:"ocupacao",label:"Ocupação %"}];
  _lastRepRows=sorted;
}

/* === Relatório: Squads (dashboard no padrão da Esteira) ===
   Agrupa os analistas do escopo por squad, no padrão visual do dashboard executivo
   da Esteira (KPIs + colunas tipo kanban + legenda). A ocupação usa o período dos
   filtros (mesma base do relatório de Alocação por Analista). */
function renderRepSquads(){
  const dias=repDays(), fer=feriadosMap();
  const ns=repAnalysts();
  if(!dias.length){el("repBody").innerHTML='<div class="rep-empty">Selecione um período válido.</div>';_lastRepRows=[];return;}
  if(!ns.length){el("repBody").innerHTML='<div class="rep-empty">Nenhum analista no escopo selecionado.</div>';_lastRepRows=[];return;}

  const safe=s=>enc(s==null?'':String(s));
  const iniciais=(txt)=>{const t=(txt||'?').trim().split(/\s+/).filter(Boolean);return (t.slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase();};

  // dados por analista (ocupação no período + vínculo)
  const info={};
  ns.forEach(n=>{
    const c=contarSlots(n,dias,fer);
    info[n]={ocup:c.ocup, trab:c.ocupado, lider:liderDe(n)||"", squad:squadDe(n)||"", proj:projetosDoAnalista(n).length};
  });

  // colunas: squads cadastradas + "Sem squad" (só se houver alguém sem squad no escopo)
  const temSemSquad=ns.some(n=>!info[n].squad);
  const cols=[...SQUADS, ...(temSemSquad?[SQUAD_SEM_LABEL]:[])];
  const grupo=(sqLabel)=>{
    const alvo = sqLabel===SQUAD_SEM_LABEL ? "" : sqLabel;
    return ns.filter(n=>info[n].squad===alvo).sort((a,b)=>a.localeCompare(b,"pt"));
  };

  // KPIs
  const semSquad=ns.filter(n=>!info[n].squad).length;
  const squadsAtivas=SQUADS.filter(s=>ns.some(n=>info[n].squad===s)).length;
  const ocupMedia=ns.length?Math.round(ns.reduce((a,n)=>a+info[n].ocup,0)/ns.length):0;
  let maiorNome="—", maiorN=0;
  cols.forEach(s=>{const q=grupo(s).length; if(q>maiorN){maiorN=q;maiorNome=s;}});
  const kpi=(ico,label,num,sub)=>`<div class="dash-kpi"><div class="dash-kpi-ico"><i data-lucide="${ico}"></i></div><div><div class="dash-kpi-l">${label}</div><div class="dash-kpi-n">${num}</div><div class="dash-kpi-s">${sub}</div></div></div>`;

  // colunas estilo kanban
  const colunas=cols.map((sqLabel,idx)=>{
    const m=squadMeta(sqLabel);
    const membros=grupo(sqLabel);
    const cards=membros.slice(0,12).map(n=>{
      const d=info[n];
      const sub=(d.lider?d.lider:'sem líder')+(d.proj?` · ${d.proj} proj.`:'');
      return `<div class="client-card" style="--prog:${Math.max(6,d.ocup)}%">
        <div class="client-row"><div class="client-logo">${safe(iniciais(n))}</div><div style="min-width:0"><div class="client-name">${safe(n)}</div><div class="client-sub">${safe(sub)}</div></div></div>
        <div class="client-meta"><span class="status-badge">${d.ocup}% ocup.</span><span class="client-date">${d.trab} slot${d.trab===1?'':'s'}</span></div>
        <div class="progress"><i></i></div>
      </div>`;
    }).join('');
    const more=membros.length>12?`<div class="empty-stage small">+${membros.length-12} analista${membros.length-12>1?'s':''}</div>`:'';
    const ocupCol=membros.length?Math.round(membros.reduce((a,n)=>a+info[n].ocup,0)/membros.length):0;
    return `<section class="stage-col" style="--st-color:${m.color};--st-bg:${m.bg};--st-bd:${m.bd}">
      <div class="stage-head"><div class="stage-top"><div class="stage-name"><span class="stage-num">${idx+1}</span><span>${safe(sqLabel)}</span></div><span class="stage-count">${membros.length}</span></div><div class="stage-desc">${safe(m.desc)}${membros.length?` · ${ocupCol}% ocup. média`:''}</div></div>
      <div class="stage-body">${cards||'<div class="empty-stage">Nenhum analista nesta squad</div>'}${more}</div>
    </section>`;
  }).join('');

  const legenda=cols.map(s=>{const m=squadMeta(s);return `<div class="legend-item" style="--st-color:${m.color}"><span class="legend-dot"></span><span><b>${safe(s)}</b>${safe(squadMeta(s).desc)}</span></div>`;}).join('');

  // largura mínima do pipeline conforme nº de colunas (mesma métrica da esteira)
  const minW=Math.max(900, cols.length*230);
  const pipeStyle=`grid-template-columns:repeat(${cols.length},minmax(215px,1fr));min-width:${minW}px`;

  el("repBody").innerHTML=`<div class="est-dash-v2" style="padding:18px 6px 22px;background:transparent">
    <div class="dash-hero"><div class="dash-title"><h2>Distribuição por Squad</h2><p>Analistas por time operacional · ocupação no período ${safe(fmtDM(parseISO(repFrom)))} – ${safe(fmtDM(parseISO(repTo)))}</p></div><div class="dash-actions"><span class="dash-pill"><i data-lucide="users"></i>${ns.length} analista(s)</span><span class="dash-pill"><i data-lucide="layers"></i>${squadsAtivas} squad(s) ativa(s)</span></div></div>
    <div class="dash-kpis" style="grid-template-columns:repeat(5,minmax(155px,1fr))">${kpi('users','Total de Analistas',ns.length,'no escopo')}${kpi('layers','Squads Ativas',squadsAtivas,'de '+SQUADS.length+' cadastradas')}${kpi('user-minus','Sem Squad',semSquad,semSquad?'precisam atribuição':'todos atribuídos')}${kpi('gauge','Ocupação Média',ocupMedia+'%','no período')}${kpi('crown','Maior Squad',maiorN,safe(maiorNome))}</div>
    <div class="pipeline-wrap"><div class="pipeline" style="${pipeStyle}">${colunas}</div></div>
    <div class="legend-card"><div class="legend-title">Legenda das Squads</div><div class="legend-grid">${legenda}</div></div>
  </div>`;

  // dados para Export CSV / impressão
  _lastRepCols=[{key:"squad",label:"Squad"},{key:"analista",label:"Analista"},{key:"lider",label:"Líder"},{key:"projetos",label:"Projetos"},{key:"trabalhado",label:"Slots trabalhados"},{key:"ocupacao",label:"Ocupação %"}];
  _lastRepRows=ns.map(n=>({squad:info[n].squad||SQUAD_SEM_LABEL,analista:n,lider:info[n].lider||"—",projetos:info[n].proj,trabalhado:info[n].trab,ocupacao:info[n].ocup}))
                .sort((a,b)=>a.squad.localeCompare(b.squad,"pt")||a.analista.localeCompare(b.analista,"pt"));
  lucideRefresh();
}

/* === Relatório 2: Slots livres por analista === */
/* === Relatório: Controle de Go-Lives ===
   Visão consolidada de todos os projetos com bloco Go-Live preenchido.
   Mostra: projeto, situação, datas (previsto/ajustado/realizado), modalidade,
   GP, líder, analistas alocados, derrapagem (slip em dias). */
function renderRepControleGoLives(){
  // Não depende do período: lista todos os projetos com algum dado de Go-Live
  const hoje=toISO(new Date());
  let projs=(REG.projetos||[]).filter(p=>{
    if(p.tipo && p.tipo!=="implantacao")return false; // só Implantação
    return p.goLivePrevisto||p.goLiveAjustado||p.goLiveRealizado||p.goLiveSituacao||p.goLiveModalidade;
  });

  // Aplica filtro de escopo se fizer sentido
  if(repScope.startsWith("lider:")){const l=repScope.slice(6); projs=projs.filter(p=>p.lider===l);}
  else if(repScope.startsWith("gp:")){const g=repScope.slice(3); projs=projs.filter(p=>p.gp===g);}
  else if(repScope.startsWith("tipoatv:")){ /* filtro por tipo de atividade não se aplica ao Go-Live (relatório por projeto/data) */ }
  else if(repScope.startsWith("analista:")){const n=repScope.slice(9); projs=projs.filter(p=>(p.analistas||[]).includes(n));}

  // Linhas enriquecidas
  const linhas=projs.map(p=>{
    const prev=p.goLivePrevisto||"";
    const aju=p.goLiveAjustado||"";
    const real=p.goLiveRealizado||"";
    const sit=p.goLiveSituacao||(real?"Realizado":(prev||aju?"Planejado":""));
    const mod=p.goLiveModalidade||"";

    // Data efetiva pra computar urgência: realizado > ajustado > previsto
    const dataRef = real || aju || prev || "";
    // Derrapagem em dias: realizado vs (ajustado ou previsto). Se sem realizado, comparar previsto vs ajustado.
    let slip=null, slipLabel="";
    if(real && (aju||prev)){
      const baseline = aju||prev;
      slip = Math.round((parseISO(real)-parseISO(baseline))/86400000);
      slipLabel = slip===0 ? "no prazo" : (slip>0?`+${slip}d (atraso)`:`${slip}d (adiantado)`);
    }else if(aju && prev){
      slip = Math.round((parseISO(aju)-parseISO(prev))/86400000);
      slipLabel = slip===0 ? "ajuste sem efeito" : (slip>0?`+${slip}d (replanejado)`:`${slip}d (antecipado)`);
    }

    // Urgência (para projetos sem realizado): dias até a data prevista mais próxima
    let urgencia="—", urgenciaSort=999999;
    if(!real && dataRef){
      const dias=Math.round((parseISO(dataRef)-parseISO(hoje))/86400000);
      urgenciaSort=dias;
      if(dias<0)urgencia=`vencido ${Math.abs(dias)}d`;
      else if(dias===0)urgencia="hoje";
      else if(dias<=7)urgencia=`em ${dias}d`;
      else urgencia=`em ${dias}d`;
    }else if(real){
      urgencia="realizado"; urgenciaSort=1000000;
    }

    return {
      projeto:p.nome,
      tipoSeg:p.segmentacao||"—",
      statusProj:p.status||"—",
      situacao:sit,
      modalidade:mod||"—",
      gp:p.gp||"—",
      lider:p.lider||"—",
      analistas:(p.analistas||[]).filter(a=>a).join(", ")||"—",
      qtdAnalistas:(p.analistas||[]).filter(a=>a).length,
      goLivePrevisto:prev,
      goLiveAjustado:aju,
      goLiveRealizado:real,
      slip:slip,
      slipLabel:slipLabel,
      dataRef:dataRef,
      urgencia:urgencia,
      urgenciaSort:urgenciaSort,
      // versões formatadas pro display
      prevFmt:prev?(fmtDM(parseISO(prev))+"/"+parseISO(prev).getFullYear()):"—",
      ajuFmt:aju?(fmtDM(parseISO(aju))+"/"+parseISO(aju).getFullYear()):"—",
      realFmt:real?(fmtDM(parseISO(real))+"/"+parseISO(real).getFullYear()):"—"
    };
  });

  // Ordenação default: urgência (vencidos primeiro, depois hoje, depois futuros, realizados por último)
  const sorted=applySort(linhas.length?linhas:[]);
  if(!repSort.col){
    sorted.sort((a,b)=>a.urgenciaSort-b.urgenciaSort||a.projeto.localeCompare(b.projeto,"pt"));
  }

  // Contagem por situação
  const cntSit={};
  linhas.forEach(r=>{cntSit[r.situacao]=(cntSit[r.situacao]||0)+1;});
  const cntMod={};
  linhas.forEach(r=>{if(r.modalidade&&r.modalidade!=="—")cntMod[r.modalidade]=(cntMod[r.modalidade]||0)+1;});
  const realizados=linhas.filter(r=>r.goLiveRealizado);
  const noPrazo=realizados.filter(r=>r.slip!=null&&r.slip<=0);
  const aderencia=realizados.length?Math.round(noPrazo.length/realizados.length*100):0;
  const atrasados=linhas.filter(r=>!r.goLiveRealizado && r.urgenciaSort<0).length;
  const proximos7=linhas.filter(r=>!r.goLiveRealizado && r.urgenciaSort>=0 && r.urgenciaSort<=7).length;

  // Helpers visuais
  const sitBadge=(s)=>{
    const map={"Planejado":["#5a6478","#f1f3f7"],"Confirmado":["#3B82F6","#EFF6FF"],"Em execução":["#F26C20","#FFEFE5"],"Realizado":["#14B8A6","#F0FDFA"],"Adiado":["#F59E0B","#FFFBEB"],"Cancelado":["#DC2626","#FEF2F2"]};
    const v=map[s]||["#5a6478","#f1f3f7"]; return `<span class="badge-small" style="color:${v[0]};background:${v[1]};border-color:transparent;font-weight:700">${enc(s||"—")}</span>`;
  };
  const modBadge=(m)=>{
    if(!m||m==="—")return '<span style="color:var(--fn-faint)">—</span>';
    const icons={"Remoto":"💻","Presencial":"🏢","Híbrido":"🔀"};
    return `<span style="font-size:11.5px">${icons[m]||""} ${enc(m)}</span>`;
  };
  const slipBadge=(r)=>{
    if(r.slip==null)return '<span style="color:var(--fn-faint)">—</span>';
    let cor='#5a6478', bg='#f1f3f7';
    if(r.slip>0&&r.goLiveRealizado){cor='#DC2626';bg='#FEF2F2';}
    else if(r.slip<0){cor='#14B8A6';bg='#F0FDFA';}
    else if(r.slip===0){cor='#14B8A6';bg='#F0FDFA';}
    else if(r.slip>0&&!r.goLiveRealizado){cor='#F59E0B';bg='#FFFBEB';}
    return `<span class="badge-small" style="color:${cor};background:${bg};border-color:transparent;font-weight:700">${enc(r.slipLabel)}</span>`;
  };
  const urgenciaBadge=(r)=>{
    if(r.urgencia==="—")return '<span style="color:var(--fn-faint)">—</span>';
    if(r.urgencia==="realizado")return '<span style="color:var(--fn-teal);font-weight:600">✓ realizado</span>';
    if(r.urgencia.startsWith("vencido"))return `<span class="badge-small" style="color:#DC2626;background:#FEF2F2;border-color:transparent;font-weight:700">⚠ ${enc(r.urgencia)}</span>`;
    if(r.urgencia==="hoje")return '<span class="badge-small" style="color:#F26C20;background:#FFEFE5;border-color:transparent;font-weight:700">🔴 hoje</span>';
    const dias=parseInt(r.urgencia.replace(/\D/g,''),10);
    if(dias<=7)return `<span class="badge-small" style="color:#F59E0B;background:#FFFBEB;border-color:transparent;font-weight:700">${enc(r.urgencia)}</span>`;
    return `<span style="color:var(--fn-muted);font-weight:500">${enc(r.urgencia)}</span>`;
  };

  // Sumário
  const summary=`<div class="rep-summary print-show">
    <div class="stat"><div class="n">${linhas.length}</div><div class="l">Projetos com Go-Live</div></div>
    <div class="stat ${atrasados>0?'':''}"><div class="n" style="${atrasados>0?'color:#DC2626':''}">${atrasados}</div><div class="l">Atrasados</div></div>
    <div class="stat"><div class="n" style="${proximos7>0?'color:#F26C20':''}">${proximos7}</div><div class="l">Próximos 7 dias</div></div>
    <div class="stat"><div class="n">${realizados.length}</div><div class="l">Realizados</div></div>
    <div class="stat"><div class="n">${aderencia}%</div><div class="l">Aderência (no prazo)</div></div>
  </div>`;

  // Distribuição por situação e modalidade
  const sitChips=Object.entries(cntSit).sort((a,b)=>b[1]-a[1]).map(([s,c])=>`<span class="kpi-chip">${sitBadge(s)} <b>${c}</b></span>`).join(" ");
  const modChips=Object.entries(cntMod).sort((a,b)=>b[1]-a[1]).map(([m,c])=>`<span class="kpi-chip">${modBadge(m)} <b>${c}</b></span>`).join(" ");
  const chipsRow=`<div class="golivectrl-chips print-show">
    <div><b style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--fn-faint)">Situação:</b> ${sitChips||'<span style="color:var(--fn-faint)">—</span>'}</div>
    ${modChips?`<div style="margin-top:6px"><b style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--fn-faint)">Modalidade:</b> ${modChips}</div>`:""}
  </div>`;

  // Tabela
  const head=`<tr>
    ${thSort("projeto","Projeto")}
    ${thSort("situacao","Situação")}
    ${thSort("modalidade","Modalidade")}
    ${thSort("prevFmt","Previsto")}
    ${thSort("ajuFmt","Ajustado")}
    ${thSort("realFmt","Realizado")}
    ${thSort("slip","Derrapagem","num")}
    ${thSort("urgencia","Urgência")}
    ${thSort("gp","GP")}
    ${thSort("lider","Líder")}
    ${thSort("qtdAnalistas","# Analistas","num")}
    <th>Analistas</th>
  </tr>`;
  const body=sorted.map(r=>`<tr>
    <td class="nm">${enc(r.projeto)} <span style="font-size:11px;color:var(--fn-faint)">${enc(r.tipoSeg)}</span></td>
    <td>${sitBadge(r.situacao)}</td>
    <td>${modBadge(r.modalidade)}</td>
    <td class="mono">${enc(r.prevFmt)}</td>
    <td class="mono">${enc(r.ajuFmt)}</td>
    <td class="mono">${enc(r.realFmt)}</td>
    <td>${slipBadge(r)}</td>
    <td>${urgenciaBadge(r)}</td>
    <td>${enc(r.gp)}</td>
    <td>${enc(r.lider)}</td>
    <td class="num">${r.qtdAnalistas}</td>
    <td style="font-size:11.5px;color:var(--fn-muted);max-width:280px">${enc(r.analistas)}</td>
  </tr>`).join("");

  // Cabeçalho de impressão
  const printHeader=`<div class="print-header print-only">
    <div class="ph-brand"><div class="lm">NS</div><div class="pi"><div class="t">NS ALOC</div><div class="s">NSTech · Controle de Go-Lives</div></div></div>
    <div class="ph-meta">
      <div><b>Escopo:</b> ${enc(_descScope(repScope))}</div>
      <div><b>Total:</b> ${linhas.length} projeto(s) · ${realizados.length} realizado(s) · ${atrasados} atrasado(s)</div>
      <div><b>Aderência:</b> ${aderencia}%</div>
      <div><b>Emitido:</b> ${new Date().toLocaleString("pt-BR")}</div>
    </div>
  </div>`;

  el("repBody").innerHTML=`
    <div class="rep-actions">
      <div class="left">Visão consolidada dos projetos com Go-Live planejado/ajustado/realizado · clique nas colunas para ordenar · use <b>Imprimir</b> para gerar PDF</div>
    </div>
    <div id="repPrintArea" class="print-area">
      ${printHeader}
      ${summary}
      ${chipsRow}
      ${linhas.length?`<div class="mapa-wrap" style="margin-top:12px"><table class="rep-table golive-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`:'<div class="rep-empty">Nenhum projeto com bloco Go-Live preenchido${(repScope!=="todos"?" para o escopo selecionado":"")}.</div>'}
    </div>`;
  bindSort();
  _lastRepCols=[
    {key:"projeto",label:"Projeto"},{key:"tipoSeg",label:"Segmentação"},{key:"statusProj",label:"Status"},
    {key:"situacao",label:"Situação Go-Live"},{key:"modalidade",label:"Modalidade"},
    {key:"prevFmt",label:"Previsto"},{key:"ajuFmt",label:"Ajustado"},{key:"realFmt",label:"Realizado"},
    {key:"slipLabel",label:"Derrapagem"},{key:"urgencia",label:"Urgência"},
    {key:"gp",label:"GP"},{key:"lider",label:"Líder"},
    {key:"qtdAnalistas",label:"# Analistas"},{key:"analistas",label:"Analistas"}
  ];
  _lastRepRows=sorted;
  lucideRefresh();
}

/* Largura mínima da tabela Mapa (analista × dia × slot).
   Mantém cada coluna de slot legível e força scroll horizontal quando o período é grande,
   em vez de espremer todas as colunas para caber na largura da tela (table-layout:fixed).
   Mesmo padrão usado na grade mensal do board. Em períodos curtos, fica abaixo da largura
   do container e a tabela segue ocupando 100% normalmente. */
const REP_MAPA_AN_W=160, REP_MAPA_SLOT_W=64;
function repMapaTableStyle(nDias,nSlots){
  const cols=Math.max(0,nDias)*Math.max(0,nSlots);
  const min=REP_MAPA_AN_W+REP_MAPA_SLOT_W*cols;
  return `min-width:${min}px`;
}

/* === Relatório: Mapa de Slots (formato impressão) ===
   Tabela completa: analista × (data + slot) com a alocação dentro de cada célula.
   Mostra projeto · atividade. Slots livres ficam em branco. Otimizado para impressão A4 paisagem. */
function renderRepMapa(){
  const dias=repDays(); const ns=repAnalysts();
  if(!dias.length){el("repBody").innerHTML='<div class="rep-empty">Selecione um período válido.</div>';_lastRepRows=[];return;}
  if(!ns.length){el("repBody").innerHTML='<div class="rep-empty">Nenhum analista no escopo selecionado.</div>';return;}
  const slots=SLOTS.filter(s=>!s.lunch);
  const fer={}; (REG.feriados||[]).forEach(f=>fer[f.data]=f.nome);

  // Contagem para o sumário do topo
  let totalSlots=0, ocup=0, livres=0, ferAuto=0;
  ns.forEach(n=>dias.forEach(d=>{
    const iso=toISO(d); slots.forEach(s=>{
      totalSlots++;
      const r=DATA[key(n,iso,s.id)];
      if(ehSlotLivre(r)){livres++;return;}
      if(r.feriado){ferAuto++;ocup++;return;}
      ocup++;
    });
  }));
  const pctOcup=totalSlots?Math.round(ocup/totalSlots*100):0;
  const pctLivre=totalSlots?Math.round(livres/totalSlots*100):0;

  // Cabeçalho: agrupa por data, com sub-colunas de slot
  let head1='<tr><th rowspan="2" class="col-an">Analista</th>';
  dias.forEach(d=>{const iso=toISO(d); const isFer=!!fer[iso]; const fname=isFer?` · ${enc(fer[iso])}`:'';
    head1+=`<th colspan="${slots.length}" class="col-day${isFer?' fer':''}">${DOW[d.getDay()]} ${fmtDM(d)}${fname}</th>`;
  });
  head1+='</tr>';
  let head2='<tr>';
  dias.forEach(()=>slots.forEach(s=>{head2+=`<th class="col-slot">${s.id.replace("Slot","S")}<br><span style="font-weight:500;color:var(--fn-faint);font-size:9.5px">${s.time}</span></th>`;}));
  head2+='</tr>';

  // Linhas: uma por analista
  const corDeTipo=(tipo)=>({implantacao:'#FFEFE0',discovery:'#F4DDD3',service:'#F5EBD2',interna:'#FAEEDC',ausencia:'#EFEFEF'})[tipo]||'#fff';
  const corTexto=(tipo)=>({implantacao:'#B8400A',discovery:'#7E3717',service:'#5C4A20',interna:'#7A4A1A',ausencia:'#5a5a5a'})[tipo]||'#222';

  const corpo=ns.map(n=>{
    let row=`<tr><td class="col-an">${enc(n)}</td>`;
    dias.forEach(d=>{
      const iso=toISO(d);
      slots.forEach(s=>{
        const r=DATA[key(n,iso,s.id)];
        if(ehSlotLivre(r)){ row+=`<td class="cell-mapa livre"></td>`; return; }
        const atv=r.atividade||"—";
        const atvObj=atividadeObj(atv);
        const tipo=atvObj?atvObj.tipo:(r.feriado?"ausencia":"implantacao");
        const cli=(r.cliente && r.cliente!=="Livre")?r.cliente:"";
        const bg=corDeTipo(tipo), txt=corTexto(tipo);
        row+=`<td class="cell-mapa" style="background:${bg};color:${txt}"><div class="cm-atv">${enc(atv)}</div>${cli?`<div class="cm-cli">${enc(cli)}</div>`:""}</td>`;
      });
    });
    row+='</tr>';
    return row;
  }).join("");

  // Sumário do topo (visível na impressão também)
  const summary=`<div class="rep-summary print-show">
    <div class="stat"><div class="n">${ns.length}</div><div class="l">Analistas</div></div>
    <div class="stat"><div class="n">${dias.length}</div><div class="l">Dias úteis</div></div>
    <div class="stat"><div class="n">${totalSlots}</div><div class="l">Slots totais</div></div>
    <div class="stat"><div class="n">${pctOcup}%</div><div class="l">Ocupação</div></div>
    <div class="stat"><div class="n">${ocup}</div><div class="l">Ocupados${ferAuto?` (${ferAuto} feriado)`:''}</div></div>
    <div class="stat"><div class="n">${livres} (${pctLivre}%)</div><div class="l">Livres</div></div>
  </div>`;

  // Legenda
  const legenda=`<div class="mapa-legenda print-show">
    <span class="lg"><span class="sw" style="background:#FFEFE0;border-color:#F0B894"></span>Implantação</span>
    <span class="lg"><span class="sw" style="background:#F4DDD3;border-color:#D6A492"></span>Discovery</span>
    <span class="lg"><span class="sw" style="background:#F5EBD2;border-color:#D9C794"></span>Service</span>
    <span class="lg"><span class="sw" style="background:#FAEEDC;border-color:#E9CBA3"></span>Interna</span>
    <span class="lg"><span class="sw" style="background:#EFEFEF;border-color:#D9D9D9"></span>Ausência / Feriado</span>
    <span class="lg"><span class="sw" style="background:#fff;border:1px dashed #aaa"></span>Livre</span>
  </div>`;

  // Cabeçalho de impressão
  const head=`<div class="print-header print-only">
    <div class="ph-brand"><div class="lm">NS</div><div class="pi"><div class="t">NS ALOC</div><div class="s">NSTech · Mapa de Slots</div></div></div>
    <div class="ph-meta"><div><b>Período:</b> ${fmtDM(parseISO(repFrom))}/${parseISO(repFrom).getFullYear()} – ${fmtDM(parseISO(repTo))}/${parseISO(repTo).getFullYear()}</div>
    <div><b>Escopo:</b> ${enc(_descScope(repScope))}</div>
    <div><b>Emitido:</b> ${new Date().toLocaleString("pt-BR")}</div></div>
  </div>`;

  el("repBody").innerHTML=`<div class="rep-actions"><div class="left">Visão completa para envio/impressão: cada célula mostra a atividade e o cliente/projeto. Slots livres em branco. <b>Use o botão Imprimir</b> para gerar PDF/A4 paisagem.</div></div>
    <div id="repPrintArea" class="print-area">
      ${head}
      ${summary}
      ${legenda}
      <div class="mapa-wrap">
        <table class="rep-mapa" style="${repMapaTableStyle(dias.length,slots.length)}"><thead>${head1}${head2}</thead><tbody>${corpo}</tbody></table>
      </div>
    </div>`;

  // Dados para exportação CSV
  const cols=[{key:"analista",label:"Analista"}];
  dias.forEach(d=>{const iso=toISO(d); slots.forEach(s=>{cols.push({key:`${iso}_${s.id}`,label:`${DOW[d.getDay()]} ${fmtDM(d)} ${s.id}`});});});
  const rows=ns.map(n=>{
    const o={analista:n};
    dias.forEach(d=>{const iso=toISO(d); slots.forEach(s=>{
      const r=DATA[key(n,iso,s.id)];
      if(ehSlotLivre(r)){o[`${iso}_${s.id}`]="Livre";return;}
      const cli=(r.cliente&&r.cliente!=="Livre")?r.cliente:"";
      o[`${iso}_${s.id}`]=(r.atividade||"")+(cli?" · "+cli:"");
    });});
    return o;
  });
  _lastRepCols=cols; _lastRepRows=rows;
}
function _descScope(s){
  if(!s||s==="todos")return "Todos no meu escopo";
  if(s.startsWith("lider:"))return "Equipe: "+s.slice(6);
  if(s.startsWith("analista:"))return "Analista: "+s.slice(9);
  if(s.startsWith("gp:"))return "GP: "+s.slice(3);
  if(s.startsWith("tipoatv:"))return "Tipo de atividade: "+s.slice(8);
  return s;
}

/* === Relatório: Mapa de Projeto ===
   Foco no projeto: selecione um e veja todos os analistas alocados, dias, slots, horários, atividades. */
function renderRepMapaProjeto(){
  const dias=repDays();
  if(!dias.length){el("repBody").innerHTML='<div class="rep-empty">Selecione um período válido.</div>';_lastRepRows=[];return;}
  const slots=SLOTS.filter(s=>!s.lunch);
  const fer={}; (REG.feriados||[]).forEach(f=>fer[f.data]=f.nome);

  // Lista de projetos que têm alocação no período (para o dropdown)
  const projComAloc=new Set();
  const todasAlocs=[]; // {analista,iso,slot,atividade,projeto,obs,r}
  visibleAnalysts().forEach(n=>dias.forEach(d=>{
    const iso=toISO(d); slots.forEach(s=>{
      const r=DATA[key(n,iso,s.id)];
      if(ehSlotLivre(r))return;
      if(r.feriado)return;
      const cli=(r.cliente && r.cliente!=="Livre")?r.cliente:null;
      if(!cli)return;
      // Considera projetos cadastrados
      if(!REG.projetos.some(p=>p.nome===cli))return;
      projComAloc.add(cli);
      todasAlocs.push({analista:n,iso,slot:s.id,horario:s.time,atividade:r.atividade||"—",projeto:cli,obs:r.obs||""});
    });
  }));
  // Inclui projetos cadastrados (mesmo sem alocação no período)
  const projetosLista=Array.from(new Set([...projComAloc, ...REG.projetos.filter(p=>isAtivo(p)).map(p=>p.nome)])).sort((a,b)=>a.localeCompare(b,"pt"));

  // Se não tem projeto selecionado ou o atual sumiu da lista, escolhe o primeiro com alocação
  if(!repProjetoSel || !projetosLista.includes(repProjetoSel)){
    repProjetoSel = projComAloc.size ? Array.from(projComAloc).sort()[0] : (projetosLista[0]||"");
  }
  if(!projetosLista.length){
    el("repBody").innerHTML='<div class="rep-empty">Nenhum projeto cadastrado.</div>';
    _lastRepRows=[];
    return;
  }

  // Dropdown de projeto + dados do cadastro
  const cad=REG.projetos.find(p=>p.nome===repProjetoSel)||{};
  const tipoObj=TIPOS_ATIVIDADE.find(t=>t.id===(cad.tipo||"implantacao"))||{nome:"—",icone:"•"};

  // Alocações desse projeto no período
  const alocsProj=todasAlocs.filter(a=>a.projeto===repProjetoSel)
    .sort((a,b)=>a.iso.localeCompare(b.iso)||a.slot.localeCompare(b.slot)||a.analista.localeCompare(b.analista,"pt"));

  // Sumário
  const analistasSet=new Set(alocsProj.map(a=>a.analista));
  const atividadesSet=new Set(alocsProj.map(a=>a.atividade));
  const diasComAloc=new Set(alocsProj.map(a=>a.iso));
  const slotsTotal=alocsProj.length;

  // Tabela "Mapa": Analistas (linhas) × Dias × Slots (colunas)
  const analistas=Array.from(analistasSet).sort((a,b)=>a.localeCompare(b,"pt"));

  // Header da tabela: dia + sub-colunas de slot
  let head1='<tr><th rowspan="2" class="col-an">Analista</th>';
  dias.forEach(d=>{const iso=toISO(d); const isFer=!!fer[iso]; const fname=isFer?` · ${enc(fer[iso])}`:'';
    head1+=`<th colspan="${slots.length}" class="col-day${isFer?' fer':''}">${DOW[d.getDay()]} ${fmtDM(d)}${fname}</th>`;
  });
  head1+='</tr>';
  let head2='<tr>';
  dias.forEach(()=>slots.forEach(s=>{head2+=`<th class="col-slot">${s.id.replace("Slot","S")}<br><span style="font-weight:500;color:var(--fn-faint);font-size:9.5px">${s.time}</span></th>`;}));
  head2+='</tr>';

  // Lookup das alocações deste projeto
  const lkp={}; // analista::iso::slot -> reg
  alocsProj.forEach(a=>{lkp[a.analista+"::"+a.iso+"::"+a.slot]=a;});

  const corDeTipo=(tipo)=>({implantacao:'#FFEFE0',discovery:'#F4DDD3',service:'#F5EBD2',interna:'#FAEEDC',ausencia:'#EFEFEF'})[tipo]||'#FFEFE0';
  const corTexto=(tipo)=>({implantacao:'#B8400A',discovery:'#7E3717',service:'#5C4A20',interna:'#7A4A1A',ausencia:'#5a5a5a'})[tipo]||'#B8400A';

  const corpo=analistas.length?analistas.map(n=>{
    let row=`<tr><td class="col-an">${enc(n)}</td>`;
    dias.forEach(d=>{
      const iso=toISO(d);
      slots.forEach(s=>{
        const a=lkp[n+"::"+iso+"::"+s.id];
        if(!a){ row+=`<td class="cell-mapa livre"></td>`; return; }
        const atvObj=atividadeObj(a.atividade);
        const tipo=(atvObj?atvObj.tipo:null)||(cad.tipo||"implantacao");
        const bg=corDeTipo(tipo), txt=corTexto(tipo);
        row+=`<td class="cell-mapa" style="background:${bg};color:${txt}" title="${enc(a.atividade)}${a.obs?' — '+enc(a.obs):''}"><div class="cm-atv">${enc(a.atividade)}</div></td>`;
      });
    });
    row+='</tr>';
    return row;
  }).join("") : `<tr><td colspan="${1+dias.length*slots.length}" style="padding:24px;text-align:center;color:var(--fn-faint);font-style:italic">Nenhuma alocação para este projeto no período selecionado.</td></tr>`;

  // Tabela detalhada (linha por linha) — mais fácil de imprimir e analisar
  const detRows=alocsProj.map(a=>{
    const d=parseISO(a.iso);
    return `<tr>
      <td class="mono">${fmtDM(d)}/${d.getFullYear()}</td>
      <td>${DOW[d.getDay()]}</td>
      <td><b>${a.slot.replace("Slot","S")}</b></td>
      <td class="mono">${enc(a.horario)}</td>
      <td>${enc(a.analista)}</td>
      <td>${enc(a.atividade)}</td>
      <td style="font-size:11px;color:var(--fn-muted)">${a.obs?enc(a.obs):'—'}</td>
    </tr>`;
  }).join("");

  // Dropdown de projeto
  const dropOpts=projetosLista.map(p=>`<option value="${enc(p)}" ${p===repProjetoSel?"selected":""}>${enc(p)}${projComAloc.has(p)?"":' (sem alocação)'}</option>`).join("");

  // Card do projeto
  const projCardStatus=cad.status?statusBadge(cad.status):'';
  const gp=cad.gp||"—", lider=cad.lider||"—", seg=cad.segmentacao||"—";
  const goPrev=cad.goLivePrevisto?(fmtDM(parseISO(cad.goLivePrevisto))+"/"+parseISO(cad.goLivePrevisto).getFullYear()):"—";
  const goReal=cad.goLiveRealizado?(fmtDM(parseISO(cad.goLiveRealizado))+"/"+parseISO(cad.goLiveRealizado).getFullYear()):"—";

  // Cabeçalho de impressão (igual ao Mapa de Slots, com nome do projeto)
  const printHeader=`<div class="print-header print-only">
    <div class="ph-brand"><div class="lm">NS</div><div class="pi"><div class="t">NS ALOC</div><div class="s">NSTech · Mapa de Projeto — ${enc(repProjetoSel)}</div></div></div>
    <div class="ph-meta"><div><b>Período:</b> ${fmtDM(parseISO(repFrom))}/${parseISO(repFrom).getFullYear()} – ${fmtDM(parseISO(repTo))}/${parseISO(repTo).getFullYear()}</div>
    <div><b>Tipo:</b> ${tipoObj.icone} ${enc(tipoObj.nome)}</div>
    <div><b>Status:</b> ${enc(cad.status||"—")}</div>
    <div><b>GP:</b> ${enc(gp)} · <b>Líder:</b> ${enc(lider)}</div>
    <div><b>Emitido:</b> ${new Date().toLocaleString("pt-BR")}</div></div>
  </div>`;

  // Card de identificação do projeto (visível em tela e na impressão)
  const projCard=`<div class="proj-card print-show">
    <div class="pc-top">
      <div class="pc-title">
        <span class="pc-icon">${tipoObj.icone}</span>
        <div><div class="pc-name">${enc(repProjetoSel)}</div>
        <div class="pc-sub">${enc(tipoObj.nome)}${projCardStatus?' · '+projCardStatus:''}</div></div>
      </div>
    </div>
    <div class="pc-grid">
      <div class="pc-it"><div class="pc-l">GP</div><div class="pc-v">${enc(gp)}</div></div>
      <div class="pc-it"><div class="pc-l">Líder</div><div class="pc-v">${enc(lider)}</div></div>
      <div class="pc-it"><div class="pc-l">Segmentação</div><div class="pc-v">${enc(seg)}</div></div>
      <div class="pc-it"><div class="pc-l">Go-Live previsto</div><div class="pc-v">${enc(goPrev)}</div></div>
      <div class="pc-it"><div class="pc-l">Go-Live realizado</div><div class="pc-v">${enc(goReal)}</div></div>
    </div>
  </div>`;

  // Sumário do escopo selecionado
  const summary=`<div class="rep-summary print-show">
    <div class="stat"><div class="n">${analistas.length}</div><div class="l">Analistas envolvidos</div></div>
    <div class="stat"><div class="n">${diasComAloc.size}</div><div class="l">Dias com alocação</div></div>
    <div class="stat"><div class="n">${slotsTotal}</div><div class="l">Slots no projeto</div></div>
    <div class="stat"><div class="n">${atividadesSet.size}</div><div class="l">Atividades distintas</div></div>
  </div>`;

  el("repBody").innerHTML=`
    <div class="rep-actions">
      <div class="left">Centrado no projeto: cada célula da matriz mostra a atividade alocada ao analista naquele slot. A tabela detalhada lista cada lançamento individual.</div>
      <div class="right" style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
        <label style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--fn-faint);font-weight:700">Projeto:</label>
        <select id="repProjetoSel" style="min-width:240px">${dropOpts}</select>
      </div>
    </div>
    <div id="repPrintArea" class="print-area">
      ${printHeader}
      ${projCard}
      ${summary}
      <h3 class="print-h">Mapa de slots — visão matriz</h3>
      <div class="mapa-wrap">
        <table class="rep-mapa" style="${repMapaTableStyle(dias.length,slots.length)}"><thead>${head1}${head2}</thead><tbody>${corpo}</tbody></table>
      </div>
      <h3 class="print-h" style="margin-top:18px">Lista detalhada de lançamentos</h3>
      ${alocsProj.length?`<div class="mapa-wrap">
        <table class="rep-table"><thead>
          <tr><th>Data</th><th>Dia</th><th>Slot</th><th>Horário</th><th>Analista</th><th>Atividade</th><th>Observação</th></tr>
        </thead><tbody>${detRows}</tbody></table></div>`:'<div class="rep-empty">Nenhum lançamento detalhado para este projeto.</div>'}
    </div>`;

  // Listener do dropdown
  el("repProjetoSel").addEventListener("change",e=>{repProjetoSel=e.target.value;renderReports();});

  // Dados para export CSV: a versão detalhada (mais útil)
  _lastRepCols=[{key:"data",label:"Data"},{key:"dow",label:"Dia"},{key:"slot",label:"Slot"},{key:"horario",label:"Horário"},{key:"analista",label:"Analista"},{key:"atividade",label:"Atividade"},{key:"obs",label:"Observação"}];
  _lastRepRows=alocsProj.map(a=>{const d=parseISO(a.iso);return {data:`${fmtDM(d)}/${d.getFullYear()}`, dow:DOW[d.getDay()], slot:a.slot, horario:a.horario, analista:a.analista, atividade:a.atividade, obs:a.obs};});
  lucideRefresh();
}


// Função de impressão: usa @media print, mas o botão garante focar a área correta
function imprimirRelatorio(){
  document.body.classList.add("printing");
  // Garante render de ícones antes
  lucideRefresh();
  setTimeout(()=>{
    window.print();
    setTimeout(()=>document.body.classList.remove("printing"),500);
  },80);
}


function renderRepLivres(){
  const dias=repDays(), fer=feriadosMap(); const ns=repAnalysts();
  if(!dias.length){el("repBody").innerHTML='<div class="rep-empty">Selecione um período válido.</div>';_lastRepRows=[];return;}
  if(!ns.length){el("repBody").innerHTML='<div class="rep-empty">Nenhum analista no escopo selecionado.</div>';_lastRepRows=[];return;}
  const work=SLOTS.filter(s=>!s.lunch);
  const rows=[];
  ns.forEach(n=>{const l=liderDe(n)||"—";
    dias.forEach(d=>{const iso=toISO(d);if(fer[iso])return; // descarta feriados
      work.forEach(s=>{const r=DATA[key(n,iso,s.id)];
        if(ehSlotLivre(r))rows.push({analista:n,lider:l,data:iso,dataFmt:fmtDM(d),dow:DOW[d.getDay()],slot:s.id,horario:s.time, _r:r});
      });
    });
  });
  const sorted=applySort(rows.length?rows:[]);
  const summary=`<div class="rep-summary">
    <div class="stat"><div class="n">${ns.length}</div><div class="l">Analistas</div></div>
    <div class="stat"><div class="n">${dias.length}</div><div class="l">Dias úteis</div></div>
    <div class="stat"><div class="n">${rows.length}</div><div class="l">Slots livres</div></div>
    <div class="stat"><div class="n">${(rows.length/ns.length).toFixed(1)}</div><div class="l">Média / analista</div></div></div>`;
  const head=`<tr>${thSort("analista","Analista")}${thSort("lider","Líder")}${thSort("data","Data")}${thSort("dow","Dia")}${thSort("slot","Slot")}<th>Horário</th><th>Status</th></tr>`;
  const body=sorted.map(r=>`<tr>
    <td class="nm">${enc(r.analista)}</td><td>${enc(r.lider)}</td>
    <td class="mono">${r.dataFmt}</td><td>${r.dow}</td>
    <td><b>${r.slot}</b></td><td class="mono">${enc(r.horario)}</td>
    <td>${r._r?'<span class="badge-small" style="color:#b5b5b5;background:transparent;border-color:#dcdcdc">Livre (registrado)</span>':'<span class="badge-small" style="color:#6b6b6b;background:#f2f2f2;border-color:#d9d9d9">Sem registro</span>'}</td>
  </tr>`).join("");
  el("repBody").innerHTML=`<div class="rep-actions"><div class="left">Lista acionável de capacidade disponível · feriados foram excluídos · clique em uma coluna para ordenar</div></div>
    ${summary}${rows.length?`<table class="rep-table"><thead>${head}</thead><tbody>${body}</tbody></table>`:'<div class="rep-empty">Nenhum slot livre no período/escopo selecionado. 🎉</div>'}`;
  bindSort();
  _lastRepCols=[{key:"analista",label:"Analista"},{key:"lider",label:"Líder"},{key:"data",label:"Data"},{key:"dow",label:"Dia"},{key:"slot",label:"Slot"},{key:"horario",label:"Horário"}];
  _lastRepRows=sorted;
}

/* ===== Relatório · Aderência ao Plano (previsto × realizado) =====
   Compara, slot a slot, a camada previsto (PREV) com o realizado (DATA) no período
   e escopo selecionados. Requer histórico completo do previsto. */
function renderRepAderencia(){
  if(!_repPrevistoCarregado){
    el("repBody").innerHTML = _htmlRelatorioSobDemanda();
    _lastRepRows=[];
    return;
  }
  const dias=repDays(); const ns=repAnalysts();
  if(!dias.length){ el("repBody").innerHTML='<div class="rep-empty">Selecione um período válido.</div>'; _lastRepRows=[]; return; }
  const work=SLOTS.filter(s=>!s.lunch);
  const porProj={}, porAn={}, G={prev:0,confirmado:0,conflito:0,naoRealizado:0,extra:0};
  const ensureP=p=>porProj[p]||(porProj[p]={projeto:p,prev:0,confirmado:0,conflito:0,naoRealizado:0,extra:0});
  const ensureA=a=>porAn[a]||(porAn[a]={analista:a,prev:0,confirmado:0,conflito:0,naoRealizado:0,extra:0});
  ns.forEach(n=>{
    dias.forEach(d=>{ const iso=toISO(d);
      work.forEach(s=>{
        const st=statusCelula(n,iso,s.id);
        if(st==="vazio") return;
        const pv=PREV[key(n,iso,s.id)], rl=DATA[key(n,iso,s.id)];
        const A=ensureA(n);
        if(st==="extra"){ const P=ensureP((rl&&rl.cliente)||"—"); P.extra++; A.extra++; G.extra++; return; }
        const P=ensureP((pv&&pv.cliente)||"—");
        P.prev++; A.prev++; G.prev++;
        if(st==="confirmado"){P.confirmado++;A.confirmado++;G.confirmado++;}
        else if(st==="conflito"){P.conflito++;A.conflito++;G.conflito++;}
        else if(st==="previsto"){P.naoRealizado++;A.naoRealizado++;G.naoRealizado++;}
      });
    });
  });
  const pct=(num,den)=>den>0?Math.round(num/den*100):null;
  const fmtPct=v=>v==null?"—":v+"%";
  const summary=`<div class="rep-summary">
    <div class="stat"><div class="n">${G.prev}</div><div class="l">Previsto (slots)</div></div>
    <div class="stat"><div class="n">${G.confirmado}</div><div class="l">Confirmado</div></div>
    <div class="stat"><div class="n">${G.conflito}</div><div class="l">Conflito</div></div>
    <div class="stat"><div class="n">${G.naoRealizado}</div><div class="l">Não realizado</div></div>
    <div class="stat"><div class="n">${fmtPct(pct(G.confirmado,G.prev))}</div><div class="l">Aderência</div></div>
    <div class="stat"><div class="n">${G.extra}</div><div class="l">Extra (fora do plano)</div></div></div>`;
  const projRows=Object.values(porProj).filter(r=>r.prev>0||r.extra>0).map(r=>({...r,aderencia:pct(r.confirmado,r.prev)}));
  const sorted=applySort(projRows.length?projRows:[]);
  const headP=`<tr>${thSort("projeto","Projeto")}${thSort("prev","Previsto","num")}${thSort("confirmado","Confirm.","num")}${thSort("conflito","Conflito","num")}${thSort("naoRealizado","Não realiz.","num")}${thSort("extra","Extra","num")}${thSort("aderencia","Aderência","num")}</tr>`;
  const bodyP=sorted.map(r=>`<tr>
    <td class="nm">${enc(r.projeto)}</td>
    <td class="num">${r.prev}</td><td class="num">${r.confirmado}</td>
    <td class="num">${r.conflito?`<b style="color:#d12b2b">${r.conflito}</b>`:0}</td>
    <td class="num">${r.naoRealizado}</td><td class="num">${r.extra}</td>
    <td class="num">${_aderBadge(r.aderencia)}</td></tr>`).join("");
  const anRows=Object.values(porAn).filter(r=>r.prev>0||r.extra>0).map(r=>({...r,aderencia:pct(r.confirmado,r.prev)}))
    .sort((a,b)=>((a.aderencia==null?999:a.aderencia)-(b.aderencia==null?999:b.aderencia)));
  const bodyA=anRows.map(r=>`<tr>
    <td class="nm">${enc(r.analista)}</td>
    <td class="num">${r.prev}</td><td class="num">${r.confirmado}</td>
    <td class="num">${r.conflito?`<b style="color:#d12b2b">${r.conflito}</b>`:0}</td>
    <td class="num">${r.naoRealizado}</td><td class="num">${r.extra}</td>
    <td class="num">${_aderBadge(r.aderencia)}</td></tr>`).join("");
  el("repBody").innerHTML=`
    <div class="rep-actions"><div class="left">Aderência ao plano — previsto × realizado por slot no período/escopo. <b>Confirmado</b>=realizado igual ao previsto · <b>Conflito</b>=projeto diferente · <b>Não realizado</b>=previsto sem realizado · <b>Extra</b>=realizado sem plano.</div></div>
    ${summary}
    ${projRows.length?`<table class="rep-table"><thead>${headP}</thead><tbody>${bodyP}</tbody></table>`:'<div class="rep-empty">Nenhum previsto no período/escopo. Lance o previsto pela aba Previsto do projeto.</div>'}
    ${anRows.length?`<div class="gp-lbl" style="margin:18px 0 8px">Por analista</div><table class="rep-table"><thead><tr><th>Analista</th><th class="num">Previsto</th><th class="num">Confirm.</th><th class="num">Conflito</th><th class="num">Não realiz.</th><th class="num">Extra</th><th class="num">Aderência</th></tr></thead><tbody>${bodyA}</tbody></table>`:""}`;
  bindSort();
  _lastRepCols=[{key:"projeto",label:"Projeto"},{key:"prev",label:"Previsto"},{key:"confirmado",label:"Confirmado"},{key:"conflito",label:"Conflito"},{key:"naoRealizado",label:"NaoRealizado"},{key:"extra",label:"Extra"},{key:"aderencia",label:"Aderencia%"}];
  _lastRepRows=sorted;
}
function _aderBadge(v){
  if(v==null) return '<span style="color:var(--muted)">—</span>';
  const c = v>=85?["#1f8a44","#e6f4ea"]:v>=60?["#9a5a00","#fbeccf"]:["#b32020","#fbe3e3"];
  return `<span class="badge-small" style="color:${c[0]};background:${c[1]};border-color:transparent;font-weight:700">${v}%</span>`;
}

/* === Relatório 3: Alocação por Projetos === */
function renderRepProjetos(){
  const dias=repDays(), fer=feriadosMap(); const ns=repAnalysts();
  if(!dias.length){el("repBody").innerHTML='<div class="rep-empty">Selecione um período válido.</div>';_lastRepRows=[];return;}
  // contagem cliente → {slots total, por analista}
  // Quando o escopo é por TIPO DE ATIVIDADE, conta só os slots daquele tipo (projsTipo);
  // caso contrário, conta todo o esforço em projeto (projs).
  const tipoAtvScope = repScope.startsWith("tipoatv:") ? repScope.slice(8) : null;
  const por={};
  ns.forEach(n=>{const c=contarSlots(n,dias,fer);
    if(tipoAtvScope){
      Object.entries(c.projsTipo||{}).forEach(([proj,m])=>{
        const cnt=(m&&m[tipoAtvScope])||0; if(!cnt)return;
        if(!por[proj])por[proj]={projeto:proj,slots:0,analistas:{}};
        por[proj].slots+=cnt; por[proj].analistas[n]=(por[proj].analistas[n]||0)+cnt;
      });
    }else{
      Object.entries(c.projs).forEach(([proj,cnt])=>{
        if(!por[proj])por[proj]={projeto:proj,slots:0,analistas:{}};
        por[proj].slots+=cnt; por[proj].analistas[n]=(por[proj].analistas[n]||0)+cnt;
      });
    }
  });
  // enriquece com info do cadastro de projeto
  const rows=Object.values(por).map(p=>{
    const cad=REG.projetos.find(x=>x.nome===p.projeto);
    const analistasCount=Object.keys(p.analistas).length;
    const top=Object.entries(p.analistas).sort((a,b)=>b[1]-a[1]);
    const tipoObj=TIPOS_ATIVIDADE.find(t=>t.id===(cad&&cad.tipo||"implantacao"))||{nome:"—",icone:"•"};
    return {
      projeto:p.projeto, tipo:tipoObj.nome, tipoIcone:tipoObj.icone, tipoId:(cad&&cad.tipo)||"implantacao",
      status:(cad&&cad.status)||"—",
      gp:(cad&&cad.gp)||"—", lider:(cad&&cad.lider)||"—",
      segmentacao:(cad&&cad.segmentacao)||"—",
      slots:p.slots, analistas:analistasCount,
      distribuicao:top.map(([n,c])=>n+" ("+c+")").join(", ")
    };
  });
  // inclui projetos cadastrados sem alocação no período (só se escopo for "todos")
  if(repScope==="todos" && (isAdmin()||isGestor())){
    REG.projetos.forEach(p=>{
      if(!por[p.nome]){
        const tipoObj=TIPOS_ATIVIDADE.find(t=>t.id===(p.tipo||"implantacao"))||{nome:"—",icone:"•"};
        rows.push({projeto:p.nome,tipo:tipoObj.nome,tipoIcone:tipoObj.icone,tipoId:p.tipo||"implantacao",status:p.status||"—",gp:p.gp||"—",lider:p.lider||"—",segmentacao:p.segmentacao||"—",slots:0,analistas:0,distribuicao:"—"});
      }
    });
  }
  // Filtros adicionais (GP / tipo de atividade) — aplicados no resultado
  let filtered=rows;
  if(repScope.startsWith("gp:")){const g=repScope.slice(3); filtered=rows.filter(r=>r.gp===g);}
  else if(repScope.startsWith("tipoatv:")){ /* já restrito na agregação por tipo de atividade */ }
  const totalSlots=filtered.reduce((a,r)=>a+r.slots,0);
  const ativos=filtered.filter(r=>r.slots>0).length;
  const sorted=applySort(filtered.length?filtered:[]);
  const summary=`<div class="rep-summary">
    <div class="stat"><div class="n">${filtered.length}</div><div class="l">Projetos</div></div>
    <div class="stat"><div class="n">${ativos}</div><div class="l">Com alocação</div></div>
    <div class="stat"><div class="n">${totalSlots}</div><div class="l">Slots em projeto</div></div>
    <div class="stat"><div class="n">${ns.length}</div><div class="l">Analistas no escopo</div></div></div>`;
  const head=`<tr>${thSort("projeto","Projeto")}${thSort("tipo","Tipo")}${thSort("status","Status")}${thSort("segmentacao","Segm.")}${thSort("gp","GP")}${thSort("lider","Líder")}${thSort("slots","Slots","num")}${thSort("analistas","# Analistas","num")}<th>Distribuição (top)</th></tr>`;
  const statusBadge=s=>{const m={"Em andamento":["b-ema","#B8400A","#FFE4D3","#F0B894"],"Estabilização":["b-est","#b07a1e","#f6ecd6","#e6d2a6"],"Concluído":["b-con","#6b6b6b","#EEEEEE","#D5D5D5"],"Não iniciado":["b-nao","#6b6b6b","#f2f2f2","#d9d9d9"],"Congelado":["b-cgl","#2a5d7c","#dde8f1","#bcd1e3"],"Churn":["b-chr","#a33","#fbeceb","#e8c9c4"]};
    const v=m[s]||m["Não iniciado"];return `<span class="badge-small" style="color:${v[1]};background:${v[2]};border-color:${v[3]}">${enc(s)}</span>`;};
  const body=sorted.map(r=>`<tr>
    <td class="nm">${enc(r.projeto)}</td>
    <td><span class="badge-small">${r.tipoIcone} ${enc(r.tipo)}</span></td>
    <td>${statusBadge(r.status)}</td>
    <td>${enc(r.segmentacao)}</td>
    <td>${enc(r.gp)}</td><td>${enc(r.lider)}</td>
    <td class="num"><b>${r.slots}</b></td><td class="num">${r.analistas}</td>
    <td style="font-size:12px;color:var(--muted)">${enc(r.distribuicao)}</td>
  </tr>`).join("");
  el("repBody").innerHTML=`<div class="rep-actions"><div class="left">Esforço (em slots) consumido por cada projeto no período · clique em uma coluna para ordenar</div></div>
    ${summary}${filtered.length?`<table class="rep-table"><thead>${head}</thead><tbody>${body}</tbody></table>`:'<div class="rep-empty">Nenhum projeto com alocação no período/escopo.</div>'}`;
  bindSort();
  _lastRepCols=[{key:"projeto",label:"Projeto"},{key:"tipo",label:"Tipo"},{key:"status",label:"Status"},{key:"segmentacao",label:"Segmentação"},{key:"gp",label:"GP"},{key:"lider",label:"Líder"},{key:"slots",label:"Slots"},{key:"analistas",label:"# Analistas"},{key:"distribuicao",label:"Distribuição"}];
  _lastRepRows=sorted;
}

/* === Relatório 4: Gestão de Go-Live === */
function renderRepGoLive(){
  const hojeISO=toISO(new Date());
  // Considera projetos que tenham ao menos uma das datas preenchidas
  const linhas=(REG.projetos||[])
    .filter(p=>(p.tipo==="implantacao") && (p.goLivePrevisto||p.goLiveRealizado))
    .map(p=>{
      const prev=p.goLivePrevisto||"";
      const real=p.goLiveRealizado||"";
      let status="—", diff=null;
      if(real){
        if(!prev){status="Realizado";}
        else{
          const d=daysBetween(prev,real); diff=d;
          status = d===0 ? "No prazo" : (d>0 ? "Atrasou "+d+"d" : "Adiantou "+Math.abs(d)+"d");
        }
      }else if(prev){
        if(prev<hojeISO){const d=daysBetween(prev,hojeISO); diff=d; status="Atrasado "+d+"d";}
        else if(prev===hojeISO){status="Hoje";}
        else{const d=daysBetween(hojeISO,prev); diff=-d; status="Em "+d+"d";}
      }
      return {
        projeto:p.nome, status:status, segmentacao:p.segmentacao||"—", projStatus:p.status||"—",
        gp:p.gp||"—", lider:p.lider||"—",
        goLivePrevisto:prev, goLiveRealizado:real, diff:diff
      };
    });
  // Aplica filtro de escopo
  let rows=linhas;
  if(repScope.startsWith("lider:")){const l=repScope.slice(6); rows=rows.filter(r=>r.lider===l);}
  else if(repScope.startsWith("gp:")){const g=repScope.slice(3); rows=rows.filter(r=>r.gp===g);}
  else if(repScope.startsWith("tipoatv:")){
    // Filtro por tipo de atividade não se aplica ao Go-Live (relatório por projeto/data) — mantém todos no escopo.
  }
  else if(repScope.startsWith("analista:")){
    const n=repScope.slice(9);
    rows=rows.filter(r=>{const p=REG.projetos.find(x=>x.nome===r.projeto);return p&&(p.analistas||[]).includes(n);});
  }
  // Ordenação padrão: pendentes primeiro (mais atrasados no topo), depois realizados
  const sorted=applySort(rows.length?rows:[]);
  // se nenhuma coluna foi clicada, ordena por urgência (pendentes mais atrasados primeiro)
  if(!repSort.col){
    sorted.sort((a,b)=>{
      const aR=!!a.goLiveRealizado, bR=!!b.goLiveRealizado;
      if(aR!==bR) return aR?1:-1; // pendentes (não realizado) antes
      if(!aR){ // ambos pendentes: mais atrasado primeiro (data prevista mais antiga primeiro)
        return (a.goLivePrevisto||"9999").localeCompare(b.goLivePrevisto||"9999");
      }
      // ambos realizados: mais recente primeiro
      return (b.goLiveRealizado||"").localeCompare(a.goLiveRealizado||"");
    });
  }
  // Estatísticas
  const pend=rows.filter(r=>!r.goLiveRealizado).length;
  const atrasados=rows.filter(r=>!r.goLiveRealizado && r.goLivePrevisto && r.goLivePrevisto<hojeISO).length;
  const proximos30=rows.filter(r=>!r.goLiveRealizado && r.goLivePrevisto && r.goLivePrevisto>=hojeISO && daysBetween(hojeISO,r.goLivePrevisto)<=30).length;
  const realizados=rows.filter(r=>r.goLiveRealizado).length;
  const noPrazo=rows.filter(r=>r.goLiveRealizado && r.goLivePrevisto && r.diff!=null && r.diff<=0).length;
  const summary=`<div class="rep-summary">
    <div class="stat"><div class="n">${rows.length}</div><div class="l">Projetos com Go-Live</div></div>
    <div class="stat ${atrasados>0?'warn':''}"><div class="n">${atrasados}</div><div class="l">Atrasados</div></div>
    <div class="stat info"><div class="n">${proximos30}</div><div class="l">Próximos 30 dias</div></div>
    <div class="stat ok"><div class="n">${realizados}</div><div class="l">Realizados</div></div>
    <div class="stat"><div class="n">${realizados?Math.round(noPrazo/realizados*100):0}%</div><div class="l">Aderência (no prazo)</div></div>
  </div>`;
  const head=`<tr>
    ${thSort("projeto","Projeto")}${thSort("projStatus","Status do Projeto")}${thSort("segmentacao","Segm.")}
    ${thSort("gp","GP")}${thSort("lider","Líder")}
    ${thSort("goLivePrevisto","Go-Live previsto")}${thSort("goLiveRealizado","Go-Live realizado")}
    ${thSort("status","Situação")}</tr>`;
  const statusBadge=s=>{
    if(s.startsWith("Atrasado")||s.startsWith("Atrasou")) return `<span class="badge-small" style="color:#a33;background:#fbeceb;border-color:#e8c9c4">${enc(s)}</span>`;
    if(s==="No prazo"||s.startsWith("Adiantou")) return `<span class="badge-small" style="color:#2f7a4f;background:#dcefe2;border-color:#bcdcc6">${enc(s)}</span>`;
    if(s==="Realizado") return `<span class="badge-small" style="color:#2f7a4f;background:#dcefe2;border-color:#bcdcc6">${enc(s)}</span>`;
    if(s==="Hoje") return `<span class="badge-small" style="color:#b07a1e;background:#f6ecd6;border-color:#e6d2a6">⚡ ${enc(s)}</span>`;
    if(s.startsWith("Em ")) return `<span class="badge-small" style="color:#6b6b6b;background:#eee;border-color:#d9d9d9">${enc(s)}</span>`;
    return `<span class="badge-small" style="color:#6b6b6b;background:#eee;border-color:#d9d9d9">${enc(s)}</span>`;
  };
  const body=sorted.map(r=>`<tr>
    <td class="nm">${enc(r.projeto)}</td>
    <td>${enc(r.projStatus)}</td>
    <td>${enc(r.segmentacao)}</td>
    <td>${enc(r.gp)}</td><td>${enc(r.lider)}</td>
    <td class="mono">${r.goLivePrevisto?fmtDM(parseISO(r.goLivePrevisto))+"/"+parseISO(r.goLivePrevisto).getFullYear():'—'}</td>
    <td class="mono">${r.goLiveRealizado?fmtDM(parseISO(r.goLiveRealizado))+"/"+parseISO(r.goLiveRealizado).getFullYear():'—'}</td>
    <td>${statusBadge(r.status)}</td>
  </tr>`).join("");
  el("repBody").innerHTML=`<div class="rep-actions"><div class="left">Gestão dos Go-Lives previstos e realizados · ordenação padrão: pendentes mais atrasados primeiro · clique em uma coluna para reordenar</div></div>
    ${summary}${rows.length?`<table class="rep-table"><thead>${head}</thead><tbody>${body}</tbody></table>`:'<div class="rep-empty">Nenhum projeto com Go-Live cadastrado.<br><span style="font-size:12px">Adicione as datas em Ações → Projetos → editar projeto.</span></div>'}`;
  bindSort();
  _lastRepCols=[{key:"projeto",label:"Projeto"},{key:"projStatus",label:"Status"},{key:"segmentacao",label:"Segmentação"},{key:"gp",label:"GP"},{key:"lider",label:"Líder"},{key:"goLivePrevisto",label:"Go-Live previsto"},{key:"goLiveRealizado",label:"Go-Live realizado"},{key:"status",label:"Situação"}];
  _lastRepRows=sorted;
}

/* === Relatório 5: Férias (agregando das alocações tipo Ausência) === */
function renderRepFerias(){
  // Considera atividades cujo tipo é "ausencia" e o nome lembra férias
  // (mais permissivo: "Férias" + variações, mas exclui Atestado/Folga/etc — esses são ausências distintas)
  const ehFerias=cli=>{
    if(!cli)return false;
    if(/f[ée]rias/i.test(cli))return true; // "Férias", "Ferias"
    const ativ=atividadeObj(cli);
    return ativ && ativ.tipo==="ausencia" && /f[ée]rias/i.test(ativ.nome);
  };
  // Janela: período do relatório (repFrom/repTo) ou tudo no histórico se vazio
  const allDates=new Set();
  Object.keys(DATA).forEach(k=>{const p=k.split("__"); if(p[1])allDates.add(p[1]);});
  const datasOrdenadas=[...allDates].sort();
  if(!datasOrdenadas.length){el("repBody").innerHTML='<div class="rep-empty">Sem alocações registradas para apurar férias.</div>';_lastRepRows=[];return;}

  // Filtro de janela
  const inicio = repFrom || datasOrdenadas[0];
  const fim    = repTo   || datasOrdenadas[datasOrdenadas.length-1];

  // Coleta slots de férias por analista, depois agrupa em períodos contínuos
  const porAnalista={}; // {nome: [{iso, slots:0}, ...]} agregado por dia
  Object.entries(DATA).forEach(([k,v])=>{
    if(!ehFerias(v&&v.cliente)&&!ehFerias(v&&v.atividade))return;
    const [nome,iso,slot]=k.split("__"); if(!nome||!iso)return;
    if(iso<inicio||iso>fim)return;
    const w=parseISO(iso).getDay(); if(w===0||w===6)return; // ignora sábado/domingo
    if(!porAnalista[nome])porAnalista[nome]={};
    porAnalista[nome][iso]=(porAnalista[nome][iso]||0)+1;
  });

  // Respeita escopo do perfil
  const ns=visibleAnalysts(fim);
  let nomes=Object.keys(porAnalista).filter(n=>ns.includes(n));
  if(repScope.startsWith("lider:")){const l=repScope.slice(6); nomes=nomes.filter(n=>liderDe(n)===l);}
  else if(repScope.startsWith("analista:")){const n=repScope.slice(9); nomes=nomes.filter(x=>x===n);}

  // Agrupa dias contínuos em "períodos" (dias consecutivos = mesmo período)
  const periodos=[]; // [{analista, inicio, fim, dias, slots}]
  nomes.forEach(n=>{
    const dias=Object.keys(porAnalista[n]).sort();
    if(!dias.length)return;
    let blocoInicio=dias[0], blocoSlots=porAnalista[n][dias[0]], blocoDias=1;
    for(let i=1;i<dias.length;i++){
      const ant=dias[i-1], atu=dias[i];
      // são consecutivos se diff = 1 dia ÚTIL (seg→ter, qua→qui...) — ou seg-sex pulando fim de semana
      if(saoConsecutivos(ant,atu)){
        blocoSlots+=porAnalista[n][atu]; blocoDias++;
      }else{
        periodos.push({analista:n, inicio:blocoInicio, fim:dias[i-1], dias:blocoDias, slots:blocoSlots, lider:liderDe(n)||"—"});
        blocoInicio=atu; blocoSlots=porAnalista[n][atu]; blocoDias=1;
      }
    }
    periodos.push({analista:n, inicio:blocoInicio, fim:dias[dias.length-1], dias:blocoDias, slots:blocoSlots, lider:liderDe(n)||"—"});
  });

  const hojeISO=toISO(new Date());
  periodos.forEach(p=>{p.status = p.fim<hojeISO ? "Concluídas" : (p.inicio>hojeISO ? "Futuras" : "Em andamento");});
  const sorted=applySort(periodos.length?periodos:[]);
  if(!repSort.col){sorted.sort((a,b)=>b.inicio.localeCompare(a.inicio));} // mais recente primeiro

  const totDias=periodos.reduce((a,p)=>a+p.dias,0);
  const emAnd=periodos.filter(p=>p.status==="Em andamento").length;
  const futuras=periodos.filter(p=>p.status==="Futuras").length;
  const summary=`<div class="rep-summary">
    <div class="stat"><div class="n">${nomes.length}</div><div class="l">Analistas c/ férias</div></div>
    <div class="stat"><div class="n">${periodos.length}</div><div class="l">Períodos</div></div>
    <div class="stat"><div class="n">${totDias}</div><div class="l">Total de dias</div></div>
    <div class="stat ${emAnd>0?'warn':''}"><div class="n">${emAnd}</div><div class="l">Em andamento</div></div>
    <div class="stat info"><div class="n">${futuras}</div><div class="l">Futuras</div></div>
  </div>`;
  const statusBadge=s=>{
    if(s==="Em andamento")return `<span class="badge-small" style="color:#b07a1e;background:#f6ecd6;border-color:#e6d2a6">${enc(s)}</span>`;
    if(s==="Futuras")return `<span class="badge-small" style="color:#22456a;background:#dde8f1;border-color:#bcd1e3">${enc(s)}</span>`;
    return `<span class="badge-small" style="color:#6b6b6b;background:#eee;border-color:#d9d9d9">${enc(s)}</span>`;
  };
  const head=`<tr>${thSort("analista","Analista")}${thSort("lider","Líder")}${thSort("inicio","Início")}${thSort("fim","Fim")}${thSort("dias","Dias úteis","num")}${thSort("slots","Slots","num")}${thSort("status","Situação")}</tr>`;
  const body=sorted.map(p=>`<tr>
    <td class="nm">${enc(p.analista)}</td>
    <td>${enc(p.lider)}</td>
    <td class="mono">${fmtDM(parseISO(p.inicio))}/${parseISO(p.inicio).getFullYear()}</td>
    <td class="mono">${fmtDM(parseISO(p.fim))}/${parseISO(p.fim).getFullYear()}</td>
    <td class="num"><b>${p.dias}</b></td>
    <td class="num">${p.slots}</td>
    <td>${statusBadge(p.status)}</td>
  </tr>`).join("");
  el("repBody").innerHTML=`<div class="rep-actions"><div class="left">Períodos de férias agregados das alocações marcadas como "Férias" · dias úteis consecutivos formam um período · ordenação padrão: mais recente primeiro</div></div>
    ${summary}${periodos.length?`<table class="rep-table"><thead>${head}</thead><tbody>${body}</tbody></table>`:'<div class="rep-empty">Nenhum período de férias encontrado.<br><span style="font-size:12px">Marque atividade "Férias" nos slots para os dias de férias do analista (use Aplicar em intervalo de datas).</span></div>'}`;
  bindSort();
  _lastRepCols=[{key:"analista",label:"Analista"},{key:"lider",label:"Líder"},{key:"inicio",label:"Início"},{key:"fim",label:"Fim"},{key:"dias",label:"Dias úteis"},{key:"slots",label:"Slots"},{key:"status",label:"Situação"}];
  _lastRepRows=sorted;
}

// dois dias são "consecutivos" para fins de período de férias?
// (Seg-Ter, Ter-Qua, ..., e Sex-Seg também conta — porque sábado/domingo não são úteis)
/* === Relatório 6: Slots com observação pendente ===
   Lista slots onde a atividade exige observação mas o texto está vazio (ou marcado obsPendente).
   Útil para o admin/líder cobrar o preenchimento depois de importações em massa. */
function renderRepPendObs(){
  const dias=repDays(); const ns=repAnalysts();
  if(!dias.length){el("repBody").innerHTML='<div class="rep-empty">Selecione um período válido.</div>';_lastRepRows=[];return;}
  // Indexa atividades que exigem observação
  const exigeMap={};
  (REG.atividades||[]).forEach(a=>{if(a.exigeObs)exigeMap[a.nome]=a;});

  const rows=[];
  const isoSet=new Set(dias.map(d=>toISO(d)));
  ns.forEach(nome=>{
    Object.entries(DATA).forEach(([k,r])=>{
      if(!r||r.feriado)return;
      const [an,iso,slot]=k.split("__");
      if(an!==nome)return;
      if(!isoSet.has(iso))return;
      const atv=r.atividade||"";
      const exige=exigeMap[atv];
      const semObs=!r.obs||!String(r.obs).trim();
      // Critério: atividade exige obs E não tem obs, OU flag explícita obsPendente
      if((exige && semObs) || r.obsPendente){
        rows.push({
          analista:nome, lider:liderDe(nome)||"—",
          data:iso, slot, atividade:atv, projeto:r.cliente||"—",
          dataFmt:fmtDM(parseISO(iso))+"/"+parseISO(iso).getFullYear(),
          dow:DOW[parseISO(iso).getDay()],
          fonte: r.obsPendente?"importação":"manual"
        });
      }
    });
  });

  // Filtros adicionais já vêm de repAnalysts (escopo)
  const sorted=applySort(rows.length?rows:[]);
  if(!repSort.col){
    // padrão: mais antigos primeiro (urgência maior)
    sorted.sort((a,b)=>a.data.localeCompare(b.data)||a.analista.localeCompare(b.analista,"pt"));
  }

  // Agregado por analista
  const porAnalista={};
  rows.forEach(r=>{porAnalista[r.analista]=(porAnalista[r.analista]||0)+1;});
  const topAnalista=Object.entries(porAnalista).sort((a,b)=>b[1]-a[1])[0];

  const summary=`<div class="rep-summary">
    <div class="stat ${rows.length>0?'warn':''}"><div class="n">${rows.length}</div><div class="l">Slots pendentes</div></div>
    <div class="stat"><div class="n">${Object.keys(porAnalista).length}</div><div class="l">Analistas afetados</div></div>
    <div class="stat"><div class="n">${topAnalista?topAnalista[1]:0}</div><div class="l">${topAnalista?'Maior — '+topAnalista[0]:'—'}</div></div>
    <div class="stat info"><div class="n">${rows.filter(r=>r.fonte==='importação').length}</div><div class="l">Vindas de importação</div></div>
  </div>`;

  const head=`<tr>${thSort("analista","Analista")}${thSort("lider","Líder")}${thSort("data","Data")}${thSort("dow","Dia")}${thSort("slot","Slot")}${thSort("atividade","Atividade")}${thSort("projeto","Projeto")}${thSort("fonte","Origem")}</tr>`;
  const body=sorted.map(r=>`<tr>
    <td class="nm">${enc(r.analista)}</td>
    <td>${enc(r.lider)}</td>
    <td class="mono">${enc(r.dataFmt)}</td>
    <td>${enc(r.dow)}</td>
    <td><b>${enc(r.slot)}</b></td>
    <td>${enc(r.atividade)}</td>
    <td>${enc(r.projeto)}</td>
    <td>${r.fonte==='importação'?'<span class="badge-small" style="color:#b07a1e;background:#f6ecd6;border-color:#e6d2a6">importação</span>':'<span class="badge-small" style="color:#6b6b6b;background:#eee;border-color:#d9d9d9">manual</span>'}</td>
  </tr>`).join("");

  el("repBody").innerHTML=`<div class="rep-actions"><div class="left">Slots cuja atividade exige observação, mas sem texto preenchido · útil para cobrar preenchimento após importações em massa</div></div>
    ${summary}${rows.length?`<table class="rep-table"><thead>${head}</thead><tbody>${body}</tbody></table>`:'<div class="rep-empty">Nenhuma pendência de observação no período/escopo. 🎉</div>'}`;
  bindSort();
  _lastRepCols=[{key:"analista",label:"Analista"},{key:"lider",label:"Líder"},{key:"data",label:"Data"},{key:"dow",label:"Dia"},{key:"slot",label:"Slot"},{key:"atividade",label:"Atividade"},{key:"projeto",label:"Projeto"},{key:"fonte",label:"Origem"}];
  _lastRepRows=sorted;
}

function saoConsecutivos(a,b){
  const da=parseISO(a), db=parseISO(b);
  const diff=Math.round((db-da)/86400000);
  if(diff===1)return true; // dia útil para dia útil seguinte
  if(diff===3 && da.getDay()===5 && db.getDay()===1)return true; // sexta → segunda
  return false;
}
function daysBetween(iso1,iso2){
  return Math.round((parseISO(iso2)-parseISO(iso1))/86400000);
}
let kpiScope="todos", kpiPeriodMode="semana", kpiFrom=null, kpiTo=null;
let kpiTab="visao"; // visao | capacidade | atividades | projetos | qualidade
const KPI_TABS=[
  ["visao",      "Visão Geral",        "layout-dashboard"],
  ["capacidade", "Capacidade & Ocupação", "activity"],
  ["atividades", "Atividades",         "tag"],
  ["projetos",   "Projetos & Go-Live", "rocket"],
  ["golives",    "Go-Lives",           "calendar-check-2"],
  ["qualidade",  "Qualidade & Risco",  "shield-check"],
  ["capac",      "Capacitação",        "graduation-cap"],
];
function renderKpiTabs(){
  const el2=el("kpiTabs"); if(!el2)return;
  const tabsOrd=[...KPI_TABS].sort((a,b)=>a[1].localeCompare(b[1],"pt",{sensitivity:"base"}));
  el2.innerHTML=tabsOrd.map(([id,label,ico])=>`<button class="kpi-tab ${id===kpiTab?'active':''}" data-tab="${id}"><i data-lucide="${ico}"></i>${label}</button>`).join("");
  el2.querySelectorAll(".kpi-tab").forEach(b=>b.addEventListener("click",()=>{kpiTab=b.dataset.tab;renderKPIs();}));
  lucideRefresh();
}

function openKPIs(){
  if(!canViewAction("kpis")){ alert("Você não tem acesso aos KPIs."); return; }
  _fecharOutrasTelas("kpiOverlay");
  try{ ensureCapIntegration(); }catch(e){}
  el("kpiOverlay").classList.add("open");
  aplicarDatasPadrao("kpiPeriodoDataInicio", "kpiPeriodoDataFim");
  atualizarPainelAtivo("kpis");
}
function closeKPIs(){el("kpiOverlay").classList.remove("open");}
function syncKpiRangeFromMain(){
  if(period==="dia"){kpiPeriodMode="dia";kpiFrom=toISO(refDate);kpiTo=toISO(refDate);}
  else if(period==="mes"){kpiPeriodMode="mes";const y=refDate.getFullYear(),m=refDate.getMonth();
    kpiFrom=toISO(new Date(y,m,1));kpiTo=toISO(new Date(y,m+1,0));}
  else {kpiPeriodMode="semana";kpiFrom=toISO(weekStart);kpiTo=toISO(addDays(weekStart,4));}
}
function kpiDays(){
  if(!kpiFrom||!kpiTo)return [];
  const a=parseISO(kpiFrom), b=parseISO(kpiTo); const out=[];
  for(let d=new Date(a); d<=b; d=addDays(d,1)){const w=d.getDay(); if(w>=1&&w<=5)out.push(new Date(d));}
  return out;
}
function kpiAnalysts(){return _aplicaEscopo(visibleAnalysts(kpiTo||undefined), kpiScope, new Set((kpiDays()||[]).map(toISO)));}

function renderKPIs(){ lucideRefresh(); /* Fase 4: auto-cobre icones em qualquer caminho */
  renderKpiTabs();
  try{ _renderKPIs(); }
  catch(e){
    console.error("[KPI] erro ao renderizar:",e);
    const b=el("kpiBody");
    if(b)b.innerHTML='<div class="rep-empty" style="color:#a33"><b>Erro ao renderizar KPIs:</b><br><code style="font-size:11px">'+enc(e.message||String(e))+'</code><br><br>Abra o Console do navegador (F12) para mais detalhes.</div>';
  }
}
function _renderKPIs(){
  // Filtros (reusam visual dos relatórios)
  const escopos=[["todos","Todos (no meu escopo)"]];
  if(isAdmin()||isGestor()){
    lideresAtivos().forEach(l=>escopos.push(["lider:"+l,"Equipe: "+l]));
    gpsAtivos().forEach(g=>escopos.push(["gp:"+g,"GP: "+g]));
    SQUADS.forEach(s=>escopos.push(["squad:"+s,"Squad: "+s]));
    TIPOS_ATIVIDADE.forEach(t=>escopos.push(["tipoatv:"+t.id, t.icone+" Tipo: "+t.nome]));
  }
  visibleAnalysts().forEach(n=>escopos.push(["analista:"+n,"Analista: "+n]));
  el("kpiFilters").innerHTML=`
    <div class="f"><label>Período</label>
      <select id="kpiMode">
        <option value="dia"    ${kpiPeriodMode==="dia"?"selected":""}>Dia</option>
        <option value="semana" ${kpiPeriodMode==="semana"?"selected":""}>Semana</option>
        <option value="mes"    ${kpiPeriodMode==="mes"?"selected":""}>Mês</option>
        <option value="custom" ${kpiPeriodMode==="custom"?"selected":""}>Personalizado</option>
      </select></div>
    <div class="f"><label>De</label><input type="date" id="kpiFrom" value="${kpiFrom||''}"></div>
    <div class="f"><label>Até</label><input type="date" id="kpiTo" value="${kpiTo||''}"></div>
    <div class="f"><label>Escopo</label>
      <select id="kpiScope">${escopos.map(([v,l])=>`<option value="${enc(v)}" ${v===kpiScope?"selected":""}>${enc(l)}</option>`).join("")}</select></div>`;
  el("kpiMode").addEventListener("change",e=>{
    kpiPeriodMode=e.target.value;
    if(kpiPeriodMode!=="custom"){const r=refDate||new Date();
      if(kpiPeriodMode==="dia"){kpiFrom=toISO(r);kpiTo=toISO(r);}
      else if(kpiPeriodMode==="semana"){const ws=monday(r);kpiFrom=toISO(ws);kpiTo=toISO(addDays(ws,4));}
      else {const y=r.getFullYear(),m=r.getMonth();kpiFrom=toISO(new Date(y,m,1));kpiTo=toISO(new Date(y,m+1,0));}
    }
    const pIni=el("kpiPeriodoDataInicio"), pFim=el("kpiPeriodoDataFim");
    if(pIni) pIni.value=kpiFrom; if(pFim) pFim.value=kpiTo;
    atualizarPainelAtivo("kpis");
  });
  el("kpiFrom").addEventListener("change",e=>{kpiFrom=e.target.value;kpiPeriodMode="custom";const pIni=el("kpiPeriodoDataInicio"); if(pIni) pIni.value=kpiFrom; atualizarPainelAtivo("kpis");});
  el("kpiTo").addEventListener("change",e=>{kpiTo=e.target.value;kpiPeriodMode="custom";const pFim=el("kpiPeriodoDataFim"); if(pFim) pFim.value=kpiTo; atualizarPainelAtivo("kpis");});
  el("kpiScope").addEventListener("change",e=>{kpiScope=e.target.value;renderKPIs();});

  // Computa tudo de uma vez
  const dias=kpiDays(), fer=feriadosMap(), ns=kpiAnalysts();
  if(!dias.length){el("kpiBody").innerHTML='<div class="rep-empty">Selecione um período válido.</div>';return;}
  if(!ns.length){el("kpiBody").innerHTML='<div class="rep-empty">Nenhum analista no escopo selecionado.</div>';return;}
  if(kpiTab==="capac"){ try{ el("kpiBody").innerHTML=_capacKpiBody(ns,dias,fer); }catch(e){ el("kpiBody").innerHTML='<div class="rep-empty">Capacitação indisponível: '+enc(e.message||e)+'</div>'; } lucideRefresh(); return; }

  // Agregados por analista
  const perAn=ns.map(n=>{const c=contarSlots(n,dias,fer);return Object.assign({nome:n,lider:liderDe(n)||"—"},c);});
  // Totais globais — 5 tipos + livre/vazio/feriadoAuto
  const tot=perAn.reduce((a,r)=>{["total","livre","proj","dsc","rot","intn","svc","aus","feriadoAuto","vazio","ocupado"].forEach(k=>a[k]=(a[k]||0)+(r[k]||0));return a;},{});
  const baseUtil=tot.total-tot.aus;
  const ocupMedia=baseUtil>0?Math.round(tot.ocupado/baseUtil*100):0;

  // Previsto × Realizado (aderência ao plano) — só quando o usuário tem visão de prealoc.
  let plan=null;
  if(canViewAction("prealoc")){
    plan={prev:0,confirmado:0,conflito:0,naoRealizado:0,extra:0};
    const _work=SLOTS.filter(s=>!s.lunch);
    ns.forEach(n=>dias.forEach(d=>{ const iso=toISO(d); _work.forEach(s=>{
      const st=statusCelula(n,iso,s.id);
      if(st==="confirmado"){plan.prev++;plan.confirmado++;}
      else if(st==="conflito"){plan.prev++;plan.conflito++;}
      else if(st==="previsto"){plan.prev++;plan.naoRealizado++;}
      else if(st==="extra"){plan.extra++;}
    });}));
    plan.aderencia = plan.prev>0?Math.round(plan.confirmado/plan.prev*100):null;
  }
  const _adAccent=v=>v==null?"accent-info":v>=85?"accent-ok":v>=60?"accent-warn":"accent-bad";

  // Projetos no período
  const projAlloc={}; perAn.forEach(r=>{Object.entries(r.projs).forEach(([p,c])=>{projAlloc[p]=(projAlloc[p]||0)+c;});});
  const projetosAtivos=Object.keys(projAlloc).length;
  const slotsProj=Object.values(projAlloc).reduce((a,b)=>a+b,0);
  // status dos projetos (a partir do cadastro), só projetos que tiveram alocação no período
  const stat={ "Em andamento":0,"Estabilização":0,"Concluído":0,"Não iniciado":0 };
  Object.keys(projAlloc).forEach(p=>{const cad=REG.projetos.find(x=>x.nome===p);const s=(cad&&cad.status)||"Não iniciado";if(stat[s]!=null)stat[s]++;else stat["Não iniciado"]++;});
  const gpsEnvolvidos=new Set(Object.keys(projAlloc).map(p=>{const cad=REG.projetos.find(x=>x.nome===p);return cad&&cad.gp;}).filter(Boolean)).size;
  // Sem alocação (cadastrados mas zerados no período)
  const semAloc=REG.projetos.filter(p=>!projAlloc[p.nome]).length;

  // Concentração
  const sortedByOcup=perAn.slice().sort((a,b)=>b.ocup-a.ocup);
  const topAn=sortedByOcup[0];
  const botAn=sortedByOcup[sortedByOcup.length-1];
  const sortedProj=Object.entries(projAlloc).sort((a,b)=>b[1]-a[1]);
  const topProj=sortedProj[0]; // [nome, slots]
  // Concentração: % dos slots de projeto que vão para os 3 maiores projetos
  const top3Pct=slotsProj>0?Math.round((sortedProj.slice(0,3).reduce((a,[,c])=>a+c,0))/slotsProj*100):0;
  // Concentração por analista: % dos slots ocupados que vão para o top-1 analista
  const ocupTotal=perAn.reduce((a,r)=>a+r.ocupado,0);
  const topAnConc=ocupTotal>0?Math.round((sortedByOcup[0].ocupado||0)/ocupTotal*100):0;

  // ---- Renderização ----
  const cardSpot=(label,nome,sub,accent)=>{
    if(!nome)return `<div class="kpi-card kpi-spotlight ${accent||''}"><div class="kpi-l">${label}</div><div class="mt" style="margin-top:18px;color:var(--faint)">—</div></div>`;
    return `<div class="kpi-card kpi-spotlight ${accent||''}"><div class="kpi-l">${label}</div>
      <div class="who"><span class="av" style="background:${colorFor(nome)}">${(nome[0]||'?').toUpperCase()}</span>
      <div><div class="nm">${enc(nome)}</div><div class="mt">${enc(sub||'')}</div></div></div></div>`;
  };

  // ---- Gráficos SVG ----
  // 1) Pizza: mix das 5 categorias de atividade
  const mixData=[
    ["Implantação", tot.proj,  "#E55810"],
    ["Discovery",   tot.dsc,   "#9C4520"],
    ["Service",     tot.svc,   "#6D5A2C"],
    ["Interna",     tot.rot+tot.intn, "#A66A2C"],
    ["Ausência",    tot.aus,   "#8a8a8a"],
    ["Livre",       tot.livre, "#b5b5b5"],
    ["Vazio",       tot.vazio, "#cccccc"],
  ].filter(d=>d[1]>0);
  const mixTotal=mixData.reduce((a,b)=>a+b[1],0);
  const pieSVG=()=>{
    if(!mixTotal)return '<div style="text-align:center;color:var(--faint);padding:30px 0">Sem dados.</div>';
    const cx=90,cy=90,r=78,r2=44; let acc=0; const paths=[];
    mixData.forEach(([,v,col])=>{
      const a0=acc/mixTotal*2*Math.PI - Math.PI/2;
      const a1=(acc+v)/mixTotal*2*Math.PI - Math.PI/2;
      const large=v/mixTotal>0.5?1:0;
      const x0=cx+r*Math.cos(a0), y0=cy+r*Math.sin(a0);
      const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
      const x2=cx+r2*Math.cos(a1),y2=cy+r2*Math.sin(a1);
      const x3=cx+r2*Math.cos(a0),y3=cy+r2*Math.sin(a0);
      paths.push(`<path d="M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r2},${r2} 0 ${large} 0 ${x3},${y3} Z" fill="${col}" stroke="#fff" stroke-width="1.5"/>`);
      acc+=v;
    });
    return `<svg viewBox="0 0 180 180" style="width:100%;max-width:200px;display:block;margin:0 auto">
      ${paths.join("")}
      <text x="90" y="86" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="22" fill="#1c1b18">${ocupMedia}%</text>
      <text x="90" y="104" text-anchor="middle" font-size="10" font-weight="700" fill="#6b6b6b" letter-spacing="1">OCUPAÇÃO</text>
    </svg>`;
  };
  const pieLegend=mixData.map(([lb,v,col])=>{const pct=Math.round(v/mixTotal*100);return `<div class="it"><span class="sw" style="background:${col}"></span>${lb} · ${v} (${pct}%)</div>`;}).join("");

  // 2) Barras horizontais: ocupação por analista (top 12, ordenado desc)
  const barsTop=sortedByOcup.slice(0,12);
  const bars=barsTop.map(r=>{
    const cls=r.ocup>=85?"hot":r.ocup>=60?"warm":"";
    return `<div class="bar-row"><div class="nm" title="${enc(r.nome)}">${enc(r.nome)}</div>
      <div class="track"><div class="fill ${cls}" style="width:${Math.max(2,r.ocup)}%"></div></div>
      <div class="pct">${r.ocup}%</div></div>`;
  }).join("") || '<div style="text-align:center;color:var(--faint);padding:20px 0">Sem analistas no escopo.</div>';

  // Pré-cálculos para Indicadores Operacionais (fora do template para isolar erros)
  let kpiAderencia="—", kpiAtrasados=0, kpiProximos=0, kpiRealizados=0, kpiNoPrazo=0, kpiPendObs=0;
  // Métricas detalhadas para a aba Go-Lives
  let glStats=null;
  try{
    const impl=(REG.projetos||[]).filter(p=>p.tipo==="implantacao"||!p.tipo);
    const comGl=impl.filter(p=>p.goLivePrevisto||p.goLiveAjustado||p.goLiveRealizado||p.goLiveSituacao||p.goLiveModalidade);
    const realizados=impl.filter(p=>p.goLiveRealizado);
    const noPrazo=realizados.filter(p=>{ if(!p.goLivePrevisto&&!p.goLiveAjustado)return true; const base=p.goLiveAjustado||p.goLivePrevisto; return p.goLiveRealizado<=base; });
    kpiAderencia = realizados.length?Math.round(noPrazo.length/realizados.length*100):0;
    kpiRealizados = realizados.length; kpiNoPrazo = noPrazo.length;
    const hojeISO=toISO(new Date());
    // Considera previsto OU ajustado como referência para vencimento
    const refDate=(p)=>p.goLiveAjustado||p.goLivePrevisto||"";
    kpiAtrasados=impl.filter(p=>!p.goLiveRealizado&&refDate(p)&&refDate(p)<hojeISO).length;
    kpiProximos=impl.filter(p=>!p.goLiveRealizado&&refDate(p)&&refDate(p)>=hojeISO).length;

    // ---- ESTATÍSTICAS PRA ABA GO-LIVES ----
    // Slip realizado vs (ajustado || previsto): >0 = atraso, <0 = adiantamento, =0 = no prazo
    const slips=[]; // dias
    const slipDetalhe=[]; // {projeto, slip, baseline, real, gp, modal}
    realizados.forEach(p=>{
      const base=p.goLiveAjustado||p.goLivePrevisto;
      if(!base)return;
      const s=Math.round((parseISO(p.goLiveRealizado)-parseISO(base))/86400000);
      slips.push(s);
      slipDetalhe.push({projeto:p.nome,slip:s,baseline:base,real:p.goLiveRealizado,gp:p.gp||"—",modal:p.goLiveModalidade||"—",sit:p.goLiveSituacao||"Realizado"});
    });
    // Replanejamentos: projetos com ajustado diferente do previsto
    const replanejados=impl.filter(p=>p.goLivePrevisto&&p.goLiveAjustado&&p.goLiveAjustado!==p.goLivePrevisto);
    const slipsPlanejamento=replanejados.map(p=>Math.round((parseISO(p.goLiveAjustado)-parseISO(p.goLivePrevisto))/86400000));

    // Estatísticas dos slips de execução (realizado vs baseline)
    const avg=arr=>arr.length?(arr.reduce((a,b)=>a+b,0)/arr.length):0;
    const median=arr=>{if(!arr.length)return 0;const s=[...arr].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;};
    const slipMed=Math.round(median(slips));
    const slipAvg=Math.round(avg(slips));
    const slipMin=slips.length?Math.min(...slips):0;
    const slipMax=slips.length?Math.max(...slips):0;
    const noPrazoStrict=slips.filter(s=>s===0).length; // exatamente na data
    const adiantados=slips.filter(s=>s<0).length;
    const atrasados1a7=slips.filter(s=>s>=1&&s<=7).length;
    const atrasados8a30=slips.filter(s=>s>=8&&s<=30).length;
    const atrasadosMais30=slips.filter(s=>s>30).length;

    // Distribuição por mês (últimos 6 meses) — quantidade realizada por mês
    const hoje=new Date();
    const buckets=[]; // [{label, ano, mes, realizados, previstos, atrasoMedio}]
    for(let i=5;i>=0;i--){
      const ref=new Date(hoje.getFullYear(),hoje.getMonth()-i,1);
      buckets.push({label:["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][ref.getMonth()]+"/"+String(ref.getFullYear()).slice(2), ano:ref.getFullYear(), mes:ref.getMonth(), realizados:0, previstos:0, slipMed:0, slips:[]});
    }
    impl.forEach(p=>{
      if(p.goLiveRealizado){
        const d=parseISO(p.goLiveRealizado);
        buckets.forEach(b=>{if(d.getFullYear()===b.ano&&d.getMonth()===b.mes){b.realizados++; const base=p.goLiveAjustado||p.goLivePrevisto; if(base){b.slips.push(Math.round((d-parseISO(base))/86400000));}}});
      }
      const base=p.goLiveAjustado||p.goLivePrevisto;
      if(base && !p.goLiveRealizado){
        const d=parseISO(base);
        buckets.forEach(b=>{if(d.getFullYear()===b.ano&&d.getMonth()===b.mes)b.previstos++;});
      }
    });
    buckets.forEach(b=>{b.slipMed=Math.round(median(b.slips));});

    // Distribuição por situação
    const porSit={}; impl.forEach(p=>{const s=p.goLiveSituacao||(p.goLiveRealizado?"Realizado":"Planejado"); porSit[s]=(porSit[s]||0)+1;});
    // Distribuição por modalidade
    const porMod={}; impl.forEach(p=>{if(p.goLiveModalidade)porMod[p.goLiveModalidade]=(porMod[p.goLiveModalidade]||0)+1;});
    // Distribuição por GP (top 5)
    const porGp={};
    realizados.forEach(p=>{const g=p.gp||"—"; if(!porGp[g])porGp[g]={total:0,noPrazo:0,slips:[]}; porGp[g].total++; const base=p.goLiveAjustado||p.goLivePrevisto; if(base){const s=Math.round((parseISO(p.goLiveRealizado)-parseISO(base))/86400000); porGp[g].slips.push(s); if(s<=0)porGp[g].noPrazo++;}});
    const gpRanking=Object.entries(porGp).map(([g,d])=>({gp:g, total:d.total, noPrazo:d.noPrazo, aderencia:d.total?Math.round(d.noPrazo/d.total*100):0, slipMed:Math.round(median(d.slips))})).sort((a,b)=>b.total-a.total);

    // Próximos 30 dias
    const dataLim=toISO(addDays(new Date(),30));
    const proximos30=impl.filter(p=>!p.goLiveRealizado && refDate(p) && refDate(p)>=hojeISO && refDate(p)<=dataLim)
      .sort((a,b)=>refDate(a).localeCompare(refDate(b)));

    glStats={
      total:impl.length, comGl:comGl.length, realizados:realizados.length, noPrazo:noPrazo.length,
      pendentes:comGl.length-realizados.length,
      adiantados, noPrazoStrict, atrasados1a7, atrasados8a30, atrasadosMais30,
      slipMed, slipAvg, slipMin, slipMax,
      replanejados:replanejados.length, slipReplaneAvg:Math.round(avg(slipsPlanejamento)),
      buckets, porSit, porMod, gpRanking, proximos30, slipDetalhe, hojeISO
    };
  }catch(e){console.warn("[KPI] erro ao calcular Go-Live:",e);}
  try{
    const isoSet=new Set(dias.map(d=>toISO(d)));
    const exigeMap={}; (REG.atividades||[]).forEach(a=>{if(a.exigeObs)exigeMap[a.nome]=true;});
    Object.entries(DATA||{}).forEach(([k,r])=>{
      if(!r||r.feriado)return;
      const parts=k.split("__"); const an=parts[0], iso=parts[1];
      if(!ns.includes(an)||!isoSet.has(iso))return;
      if(r.obsPendente){kpiPendObs++;return;}
      if(exigeMap[r.atividade]&&(!r.obs||!String(r.obs).trim()))kpiPendObs++;
    });
  }catch(e){console.warn("[KPI] erro ao calcular pendências:",e);}
  const ackClass = (typeof kpiAderencia==="number") ? (kpiAderencia>=80?'accent-ok':kpiAderencia>=50?'accent-warn':'') : '';

  // ============= MÉTRICAS DETALHADAS =============
  // Janela do período anterior, mesma duração — usado nas variações (↑/↓)
  let totPrev=null, perAtvPrev={};
  try{
    const ndias=dias.length;
    if(ndias>0){
      const inicio=parseISO(toISO(dias[0])); const prevFim=addDays(inicio,-1); const prevIni=addDays(prevFim,-(ndias-1));
      const diasPrev=[]; for(let dt=new Date(prevIni); dt<=prevFim; dt=addDays(dt,1)){const w=dt.getDay(); if(w>=1&&w<=5)diasPrev.push(toISO(dt));}
      // Buckets agregados do período anterior
      totPrev={proj:0,dsc:0,svc:0,rot:0,intn:0,aus:0,livre:0,total:0};
      ns.forEach(an=>{ diasPrev.forEach(iso=>{ SLOTS.filter(s=>!s.lunch).forEach(s=>{
        totPrev.total++;
        const r=DATA[key(an,iso,s.id)];
        if(ehSlotLivre(r)){totPrev.livre++;return;}
        if(r.feriado){totPrev.aus++;return;}
        const c=categoria(r);
        if(c==="c-proj")totPrev.proj++;
        else if(c==="c-dsc")totPrev.dsc++;
        else if(c==="c-svc")totPrev.svc++;
        else if(c==="c-rot")totPrev.rot++;
        else if(c==="c-int")totPrev.intn++;
        else if(c==="c-aus")totPrev.aus++;
        // contagem por atividade
        if(r.atividade){perAtvPrev[r.atividade]=(perAtvPrev[r.atividade]||0)+1;}
      });});});
    }
  }catch(e){console.warn("[KPI] erro ao calcular período anterior:",e); totPrev=null;}

  // Função utilitária pra renderizar variação ↑/↓ %
  const variacao=(atual,anterior)=>{
    if(anterior==null) return "";
    if(anterior===0) return atual>0?'<span style="color:var(--ok);font-weight:700">↑ novo</span>':'';
    const pct=Math.round(((atual-anterior)/anterior)*100);
    if(pct===0) return '<span style="color:var(--muted);font-weight:700">= 0%</span>';
    const cor=pct>0?'var(--ok)':'#a33', seta=pct>0?'↑':'↓';
    return `<span style="color:${cor};font-weight:700">${seta} ${Math.abs(pct)}%</span>`;
  };

  // === Drill-down por tipo de atividade ===
  // Para cada tipo: total de slots, % no período, top 3 atividades, # analistas envolvidos, # projetos envolvidos
  const drillTipos = TIPOS_ATIVIDADE.map(t=>{
    const slotsTipo = (t.id==="implantacao")?tot.proj:(t.id==="discovery")?tot.dsc:(t.id==="service")?tot.svc:(t.id==="interna")?(tot.rot+tot.intn):(t.id==="ausencia")?tot.aus:0;
    const prevTipo = totPrev?((t.id==="implantacao")?totPrev.proj:(t.id==="discovery")?totPrev.dsc:(t.id==="service")?totPrev.svc:(t.id==="interna")?(totPrev.rot+totPrev.intn):(t.id==="ausencia")?totPrev.aus:0):null;
    // Atividades cadastradas deste tipo
    const ativsDoTipo=new Set((REG.atividades||[]).filter(a=>a.tipo===t.id).map(a=>a.nome));
    const isoSet=new Set(dias.map(d=>toISO(d)));
    const cntAtv={}; const ansSet=new Set(); const projSet=new Set();
    Object.entries(DATA).forEach(([k,r])=>{
      if(!r||r.feriado)return;
      const [an,iso,_s]=k.split("__");
      if(!ns.includes(an)||!isoSet.has(iso))return;
      if(!ativsDoTipo.has(r.atividade))return;
      cntAtv[r.atividade]=(cntAtv[r.atividade]||0)+1;
      ansSet.add(an);
      if(r.cliente && r.cliente!=="Livre")projSet.add(r.cliente);
    });
    const top3=Object.entries(cntAtv).sort((a,b)=>b[1]-a[1]).slice(0,3);
    return {id:t.id,nome:t.nome,icone:t.icone, slots:slotsTipo,prev:prevTipo, top3, analistas:ansSet.size, projetos:projSet.size};
  });
  const drillHTML = drillTipos.map(d=>{
    const pct = tot.total?Math.round(d.slots/tot.total*100):0;
    const topHTML = d.top3.length
      ? d.top3.map(([nome,c])=>`<div style="display:flex;justify-content:space-between;font-size:11.5px;padding:2px 0"><span style="color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px" title="${enc(nome)}">${enc(nome)}</span><b>${c}</b></div>`).join("")
      : '<div style="font-size:11px;color:var(--faint);font-style:italic">sem lançamentos</div>';
    const acc = d.id==="implantacao"?"accent-proj":d.id==="discovery"?"":d.id==="service"?"":d.id==="ausencia"?"accent-aus":"accent-rot";
    return `<div class="kpi-card ${acc}" style="display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div class="kpi-l">${d.icone} ${enc(d.nome)}</div>
        <div style="font-size:10.5px">${variacao(d.slots,d.prev)}</div>
      </div>
      <div style="display:flex;align-items:baseline;gap:8px">
        <div class="kpi-n">${d.slots}</div>
        <span style="color:var(--muted);font-size:12px">${pct}% · ${d.analistas} analista(s)${d.projetos?' · '+d.projetos+' projeto(s)':''}</span>
      </div>
      <div style="border-top:1px dashed var(--line);padding-top:6px;margin-top:2px">${topHTML}</div>
    </div>`;
  }).join("");

  // === Análise por atividade específica (granular) ===
  // Para cada atividade ATIVA: # slots no período, # analistas distintos, variação vs período anterior
  const perAtv={};
  const isoSet=new Set(dias.map(d=>toISO(d)));
  Object.entries(DATA).forEach(([k,r])=>{
    if(!r||r.feriado||!r.atividade)return;
    const [an,iso,_s]=k.split("__");
    if(!ns.includes(an)||!isoSet.has(iso))return;
    if(!perAtv[r.atividade])perAtv[r.atividade]={slots:0,analistas:new Set(),tipo:null};
    perAtv[r.atividade].slots++;
    perAtv[r.atividade].analistas.add(an);
    if(!perAtv[r.atividade].tipo){const a=atividadeObj(r.atividade); if(a)perAtv[r.atividade].tipo=a.tipo;}
  });
  const atvRows = Object.entries(perAtv).map(([nome,data])=>({nome,slots:data.slots,analistas:data.analistas.size,tipo:data.tipo||"",prev:perAtvPrev[nome]||0}))
    .sort((a,b)=>b.slots-a.slots);
  const tipoToColor={implantacao:'#E55810',discovery:'#9C4520',service:'#6D5A2C',interna:'#A66A2C',ausencia:'#8a8a8a'};
  const atvTableHTML = atvRows.length
    ? `<div style="max-height:340px;overflow:auto;border:1px solid var(--line);border-radius:var(--r-md);background:#fff">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead style="position:sticky;top:0;background:var(--paper);z-index:1">
            <tr style="text-align:left">
              <th style="padding:7px 10px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Atividade</th>
              <th style="padding:7px 10px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:right">Slots</th>
              <th style="padding:7px 10px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:right">Analistas</th>
              <th style="padding:7px 10px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:right">Tendência</th>
            </tr>
          </thead>
          <tbody>
            ${atvRows.map(r=>`<tr>
              <td style="padding:6px 10px;border-bottom:1px solid var(--line)"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${tipoToColor[r.tipo]||'#bbb'};vertical-align:middle;margin-right:7px"></span>${enc(r.nome)}</td>
              <td style="padding:6px 10px;border-bottom:1px solid var(--line);text-align:right;font-weight:700">${r.slots}</td>
              <td style="padding:6px 10px;border-bottom:1px solid var(--line);text-align:right;color:var(--muted)">${r.analistas}</td>
              <td style="padding:6px 10px;border-bottom:1px solid var(--line);text-align:right">${variacao(r.slots,r.prev)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`
    : '<div class="rep-empty">Sem lançamentos no período.</div>';

  // === Matriz Analista × Tipo (cruzada) ===
  // Cada linha = analista; colunas = % do tempo gasto em cada tipo
  const matrixRows = perAn.map(r=>{
    const trab=r.proj+r.dsc+r.svc+r.rot+r.intn;
    const tot2=trab+r.aus; // base = trabalhado + ausência (exclui livre/vazio)
    const pct=(n)=>tot2?Math.round(n/tot2*100):0;
    return {nome:r.nome, implantacao:pct(r.proj), discovery:pct(r.dsc), service:pct(r.svc), interna:pct(r.rot+r.intn), ausencia:pct(r.aus), slots:tot2};
  }).sort((a,b)=>b.slots-a.slots);
  // Helper de barra horizontal
  const matBar=(p,cor)=>p>0?`<div style="position:relative;width:100%;height:14px;background:#f5f5f5;border-radius:3px;overflow:hidden"><div style="position:absolute;left:0;top:0;height:100%;width:${p}%;background:${cor};opacity:.7"></div><div style="position:relative;font-size:10.5px;line-height:14px;text-align:center;font-weight:700;color:${p>30?'#fff':'#333'};mix-blend-mode:${p>30?'normal':'normal'}">${p}%</div></div>`:'<div style="font-size:10.5px;color:var(--faint);text-align:center">—</div>';
  const matrixHTML = matrixRows.length
    ? `<div style="overflow:auto;border:1px solid var(--line);border-radius:var(--r-md);background:#fff">
        <table style="width:100%;border-collapse:collapse;font-size:11.5px;min-width:600px">
          <thead style="position:sticky;top:0;background:var(--paper);z-index:1">
            <tr style="text-align:left">
              <th style="padding:7px 10px;border-bottom:1px solid var(--line);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">Analista</th>
              <th style="padding:7px 8px;border-bottom:1px solid var(--line);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);width:100px;text-align:center">🚀 Implantação</th>
              <th style="padding:7px 8px;border-bottom:1px solid var(--line);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);width:100px;text-align:center">🔍 Discovery</th>
              <th style="padding:7px 8px;border-bottom:1px solid var(--line);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);width:100px;text-align:center">🔧 Service</th>
              <th style="padding:7px 8px;border-bottom:1px solid var(--line);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);width:100px;text-align:center">🏢 Interna</th>
              <th style="padding:7px 8px;border-bottom:1px solid var(--line);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);width:100px;text-align:center">🌴 Ausência</th>
            </tr>
          </thead>
          <tbody>
            ${matrixRows.map(r=>`<tr>
              <td style="padding:6px 10px;border-bottom:1px solid var(--line);font-weight:600">${enc(r.nome)}</td>
              <td style="padding:5px 8px;border-bottom:1px solid var(--line)">${matBar(r.implantacao,tipoToColor.implantacao)}</td>
              <td style="padding:5px 8px;border-bottom:1px solid var(--line)">${matBar(r.discovery,tipoToColor.discovery)}</td>
              <td style="padding:5px 8px;border-bottom:1px solid var(--line)">${matBar(r.service,tipoToColor.service)}</td>
              <td style="padding:5px 8px;border-bottom:1px solid var(--line)">${matBar(r.interna,tipoToColor.interna)}</td>
              <td style="padding:5px 8px;border-bottom:1px solid var(--line)">${matBar(r.ausencia,tipoToColor.ausencia)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`
    : '<div class="rep-empty">Sem dados.</div>';

  // === Qualidade ===
  // % de slots com observação, taxa de pendência, slots de feriado automático
  let slotsComObs=0, slotsExigeObs=0, slotsTrabalhados=0;
  Object.entries(DATA).forEach(([k,r])=>{
    if(!r||r.feriado||!r.atividade)return;
    const [an,iso,_s]=k.split("__");
    if(!ns.includes(an)||!isoSet.has(iso))return;
    slotsTrabalhados++;
    if(r.obs && String(r.obs).trim())slotsComObs++;
    const a=atividadeObj(r.atividade);
    if(a&&a.exigeObs)slotsExigeObs++;
  });
  const pctComObs = slotsTrabalhados?Math.round(slotsComObs/slotsTrabalhados*100):0;
  const pctPendentes = slotsExigeObs?Math.round(kpiPendObs/slotsExigeObs*100):0;
  const days=dias.length;
  // Header da aba: linha com período e contagem
  const head=`<div class="rep-actions"><div class="left">Período: <b>${fmtDM(parseISO(kpiFrom))} – ${fmtDM(parseISO(kpiTo))}</b> · ${days} dia(s) útil(eis) · ${ns.length} analista(s)</div></div>`;

  // Templates por aba — cada tela aprofunda um eixo da análise
  const tplVisao = `${head}
    <div class="kpi-charts">
      <div class="kpi-chart"><h4>🥧 Mix de Atividades</h4>${pieSVG()}<div class="legend">${pieLegend}</div></div>
      <div class="kpi-chart"><h4>📊 Ocupação por Analista (Top ${barsTop.length})</h4>${bars}</div>
    </div>
    <!-- Resumo executivo: 1 card de cada eixo -->
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">⭐</span>Resumo Executivo<span style="font-size:11px;color:var(--fn-faint);font-weight:600;text-transform:none;letter-spacing:normal;margin-left:auto">métricas principais de cada aba</span></div>
      <div class="kpi-grid">
        <div class="kpi-card accent-${ocupMedia>=70?'ok':ocupMedia>=40?'warn':'bad'}">
          <div class="kpi-l">Ocupação média</div><div class="kpi-n">${ocupMedia}<span class="unit">%</span></div>
          <div class="kpi-sub">${tot.ocupado} de ${baseUtil} slots úteis</div>
        </div>
        <div class="kpi-card accent-info"><div class="kpi-l">Analistas no escopo</div><div class="kpi-n">${ns.length}</div><div class="kpi-sub">${days} dia(s) úteis</div></div>
        <div class="kpi-card accent-proj"><div class="kpi-l">Projetos ativos</div><div class="kpi-n">${projetosAtivos}</div><div class="kpi-sub">Com alocação no período</div></div>
        <div class="kpi-card ${ackClass}"><div class="kpi-l">Aderência Go-Live</div><div class="kpi-n">${kpiAderencia}<span class="unit">%</span></div><div class="kpi-sub">${kpiNoPrazo} de ${kpiRealizados} no prazo</div></div>
        ${plan?`<div class="kpi-card ${_adAccent(plan.aderencia)}"><div class="kpi-l">Aderência ao plano</div><div class="kpi-n">${plan.aderencia==null?"—":plan.aderencia+'<span class="unit">%</span>'}</div><div class="kpi-sub">${plan.confirmado} de ${plan.prev} previstos confirmados</div></div>`:""}
        <div class="kpi-card ${kpiAtrasados>0?'accent-warn':'accent-ok'}"><div class="kpi-l">Go-Lives atrasados</div><div class="kpi-n">${kpiAtrasados}</div><div class="kpi-sub">Pendentes vencidos</div></div>
        <div class="kpi-card ${pctComObs>=60?'accent-ok':pctComObs>=30?'accent-warn':'accent-bad'}"><div class="kpi-l">Documentação</div><div class="kpi-n">${pctComObs}<span class="unit">%</span></div><div class="kpi-sub">Slots com observação</div></div>
        <div class="kpi-card ${kpiPendObs>0?'accent-warn':'accent-ok'}"><div class="kpi-l">Obs. pendentes</div><div class="kpi-n">${kpiPendObs}</div><div class="kpi-sub">A regularizar</div></div>
        <div class="kpi-card ${topAnConc>=25?'accent-warn':'accent-ok'}"><div class="kpi-l">Concentração Top-Analista</div><div class="kpi-n">${topAnConc}<span class="unit">%</span></div><div class="kpi-sub">do esforço total</div></div>
      </div>
    </div>
    <div style="font-size:12.5px;color:var(--fn-faint);text-align:center;padding:14px 8px;border-top:1px dashed var(--line);margin-top:6px">Clique em uma aba acima para aprofundar cada tema.</div>`;

  const tplCapacidade = `${head}
    <div class="kpi-charts">
      <div class="kpi-chart"><h4>🥧 Mix de Atividades</h4>${pieSVG()}<div class="legend">${pieLegend}</div></div>
      <div class="kpi-chart"><h4>📊 Ocupação por Analista (Top ${barsTop.length})</h4>${bars}</div>
    </div>
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">⚡</span>Capacidade & Ocupação</div>
      <div class="kpi-grid">
        <div class="kpi-card accent-${ocupMedia>=70?"ok":ocupMedia>=40?"warn":"bad"}">
          <div class="kpi-l">Ocupação média</div><div class="kpi-n">${ocupMedia}<span class="unit">%</span></div>
          <div class="kpi-sub">${tot.ocupado} de ${baseUtil} slots úteis</div>
          <div class="ribbon ${ocupMedia>=70?"r-ok":ocupMedia>=40?"r-warn":"r-bad"}">${ocupMedia>=70?"BOM":ocupMedia>=40?"ATENÇÃO":"BAIXO"}</div>
        </div>
        <div class="kpi-card accent-info"><div class="kpi-l">Analistas no escopo</div><div class="kpi-n">${ns.length}</div><div class="kpi-sub">${kpiScope==="todos"?"Todos visíveis":"Filtro aplicado"}</div></div>
        <div class="kpi-card accent-analysis"><div class="kpi-l">Dias úteis</div><div class="kpi-n">${days}</div><div class="kpi-sub">Seg–Sex no período</div></div>
        <div class="kpi-card accent-info"><div class="kpi-l">Slots totais</div><div class="kpi-n">${tot.total}</div><div class="kpi-sub">${ns.length} × ${days} × 6 slots</div></div>
        <div class="kpi-card accent-ok"><div class="kpi-l">Slots ocupados</div><div class="kpi-n">${tot.ocupado}</div><div class="kpi-sub">Projeto + Rotina + Interna</div></div>
        <div class="kpi-card accent-warn"><div class="kpi-l">Livres + vazios</div><div class="kpi-n">${tot.livre+tot.vazio}</div><div class="kpi-sub">${tot.livre} marcados como livre, ${tot.vazio} sem registro</div></div>
      </div>
    </div>
    ${plan?`<div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">🎯</span>Previsto × Realizado (aderência ao plano)</div>
      <div class="kpi-grid">
        <div class="kpi-card accent-info"><div class="kpi-l">Previsto</div><div class="kpi-n">${plan.prev}</div><div class="kpi-sub">slots planejados no período</div></div>
        <div class="kpi-card accent-ok"><div class="kpi-l">Confirmado</div><div class="kpi-n">${plan.confirmado}</div><div class="kpi-sub">realizado = previsto</div></div>
        <div class="kpi-card ${plan.conflito>0?"accent-bad":"accent-ok"}"><div class="kpi-l">Conflito</div><div class="kpi-n">${plan.conflito}</div><div class="kpi-sub">realizado em outro projeto</div></div>
        <div class="kpi-card accent-warn"><div class="kpi-l">Não realizado</div><div class="kpi-n">${plan.naoRealizado}</div><div class="kpi-sub">previsto sem realizado</div></div>
        <div class="kpi-card ${_adAccent(plan.aderencia)}"><div class="kpi-l">Aderência</div><div class="kpi-n">${plan.aderencia==null?"—":plan.aderencia+'<span class="unit">%</span>'}</div><div class="kpi-sub">confirmado ÷ previsto</div><div class="ribbon ${plan.aderencia==null?"":plan.aderencia>=85?"r-ok":plan.aderencia>=60?"r-warn":"r-bad"}">${plan.aderencia==null?"":plan.aderencia>=85?"BOM":plan.aderencia>=60?"ATENÇÃO":"BAIXO"}</div></div>
        <div class="kpi-card accent-analysis"><div class="kpi-l">Extra (fora do plano)</div><div class="kpi-n">${plan.extra}</div><div class="kpi-sub">realizado sem previsto</div></div>
      </div>
    </div>`:""}
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">🎯</span>Mix de Atividades</div>
      <div class="kpi-grid">
        <div class="kpi-card accent-proj"><div class="kpi-l">Implantação</div><div class="kpi-n">${tot.proj}</div><div class="kpi-sub">${tot.total?Math.round(tot.proj/tot.total*100):0}% dos slots totais</div></div>
        <div class="kpi-card" style="border-left:3px solid var(--dsc)"><div class="kpi-l">Discovery</div><div class="kpi-n">${tot.dsc}</div><div class="kpi-sub">Mapeamento de processos</div></div>
        <div class="kpi-card" style="border-left:3px solid var(--svc)"><div class="kpi-l">Service</div><div class="kpi-n">${tot.svc}</div><div class="kpi-sub">Atendimento pós-Go Live</div></div>
        <div class="kpi-card accent-rot"><div class="kpi-l">Internas (rotina+cap.)</div><div class="kpi-n">${tot.rot+tot.intn}</div><div class="kpi-sub">Daily, Capacitação, RH…</div></div>
        <div class="kpi-card accent-aus"><div class="kpi-l">Ausências</div><div class="kpi-n">${tot.aus}</div><div class="kpi-sub">Férias, atestado, feriado${tot.feriadoAuto?" · "+tot.feriadoAuto+" de feriado":""}</div></div>
        <div class="kpi-card"><div class="kpi-l">Slots livres</div><div class="kpi-n">${tot.livre}</div><div class="kpi-sub">Marcados como Livre</div></div>
        <div class="kpi-card"><div class="kpi-l">Sem registro</div><div class="kpi-n">${tot.vazio}</div><div class="kpi-sub">Slots em branco</div></div>
      </div>
    </div>`;

  const tplAtividades = `${head}
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">📂</span>Detalhamento por Tipo de Atividade${totPrev?` <span style="font-size:11px;color:var(--fn-faint);font-weight:600;text-transform:none;letter-spacing:normal;margin-left:auto">↑↓ vs período anterior</span>`:""}</div>
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">${drillHTML}</div>
    </div>
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">🏷️</span>Ranking de Atividades<span style="font-size:11px;color:var(--fn-faint);font-weight:600;text-transform:none;letter-spacing:normal;margin-left:auto">${atvRows.length} atividade(s) com lançamento</span></div>
      ${atvTableHTML}
    </div>
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">📊</span>Distribuição por Analista × Tipo<span style="font-size:11px;color:var(--fn-faint);font-weight:600;text-transform:none;letter-spacing:normal;margin-left:auto">% do tempo trabalhado de cada analista</span></div>
      ${matrixHTML}
    </div>`;

  const tplProjetos = `${head}
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">📌</span>Indicadores Operacionais</div>
      <div class="kpi-grid">
        <div class="kpi-card ${ackClass}"><div class="kpi-l">Aderência Go-Live</div><div class="kpi-n">${kpiAderencia}<span class="unit">%</span></div><div class="kpi-sub">${kpiNoPrazo} de ${kpiRealizados} realizados no prazo</div></div>
        <div class="kpi-card ${kpiAtrasados>0?"accent-warn":""}"><div class="kpi-l">Go-Lives atrasados</div><div class="kpi-n">${kpiAtrasados}</div><div class="kpi-sub">Previsto já passou, não realizado</div></div>
        <div class="kpi-card"><div class="kpi-l">Próximos Go-Lives</div><div class="kpi-n">${kpiProximos}</div><div class="kpi-sub">Agendados, pendentes</div></div>
        <div class="kpi-card ${kpiPendObs>0?"accent-warn":"accent-ok"}"><div class="kpi-l">Obs. pendentes</div><div class="kpi-n">${kpiPendObs}</div><div class="kpi-sub">Slots que exigem observação sem texto</div></div>
      </div>
    </div>
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">🚀</span>Carteira de Projetos</div>
      <div class="kpi-grid">
        <div class="kpi-card accent-proj"><div class="kpi-l">Projetos ativos</div><div class="kpi-n">${projetosAtivos}</div><div class="kpi-sub">Com alocação no período</div></div>
        <div class="kpi-card"><div class="kpi-l">Slots em projeto</div><div class="kpi-n">${slotsProj}</div><div class="kpi-sub">${tot.proj===slotsProj?"✓ Bate com Mix":"Atenção: divergência"}</div></div>
        <div class="kpi-card"><div class="kpi-l">Em andamento</div><div class="kpi-n">${stat["Em andamento"]}</div><div class="kpi-sub">Projetos ativos</div></div>
        <div class="kpi-card accent-warn"><div class="kpi-l">Em estabilização</div><div class="kpi-n">${stat["Estabilização"]}</div><div class="kpi-sub">Próximos do GO LIVE</div></div>
        <div class="kpi-card accent-ok"><div class="kpi-l">Concluídos</div><div class="kpi-n">${stat["Concluído"]}</div><div class="kpi-sub">Ainda recebendo slots</div></div>
        <div class="kpi-card accent-info"><div class="kpi-l">GPs envolvidos</div><div class="kpi-n">${gpsEnvolvidos}</div><div class="kpi-sub">Gerentes ativos no período</div></div>
        <div class="kpi-card accent-aus"><div class="kpi-l">Sem alocação</div><div class="kpi-n">${semAloc}</div><div class="kpi-sub">Cadastrados sem slots no período</div></div>
      </div>
    </div>`;

  const tplQualidade = `${head}
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">⚠️</span>Concentração de Risco</div>
      <div class="kpi-grid">
        ${cardSpot("Analista mais carregado", topAn&&topAn.nome, topAn?`${topAn.ocup}% de ocupação · ${topAn.ocupado} slots`:"", topAn&&topAn.ocup>=85?"accent-warn":"")}
        ${cardSpot("Analista mais ocioso",   botAn&&botAn.nome, botAn?`${botAn.ocup}% de ocupação · ${botAn.livre+botAn.vazio} slots livres`:"", botAn&&botAn.ocup<40?"accent-aus":"")}
        ${cardSpot("Projeto com mais alocação", topProj&&topProj[0], topProj?`${topProj[1]} slots no período`:"", "accent-proj")}
        <div class="kpi-card ${top3Pct>=70?"accent-warn":""}"><div class="kpi-l">Concentração Top-3 projetos</div><div class="kpi-n">${top3Pct}<span class="unit">%</span></div><div class="kpi-sub">${top3Pct>=70?"⚠️ Esforço muito concentrado":"Distribuição saudável"}</div></div>
        <div class="kpi-card ${topAnConc>=25?"accent-warn":""}"><div class="kpi-l">Top analista concentra</div><div class="kpi-n">${topAnConc}<span class="unit">%</span></div><div class="kpi-sub">do esforço total da equipe</div></div>
        <div class="kpi-card ${semAloc>=5?"accent-aus":""}"><div class="kpi-l">Projetos esquecidos</div><div class="kpi-n">${semAloc}</div><div class="kpi-sub">${semAloc>=5?"⚠️ Vários sem movimento":"Quantidade aceitável"}</div></div>
      </div>
    </div>
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">✅</span>Qualidade da Operação</div>
      <div class="kpi-grid">
        <div class="kpi-card ${pctComObs>=60?"accent-ok":pctComObs>=30?"accent-warn":"accent-bad"}"><div class="kpi-l">Slots com observação</div><div class="kpi-n">${pctComObs}<span class="unit">%</span></div><div class="kpi-sub">${slotsComObs} de ${slotsTrabalhados} slots trabalhados</div></div>
        <div class="kpi-card ${pctPendentes>=30?"accent-warn":pctPendentes>0?"":"accent-ok"}"><div class="kpi-l">Pendência em obrigatórias</div><div class="kpi-n">${pctPendentes}<span class="unit">%</span></div><div class="kpi-sub">${kpiPendObs} de ${slotsExigeObs} slots que exigem observação</div></div>
        <div class="kpi-card accent-aus"><div class="kpi-l">Slots de feriado automático</div><div class="kpi-n">${tot.feriadoAuto||0}</div><div class="kpi-sub">Vindos da propagação de feriados</div></div>
        <div class="kpi-card accent-info"><div class="kpi-l">Total trabalhado</div><div class="kpi-n">${slotsTrabalhados}</div><div class="kpi-sub">Slots com atividade real lançada</div></div>
      </div>
    </div>`;

  // ===== Template: Go-Lives (aba executiva dedicada) =====
  const gl = glStats || {total:0,comGl:0,realizados:0,noPrazo:0,pendentes:0,adiantados:0,noPrazoStrict:0,atrasados1a7:0,atrasados8a30:0,atrasadosMais30:0,slipMed:0,slipAvg:0,slipMin:0,slipMax:0,replanejados:0,slipReplaneAvg:0,buckets:[],porSit:{},porMod:{},gpRanking:[],proximos30:[],slipDetalhe:[]};
  const _fmtDia=iso=>{try{const d=parseISO(iso);return fmtDM(d)+"/"+d.getFullYear();}catch(e){return iso;}};
  const _slipColor=s=>s==null?"var(--fn-faint)":(s>7?"#DC2626":(s>0?"#F59E0B":(s===0?"#14B8A6":"#3B82F6")));
  const _slipLabel=s=>s==null?"—":(s===0?"no prazo":(s>0?`+${s}d`:`${s}d`));

  // Barras horizontais da distribuição de slip por faixa
  const totalFaixas = gl.adiantados+gl.noPrazoStrict+gl.atrasados1a7+gl.atrasados8a30+gl.atrasadosMais30;
  const _barFaixa=(label,val,cor)=>{const pct=totalFaixas?Math.round(val/totalFaixas*100):0;return `
    <div style="display:flex;align-items:center;gap:9px;font-size:12px;margin-bottom:5px">
      <div style="width:160px;color:var(--fn-muted);font-weight:500">${label}</div>
      <div style="flex:1;height:18px;background:#f1f3f7;border-radius:4px;overflow:hidden;position:relative">
        <div style="position:absolute;left:0;top:0;height:100%;width:${pct}%;background:${cor};opacity:.85"></div>
        <div style="position:relative;line-height:18px;text-align:center;font-size:10.5px;font-weight:700;color:${pct>30?'#fff':'#333'}">${val} ${val>0?`(${pct}%)`:''}</div>
      </div>
    </div>`;};

  // Mini-gráfico de barras por mês (últimos 6)
  const maxMes = Math.max(1, ...gl.buckets.map(b=>Math.max(b.realizados,b.previstos)));
  const _bucketCell=(b)=>{
    const hR = b.realizados/maxMes*60;
    const hP = b.previstos/maxMes*60;
    const slipCor = _slipColor(b.slipMed);
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;padding:0 4px;border-right:1px dashed var(--line);min-width:60px">
      <div style="font-size:10px;color:var(--fn-muted);font-weight:700;margin-bottom:4px">${b.realizados+b.previstos}</div>
      <div style="display:flex;align-items:flex-end;gap:3px;height:60px">
        <div title="Realizados em ${b.label}: ${b.realizados}" style="width:14px;height:${Math.max(2,hR)}px;background:#14B8A6;border-radius:2px 2px 0 0"></div>
        <div title="Previstos em ${b.label}: ${b.previstos}" style="width:14px;height:${Math.max(2,hP)}px;background:#F26C20;border-radius:2px 2px 0 0;opacity:.7"></div>
      </div>
      <div style="font-size:10px;margin-top:6px;color:var(--fn-faint);font-weight:600">${b.label}</div>
      ${b.realizados>0?`<div style="font-size:9.5px;color:${slipCor};font-weight:700;margin-top:2px">med ${_slipLabel(b.slipMed)}</div>`:''}
    </div>`;
  };
  const grafBuckets = `<div style="display:flex;background:#fff;border:1px solid var(--line);border-radius:var(--r-md);padding:14px 8px">
    ${gl.buckets.map(_bucketCell).join("")}
  </div>
  <div style="display:flex;gap:14px;font-size:11px;color:var(--fn-muted);margin-top:8px;padding-left:8px">
    <span style="display:inline-flex;align-items:center;gap:5px"><span style="width:11px;height:11px;background:#14B8A6;border-radius:2px"></span>Realizados</span>
    <span style="display:inline-flex;align-items:center;gap:5px"><span style="width:11px;height:11px;background:#F26C20;border-radius:2px;opacity:.7"></span>Previstos (pendentes)</span>
  </div>`;

  // Distribuição por situação/modalidade — chips
  const sitChips = Object.entries(gl.porSit||{}).sort((a,b)=>b[1]-a[1]).map(([s,c])=>{
    const cor={"Planejado":"#5a6478","Confirmado":"#3B82F6","Em execução":"#F26C20","Realizado":"#14B8A6","Adiado":"#F59E0B","Cancelado":"#DC2626"}[s]||"#5a6478";
    return `<div class="kpi-chip" style="border-left:3px solid ${cor}">${enc(s)} <b>${c}</b></div>`;
  }).join(" ");
  const modChips = Object.entries(gl.porMod||{}).sort((a,b)=>b[1]-a[1]).map(([m,c])=>{
    const ico={"Remoto":"💻","Presencial":"🏢","Híbrido":"🔀"}[m]||"";
    return `<div class="kpi-chip">${ico} ${enc(m)} <b>${c}</b></div>`;
  }).join(" ");

  // Ranking GP (top 5)
  const gpRankRows = (gl.gpRanking||[]).slice(0,5).map(g=>`<tr>
    <td><b>${enc(g.gp)}</b></td>
    <td class="num">${g.total}</td>
    <td class="num">${g.noPrazo}</td>
    <td class="num"><span style="color:${g.aderencia>=80?'#14B8A6':g.aderencia>=50?'#F59E0B':'#DC2626'};font-weight:700">${g.aderencia}%</span></td>
    <td class="num"><span style="color:${_slipColor(g.slipMed)};font-weight:700">${_slipLabel(g.slipMed)}</span></td>
  </tr>`).join("");

  // Próximos 30 dias
  const prox30Rows = (gl.proximos30||[]).slice(0,10).map(p=>{
    const ref=p.goLiveAjustado||p.goLivePrevisto;
    const dias=Math.round((parseISO(ref)-parseISO(gl.hojeISO))/86400000);
    const urg=dias===0?'<span style="color:#F26C20;font-weight:700">hoje</span>':(dias<=7?`<span style="color:#F59E0B;font-weight:700">em ${dias}d</span>`:`<span style="color:var(--fn-muted)">em ${dias}d</span>`);
    return `<tr>
      <td><b>${enc(p.nome)}</b></td>
      <td class="mono">${_fmtDia(ref)}</td>
      <td>${enc(p.gp||"—")}</td>
      <td>${enc(p.goLiveModalidade||"—")}</td>
      <td>${urg}</td>
    </tr>`;
  }).join("");

  // Top atrasos (slip detalhe sorted desc por slip)
  const topAtrasos = (gl.slipDetalhe||[]).filter(s=>s.slip>0).sort((a,b)=>b.slip-a.slip).slice(0,5);
  const topAdiant = (gl.slipDetalhe||[]).filter(s=>s.slip<0).sort((a,b)=>a.slip-b.slip).slice(0,5);

  const tplGoLives = `${head}
    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">🚀</span>Panorama Geral</div>
      <div class="kpi-grid">
        <div class="kpi-card accent-info"><div class="kpi-l">Projetos com Go-Live</div><div class="kpi-n">${gl.comGl}</div><div class="kpi-sub">de ${gl.total} projetos de implantação</div></div>
        <div class="kpi-card accent-ok"><div class="kpi-l">Realizados</div><div class="kpi-n">${gl.realizados}</div><div class="kpi-sub">${gl.comGl?Math.round(gl.realizados/gl.comGl*100):0}% concluídos</div></div>
        <div class="kpi-card accent-warn"><div class="kpi-l">Pendentes</div><div class="kpi-n">${gl.pendentes}</div><div class="kpi-sub">Aguardando execução</div></div>
        <div class="kpi-card accent-${gl.realizados&&kpiAderencia>=80?'ok':kpiAderencia>=50?'warn':'bad'}"><div class="kpi-l">Aderência</div><div class="kpi-n">${kpiAderencia}<span class="unit">%</span></div><div class="kpi-sub">${gl.noPrazo} no prazo de ${gl.realizados}</div></div>
        <div class="kpi-card ${kpiAtrasados>0?'accent-bad':'accent-ok'}"><div class="kpi-l">Atrasados (vencidos)</div><div class="kpi-n">${kpiAtrasados}</div><div class="kpi-sub">Sem realização, data vencida</div></div>
        <div class="kpi-card accent-analysis"><div class="kpi-l">Replanejados</div><div class="kpi-n">${gl.replanejados}</div><div class="kpi-sub">${gl.replanejados?`média ${gl.slipReplaneAvg>=0?'+':''}${gl.slipReplaneAvg}d vs original`:'Sem ajustes'}</div></div>
      </div>
    </div>

    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">📐</span>Dispersão entre Previsto e Realizado<span style="font-size:11px;color:var(--fn-faint);font-weight:600;text-transform:none;letter-spacing:normal;margin-left:auto">considera ajustado como baseline quando existe</span></div>
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
        <div class="kpi-card" style="border-left:3px solid #3B82F6"><div class="kpi-l">Adiantados</div><div class="kpi-n" style="color:#3B82F6">${gl.adiantados}</div><div class="kpi-sub">Antes da data baseline</div></div>
        <div class="kpi-card accent-ok"><div class="kpi-l">Exatamente no prazo</div><div class="kpi-n">${gl.noPrazoStrict}</div><div class="kpi-sub">Slip = 0</div></div>
        <div class="kpi-card accent-warn"><div class="kpi-l">Atraso 1–7d</div><div class="kpi-n">${gl.atrasados1a7}</div><div class="kpi-sub">Pequeno deslize</div></div>
        <div class="kpi-card" style="border-left:3px solid #F59E0B"><div class="kpi-l">Atraso 8–30d</div><div class="kpi-n" style="color:#F59E0B">${gl.atrasados8a30}</div><div class="kpi-sub">Médio impacto</div></div>
        <div class="kpi-card accent-bad"><div class="kpi-l">Atraso 30+d</div><div class="kpi-n">${gl.atrasadosMais30}</div><div class="kpi-sub">Alto impacto</div></div>
      </div>
      ${totalFaixas?`<div style="margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:var(--r-md);padding:14px">
        <div style="font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint);margin-bottom:10px">Distribuição visual das ${totalFaixas} realizações com baseline</div>
        ${_barFaixa("⬅ Adiantados (slip&lt;0)",gl.adiantados,"#3B82F6")}
        ${_barFaixa("✓ No prazo (slip=0)",gl.noPrazoStrict,"#14B8A6")}
        ${_barFaixa("⚠ Atraso 1–7d",gl.atrasados1a7,"#F59E0B")}
        ${_barFaixa("⚠ Atraso 8–30d",gl.atrasados8a30,"#F59E0B")}
        ${_barFaixa("🔴 Atraso 30+d",gl.atrasadosMais30,"#DC2626")}
      </div>`:""}
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin-top:14px">
        <div class="kpi-card"><div class="kpi-l">Slip mediano</div><div class="kpi-n" style="color:${_slipColor(gl.slipMed)}">${_slipLabel(gl.slipMed)}</div><div class="kpi-sub">Metade ficou acima, metade abaixo</div></div>
        <div class="kpi-card"><div class="kpi-l">Slip médio</div><div class="kpi-n" style="color:${_slipColor(gl.slipAvg)}">${_slipLabel(gl.slipAvg)}</div><div class="kpi-sub">Média aritmética</div></div>
        <div class="kpi-card"><div class="kpi-l">Maior adiantamento</div><div class="kpi-n" style="color:#3B82F6">${gl.realizados?_slipLabel(gl.slipMin):'—'}</div><div class="kpi-sub">Caso mais antecipado</div></div>
        <div class="kpi-card"><div class="kpi-l">Maior atraso</div><div class="kpi-n" style="color:#DC2626">${gl.realizados?_slipLabel(gl.slipMax):'—'}</div><div class="kpi-sub">Caso mais atrasado</div></div>
      </div>
    </div>

    ${gl.buckets&&gl.buckets.some(b=>b.realizados+b.previstos>0)?`<div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">📅</span>Evolução nos Últimos 6 Meses</div>
      ${grafBuckets}
    </div>`:""}

    <div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">🏷️</span>Distribuição</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px">
        <div style="background:#fff;border:1px solid var(--line);border-radius:var(--r-md);padding:14px">
          <div style="font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint);margin-bottom:10px">Por situação</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${sitChips||'<span style="color:var(--fn-faint);font-size:12px">Sem dados</span>'}</div>
        </div>
        <div style="background:#fff;border:1px solid var(--line);border-radius:var(--r-md);padding:14px">
          <div style="font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint);margin-bottom:10px">Por modalidade</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${modChips||'<span style="color:var(--fn-faint);font-size:12px">Sem dados</span>'}</div>
        </div>
      </div>
    </div>

    ${gpRankRows?`<div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">👤</span>Ranking de GPs (top 5 por volume)</div>
      <div style="background:#fff;border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px">
          <thead style="background:var(--paper)">
            <tr style="text-align:left">
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint)">GP</th>
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint);text-align:right">Realizados</th>
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint);text-align:right">No prazo</th>
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint);text-align:right">Aderência</th>
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint);text-align:right">Slip mediano</th>
            </tr>
          </thead>
          <tbody>${gpRankRows}</tbody>
        </table>
      </div>
    </div>`:""}

    ${gl.proximos30.length?`<div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">⏰</span>Próximos 30 dias (top 10)</div>
      <div style="background:#fff;border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px">
          <thead style="background:var(--paper)">
            <tr style="text-align:left">
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint)">Projeto</th>
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint)">Data</th>
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint)">GP</th>
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint)">Modalidade</th>
              <th style="padding:9px 12px;border-bottom:1px solid var(--line);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fn-faint)">Urgência</th>
            </tr>
          </thead>
          <tbody>${prox30Rows}</tbody>
        </table>
      </div>
    </div>`:""}

    ${topAtrasos.length||topAdiant.length?`<div class="kpi-group">
      <div class="kpi-group-title"><span class="ico">🎯</span>Destaques</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px">
        ${topAtrasos.length?`<div style="background:#fff;border:1px solid var(--line);border-radius:var(--r-md);padding:14px">
          <div style="font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#DC2626;margin-bottom:10px">⚠ Top 5 maiores atrasos</div>
          ${topAtrasos.map(s=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line);font-size:12.5px">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px" title="${enc(s.projeto)}"><b>${enc(s.projeto)}</b><br><span style="color:var(--fn-faint);font-size:10.5px">${enc(s.gp)}</span></span>
            <span style="color:#DC2626;font-weight:700">+${s.slip}d</span>
          </div>`).join("")}
        </div>`:""}
        ${topAdiant.length?`<div style="background:#fff;border:1px solid var(--line);border-radius:var(--r-md);padding:14px">
          <div style="font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#3B82F6;margin-bottom:10px">⬅ Top 5 maiores adiantamentos</div>
          ${topAdiant.map(s=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line);font-size:12.5px">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px" title="${enc(s.projeto)}"><b>${enc(s.projeto)}</b><br><span style="color:var(--fn-faint);font-size:10.5px">${enc(s.gp)}</span></span>
            <span style="color:#3B82F6;font-weight:700">${s.slip}d</span>
          </div>`).join("")}
        </div>`:""}
      </div>
    </div>`:""}
  `;

  const html = (kpiTab==="capacidade") ? tplCapacidade
             : (kpiTab==="atividades") ? tplAtividades
             : (kpiTab==="projetos")   ? tplProjetos
             : (kpiTab==="golives")    ? tplGoLives
             : (kpiTab==="qualidade")  ? tplQualidade
             : tplVisao;
  el("kpiBody").innerHTML=html;
}

/* ===================== IMPORTAR (Ações → Importar) ===================== */
// Colunas esperadas no arquivo (baseado na aba "Base de Dados" da planilha original)
/* =================== IMPORTADOR (estrito) ===================
   Regras:
   - Formato canônico fixo: colunas "analista" "data" "slot" "atividade" "projeto" "observacao"
   - NUNCA cria cadastros automaticamente. Linha cujo analista/atividade/projeto
     não esteja cadastrado é rejeitada e listada no relatório de erros.
   - Valida coerência projeto×atividade (tipos têm que bater).
   - Atividade "exige observação" sem texto → marca como pendente (avisa, mas importa).
*/
const IMP_COLS_CANONICAS = ["analista","data","slot","atividade","projeto","observacao"];
const IMP_COLS_OBRIGATORIAS = ["analista","data","slot","atividade"];

function renderImporter(){ lucideRefresh(); /* Fase 4: auto-cobre icones em qualquer caminho */
  const b=el("actBody");
  if(!isAdmin()){b.innerHTML='<div class="rep-empty">Apenas administradores podem importar.</div>';return;}
  if(typeof XLSX==="undefined"){b.innerHTML='<div class="rep-empty">Biblioteca de leitura de Excel não carregou. Verifique sua conexão e recarregue (Ctrl+Shift+R).</div>';return;}

  b.innerHTML=`
    <div class="hint" style="margin-bottom:14px"><b>Importação estrita</b> — o arquivo deve conter as colunas canônicas <b>analista</b>, <b>data</b>, <b>slot</b>, <b>atividade</b>, <b>projeto</b> e <b>observacao</b>. O sistema <b>não cria cadastros automaticamente</b>: linhas com analista, projeto ou atividade não cadastrados são rejeitadas. <button class="btn sm" id="impTemplate" style="margin-left:6px"><i data-lucide="download"></i>Baixar template</button></div>

    <label class="imp-drop" id="impDrop">
      <div class="ico"><i data-lucide="upload-cloud" style="width:38px;height:38px;color:var(--orange)"></i></div>
      <div class="tt">Solte o arquivo aqui ou clique para escolher</div>
      <div class="st">.xlsx, .xls, .csv ou .tsv</div>
      <input type="file" id="impFile" accept=".xlsx,.xls,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/tab-separated-values">
    </label>

    <details style="margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:var(--r-md);padding:0">
      <summary style="cursor:pointer;padding:11px 14px;font-size:12.5px;font-weight:700;color:var(--muted);list-style:none">📖 Como o arquivo deve ser preenchido</summary>
      <div style="padding:0 16px 14px;font-size:12.5px;line-height:1.6;color:#444">
        <p>O arquivo precisa ter <b>6 colunas</b> com os nomes abaixo (em qualquer ordem, mas com os nomes exatos):</p>
        <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:12px">
          <thead><tr style="background:var(--paper)"><th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--line)">Coluna</th><th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--line)">Obrigatória?</th><th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--line)">Conteúdo</th></tr></thead>
          <tbody>
            <tr><td style="padding:5px 10px"><code>analista</code></td><td style="padding:5px 10px">Sim</td><td style="padding:5px 10px">Nome exato como cadastrado</td></tr>
            <tr><td style="padding:5px 10px"><code>data</code></td><td style="padding:5px 10px">Sim</td><td style="padding:5px 10px"><code>DD/MM/AAAA</code> ou <code>AAAA-MM-DD</code></td></tr>
            <tr><td style="padding:5px 10px"><code>slot</code></td><td style="padding:5px 10px">Sim</td><td style="padding:5px 10px"><code>Slot1</code> a <code>Slot6</code></td></tr>
            <tr><td style="padding:5px 10px"><code>atividade</code></td><td style="padding:5px 10px">Sim</td><td style="padding:5px 10px">Nome exato de uma atividade <b>cadastrada e ativa</b></td></tr>
            <tr><td style="padding:5px 10px"><code>projeto</code></td><td style="padding:5px 10px">Condicional</td><td style="padding:5px 10px">Obrigatório se a atividade for <b>Discovery</b> ou <b>Implantação</b>. Em Interna/Service/Ausência, deixe vazio.</td></tr>
            <tr><td style="padding:5px 10px"><code>observacao</code></td><td style="padding:5px 10px">Condicional</td><td style="padding:5px 10px">Atividades que exigem observação sem texto são importadas, mas marcadas como pendentes.</td></tr>
          </tbody>
        </table>
        <p><b>Regras de coerência:</b></p>
        <ul style="padding-left:22px;margin:4px 0">
          <li>Atividade Discovery → projeto de tipo Discovery ou Implantação (todo projeto de implantação passa pela fase de Discovery).</li>
          <li>Atividade Implantação → projeto deve ser de tipo Implantação.</li>
          <li>Atividade Interna/Service/Ausência → projeto deve vir vazio.</li>
          <li>Nada é criado automaticamente. Se o nome não bate, a linha é rejeitada.</li>
        </ul>
        <p style="color:var(--muted)">Baixe o template no botão acima — vem com os cabeçalhos certos e linhas-exemplo.</p>
      </div>
    </details>

    <div id="impArea"></div>`;

  const drop=el("impDrop"), file=el("impFile");
  drop.addEventListener("click",()=>file.click());
  ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("hover");}));
  ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("hover");}));
  drop.addEventListener("drop",e=>{const f=e.dataTransfer.files[0]; if(f)readImportFile(f);});
  file.addEventListener("change",e=>{const f=e.target.files[0]; if(f)readImportFile(f);});
  el("impTemplate").addEventListener("click",baixarTemplateImport);
  if(_impSrc)renderImportSteps();
}

function baixarTemplateImport(){
  const linhas=[
    IMP_COLS_CANONICAS.join(","),
    "Marlon,02/06/2026,Slot2,Mapeamento de processos,Discovery,Workshop com transporte primário",
    "Marlon,02/06/2026,Slot3,Daily,,",
    "Lucivandro,02/06/2026,Slot4,Go Live,Cliente X,Validação final pré-Go Live",
    "Lucivandro,02/06/2026,Slot5,Férias,,",
  ];
  const blob=new Blob(["\ufeff"+linhas.join("\r\n")],{type:"text/csv;charset=utf-8"});
  const u=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=u; a.download="template_importacao_alocacoes.csv"; a.click();
  setTimeout(()=>URL.revokeObjectURL(u),1500);
}

function readImportFile(file){
  const ext=(file.name.split(".").pop()||"").toLowerCase();
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      let rows=[], headers=[];
      if(ext==="csv"||ext==="tsv"){
        const sep=ext==="tsv"?"\t":detectSep(ev.target.result);
        const parsed=parseDelimited(ev.target.result,sep);
        headers=parsed.headers; rows=parsed.rows;
      }else{
        const data=new Uint8Array(ev.target.result);
        const wb=XLSX.read(data,{type:"array",cellDates:true});
        const sheetName = wb.SheetNames[0];
        const ws=wb.Sheets[sheetName];
        const json=XLSX.utils.sheet_to_json(ws,{defval:"",raw:true});
        rows=json;
        headers=json.length?Object.keys(json[0]):[];
      }
      _impSrc={filename:file.name,rows,headers};
      renderImportSteps();
    }catch(e){
      console.error("[Importar] falha ao ler:",e);
      alert("Não consegui ler o arquivo: "+e.message);
    }
  };
  reader.onerror=()=>alert("Erro ao ler o arquivo.");
  if(ext==="csv"||ext==="tsv")reader.readAsText(file,"utf-8"); else reader.readAsArrayBuffer(file);
}
function normHeader(s){return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function detectSep(txt){const l=(txt||"").split("\n").slice(0,5).join("\n"); const c=(l.match(/,/g)||[]).length, s=(l.match(/;/g)||[]).length; return s>c?";":",";}
function parseDelimited(text,sep){
  const lines=text.replace(/\r/g,"").split("\n").filter(l=>l.length);
  if(!lines.length)return {headers:[],rows:[]};
  const parseLine=(line)=>{const out=[];let cur="",inQ=false;for(let i=0;i<line.length;i++){const ch=line[i];
    if(inQ){if(ch=='"'){if(line[i+1]=='"'){cur+='"';i++;}else inQ=false;}else cur+=ch;}
    else{if(ch=='"')inQ=true;else if(ch===sep){out.push(cur);cur="";}else cur+=ch;}} out.push(cur); return out;};
  const headers=parseLine(lines[0]).map(s=>s.trim());
  const rows=lines.slice(1).map(l=>{const vals=parseLine(l);const obj={};headers.forEach((h,i)=>obj[h]=(vals[i]||"").trim());return obj;});
  return {headers,rows};
}

function _mapHeaders(headers){
  const map={};
  IMP_COLS_CANONICAS.forEach(c=>{
    const m=headers.find(h=>normHeader(h)===c);
    if(m)map[c]=m;
  });
  return map;
}

function renderImportSteps(){ lucideRefresh(); /* Fase 4: auto-cobre icones em qualquer caminho */
  const a=el("impArea");
  const headers=_impSrc.headers;
  const mapping=_mapHeaders(headers);
  const faltam=IMP_COLS_OBRIGATORIAS.filter(c=>!mapping[c]);
  if(faltam.length){
    a.innerHTML=`<div class="imp-stat danger" style="grid-column:1/-1;margin-top:14px">
      <div class="n">⚠️</div>
      <div class="l">Colunas obrigatórias não encontradas: <b>${faltam.join(", ")}</b><br>
      <span style="font-weight:500;font-size:12px">O arquivo precisa ter os cabeçalhos canônicos: ${IMP_COLS_CANONICAS.join(", ")}</span></div>
      </div>
      <div style="margin-top:12px"><button class="btn" id="impReset"><i data-lucide="rotate-ccw"></i>Escolher outro arquivo</button></div>`;
    el("impReset").addEventListener("click",()=>{_impSrc=null;_impPreview=null;renderImporter();});
    return;
  }
  const v=validateRowsStrict(_impSrc.rows, mapping);
  _impPreview=v;
  const totalLinhas=_impSrc.rows.length;
  a.innerHTML=`
    <div class="imp-step">
      <h3><span class="num">1</span>Arquivo carregado</h3>
      <div style="font-size:13px"><b>${enc(_impSrc.filename)}</b> · ${totalLinhas.toLocaleString("pt-BR")} linhas · ${headers.length} colunas</div>
      <div class="imp-detail" style="margin-top:8px">Cabeçalhos detectados: ${headers.map(h=>'<b>'+enc(h)+'</b>').join(" · ")}</div>
    </div>
    <div class="imp-step">
      <h3><span class="num">2</span>Validação contra cadastros</h3>
      <div class="imp-stats">
        <div class="imp-stat ok"><div class="n">${v.ok.length.toLocaleString("pt-BR")}</div><div class="l">Linhas válidas</div></div>
        ${v.warnings.length?`<div class="imp-stat warn"><div class="n">${v.warnings.length.toLocaleString("pt-BR")}</div><div class="l">Avisos (importarão)</div></div>`:""}
        ${v.bad.length?`<div class="imp-stat danger"><div class="n">${v.bad.length.toLocaleString("pt-BR")}</div><div class="l">Linhas rejeitadas</div></div>`:""}
      </div>
      ${v.bad.length?`<div style="margin-top:14px">
        <div style="font-size:11.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Erros agrupados por motivo</div>
        <div class="imp-detail">${_resumoErros(v.bad)}</div>
        <div style="margin-top:8px"><button class="btn sm" id="impExportErr"><i data-lucide="file-down"></i>Exportar relatório de erros (.csv)</button></div>
      </div>`:""}
      ${v.warnings.length?`<div style="margin-top:14px">
        <div style="font-size:11.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Avisos (importam, mas atenção)</div>
        <div class="imp-detail">${_resumoErros(v.warnings)}</div>
      </div>`:""}
    </div>
    ${v.ok.length?`<div class="imp-step">
      <h3><span class="num">3</span>Confirmação</h3>
      <div class="hint" style="margin-bottom:10px">${v.ok.length.toLocaleString("pt-BR")} alocação(ões) válida(s) serão aplicadas em modo <b>mesclar</b>. ${v.sobrescreve?`<span style="color:var(--warn)">⚠ ${v.sobrescreve.toLocaleString("pt-BR")} slot(s) já preenchido(s) serão sobrescritos.</span>`:""}</div>
      <div style="margin-top:6px"><div style="font-size:11.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Prévia das primeiras 10 linhas válidas</div>
      <div class="imp-preview"><table><thead><tr><th>analista</th><th>data</th><th>slot</th><th>atividade</th><th>projeto</th><th>obs.</th></tr></thead>
      <tbody>${v.ok.slice(0,10).map(r=>`<tr><td>${enc(r.analista)}</td><td>${r.iso}</td><td>${r.slot}</td><td>${enc(r.atividade)}</td><td>${enc(r.projeto||'—')}</td><td>${r.obs?'📝':(r.obsPendente?'<span title="atividade exige observação, importará marcada como pendente" style="color:var(--warn)">⚠</span>':'—')}</td></tr>`).join("")}</tbody></table></div></div>
    </div>`:""}
    <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:14px">
      ${v.ok.length?`<button class="btn primary" id="impCommit"><i data-lucide="check-check"></i>Importar ${v.ok.length.toLocaleString("pt-BR")} alocação(ões) válida(s)</button>`:""}
      <button class="btn" id="impReset"><i data-lucide="rotate-ccw"></i>Cancelar / escolher outro arquivo</button>
    </div>`;
  if(v.ok.length)el("impCommit").addEventListener("click",commitImportStrict);
  if(v.bad.length)el("impExportErr").addEventListener("click",()=>exportarRelatorioErros(v.bad,v.warnings));
  el("impReset").addEventListener("click",()=>{_impSrc=null;_impPreview=null;renderImporter();});
}

function _resumoErros(lista){
  const grupos={};
  lista.forEach(e=>{const k=e.categoria||"Erro";(grupos[k]=grupos[k]||[]).push(e);});
  return Object.entries(grupos).map(([cat,arr])=>{
    const ex=arr.slice(0,5).map(e=>'linha '+e.linha+': '+enc(e.motivo)).join("<br>");
    return `<div style="margin-bottom:9px"><b style="color:${arr[0].nivel==='warn'?'var(--warn)':'#a33'}">${enc(cat)}</b> (${arr.length} ocorrência${arr.length>1?'s':''})<br><span style="font-size:11.5px;color:var(--muted)">${ex}${arr.length>5?'<br>...e mais '+(arr.length-5):''}</span></div>`;
  }).join("");
}

function exportarRelatorioErros(bad,warnings){
  const linhas=[["linha","categoria","nivel","motivo","analista","data","slot","atividade","projeto","observacao"].join(",")];
  [...bad,...warnings].forEach(e=>{
    const d=e.dados||{};
    const cells=[e.linha,e.categoria||"",e.nivel||"erro",e.motivo||"",
      d.analista||"",d.data||"",d.slot||"",d.atividade||"",d.projeto||"",d.observacao||""];
    linhas.push(cells.map(c=>{const s=String(c||"").replace(/"/g,'""');return /[,;\n"]/.test(s)?'"'+s+'"':s;}).join(","));
  });
  const blob=new Blob(["\ufeff"+linhas.join("\r\n")],{type:"text/csv;charset=utf-8"});
  const u=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=u; a.download="erros_importacao.csv"; a.click();
  setTimeout(()=>URL.revokeObjectURL(u),1500);
}

function validateRowsStrict(rows, mapping){
  const ok=[], bad=[], warnings=[];
  const norm=s=>String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const idxAn={}; REG.analistas.forEach(a=>{if(isAtivo(a))idxAn[norm(a.nome)]=a.nome;});
  const idxProj={}; (REG.projetos||[]).forEach(p=>{if(isAtivo(p))idxProj[norm(p.nome)]=p;});
  const idxAtv={}; (REG.atividades||[]).forEach(a=>{if(a.ativo!==false)idxAtv[norm(a.nome)]=a;});
  const slotsValidos=new Set(SLOTS.filter(s=>!s.lunch).map(s=>s.id.toLowerCase()));
  let sobrescreve=0;

  rows.forEach((r,i)=>{
    const linha=i+2;
    const get=(c)=>String(r[mapping[c]]||"").trim();
    const dados={
      analista:get("analista"), data:r[mapping.data], slot:get("slot"),
      atividade:get("atividade"), projeto:get("projeto"), observacao:get("observacao")
    };
    if(!dados.analista){bad.push({linha,categoria:"Analista vazio",nivel:"erro",motivo:"campo analista vazio",dados});return;}
    const analNome=idxAn[norm(dados.analista)];
    if(!analNome){bad.push({linha,categoria:"Analista não cadastrado",nivel:"erro",motivo:`"${dados.analista}" não existe (ou está inativo) no cadastro`,dados});return;}
    const iso=parseImpDate(dados.data);
    if(!iso){bad.push({linha,categoria:"Data inválida",nivel:"erro",motivo:`"${dados.data}" não é uma data válida`,dados});return;}
    const slotMatch=String(dados.slot||"").match(/(\d)/);
    const slotId=slotMatch?("Slot"+slotMatch[1]):"";
    if(!slotsValidos.has(slotId.toLowerCase())){bad.push({linha,categoria:"Slot inválido",nivel:"erro",motivo:`"${dados.slot}" não é um slot válido (use Slot1..Slot6)`,dados});return;}
    if(!dados.atividade){bad.push({linha,categoria:"Atividade vazia",nivel:"erro",motivo:"campo atividade vazio",dados});return;}
    // Caso especial: "Livre" não é uma atividade cadastrada — é o placeholder semântico de slot vazio.
    // Importamos como slot livre (atividade="Livre", cliente="Livre"), sem exigir cadastro.
    if(norm(dados.atividade)==="livre"){
      if(DATA[key(analNome,iso,slotId)])sobrescreve++;
      ok.push({analista:analNome, iso, slot:slotId, atividade:"Livre", projeto:"Livre", obs:dados.observacao||"", obsPendente:false, exigeObs:false});
      return;
    }
    const atvObj=idxAtv[norm(dados.atividade)];
    if(!atvObj){bad.push({linha,categoria:"Atividade não cadastrada",nivel:"erro",motivo:`"${dados.atividade}" não existe (ou está inativa) no cadastro`,dados});return;}
    const exigeProjeto = (atvObj.tipo==="discovery" || atvObj.tipo==="implantacao");
    let projNome="";
    if(exigeProjeto){
      if(!dados.projeto){bad.push({linha,categoria:"Projeto obrigatório",nivel:"erro",motivo:`atividade "${atvObj.nome}" (${atvObj.tipo}) exige projeto`,dados});return;}
      const proj=idxProj[norm(dados.projeto)];
      if(!proj){bad.push({linha,categoria:"Projeto não cadastrado",nivel:"erro",motivo:`"${dados.projeto}" não existe (ou está inativo) no cadastro de projetos`,dados});return;}
      const tipoProj=proj.tipo||"implantacao";
      if(!projetoCompativelComAtividade(tipoProj, atvObj.tipo)){
        bad.push({linha,categoria:"Incoerência projeto × atividade",nivel:"erro",motivo:`projeto "${proj.nome}" é tipo ${tipoProj}, incompatível com atividade ${atvObj.tipo}`,dados});
        return;
      }
      projNome=proj.nome;
    }else{
      if(dados.projeto)warnings.push({linha,categoria:"Projeto ignorado",nivel:"warn",motivo:`atividade "${atvObj.nome}" (${atvObj.tipo}) não usa projeto — campo será ignorado`,dados});
      projNome="Livre";
    }
    let obsPendente=false;
    if(atvObj.exigeObs && !dados.observacao){
      warnings.push({linha,categoria:"Observação pendente",nivel:"warn",motivo:`atividade "${atvObj.nome}" exige observação — slot importará marcado como pendente`,dados});
      obsPendente=true;
    }
    if(DATA[key(analNome,iso,slotId)])sobrescreve++;
    ok.push({analista:analNome, iso, slot:slotId, atividade:atvObj.nome, projeto:projNome, obs:dados.observacao||"", obsPendente, exigeObs:!!atvObj.exigeObs});
  });
  return {ok,bad,warnings,sobrescreve};
}

function parseImpDate(v){
  if(v==null||v==="")return null;
  if(v instanceof Date){return toISO(v);}
  if(typeof v==="number" && isFinite(v)){
    const d=new Date(Date.UTC(1899,11,30)+v*86400000); return toISO(d);
  }
  const s=String(v).trim();
  let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m)return `${m[1]}-${m[2]}-${m[3]}`;
  m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if(m){const a=m[3].length===2?("20"+m[3]):m[3]; return `${a}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;}
  return null;
}

/* ===== AUDITORIA — tela em Ações → Administração ===== */
let _auditCache=[];      // últimos eventos carregados
let _auditFilter="all";  // all | allocation | project | user | import | system
let _auditLimit=200;     // últimos N eventos
let _auditStarted=false; // listener iniciado uma vez por sessão

function renderAuditoria(){
  const b=el("actBody");
  if(!isAdmin()){b.innerHTML='<div class="empty-state">Apenas administradores podem ver a trilha de auditoria.</div>';return;}
  if(!_db){b.innerHTML='<div class="empty-state">Trilha de auditoria depende do Firebase configurado. Sem nuvem, as ações não são registradas.</div>';return;}

  // Carrega últimos eventos uma vez. A cada navegação na aba, recarrega.
  if(!_auditStarted){
    _auditStarted=true;
    _db.ref(AUDIT_PATH).orderByChild("ts").limitToLast(_auditLimit).on("value",snap=>{
      const arr=[]; snap.forEach(ch=>{arr.push(Object.assign({_id:ch.key},ch.val()));});
      _auditCache=arr.reverse(); // mais novo em cima
      if(actTab==="auditoria" && el("actOverlay").classList.contains("open"))renderAuditoria();
    },err=>{
      console.warn("[Auditoria] erro ao ler:",err);
      b.innerHTML='<div class="empty-state" style="color:#a33">Erro ao ler a trilha de auditoria: '+enc(err.message||err)+'</div>';
    });
  }

  // Filtros
  const filtered=_auditCache.filter(e=>{
    if(_auditFilter==="all")return true;
    if(_auditFilter==="allocation")return (e.kind||"").startsWith("allocation");
    if(_auditFilter==="project")  return (e.kind||"").startsWith("project");
    if(_auditFilter==="analyst")  return (e.kind||"").startsWith("analyst");
    if(_auditFilter==="user")     return (e.kind||"").startsWith("user");
    if(_auditFilter==="import")   return (e.kind||"").startsWith("import");
    return true;
  });

  // Contagem por categoria
  const c={all:_auditCache.length, allocation:0, project:0, analyst:0, user:0, import:0};
  _auditCache.forEach(e=>{const k=(e.kind||"").split(".")[0]; if(k in c)c[k]++;});

  const filtros=[
    ["all","Todos",c.all],
    ["allocation","Alocações",c.allocation],
    ["project","Projetos",c.project],
    ["analyst","Analistas",c.analyst],
    ["user","Usuários",c.user],
    ["import","Importações",c.import],
  ];

  const kindBadge=(k)=>{
    const grp=(k||"").split(".")[0];
    const palette={allocation:["#F26C20","#FFEFE5"],project:["#8B5CF6","#F5F3FF"],analyst:["#3B82F6","#EFF6FF"],user:["#14B8A6","#F0FDFA"],import:["#F59E0B","#FFFBEB"],system:["#64748B","#F8FAFC"]};
    const p=palette[grp]||palette.system;
    return `<span class="badge-small" style="color:${p[0]};background:${p[1]};border-color:transparent;font-weight:700;font-family:'IBM Plex Mono',monospace;font-size:10.5px">${enc(k||"—")}</span>`;
  };

  const rows = filtered.map(e=>{
    const when=_fmtLastSeen(e.ts);
    const detalhes=(e.before||e.after) ? `
      <details style="margin-top:6px">
        <summary style="cursor:pointer;font-size:10.5px;color:var(--fn-faint);font-weight:600">Ver alterações</summary>
        <div style="display:flex;gap:14px;margin-top:7px;font-size:11px;font-family:'IBM Plex Mono',monospace">
          ${e.before?`<div style="flex:1;min-width:0;background:#fef2f2;padding:7px 9px;border-radius:6px;border:1px solid #fecaca"><div style="color:#dc2626;font-weight:700;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px">Antes</div><pre style="white-space:pre-wrap;margin:0;color:#5a1010;font-size:10.5px">${enc(JSON.stringify(e.before,null,2))}</pre></div>`:""}
          ${e.after?`<div style="flex:1;min-width:0;background:#f0fdfa;padding:7px 9px;border-radius:6px;border:1px solid #99f6e4"><div style="color:#0d9488;font-weight:700;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px">Depois</div><pre style="white-space:pre-wrap;margin:0;color:#134e4a;font-size:10.5px">${enc(JSON.stringify(e.after,null,2))}</pre></div>`:""}
        </div>
      </details>` : "";
    return `<div style="padding:11px 13px;border-bottom:1px solid var(--line);background:#fff">
      <div style="display:flex;align-items:center;gap:9px;font-size:12.5px">
        ${kindBadge(e.kind)}
        <span style="font-weight:600;color:var(--fn-ink);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${enc(e.target||"—")}</span>
        <span style="font-size:11px;color:var(--fn-faint);white-space:nowrap">${when}</span>
      </div>
      <div style="font-size:11px;color:var(--fn-muted);margin-top:3px">
        <b>${enc(e.user||"?")}</b> (${enc(e.role||"?")})${e.source&&e.source!=="ui"?` · origem: <b>${enc(e.source)}</b>`:""}${e.note?` · ${enc(e.note)}`:""}
      </div>
      ${detalhes}
    </div>`;
  }).join("");

  b.innerHTML=`<div class="act-toolbar"><h3>Auditoria · trilha de alterações</h3>
    <button class="btn sm" id="auditExport"><i data-lucide="download"></i>Exportar CSV</button>
  </div>
  <div class="hint" style="margin-bottom:12px">Cada escrita relevante no sistema é registrada aqui com <b>quem fez · quando · valor antes · valor depois</b>. Mostrando os últimos <b>${_auditLimit}</b> eventos. Use os filtros abaixo para focar em uma categoria.</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${filtros.map(([id,lb,n])=>`<button class="btn sm ${id===_auditFilter?'primary':''}" data-auditfilter="${id}">${enc(lb)} <span style="opacity:.75;margin-left:5px">${n}</span></button>`).join("")}</div>
  ${rows||'<div class="empty-state">Nenhum evento registrado'+(_auditFilter!=="all"?" nesta categoria.":" ainda.")+'</div>'}`;

  b.querySelectorAll("[data-auditfilter]").forEach(btn=>btn.addEventListener("click",()=>{_auditFilter=btn.dataset.auditfilter;renderAuditoria();}));
  const btn=el("auditExport"); if(btn)btn.addEventListener("click",exportAuditoriaCSV);
  lucideRefresh();
}

function exportAuditoriaCSV(){
  if(!_auditCache.length){alert("Nada para exportar.");return;}
  const rows=_auditCache.map(e=>({
    timestamp:e.ts||"",
    usuario:e.user||"",
    perfil:e.role||"",
    evento:e.kind||"",
    alvo:e.target||"",
    origem:e.source||"",
    nota:e.note||"",
    antes:e.before?JSON.stringify(e.before):"",
    depois:e.after?JSON.stringify(e.after):""
  }));
  const cols=Object.keys(rows[0]);
  const csv=[cols.join(";")].concat(rows.map(r=>cols.map(c=>{
    let v=r[c]||""; v=String(v).replace(/"/g,'""');
    if(v.includes(";")||v.includes("\n")||v.includes('"'))v='"'+v+'"';
    return v;
  }).join(";"))).join("\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="ns-aloc-auditoria-"+(new Date().toISOString().slice(0,16).replace(/[:-]/g,""))+".csv";
  a.click(); URL.revokeObjectURL(a.href);
}

function commitImportStrict(){
  if(!_impPreview||!_impPreview.ok.length)return;
  const p=_impPreview;
  const msg = `Confirmar importação?\n\n• ${p.ok.length.toLocaleString("pt-BR")} alocação(ões) válida(s) serão inseridas\n• ${p.bad.length.toLocaleString("pt-BR")} linha(s) com erro serão IGNORADAS\n${p.warnings.length?`• ${p.warnings.length.toLocaleString("pt-BR")} aviso(s) ainda assim aplicado(s)\n`:""}${p.sobrescreve?`• ${p.sobrescreve.toLocaleString("pt-BR")} slot(s) existente(s) serão sobrescritos\n`:""}\nNenhum cadastro novo será criado.`;
  if(!confirm(msg))return;
  const agora=new Date().toISOString();
  const user=(_currentUser&&_currentUser.email)||"importação";
  p.ok.forEach(r=>{
    const reg={atividade:r.atividade, cliente:r.projeto};
    if(r.obs){reg.obs=r.obs; reg.obsAt=agora; reg.obsBy=user;}
    if(r.obsPendente)reg.obsPendente=true;
    DATA[key(r.analista,r.iso,r.slot)]=reg;
  });
  persist();
  renderConsultorSelect(); renderAll();
  audit("import.commit", "alocações em lote", null, {total:p.ok.length, ignoradas:p.bad.length, sobrescritos:p.sobrescreve||0, avisos:p.warnings.length}, {source:"import", note:"Importação de planilha"});
  alert(`✅ Importação concluída.\n\n• ${p.ok.length.toLocaleString("pt-BR")} alocação(ões) aplicada(s)\n• ${p.bad.length} linha(s) ignorada(s)\n${p.warnings.length?'• '+p.warnings.length+' aviso(s) (slots marcados como obs. pendente)':''}`);
  _impSrc=null; _impPreview=null;
  renderImporter();
}

function updateVersionLabel(){ const el2=el("footVersion"); if(el2)el2.textContent="v"+versaoAtual(); }

/* ===================== Esteira de Projetos ===================== */
let estView="dashboard", estSearch="", estFilterEtapa="", estFilterStatus="", estPeriodoDe="", estPeriodoAte="", estFiltroAplicado=false;

function podeEditarEsteira(){ return canEditAction("esteira"); }
function projetosImplantacao(){ return (REG.projetos||[]).filter(p=>p.tipo==="implantacao"||!p.tipo); }

// Etapa auto-derivada: a etapa mais avançada cuja data de início está preenchida.
// "" significa que nada foi iniciado.
function etapaAutoDe(p){
  let cur="";
  ETAPAS.forEach(e=>{
    const entrou = e.glPrev ? !!p.goLiveRealizado : !!p[e.field];
    if(entrou) cur=e.id;
  });
  return cur;
}
// Etapa efetiva: override manual (p.etapaAtual) tem prioridade; senão, automática.
function etapaEfetivaDe(p){
  if(p.etapaAtual && ETAPA_BY_ID[p.etapaAtual]) return p.etapaAtual;
  return etapaAutoDe(p);
}
function _estHoje(){ return toISO(new Date()); }
function _estFmt(iso){ if(!iso)return "—"; const d=parseISO(iso); return fmtDM(d)+"/"+d.getFullYear(); }
// baseline do Go-Live para cálculo de atraso
function _estGlBase(p){ return p.goLiveAjustado||p.goLivePrevisto||""; }
function _estGlAtrasado(p){ const b=_estGlBase(p); return !!b && !p.goLiveRealizado && b<_estHoje(); }

function openEsteira(){
  if(!canViewAction("esteira")){ alert("Você não tem acesso à Esteira de Projetos."); irPara("home"); return; }
  estView="dashboard"; estSearch=""; estFilterEtapa=""; estFilterStatus=""; estFiltroAplicado=false;
  if(!estPeriodoDe || !estPeriodoAte){ const h=new Date(); estPeriodoDe=toISO(h); estPeriodoAte=toISO(addDays(h,90)); }
  const se=el("estSearch"); if(se)se.value="";
  const ed=el("estPeriodoDe"); if(ed)ed.value=estPeriodoDe;
  const ea=el("estPeriodoAte"); if(ea)ea.value=estPeriodoAte;
  // popular filtros
  const fe=el("estFilterEtapa");
  if(fe)fe.innerHTML=`<option value="">Todas as etapas</option>`+ETAPAS.map(e=>`<option value="${e.id}">${e.label}</option>`).join("")+`<option value="_none">Não iniciado</option>`;
  const fs=el("estFilterStatus");
  if(fs)fs.innerHTML=`<option value="">Todas as situações</option>`+STATUSES.map(s=>`<option value="${enc(s)}">${enc(s)}</option>`).join("");
  el("estViews").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.ev==="dashboard"));
  el("esteiraOverlay").classList.add("open");
  renderEsteira();
}
function closeEsteira(){ const o=el("esteiraOverlay"); const was=o&&o.classList.contains("open"); if(o)o.classList.remove("open"); if(was) irPara("home"); }

function _projetoTemDataEsteiraNoPeriodo(p, de, ate){
  if(!de && !ate) return true;
  // Exceção (opção D): projeto ainda em etapa Discovery (ordem ≤ 0) nunca é escondido
  // pelo período — caso contrário sumiria por só ter datas no passado.
  const _ord = ETAPA_BY_ID[etapaEfetivaDe(p)] ? ETAPA_BY_ID[etapaEfetivaDe(p)].ordem : -1;
  if(_ord <= 0) return true;
  const datas=[];
  ESTEIRA_DATE_FIELDS.forEach(f=>{ if(p[f]) datas.push(p[f]); });
  if(p.goLivePrevisto) datas.push(p.goLivePrevisto);
  if(p.goLiveAjustado) datas.push(p.goLiveAjustado);
  if(p.goLiveRealizado) datas.push(p.goLiveRealizado);
  return datas.some(d=>(!de || d>=de) && (!ate || d<=ate));
}
function aplicarFiltroEsteira(){
  const de=el("estPeriodoDe"), ate=el("estPeriodoAte");
  estPeriodoDe = de && de.value || "";
  estPeriodoAte = ate && ate.value || "";
  if(!estPeriodoDe || !estPeriodoAte){ alert("Por favor, selecione as datas de início e fim da Esteira."); return; }
  if(estPeriodoDe > estPeriodoAte){ alert("A data inicial não pode ser maior que a data final."); return; }
  estFiltroAplicado = true;
  try{ _estPrefillRealizado(); }catch(e){ console.warn("[esteira] prefill:",e); }
  renderEsteira();
}

function esteiraFiltrados(){
  let arr=projetosImplantacao();
  const q=(estSearch||"").trim().toLowerCase();
  if(q){
    arr=arr.filter(p=>{
      const hay=[p.nome,p.gp,p.lider,p.segmentacao,(p.analistas||[]).join(" ")].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }
  if(estFilterEtapa){
    arr=arr.filter(p=>{ const eff=etapaEfetivaDe(p); return estFilterEtapa==="_none" ? eff==="" : eff===estFilterEtapa; });
  }
  if(estFilterStatus) arr=arr.filter(p=>(p.status||"")===estFilterStatus);
  arr=arr.filter(p=>_projetoTemDataEsteiraNoPeriodo(p, estPeriodoDe, estPeriodoAte));
  // ordena por etapa efetiva (mais avançado primeiro) e nome
  return arr.sort((a,b)=>{
    const oa=ETAPA_BY_ID[etapaEfetivaDe(a)]?ETAPA_BY_ID[etapaEfetivaDe(a)].ordem:-1;
    const ob=ETAPA_BY_ID[etapaEfetivaDe(b)]?ETAPA_BY_ID[etapaEfetivaDe(b)].ordem:-1;
    if(ob!==oa)return ob-oa;
    return (a.nome||"").localeCompare(b.nome||"","pt");
  });
}

function renderEsteira(){
  if(!estFiltroAplicado){ const b=el("estBody"); if(b) b.innerHTML = _htmlSobDemanda("Escolha o período e clique em <b>Aplicar Filtro</b> para carregar a Esteira de Projetos somente com os projetos do período selecionado."); lucideRefresh(); return; }
  if(estView==="dashboard"){ renderEsteiraDashboard(); }
  else if(estView==="painel"){ renderEsteiraPainel(); }
  else if(estView==="previsto"){ renderEsteiraPrevReal(); }
  else { renderEsteiraTabela(); }
  lucideRefresh();
}

function _estDateCell(p, field, extraCls=""){
  const v=p[field]||"";
  const editavel=podeEditarEsteira();
  if(!editavel) return `<td class="stage-c"><span class="est-ro ${v?'':'empty'}">${_estFmt(v)}</span></td>`;
  let cls="est-date"+(v?" filled":"")+(extraCls?(" "+extraCls):"");
  return `<td class="stage-c"><input type="date" class="${cls}" data-proj="${enc(p.nome)}" data-field="${field}" value="${enc(v)}"></td>`;
}

function _estEtapaSel(p){
  const editavel=podeEditarEsteira();
  const eff=etapaEfetivaDe(p);
  const effLabel = eff ? ETAPA_BY_ID[eff].label : "Não iniciado";
  const isAuto=!(p.etapaAtual&&ETAPA_BY_ID[p.etapaAtual]);
  if(!editavel){
    const cor = eff && ETAPA_BY_ID[eff].fase==="pos" ? "var(--fn-teal)" : "var(--fn-orange)";
    return `<span class="est-stage-chip" style="border-color:${cor};color:${cor};background:#fff">${effLabel}${isAuto?'':' ·'}</span>`;
  }
  const opts=`<option value="">⟳ Automática · ${enc(effLabel)}</option>`+
    ETAPAS.map(e=>`<option value="${e.id}" ${(!isAuto&&p.etapaAtual===e.id)?'selected':''}>${e.label}</option>`).join("");
  return `<select class="est-sel etapa" data-proj="${enc(p.nome)}" data-kind="etapa">${opts}</select>`;
}
function _estStatusSel(p){
  const editavel=podeEditarEsteira();
  if(!editavel) return `<span class="est-ro">${enc(p.status||'—')}</span>`;
  return `<select class="est-sel" data-proj="${enc(p.nome)}" data-kind="status">${STATUSES.map(s=>`<option ${s===(p.status||'')?'selected':''}>${enc(s)}</option>`).join("")}</select>`;
}

function renderEsteiraTabela(){
  try{ _estPrefillRealizado(); }catch(e){}
  const arr=esteiraFiltrados();
  const body=el("estBody");
  if(!arr.length){ body.innerHTML=`<div class="est-empty"><i data-lucide="route" style="width:30px;height:30px;opacity:.4"></i><div style="margin-top:10px">Nenhum projeto de implantação encontrado com os filtros atuais.</div></div>`; lucideRefresh(); return; }
  const num=n=>`<span class="stage-num">${n}</span>`;
  const head=`<thead><tr>
    <th class="proj-h">Projeto</th>
    <th>Analistas</th>
    <th>Etapa atual</th>
    <th>Situação</th>
    <th class="stage-h">${num(1)}Discovery</th>
    <th class="stage-h">${num(2)}Cadastros básicos</th>
    <th class="stage-h">${num(3)}Logística</th>
    <th class="stage-h">${num(4)}Backoffice</th>
    <th class="stage-h gl-h">${num(5)}Go-Live previsto</th>
    <th class="stage-h gl-h">Go-Live realizado</th>
    <th class="stage-h">${num(6)}Hypercare</th>
    <th class="stage-h">${num(7)}Monitoramento</th>
    <th class="stage-h">${num(8)}Frota</th>
    <th class="stage-h">${num(9)}Sustentação</th>
  </tr></thead>`;
  const rows=arr.map(p=>{
    const ans=(p.analistas||[]);
    const anHtml = ans.length ? ans.map(a=>`<span class="est-an">${enc(a)}</span>`).join("") : `<span class="est-an none">sem analista</span>`;
    const late=_estGlAtrasado(p);
    const glPrevCell=_estDateCell(p,"goLivePrevisto", late?"gl-late":"");
    const glRealCell=_estDateCell(p,"goLiveRealizado", p.goLiveRealizado?"gl-real":"");
    return `<tr data-proj="${enc(p.nome)}">
      <td class="proj-c"><div class="est-proj-name">${enc(p.nome)}</div><div class="est-proj-meta">${enc(p.segmentacao||'')}${p.gp?' · '+enc(p.gp):''}</div></td>
      <td><div class="est-analistas">${anHtml}</div></td>
      <td>${_estEtapaSel(p)}</td>
      <td>${_estStatusSel(p)}</td>
      ${_estDateCell(p,"dtDiscovery")}
      ${_estDateCell(p,"dtCadBasicos")}
      ${_estDateCell(p,"dtLogistica")}
      ${_estDateCell(p,"dtBackoffice")}
      ${glPrevCell}
      ${glRealCell}
      ${_estDateCell(p,"dtHypercare")}
      ${_estDateCell(p,"dtMonitoramento")}
      ${_estDateCell(p,"dtFrota")}
      ${_estDateCell(p,"dtSustentacao")}
    </tr>`;
  }).join("");
  const ro = podeEditarEsteira() ? "" : `<div style="padding:8px 20px;background:var(--fn-blue-bg);color:#1e40af;font-size:12px;border-bottom:1px solid var(--fn-blue-bd)">Você está em <b>somente leitura</b> — apenas perfis de gestão editam a esteira.</div>`;
  body.innerHTML=ro+`<div class="est-scroll"><table class="est-table">${head}<tbody>${rows}</tbody></table></div>`;
  bindEsteiraInputs();
  lucideRefresh();
}

/* ===================== Esteira · pré-preenchimento das datas REALIZADAS (Fase 3b) =====================
   Para cada projeto × etapa, calcula a data da 1ª alocação real (DATA) cuja atividade pertence
   à etapa e grava no campo de data da etapa (dt da etapa / goLiveRealizado) — SOMENTE quando está
   VAZIO. Nunca sobrescreve uma data já preenchida (manual ou previamente derivada). Idempotente:
   roda na abertura da Esteira e ao renderizar a Tabela; só persiste quando muda algo.
   Obs.: respeita a janela de leitura — etapas fora dos meses carregados preenchem ao carregar. */
function _estPrefillRealizado(){
  const atvEtapa={}; (REG.atividades||[]).forEach(a=>{ if(a.etapa) atvEtapa[a.nome]=a.etapa; });
  if(!Object.keys(atvEtapa).length) return 0;
  const realPE={};
  Object.keys(DATA).forEach(k=>{
    const r=DATA[k]; if(!r||!r.cliente||!r.atividade) return;
    const et=atvEtapa[r.atividade]; if(!et) return;
    const m=k.match(/\d{4}-\d{2}-\d{2}/); if(!m) return; const iso=m[0];
    const proj=_normProj(r.cliente);
    (realPE[proj]=realPE[proj]||{});
    if(!realPE[proj][et]||iso<realPE[proj][et]) realPE[proj][et]=iso;
  });
  let mudou=0;
  (REG.projetos||[]).forEach(p=>{
    if(!p||!p.nome) return;
    const rp=realPE[_normProj(p.nome)]; if(!rp) return;
    ETAPAS.forEach(e=>{
      const iso=rp[e.id]; if(!iso) return;
      if(!p[e.field]){ p[e.field]=iso; mudou++; }   // só preenche vazio
    });
  });
  if(mudou){ saveReg(); try{ audit("esteira.prefill.realizado", "(auto)", null, {campos:mudou}); }catch(e){} }
  return mudou;
}

/* ===================== Esteira · Previsto × Realizado por etapa (Fase 3) =====================
   Tabela DERIVADA, em tempo real (somente leitura). Por etapa:
   - Previsto: data de início da PRIMEIRA atividade prevista cuja `etapa` é a etapa (de p.previstoLinhas).
   - Realizado: data da PRIMEIRA alocação real (DATA) deste projeto cuja atividade pertence à etapa.
   - Go-Live: usa os campos dedicados (previsto = ajustado||previsto; realizado = goLiveRealizado).
   Desvio = realizado − previsto (dias corridos). NÃO grava nos campos dt* (isso é a Fase 3b). */
function _estPRdesvio(prev, real){
  if(!prev||!real) return null;
  return Math.round((parseISO(real)-parseISO(prev))/86400000);
}
function _estPRcell(prev, real){
  const pf=prev?_estFmt(prev):"—", rf=real?_estFmt(real):"—";
  const dv=_estPRdesvio(prev,real);
  let chip="";
  if(dv!=null){
    const cls = dv<=0?"pr-ok" : (dv<=7?"pr-warn":"pr-bad");
    const txt = dv===0?"no prazo" : (dv>0?`+${dv}d`:`${dv}d`);
    chip=`<span class="pr-chip ${cls}">${txt}</span>`;
  } else if(prev && !real){ chip=`<span class="pr-chip pr-pend">pendente</span>`; }
  return `<td class="stage-c pr-c"><div class="pr-prev">P · ${pf}</div><div class="pr-real">R · ${rf}</div>${chip}</td>`;
}
function renderEsteiraPrevReal(){
  const arr=esteiraFiltrados();
  const body=el("estBody");
  if(!arr.length){ body.innerHTML=`<div class="est-empty"><i data-lucide="route" style="width:30px;height:30px;opacity:.4"></i><div style="margin-top:10px">Nenhum projeto encontrado com os filtros atuais.</div></div>`; lucideRefresh(); return; }
  // atividade → etapa
  const atvEtapa={}; (REG.atividades||[]).forEach(a=>{ if(a.etapa) atvEtapa[a.nome]=a.etapa; });
  // realizado: 1ª alocação por (projeto, etapa), varrendo o DATA em memória (janela atual)
  const realPE={};
  Object.keys(DATA).forEach(k=>{
    const r=DATA[k]; if(!r||!r.cliente||!r.atividade) return;
    const et=atvEtapa[r.atividade]; if(!et) return;
    const m=k.match(/\d{4}-\d{2}-\d{2}/); if(!m) return; const iso=m[0];
    const proj=_normProj(r.cliente);
    (realPE[proj]=realPE[proj]||{});
    if(!realPE[proj][et]||iso<realPE[proj][et]) realPE[proj][et]=iso;
  });
  const num=n=>`<span class="stage-num">${n}</span>`;
  const head=`<thead><tr>
    <th class="proj-h">Projeto</th>
    <th class="stage-h">${num(1)}Discovery</th>
    <th class="stage-h">${num(2)}Cadastros básicos</th>
    <th class="stage-h">${num(3)}Logística</th>
    <th class="stage-h">${num(4)}Backoffice</th>
    <th class="stage-h gl-h">${num(5)}Go-Live</th>
    <th class="stage-h">${num(6)}Hypercare</th>
    <th class="stage-h">${num(7)}Monitoramento</th>
    <th class="stage-h">${num(8)}Frota</th>
    <th class="stage-h">${num(9)}Sustentação</th>
  </tr></thead>`;
  const ordem=["discovery","cadastros","logistica","backoffice","golive","hypercare","monitoramento","frota","sustentacao"];
  const rows=arr.map(p=>{
    if(typeof _pvRecalcChain==="function") _pvRecalcChain(p);
    const prevE={};
    (p.previstoLinhas||[]).forEach(l=>{ const et=atvEtapa[l.atv]; if(!et||!l.ini)return; if(!prevE[et]||l.ini<prevE[et])prevE[et]=l.ini; });
    const rp=realPE[_normProj(p.nome)]||{};
    const cells=ordem.map(eid=>{
      if(eid==="golive") return _estPRcell(p.goLiveAjustado||p.goLivePrevisto||"", p.goLiveRealizado||"");
      return _estPRcell(prevE[eid]||"", rp[eid]||"");
    }).join("");
    return `<tr data-proj="${enc(p.nome)}">
      <td class="proj-c"><div class="est-proj-name">${enc(p.nome)}</div><div class="est-proj-meta">${enc(p.segmentacao||'')}${p.gp?' · '+enc(p.gp):''}</div></td>
      ${cells}
    </tr>`;
  }).join("");
  const legenda=`<div class="pr-legend"><b>P</b> previsto (1ª atividade da etapa) · <b>R</b> realizado (1ª alocação real da etapa) · desvio R−P: <span class="pr-chip pr-ok">≤0</span> <span class="pr-chip pr-warn">1–7d</span> <span class="pr-chip pr-bad">&gt;7d</span> <span class="pr-chip pr-pend">pendente</span></div>`;
  body.innerHTML=legenda+`<div class="est-scroll"><table class="est-table pr-table">${head}<tbody>${rows}</tbody></table></div>`;
  lucideRefresh();
}

function bindEsteiraInputs(){
  const scope=el("estBody"); if(!scope)return;
  scope.querySelectorAll('input.est-date').forEach(inp=>{
    inp.addEventListener("change",()=>esteiraEditField(inp.dataset.proj, inp.dataset.field, inp.value));
  });
  scope.querySelectorAll('select.est-sel').forEach(sel=>{
    sel.addEventListener("change",()=>{
      if(sel.dataset.kind==="etapa") esteiraEditField(sel.dataset.proj,"etapaAtual",sel.value);
      else if(sel.dataset.kind==="status") esteiraEditField(sel.dataset.proj,"status",sel.value);
    });
  });
}

function esteiraEditField(nome, field, value){
  if(!podeEditarEsteira()){ alert("Sem permissão para editar a esteira."); return; }
  const p=REG.projetos.find(x=>x.nome===nome); if(!p)return;
  const antes=Object.assign({},p);
  p[field]=value;
  // se realizou o go-live e a situação ainda é de planejamento, sugere atualizar
  if(field==="goLiveRealizado" && value && (p.goLiveSituacao==="Planejado"||p.goLiveSituacao==="Confirmado"||p.goLiveSituacao==="Em execução")){
    p.goLiveSituacao="Realizado";
  }
  const dif=_diff(antes,p);
  if(dif)audit("project.update",nome,dif.antes,dif.depois);
  persist();
  _estSaveHint();
  // re-render preservando o scroll (etapa automática e estilo de atraso podem mudar)
  const sc=el("estBody").querySelector(".est-scroll");
  const top=sc?sc.scrollTop:0, left=sc?sc.scrollLeft:0;
  renderEsteiraTabela();
  const sc2=el("estBody").querySelector(".est-scroll");
  if(sc2){ sc2.scrollTop=top; sc2.scrollLeft=left; }
  lucideRefresh();
}

let _estHintTimer=null;
function _estSaveHint(){
  const h=el("estSaveHint"); if(!h)return;
  h.classList.add("show");
  clearTimeout(_estHintTimer);
  _estHintTimer=setTimeout(()=>h.classList.remove("show"),1600);
}


function _estStageStyle(e){
  const styles={
    discovery:{color:"#EA580C",bg:"#FFF7ED",bd:"#FDBA74",desc:"Levantamento inicial, análise de necessidade, escopo e preparação do projeto"},
    cadastros:{color:"#E55810",bg:"#FFF1E5",bd:"#FBC7A6",desc:"Parametrizações iniciais, cadastros base e saneamento"},
    logistica:{color:"#2563EB",bg:"#EFF6FF",bd:"#BFDBFE",desc:"Fluxos operacionais, emissão e movimentações logísticas"},
    backoffice:{color:"#8B5CF6",bg:"#F5F3FF",bd:"#DDD6FE",desc:"Financeiro, fiscal, integrações e regras administrativas"},
    golive:{color:"#16A34A",bg:"#F0FDF4",bd:"#BBF7D0",desc:"Entrada em produção e validação do uso real"},
    hypercare:{color:"#F59E0B",bg:"#FFFBEB",bd:"#FDE68A",desc:"Acompanhamento intensivo pós Go-Live"},
    monitoramento:{color:"#0F766E",bg:"#F0FDFA",bd:"#99F6E4",desc:"Tracking, monitoramento, eventos e visibilidade"},
    frota:{color:"#475569",bg:"#F8FAFC",bd:"#CBD5E1",desc:"Gestão de veículos, motoristas, manutenção e frota"},
    sustentacao:{color:"#64748B",bg:"#F1F5F9",bd:"#CBD5E1",desc:"Operação estabilizada, suporte contínuo e evoluções"}
  };
  return styles[e.id]||styles.discovery;
}
function _estProjetoProgresso(p){
  const eff=etapaEfetivaDe(p);
  if(!eff)return 0;
  const idx=ETAPAS.findIndex(e=>e.id===eff);
  return Math.max(12,Math.round(((idx+1)/ETAPAS.length)*100));
}
function _estInitials(nome){
  return (nome||"?").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"?";
}
function _estCardDate(p, etapa){
  if(etapa.id==="golive") return p.goLiveRealizado ? `real. ${_estFmt(p.goLiveRealizado)}` : (_estGlBase(p)?`prev. ${_estFmt(_estGlBase(p))}`:"sem data");
  return p[etapa.field] ? `início ${_estFmt(p[etapa.field])}` : (_estGlBase(p)?`GL ${_estFmt(_estGlBase(p))}`:"sem data");
}
function _estStatusClass(p){
  if(_estGlAtrasado(p))return "Atrasado";
  return p.status||"Em andamento";
}
function renderEsteiraDashboard(host){
  const body=host||el("estBody");
  if(!body) return;
  const arr=(typeof esteiraFiltrados==='function'?esteiraFiltrados():projetosImplantacao());
  const stageMeta={
    discovery:{color:'#EA580C',bg:'#FFF7ED',bd:'#FDBA74',desc:'Atendimento inicial, análise de necessidade, escopo e preparação do projeto.'},
    cadastros:{color:'#F26C20',bg:'#FFF1E5',bd:'#FBC7A6',desc:'Parametrização inicial, cadastros, pessoas, clientes e base operacional.'},
    logistica:{color:'#F59E0B',bg:'#FFFBEB',bd:'#FDE68A',desc:'Fluxos logísticos, coletas, entregas, documentos e operação.'},
    backoffice:{color:'#5B6EE1',bg:'#EEF2FF',bd:'#C7D2FE',desc:'Financeiro, fiscal, faturamento, integrações e regras administrativas.'},
    golive:{color:'#16A34A',bg:'#F0FDF4',bd:'#BBF7D0',desc:'Entrada em produção, acompanhamento da virada e validação do uso real.'},
    hypercare:{color:'#8B5CF6',bg:'#F5F3FF',bd:'#DDD6FE',desc:'Acompanhamento intensivo pós Go-Live e estabilização assistida.'},
    monitoramento:{color:'#0F766E',bg:'#F0FDFA',bd:'#99F6E4',desc:'Tracking, eventos, visibilidade operacional e monitoramento.'},
    frota:{color:'#475569',bg:'#F8FAFC',bd:'#CBD5E1',desc:'Veículos, motoristas, manutenção, agregados e gestão de frota.'},
    sustentacao:{color:'#64748B',bg:'#F1F5F9',bd:'#CBD5E1',desc:'Projeto estabilizado, suporte contínuo e evolução da operação.'}
  };
  const safe=s=>enc(s==null?'':String(s));
  const iniciais=(txt)=>{ const t=(txt||'?').trim().split(/\s+/).filter(Boolean); return (t.slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase(); };
  const etapaDe=(p)=>{ try{return etapaEfetivaDe(p)||'';}catch(e){return p.etapaAtual||'';} };
  const fmtData=(iso)=>{ try{return iso?_estFmt(iso):'sem data';}catch(e){return iso||'sem data';} };
  const dataEtapa=(p,e)=>{
    if(e.id==='golive'){
      const base=(p.goLiveRealizado||p.goLiveAjustado||p.goLivePrevisto||'');
      if(p.goLiveRealizado) return 'real. '+fmtData(p.goLiveRealizado);
      if(base) return 'prev. '+fmtData(base);
      return 'sem data';
    }
    if(p[e.field]) return 'início '+fmtData(p[e.field]);
    if(p.goLivePrevisto||p.goLiveAjustado) return 'GL '+fmtData(p.goLiveAjustado||p.goLivePrevisto);
    return 'sem data';
  };
  const progresso=(p)=>{ const id=etapaDe(p); const idx=ETAPAS.findIndex(e=>e.id===id); return idx<0?8:Math.max(10,Math.round(((idx+1)/ETAPAS.length)*100)); };
  const atrasado=(p)=>{ try{return _estGlAtrasado(p);}catch(e){return false;} };

  const concluidos=arr.filter(p=>etapaDe(p)==='sustentacao' || (p.status||'')==='Concluído').length;
  const emAndamento=Math.max(0, arr.length-concluidos);
  const atrasados=arr.filter(atrasado).length;
  const clientes=new Set(arr.map(p=>p.nome).filter(Boolean)).size;
  const kpi=(ico,label,num,sub)=>`<div class="dash-kpi"><div class="dash-kpi-ico"><i data-lucide="${ico}"></i></div><div><div class="dash-kpi-l">${label}</div><div class="dash-kpi-n">${num}</div><div class="dash-kpi-s">${sub}</div></div></div>`;

  const colunas=ETAPAS.map((e,idx)=>{
    const st=stageMeta[e.id]||{color:'#F26C20',bg:'#FFF1E5',bd:'#FBC7A6',desc:''};
    const ps=arr.filter(p=>etapaDe(p)===e.id).sort((a,b)=>(a.nome||'').localeCompare(b.nome||'', 'pt'));
    const cards=ps.slice(0,8).map(p=>{
      const resp=p.gp||p.lider||(p.analistas&&p.analistas[0])||'sem responsável';
      const status=atrasado(p)?'Atrasado':(p.status||'Em andamento');
      return `<div class="client-card" style="--prog:${progresso(p)}%">
        <div class="client-row"><div class="client-logo">${safe(iniciais(p.nome))}</div><div style="min-width:0"><div class="client-name">${safe(p.nome||'Projeto sem nome')}</div><div class="client-sub">${safe(resp)}${p.segmentacao?' · '+safe(p.segmentacao):''}</div></div></div>
        <div class="client-meta"><span class="status-badge">${safe(status)}</span><span class="client-date">${safe(dataEtapa(p,e))}</span></div>
        <div class="progress"><i></i></div>
      </div>`;
    }).join('');
    const more=ps.length>8?`<div class="empty-stage small">+${ps.length-8} projeto${ps.length-8>1?'s':''}</div>`:'';
    return `<section class="stage-col" style="--st-color:${st.color};--st-bg:${st.bg};--st-bd:${st.bd}">
      <div class="stage-head"><div class="stage-top"><div class="stage-name"><span class="stage-num">${idx+1}</span><span>${safe(e.label)}</span></div><span class="stage-count">${ps.length}</span></div><div class="stage-desc">${safe(st.desc)}</div></div>
      <div class="stage-body">${cards||'<div class="empty-stage">Nenhum cliente nesta etapa</div>'}${more}</div>
    </section>`;
  }).join('');
  const legenda=ETAPAS.map(e=>{const st=stageMeta[e.id]||{};return `<div class="legend-item" style="--st-color:${st.color}"><span class="legend-dot"></span><span><b>${safe(e.label)}</b>${safe(st.desc)}</span></div>`}).join('');
  body.innerHTML=`<div class="est-dash-v2">
    <div class="dash-hero"><div class="dash-title"><h2>Esteira de Evolução de Projetos</h2><p>Visão geral de todas as etapas e distribuição dos clientes</p></div><div class="dash-actions"><span class="dash-pill"><i data-lucide="filter"></i>Filtros</span><span class="dash-pill"><i data-lucide="refresh-cw"></i>Atualizado</span></div></div>
    <div class="dash-kpis">${kpi('layers','Total de Projetos',arr.length,'na esteira')}${kpi('users','Clientes Ativos',clientes,'base filtrada')}${kpi('check-circle-2','Concluídos',concluidos,'em sustentação')}${kpi('clock-3','Em Andamento',emAndamento,arr.length?Math.round((emAndamento/arr.length)*100)+'% do total':'0% do total')}${kpi('triangle-alert','Atrasados',atrasados,atrasados?'exigem ação':'sem atraso')}</div>
    <div class="pipeline-wrap"><div class="pipeline">${colunas}</div></div>
    <div class="legend-card"><div class="legend-title">Legenda das Etapas</div><div class="legend-grid">${legenda}</div></div>
  </div>`;
  lucideRefresh();
}
function renderEsteiraPainel(){
  const arr=esteiraFiltrados(); // respeita busca e filtros da esteira
  const body=el("estBody");
  const hoje=_estHoje();
  // distribuição por etapa efetiva
  const dist={}; ETAPAS.forEach(e=>dist[e.id]=0); dist["_none"]=0;
  arr.forEach(p=>{ const eff=etapaEfetivaDe(p); dist[eff||"_none"]++; });
  const totalPre = ETAPAS.filter(e=>e.fase==="pre").reduce((s,e)=>s+dist[e.id],0);
  const totalPos = ETAPAS.filter(e=>e.fase==="pos").reduce((s,e)=>s+dist[e.id],0);
  const emGoLive = dist["golive"];
  const realizados = arr.filter(p=>p.goLiveRealizado).length;
  const atrasados = arr.filter(p=>_estGlAtrasado(p)).length;
  const prox30 = arr.filter(p=>{ const b=_estGlBase(p); return b && !p.goLiveRealizado && b>=hoje && daysBetween(hoje,b)<=30; }).length;
  const sustent = dist["sustentacao"];
  // lead time médio: discovery -> go-live realizado
  const leads = arr.filter(p=>(p.dtDiscovery||p.dtCadBasicos) && p.goLiveRealizado && p.goLiveRealizado>=(p.dtDiscovery||p.dtCadBasicos))
                   .map(p=>daysBetween((p.dtDiscovery||p.dtCadBasicos),p.goLiveRealizado));
  const leadAvg = leads.length ? Math.round(leads.reduce((a,b)=>a+b,0)/leads.length) : null;

  const card=(l,n,sub,accent)=>`<div class="kpi-card ${accent||''}"><div class="kpi-l">${l}</div><div class="kpi-n">${n}</div><div class="kpi-sub">${sub||''}</div></div>`;
  const kpis=`<div class="kpi-grid" style="margin-bottom:22px">
    ${card("Em implantação", arr.length, "projetos no fluxo", "accent-proj")}
    ${card("Pré Go-Live", totalPre, "discovery · cadastros · logística · backoffice", "")}
    ${card("Go-Live atrasado", atrasados, atrasados?"prazo-base já vencido":"nenhum vencido", atrasados?"accent-aus":"")}
    ${card("Próx. 30 dias", prox30, "go-lives a vencer", "")}
    ${card("Go-Lives realizados", realizados, "já entraram em produção", "")}
    ${card("Em sustentação", sustent, "ciclo concluído", "")}
  </div>`;

  // funil
  const maxV=Math.max(1,...Object.values(dist));
  const funnelRows=[
    {id:"_none",label:"Não iniciado",fase:"none",num:"–"},
    ...ETAPAS.map((e,i)=>({id:e.id,label:e.label,fase:e.fase,num:i+1}))
  ].map(r=>{
    const v=dist[r.id]||0;
    const pct=Math.round(v/maxV*100);
    const post = r.fase==="pos"||r.fase==="golive";
    return `<div class="est-funnel-row">
      <div class="est-funnel-lbl"><span class="num">${r.num}</span>${enc(r.label)}</div>
      <div class="est-funnel-bar ${post?'post':''}"><i style="width:${pct}%"></i></div>
      <div class="est-funnel-val">${v}</div>
    </div>`;
  }).join("");

  const leadBlock = leadAvg!=null
    ? `<div class="kpi-card accent-proj" style="max-width:360px"><div class="kpi-l">Lead time médio (discovery → go-live)</div><div class="kpi-n">${leadAvg}<span class="unit"> dias</span></div><div class="kpi-sub">média de ${leads.length} projeto${leads.length>1?'s':''} com go-live realizado</div></div>`
    : `<div class="rep-empty" style="max-width:360px">Sem projetos com go-live realizado para calcular lead time.</div>`;

  // agrupamento por etapa
  const groups=[...ETAPAS.map(e=>({id:e.id,label:e.label,fase:e.fase})),{id:"_none",label:"Não iniciado",fase:"none"}]
    .map(g=>{
      const ps=arr.filter(p=>(etapaEfetivaDe(p)||"_none")===g.id);
      if(!ps.length)return "";
      const cards=ps.sort((a,b)=>(a.nome||"").localeCompare(b.nome||"","pt")).map(p=>{
        const eff=etapaEfetivaDe(p);
        const dt = eff && !ETAPA_BY_ID[eff].glPrev ? p[ETAPA_BY_ID[eff].field] : (eff==="golive"?p.goLiveRealizado:"");
        const glInfo = p.goLiveRealizado ? `Go-Live ${_estFmt(p.goLiveRealizado)}` : (_estGlBase(p)?`prev. ${_estFmt(_estGlBase(p))}`:"—");
        return `<div class="est-pcard"><div class="pn">${enc(p.nome)}</div><div class="pm">${enc(p.gp||'sem GP')}${p.lider?' · '+enc(p.lider):''}</div><div class="pd">${glInfo}${dt?` · início ${_estFmt(dt)}`:''}</div></div>`;
      }).join("");
      return `<div class="est-stage-group"><h4>${enc(g.label)}<span class="badge">${ps.length}</span></h4><div class="est-cards">${cards}</div></div>`;
    }).join("");

  body.innerHTML=`<div class="est-panel">
    ${kpis}
    <div class="kpi-section"><h3>Distribuição por etapa</h3><div class="est-funnel">${funnelRows}</div></div>
    <div class="kpi-section"><h3>Ciclo</h3>${leadBlock}</div>
    <div class="kpi-section"><h3>Projetos por etapa</h3>${groups||'<div class="rep-empty">Nenhum projeto.</div>'}</div>
  </div>`;
  lucideRefresh();
}

/* ===================== Discovery (rituais da fase de Discovery) =====================
   Espelha a Esteira de Projetos, focado nos RITOS internos do Discovery.
   - Mostra os projetos que estão na fase de Discovery da esteira (não iniciado ou discovery).
   - Dashboard (kanban por rito) com o MESMO layout do dashboard da Esteira (est-dash-v2).
   - Tabela editável: data de cada rito, situação do Discovery e rito atual. */
let dscView="dashboard", dscSearch="", dscFilterRito="", dscFilterSituacao="", dscRecebDe="", dscRecebAte="", dscFiltroAplicado=false;

function podeEditarDiscovery(){
  // Permissão por ação (matriz) é a base. Sem acesso → não edita.
  if(actionLevel("discovery")==="none") return false;
  if(canEditAction("discovery")) return true;
  // Regra herdada: analista da squad "Discovery" edita os próprios ritos,
  //   mesmo quando o default do perfil é somente leitura.
  if(_currentRole==="analista") return !!_linkedAnalyst && squadDe(_linkedAnalyst)==="Discovery";
  return false;
}

// Projetos elegíveis ao Discovery: implantação cuja etapa efetiva na esteira ainda
// é Discovery (ordem 0) ou ainda não iniciou (ordem -1) — ou seja, ainda na fase de discovery.
function projetosEmDiscovery(){
  return projetosImplantacao().filter(p=>{
    const eff=etapaEfetivaDe(p);
    const ord = eff && ETAPA_BY_ID[eff] ? ETAPA_BY_ID[eff].ordem : -1;
    return ord<=0;
  });
}
// Data de início de um rito num projeto (guardada em p.dscRitos[ritoId]).
function dscRitoData(p, ritoId){ return (p.dscRitos||{})[ritoId] || ""; }
// Rito mais avançado com data preenchida ("" = nenhum).
function dscRitoAutoDe(p){
  let cur="";
  DISCOVERY_RITOS.forEach(r=>{ if(dscRitoData(p,r.id)) cur=r.id; });
  return cur;
}
// Rito efetivo: override manual (p.dscRitoAtual) tem prioridade; senão, automático.
function dscRitoEfetivoDe(p){
  if(p.dscRitoAtual && DISCOVERY_RITO_BY_ID[p.dscRitoAtual]) return p.dscRitoAtual;
  return dscRitoAutoDe(p);
}
// Progresso (0–100) com base no índice do rito efetivo.
function dscProgresso(p){
  const eff=dscRitoEfetivoDe(p);
  if(!eff)return 0;
  const idx=DISCOVERY_RITOS.findIndex(r=>r.id===eff);
  return Math.max(12, Math.round(((idx+1)/DISCOVERY_RITOS.length)*100));
}
// Paleta de cor por rito (laranja→teal progressiva, no espírito da esteira).
function _dscRitoMeta(r, idx){
  const palette=[
    {color:'#EA580C',bg:'#FFF7ED',bd:'#FDBA74'},
    {color:'#F26C20',bg:'#FFF1E5',bd:'#FBC7A6'},
    {color:'#D97706',bg:'#FFFBEB',bd:'#FDE68A'},
    {color:'#CA8A04',bg:'#FEFCE8',bd:'#FEF08A'},
    {color:'#65A30D',bg:'#F7FEE7',bd:'#D9F99D'},
    {color:'#16A34A',bg:'#F0FDF4',bd:'#BBF7D0'},
    {color:'#0F766E',bg:'#F0FDFA',bd:'#99F6E4'},
    {color:'#0891B2',bg:'#ECFEFF',bd:'#A5F3FC'},
    {color:'#2563EB',bg:'#EFF6FF',bd:'#BFDBFE'},
    {color:'#5B6EE1',bg:'#EEF2FF',bd:'#C7D2FE'},
    {color:'#8B5CF6',bg:'#F5F3FF',bd:'#DDD6FE'},
    {color:'#C026D3',bg:'#FDF4FF',bd:'#F5D0FE'},
    {color:'#DB2777',bg:'#FDF2F8',bd:'#FBCFE8'},
    {color:'#475569',bg:'#F8FAFC',bd:'#CBD5E1'},
  ];
  const c=palette[idx % palette.length];
  return {color:c.color,bg:c.bg,bd:c.bd,desc:r.desc||""};
}

function openDiscovery(){
  if(!canViewAction("discovery")){ alert("Você não tem acesso à Esteira de Discovery."); irPara("home"); return; }
  dscView="dashboard"; dscSearch=""; dscFilterRito=""; dscFilterSituacao=""; dscFiltroAplicado=false;
  if(!dscRecebDe || !dscRecebAte){ const h=new Date(); dscRecebDe=toISO(addDays(h,-30)); dscRecebAte=toISO(addDays(h,90)); }
  const se=el("dscSearch"); if(se)se.value="";
  const rd=el("dscRecebDe"); if(rd)rd.value=dscRecebDe;
  const ra=el("dscRecebAte"); if(ra)ra.value=dscRecebAte;
  const fr=el("dscFilterRito");
  if(fr)fr.innerHTML=`<option value="">Todas as atividades</option>`+DISCOVERY_RITOS.map(r=>`<option value="${r.id}">${enc(r.label)}</option>`).join("")+`<option value="_none">Não iniciado</option>`;
  const fs=el("dscFilterSituacao");
  if(fs)fs.innerHTML=`<option value="">Todas as situações</option>`+DISCOVERY_SITUACOES.map(s=>`<option value="${enc(s)}">${enc(s)}</option>`).join("");
  el("dscViews").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.dv==="dashboard"));
  el("discoveryOverlay").classList.add("open");
  renderDiscovery();
}
function closeDiscovery(){ const o=el("discoveryOverlay"); const was=o&&o.classList.contains("open"); if(o)o.classList.remove("open"); if(was) irPara("home"); }

function aplicarFiltroDiscovery(){
  const de=el("dscRecebDe"), ate=el("dscRecebAte");
  dscRecebDe = de && de.value || "";
  dscRecebAte = ate && ate.value || "";
  if(!dscRecebDe || !dscRecebAte){ alert("Por favor, selecione as datas de recebimento inicial e final do Discovery."); return; }
  if(dscRecebDe > dscRecebAte){ alert("A data inicial não pode ser maior que a data final."); return; }
  dscFiltroAplicado = true;
  renderDiscovery();
}

function discoveryFiltrados(){
  let arr=projetosEmDiscovery();
  const q=(dscSearch||"").trim().toLowerCase();
  if(q){
    arr=arr.filter(p=>{
      const hay=[p.nome,p.gp,p.lider,p.segmentacao,(p.analistas||[]).join(" ")].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }
  if(dscFilterRito){
    arr=arr.filter(p=>{ const eff=dscRitoEfetivoDe(p); return dscFilterRito==="_none" ? eff==="" : eff===dscFilterRito; });
  }
  if(dscFilterSituacao) arr=arr.filter(p=>(p.dscSituacao||"")===dscFilterSituacao);
  if(dscRecebDe || dscRecebAte){
    arr=arr.filter(p=>{
      // Data de referência para o período: recebimento; se vazio, cai para a 1ª data
      // de rito lançada e, por fim, para o início do Discovery (dtDiscovery).
      let r=p.dtRecebimento||"";
      if(!r){
        const ritoDatas=DISCOVERY_RITOS.map(rt=>dscRitoData(p,rt.id)).filter(Boolean).sort();
        r=ritoDatas[0]||p.dtDiscovery||"";
      }
      if(!r) return true;                  // sem nenhum sinal de data, não esconde o projeto de Discovery
      if(dscRecebDe && r<dscRecebDe) return false;
      if(dscRecebAte && r>dscRecebAte) return false;
      return true;
    });
  }
  return arr.sort((a,b)=>{
    const oa=DISCOVERY_RITO_BY_ID[dscRitoEfetivoDe(a)]?DISCOVERY_RITO_BY_ID[dscRitoEfetivoDe(a)].ordem:-1;
    const ob=DISCOVERY_RITO_BY_ID[dscRitoEfetivoDe(b)]?DISCOVERY_RITO_BY_ID[dscRitoEfetivoDe(b)].ordem:-1;
    if(ob!==oa)return ob-oa;
    return (a.nome||"").localeCompare(b.nome||"","pt");
  });
}

function renderDiscovery(){
  if(!dscFiltroAplicado){ const b=el("dscBody"); if(b) b.innerHTML = _htmlSobDemanda("Escolha o período de recebimento e clique em <b>Aplicar Filtro</b> para carregar a Linha do Tempo Discovery somente com os projetos do período selecionado."); lucideRefresh(); return; }
  if(dscView==="tabela") renderDiscoveryTabela();
  else if(dscView==="kpi") renderDiscoveryKpis();
  else renderDiscoveryDashboard();
  lucideRefresh();
}

/* ---- Dashboard (mesmo layout do dashboard da Esteira) ---- */
function renderDiscoveryDashboard(host){
  const body=host||el("dscBody"); if(!body)return;
  const arr=discoveryFiltrados();
  const safe=s=>enc(s==null?'':String(s));
  const iniciais=(txt)=>{ const t=(txt||'?').trim().split(/\s+/).filter(Boolean); return (t.slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase(); };
  const fmtData=(iso)=>{ try{return iso?_estFmt(iso):'sem data';}catch(e){return iso||'sem data';} };

  const _ultimoRito=DISCOVERY_RITOS.length?DISCOVERY_RITOS[DISCOVERY_RITOS.length-1].id:"";
  const concl=arr.filter(p=>(p.dscSituacao||'')==='Concluído' || (_ultimoRito && dscRitoEfetivoDe(p)===_ultimoRito)).length;
  const emAnd=arr.filter(p=>(p.dscSituacao||'')==='Em andamento').length;
  const aguard=arr.filter(p=>(p.dscSituacao||'')==='Aguardando cliente').length;
  const naoIni=arr.filter(p=>dscRitoEfetivoDe(p)==='' || (p.dscSituacao||'')==='Não iniciado').length;
  const kpi=(ico,label,num,sub)=>`<div class="dash-kpi"><div class="dash-kpi-ico"><i data-lucide="${ico}"></i></div><div><div class="dash-kpi-l">${label}</div><div class="dash-kpi-n">${num}</div><div class="dash-kpi-s">${sub}</div></div></div>`;

  const colunas=DISCOVERY_RITOS.map((r,idx)=>{
    const st=_dscRitoMeta(r,idx);
    const ps=arr.filter(p=>dscRitoEfetivoDe(p)===r.id).sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt'));
    const cards=ps.slice(0,8).map(p=>{
      const resp=p.gp||p.lider||(p.analistas&&p.analistas[0])||'sem responsável';
      const sit=p.dscSituacao||'Em andamento';
      const dt=dscRitoData(p,r.id);
      const dtLabel = r.tipo==="simnao" ? (dt==="sim" ? "CSAT enviado" : "CSAT pendente") : (dt ? 'início '+fmtData(dt) : 'sem data');
      return `<div class="client-card" style="--prog:${dscProgresso(p)}%">
        <div class="client-row"><div class="client-logo">${safe(iniciais(p.nome))}</div><div style="min-width:0"><div class="client-name">${safe(p.nome||'Projeto')}</div><div class="client-sub">${safe(resp)}${p.segmentacao?' · '+safe(p.segmentacao):''}</div></div></div>
        <div class="client-meta"><span class="status-badge">${safe(sit)}</span><span class="client-date">${safe(dtLabel)}</span></div>
        <div class="progress"><i></i></div>
      </div>`;
    }).join('');
    const more=ps.length>8?`<div class="empty-stage small">+${ps.length-8} projeto${ps.length-8>1?'s':''}</div>`:'';
    return `<section class="stage-col" style="--st-color:${st.color};--st-bg:${st.bg};--st-bd:${st.bd}">
      <div class="stage-head"><div class="stage-top"><div class="stage-name"><span class="stage-num">${idx+1}</span><span>${safe(r.label)}</span></div><span class="stage-count">${ps.length}</span></div><div class="stage-desc">${safe(st.desc)}</div></div>
      <div class="stage-body">${cards||'<div class="empty-stage">Nenhum projeto nesta atividade</div>'}${more}</div>
    </section>`;
  }).join('');

  const legenda=DISCOVERY_RITOS.map((r,idx)=>{const st=_dscRitoMeta(r,idx);return `<div class="legend-item" style="--st-color:${st.color}"><span class="legend-dot"></span><span><b>${safe(r.label)}</b>${safe(st.desc)}</span></div>`;}).join('');

  const nCols=DISCOVERY_RITOS.length||1;
  const minW=Math.max(900, nCols*230);
  const pipeStyle=`grid-template-columns:repeat(${nCols},minmax(215px,1fr));min-width:${minW}px`;

  body.innerHTML=`<div class="est-dash-v2">
    <div class="dash-hero"><div class="dash-title"><h2>Linha do Tempo · Discovery</h2><p>Acompanhamento das atividades do Discovery por projeto</p></div><div class="dash-actions"><span class="dash-pill"><i data-lucide="search"></i>${arr.length} projeto(s)</span><span class="dash-pill"><i data-lucide="refresh-cw"></i>Atualizado</span></div></div>
    <div class="dash-kpis" style="grid-template-columns:repeat(5,minmax(155px,1fr))">${kpi('search','Em Discovery',arr.length,'na fase de discovery')}${kpi('clock-3','Em andamento',emAnd,'rito em execução')}${kpi('pause-circle','Aguardando cliente',aguard,'dependência externa')}${kpi('circle-dashed','Não iniciado',naoIni,'sem rito iniciado')}${kpi('check-circle-2','Concluídos',concl,'discovery finalizado')}</div>
    <div class="pipeline-wrap"><div class="pipeline" style="${pipeStyle}">${colunas}</div></div>
    <div class="legend-card"><div class="legend-title">Legenda das atividades do Discovery</div><div class="legend-grid">${legenda}</div></div>
  </div>`;
  lucideRefresh();
}

/* ---- Indicadores (KPIs do Discovery) ---- */
function _dscAvg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0;}
function _dscMedian(a){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function _dscStd(a){if(a.length<2)return 0;const m=_dscAvg(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/a.length);}

// Métricas de um projeto na fase de Discovery.
// dias = do início (recebimento ou 1ª data lançada) até o Repasse BBP (ou hoje, se em andamento).
function _dscMetrics(p){
  const dated=[];
  DISCOVERY_RITOS.forEach((r,i)=>{ if(r.tipo==="simnao")return; const d=dscRitoData(p,r.id); if(d)dated.push({id:r.id,ordem:i,label:r.label,iso:d}); });
  const porData=[...dated].sort((a,b)=>a.iso.localeCompare(b.iso));
  const receb=p.dtRecebimento||"";
  const primeira=porData.length?porData[0].iso:"";
  const inicio=receb||primeira;
  const repbbp=dscRitoData(p,"rep_bbp");
  const concluido=!!repbbp;
  const fim=repbbp||toISO(new Date());
  let dias=null;
  if(inicio){ dias=daysBetween(inicio,fim); if(dias<0)dias=0; }
  // Tempo de fila: do recebimento até o primeiro kickoff (interno ou externo).
  const kick=dscRitoData(p,"kickoff_interno")||dscRitoData(p,"kickoff_externo")||"";
  let fila=null;
  if(receb && kick){ fila=daysBetween(receb,kick); if(fila<0)fila=0; }
  return {dated,receb,inicio,fim,concluido,dias,kick,fila};
}

function renderDiscoveryKpis(){
  const body=el("dscBody"); if(!body)return;
  const arr=discoveryFiltrados();
  if(!arr.length){ body.innerHTML=`<div class="est-empty"><i data-lucide="bar-chart-3" style="width:30px;height:30px;opacity:.4"></i><div style="margin-top:10px">Nenhum projeto na fase de Discovery com os filtros atuais.</div></div>`; lucideRefresh(); return; }

  const M=arr.map(p=>({p,m:_dscMetrics(p)}));
  const comDias=M.filter(x=>x.m.dias!=null);
  const dur=comDias.map(x=>x.m.dias);
  const concl=M.filter(x=>x.m.concluido).length;
  const andamento=M.length-concl;
  const csatSim=arr.filter(p=>dscRitoData(p,"csat")==="sim").length;

  const media=Math.round(_dscAvg(dur));
  const mediana=Math.round(_dscMedian(dur));
  const desvio=Math.round(_dscStd(dur));
  const minD=dur.length?Math.min(...dur):0;
  const maxD=dur.length?Math.max(...dur):0;

  // Tempo de fila (recebimento → kickoff)
  const comFila=M.filter(x=>x.m.fila!=null);
  const fila=comFila.map(x=>x.m.fila);
  const filaMedia=Math.round(_dscAvg(fila));
  const filaMed=Math.round(_dscMedian(fila));
  const filaMax=fila.length?Math.max(...fila):0;

  const card=(l,n,sub,accent)=>`<div class="kpi-card ${accent||''}"><div class="kpi-l">${l}</div><div class="kpi-n">${n}</div><div class="kpi-sub">${enc(sub||'')}</div></div>`;
  const cards=`<div class="kpi-grid">
    ${card("Projetos em Discovery",M.length,"no escopo/filtros atuais","accent-proj")}
    ${card("Concluídos",concl,"com Repasse BBP","accent-ok")}
    ${card("Em andamento",andamento,"sem repasse ainda","accent-warn")}
    ${card("Tempo médio",media+" d","dias na etapa Discovery","accent-info")}
    ${card("Mediana",mediana+" d","metade abaixo / metade acima")}
    ${card("Dispersão (desvio)",desvio+" d","desvio-padrão das durações","accent-analysis")}
    ${card("Amplitude",dur.length?(minD+"–"+maxD+" d"):"—","menor e maior duração")}
    ${card("CSAT enviado",csatSim,"projetos com CSAT marcado")}
  </div>`;

  const cardsFila=`<div class="kpi-grid">
    ${card("Fila média",filaMedia+" d","recebimento → 1º kickoff","accent-rot")}
    ${card("Fila mediana",filaMed+" d","metade abaixo / metade acima")}
    ${card("Maior fila",fila.length?(filaMax+" d"):"—","maior espera para iniciar","accent-warn")}
    ${card("Projetos medidos",fila.length,"com recebimento e kickoff")}
  </div>`;

  body.innerHTML=`<div class="est-panel">
    <div class="kpi-group"><div class="kpi-group-title"><span class="ico">📊</span>Visão geral${dur.length?` · base de ${dur.length} projeto(s) com data`:''}</div>${cards}</div>
    <div class="kpi-group"><div class="kpi-group-title"><span class="ico">⏳</span>Tempo de fila (antes de começar)</div>${cardsFila}${_dscBarrasFila(comFila)}</div>
    <div class="kpi-charts">
      <div class="kpi-chart"><h4>Dispersão do tempo em Discovery</h4>${_dscScatter(comDias,mediana)}</div>
      <div class="kpi-chart"><h4>Distribuição das durações</h4>${_dscHistograma(dur)}</div>
    </div>
    <div class="kpi-group"><div class="kpi-group-title"><span class="ico">⏱️</span>Dias médios entre etapas</div>${_dscTransicoes(arr)}</div>
    <div class="kpi-group"><div class="kpi-group-title"><span class="ico">📅</span>Dias em Discovery por projeto</div>${_dscBarrasPorProjeto(M)}</div>
    <div class="kpi-group"><div class="kpi-group-title"><span class="ico">📍</span>Onde os projetos estão agora</div>${_dscDistribuicaoAtividade(arr)}</div>
  </div>`;
  lucideRefresh();
}

// Barras: tempo de fila (recebimento → kickoff) por projeto (top 12).
function _dscBarrasFila(comFila){
  if(!comFila.length) return `<div class="legend" style="margin-top:6px"><div class="it">Sem projetos com recebimento e kickoff preenchidos para medir a fila.</div></div>`;
  const rows=comFila.slice().sort((a,b)=>b.m.fila-a.m.fila).slice(0,12);
  const max=Math.max(1,...rows.map(x=>x.m.fila));
  return `<div style="margin-top:12px">`+rows.map(x=>{
    const d=x.m.fila; const pct=Math.round(d/max*100); const cls=d>=15?"hot":d>=7?"warm":"";
    return `<div class="bar-row"><div class="nm" title="${enc(x.p.nome)}">${enc(x.p.nome)}</div><div class="track"><div class="fill ${cls}" style="width:${Math.max(2,pct)}%"></div></div><div class="pct">${d} d</div></div>`;
  }).join("")+`<div class="legend" style="margin-top:6px"><div class="it">fila = dias entre a data de recebimento e o 1º kickoff (interno ou externo)</div></div></div>`;
}

// Gráfico de dispersão: eixo X = data de início, eixo Y = dias na etapa Discovery.
function _dscScatter(comDias, mediana){
  if(!comDias.length) return '<div style="text-align:center;color:var(--faint);padding:26px 0">Sem datas suficientes para a dispersão.</div>';
  const W=340,H=190,padL=34,padR=12,padT=12,padB=28;
  const pts=comDias.map(x=>({t:parseISO(x.m.inicio).getTime(),y:x.m.dias,c:x.m.concluido,nome:x.p.nome,inicio:x.m.inicio}));
  const ys=pts.map(p=>p.y); const ymax=Math.max(10,Math.ceil(Math.max(...ys)/10)*10);
  const ts=pts.map(p=>p.t); const tmin=Math.min(...ts), tmax=Math.max(...ts);
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const mapY=y=>(padT+plotH-(y/ymax)*plotH);
  const circles=pts.map((p,i)=>{
    const cx=(tmax===tmin)?(padL+(plotW*(i+1)/(pts.length+1))):(padL+(p.t-tmin)/(tmax-tmin)*plotW);
    const cy=mapY(p.y); const col=p.c?'#0F766E':'#E55810';
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="${col}" fill-opacity=".78" stroke="#fff" stroke-width="1"><title>${enc(p.nome)} · ${p.y} dias · início ${fmtDM(parseISO(p.inicio))}</title></circle>`;
  }).join("");
  const medY=mapY(mediana);
  const axis=`<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+plotH}" stroke="#ddd"/><line x1="${padL}" y1="${padT+plotH}" x2="${W-padR}" y2="${padT+plotH}" stroke="#ddd"/>
    <text x="${padL-5}" y="${padT+7}" text-anchor="end" font-size="9" fill="#999">${ymax}d</text>
    <text x="${padL-5}" y="${padT+plotH}" text-anchor="end" font-size="9" fill="#999">0</text>`;
  const medLine=mediana>0?`<line x1="${padL}" y1="${medY.toFixed(1)}" x2="${W-padR}" y2="${medY.toFixed(1)}" stroke="#bbb" stroke-dasharray="4 3"/><text x="${W-padR}" y="${(medY-4).toFixed(1)}" text-anchor="end" font-size="9" fill="#999">mediana ${mediana}d</text>`:'';
  const xlab=(tmax===tmin)?`<text x="${padL+plotW/2}" y="${H-8}" text-anchor="middle" font-size="9" fill="#999">início ${fmtDM(new Date(tmin))}</text>`
    :`<text x="${padL}" y="${H-8}" text-anchor="start" font-size="9" fill="#999">${fmtDM(new Date(tmin))}</text><text x="${W-padR}" y="${H-8}" text-anchor="end" font-size="9" fill="#999">${fmtDM(new Date(tmax))}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${axis}${medLine}${circles}${xlab}</svg>
    <div class="legend"><div class="it"><span class="sw" style="background:#E55810;border-color:#E55810"></span>Em andamento</div><div class="it"><span class="sw" style="background:#0F766E;border-color:#0F766E"></span>Concluído</div><div class="it">X: início · Y: dias na etapa</div></div>`;
}

// Histograma das durações (distribuição por faixas de dias).
function _dscHistograma(dur){
  if(!dur.length) return '<div style="text-align:center;color:var(--faint);padding:26px 0">Sem durações para exibir.</div>';
  const buckets=[["0–7 dias",0,7],["8–15 dias",8,15],["16–30 dias",16,30],["31–45 dias",31,45],["46–60 dias",46,60],["60+ dias",61,Infinity]];
  const counts=buckets.map(([,a,b])=>dur.filter(d=>d>=a&&d<=b).length);
  const max=Math.max(1,...counts);
  return buckets.map(([lab],i)=>{
    const v=counts[i]; const pct=Math.round(v/max*100); const cls=i>=4?"hot":i>=2?"warm":"";
    return `<div class="bar-row"><div class="nm" title="${lab}">${lab}</div><div class="track"><div class="fill ${cls}" style="width:${Math.max(2,pct)}%"></div></div><div class="pct">${v}</div></div>`;
  }).join("");
}

// Dias médios entre etapas consecutivas (apenas projetos com ambas as datas).
function _dscTransicoes(arr){
  const datedRites=DISCOVERY_RITOS.filter(r=>r.tipo!=="simnao");
  const rows=[];
  for(let i=0;i<datedRites.length-1;i++){
    const a=datedRites[i], b=datedRites[i+1]; const gaps=[];
    arr.forEach(p=>{ const da=dscRitoData(p,a.id), db=dscRitoData(p,b.id); if(da&&db){const g=daysBetween(da,db); if(g>=0)gaps.push(g);} });
    if(gaps.length) rows.push({label:a.label+" → "+b.label,avg:Math.round(_dscAvg(gaps)),n:gaps.length});
  }
  if(!rows.length) return '<div style="text-align:center;color:var(--faint);padding:18px 0">Sem pares de datas suficientes para medir intervalos entre etapas.</div>';
  const max=Math.max(1,...rows.map(r=>r.avg));
  return `<div style="display:flex;flex-direction:column;gap:6px">`+rows.map(r=>{
    const pct=Math.round(r.avg/max*100); const cls=r.avg>=15?"hot":r.avg>=7?"warm":"";
    return `<div class="bar-row" style="grid-template-columns:230px 1fr 64px"><div class="nm" title="${enc(r.label)} (${r.n} proj.)">${enc(r.label)}</div><div class="track"><div class="fill ${cls}" style="width:${Math.max(2,pct)}%"></div></div><div class="pct">${r.avg} d</div></div>`;
  }).join("")+`</div><div class="legend" style="margin-top:8px"><div class="it">média de dias entre as datas de etapas consecutivas</div></div>`;
}

// Barras: dias em Discovery por projeto (top 15 por duração).
function _dscBarrasPorProjeto(M){
  const rows=M.filter(x=>x.m.dias!=null).sort((a,b)=>b.m.dias-a.m.dias);
  if(!rows.length) return '<div style="text-align:center;color:var(--faint);padding:18px 0">Sem projetos com datas para medir duração.</div>';
  const top=rows.slice(0,15); const max=Math.max(1,...top.map(x=>x.m.dias));
  return top.map(x=>{
    const d=x.m.dias; const pct=Math.round(d/max*100); const cls=d>=45?"hot":d>=20?"warm":"";
    const est=x.m.concluido?"concluído":"em andamento";
    return `<div class="bar-row"><div class="nm" title="${enc(x.p.nome)} · ${est}">${enc(x.p.nome)}</div><div class="track"><div class="fill ${cls}" style="width:${Math.max(2,pct)}%"></div></div><div class="pct">${d} d</div></div>`;
  }).join("")+`<div class="legend" style="margin-top:6px">${rows.length>15?`<div class="it">15 de ${rows.length} projetos (maiores durações)</div>`:''}<div class="it">duração = do recebimento/1ª data até o Repasse BBP (ou hoje, se em andamento)</div></div>`;
}

// Distribuição dos projetos pela atividade atual (onde estão agora).
function _dscDistribuicaoAtividade(arr){
  const counts={}; let naoIni=0;
  arr.forEach(p=>{ const eff=dscRitoEfetivoDe(p); if(!eff){naoIni++;return;} counts[eff]=(counts[eff]||0)+1; });
  const rows=DISCOVERY_RITOS.filter(r=>counts[r.id]).map(r=>({label:r.label,n:counts[r.id]}));
  if(naoIni)rows.unshift({label:"Não iniciado",n:naoIni});
  if(!rows.length) return '<div style="text-align:center;color:var(--faint);padding:18px 0">Sem dados.</div>';
  const max=Math.max(1,...rows.map(r=>r.n));
  return rows.map(r=>{
    const pct=Math.round(r.n/max*100);
    return `<div class="bar-row" style="grid-template-columns:180px 1fr 56px"><div class="nm" title="${enc(r.label)}">${enc(r.label)}</div><div class="track"><div class="fill warm" style="width:${Math.max(2,pct)}%"></div></div><div class="pct">${r.n}</div></div>`;
  }).join("");
}

/* ---- Tabela editável (datas dos ritos · situação · rito atual) ---- */
function _dscDateCell(p, rito){
  const ritoId=rito.id;
  const v=dscRitoData(p,ritoId);
  const editavel=podeEditarDiscovery();
  if(rito.tipo==="simnao"){
    const sim = v==="sim";
    if(!editavel) return `<td class="stage-c"><span class="est-ro ${sim?'':'empty'}">${sim?'Sim':'Não'}</span></td>`;
    return `<td class="stage-c"><select class="est-sel" data-proj="${enc(p.nome)}" data-kind="ritobool" data-rito="${ritoId}"><option value="" ${!sim?'selected':''}>Não</option><option value="sim" ${sim?'selected':''}>Sim</option></select></td>`;
  }
  if(!editavel) return `<td class="stage-c"><span class="est-ro ${v?'':'empty'}">${_estFmt(v)}</span></td>`;
  const cls="est-date"+(v?" filled":"");
  return `<td class="stage-c"><input type="date" class="${cls}" data-proj="${enc(p.nome)}" data-rito="${ritoId}" value="${enc(v)}"></td>`;
}
function _dscRitoSel(p){
  const editavel=podeEditarDiscovery();
  const eff=dscRitoEfetivoDe(p);
  const effLabel = eff ? DISCOVERY_RITO_BY_ID[eff].label : "Não iniciado";
  const isAuto=!(p.dscRitoAtual&&DISCOVERY_RITO_BY_ID[p.dscRitoAtual]);
  if(!editavel) return `<span class="est-stage-chip" style="border-color:var(--fn-orange);color:var(--fn-orange);background:#fff">${enc(effLabel)}</span>`;
  const opts=`<option value="">⟳ Automático · ${enc(effLabel)}</option>`+
    DISCOVERY_RITOS.map(r=>`<option value="${r.id}" ${(!isAuto&&p.dscRitoAtual===r.id)?'selected':''}>${enc(r.label)}</option>`).join("");
  return `<select class="est-sel etapa" data-proj="${enc(p.nome)}" data-kind="rito">${opts}</select>`;
}
function _dscSituacaoSel(p){
  const editavel=podeEditarDiscovery();
  const cur=p.dscSituacao||"";
  if(!editavel) return `<span class="est-ro">${enc(cur||'—')}</span>`;
  return `<select class="est-sel" data-proj="${enc(p.nome)}" data-kind="situacao"><option value="">—</option>${DISCOVERY_SITUACOES.map(s=>`<option ${s===cur?'selected':''}>${enc(s)}</option>`).join("")}</select>`;
}

function renderDiscoveryTabela(){
  const arr=discoveryFiltrados();
  const body=el("dscBody");
  if(!arr.length){ body.innerHTML=`<div class="est-empty"><i data-lucide="search" style="width:30px;height:30px;opacity:.4"></i><div style="margin-top:10px">Nenhum projeto na fase de Discovery com os filtros atuais.</div></div>`; lucideRefresh(); return; }
  const num=n=>`<span class="stage-num">${n}</span>`;
  const ritoHeads=DISCOVERY_RITOS.map((r,i)=>`<th class="stage-h">${num(i+1)}${enc(r.label)}</th>`).join("");
  const head=`<thead><tr>
    <th class="proj-h">Projeto</th>
    <th class="dsc-c-receb">Recebimento</th>
    <th class="dsc-c-an">Analistas</th>
    <th class="dsc-c-atv">Atividade atual</th>
    <th class="dsc-c-sit">Situação</th>
    ${ritoHeads}
  </tr></thead>`;
  const editavel=podeEditarDiscovery();
  const recebCell=(p)=>{
    const v=p.dtRecebimento||"";
    if(!editavel) return `<td class="dsc-c-receb"><span class="est-ro ${v?'':'empty'}">${_estFmt(v)}</span></td>`;
    return `<td class="dsc-c-receb"><input type="date" class="est-date${v?' filled':''}" data-proj="${enc(p.nome)}" data-field="dtRecebimento" value="${enc(v)}"></td>`;
  };
  const rows=arr.map(p=>{
    const ans=(p.analistas||[]);
    const anHtml = ans.length ? ans.map(a=>`<span class="est-an">${enc(a)}</span>`).join("") : `<span class="est-an none">sem analista</span>`;
    const dateCells=DISCOVERY_RITOS.map(r=>_dscDateCell(p,r)).join("");
    return `<tr data-proj="${enc(p.nome)}">
      <td class="proj-c"><div class="est-proj-name">${enc(p.nome)}</div><div class="est-proj-meta">${enc(p.segmentacao||'')}${p.gp?' · '+enc(p.gp):''}</div></td>
      ${recebCell(p)}
      <td class="dsc-c-an"><div class="est-analistas">${anHtml}</div></td>
      <td class="dsc-c-atv">${_dscRitoSel(p)}</td>
      <td class="dsc-c-sit">${_dscSituacaoSel(p)}</td>
      ${dateCells}
    </tr>`;
  }).join("");
  const ro = podeEditarDiscovery() ? "" : `<div style="padding:8px 20px;background:var(--fn-blue-bg);color:#1e40af;font-size:12px;border-bottom:1px solid var(--fn-blue-bd)">Você está em <b>somente leitura</b> — edição liberada para gestores e analistas da squad <b>Discovery</b>.</div>`;
  const minW = 794 + DISCOVERY_RITOS.length*140; // proj+receb+analistas+atividade+situação + N atividades
  body.innerHTML=ro+`<div class="est-scroll"><table class="est-table dsc-table" style="min-width:${minW}px">${head}<tbody>${rows}</tbody></table></div>`;
  bindDiscoveryInputs();
  lucideRefresh();
}

function bindDiscoveryInputs(){
  const scope=el("dscBody"); if(!scope)return;
  scope.querySelectorAll('input.est-date').forEach(inp=>{
    inp.addEventListener("change",()=>{
      if(inp.dataset.rito) discoveryEditRito(inp.dataset.proj, inp.dataset.rito, inp.value);
      else if(inp.dataset.field) discoveryEditField(inp.dataset.proj, inp.dataset.field, inp.value);
    });
  });
  scope.querySelectorAll('select.est-sel').forEach(sel=>{
    sel.addEventListener("change",()=>{
      const k=sel.dataset.kind;
      if(k==="rito") discoveryEditField(sel.dataset.proj,"dscRitoAtual",sel.value);
      else if(k==="situacao") discoveryEditField(sel.dataset.proj,"dscSituacao",sel.value);
      else if(k==="ritobool") discoveryEditRito(sel.dataset.proj, sel.dataset.rito, sel.value);
    });
  });
}

// Edita a DATA de um rito específico (objeto aninhado p.dscRitos — preserva os demais ritos).
function discoveryEditRito(nome, ritoId, value){
  if(!podeEditarDiscovery()){ alert("Sem permissão para editar o Discovery."); return; }
  const p=REG.projetos.find(x=>x.nome===nome); if(!p)return;
  const antes={dscRitos:Object.assign({},p.dscRitos||{})};
  p.dscRitos=Object.assign({},p.dscRitos||{});
  if(value)p.dscRitos[ritoId]=value; else delete p.dscRitos[ritoId];
  audit("project.discovery.rito",nome,antes,{dscRitos:p.dscRitos});
  persist(); _dscSaveHint(); _dscRerenderPreservandoScroll();
}
// Edita campos simples do Discovery (situação / rito atual).
function discoveryEditField(nome, field, value){
  if(!podeEditarDiscovery()){ alert("Sem permissão para editar o Discovery."); return; }
  const p=REG.projetos.find(x=>x.nome===nome); if(!p)return;
  const antes={}; antes[field]=p[field];
  p[field]=value;
  const depois={}; depois[field]=value;
  audit("project.discovery.update",nome,antes,depois);
  persist(); _dscSaveHint(); _dscRerenderPreservandoScroll();
}
function _dscRerenderPreservandoScroll(){
  const sc=el("dscBody").querySelector(".est-scroll");
  const top=sc?sc.scrollTop:0, left=sc?sc.scrollLeft:0;
  renderDiscoveryTabela();
  const sc2=el("dscBody").querySelector(".est-scroll");
  if(sc2){ sc2.scrollTop=top; sc2.scrollLeft=left; }
  lucideRefresh();
}
let _dscHintTimer=null;
function _dscSaveHint(){
  const h=el("dscSaveHint"); if(!h)return;
  h.classList.add("show");
  clearTimeout(_dscHintTimer);
  _dscHintTimer=setTimeout(()=>h.classList.remove("show"),1600);
}

/* ===================== eventos ===================== */
function bind(){
  el("selConsultor").addEventListener("change",e=>{consultor=e.target.value;renderAll();});
  // Filtro "Projetos": mostra os analistas alocados no projeto escolhido.
  // Ao selecionar um projeto, força a visão "Geral" (empilhada) para apresentar
  // TODOS os analistas do projeto de uma vez; ao limpar, mantém a visão atual.
  el("selProjFilter").addEventListener("change",e=>{
    gradeProjFilter=e.target.value||"";
    if(gradeProjFilter) viewMode="geral";
    renderAll();
  });
  // navegação temporal: depende do período atual (dia=±1d, semana=±7d, mês=±1m)
  // Navegação por período: agrupa cliques rápidos no mesmo frame para evitar
  // múltiplos renders em sequência (lentidão percebida com cliques repetidos).
  let _navPending=0;
  function _navShift(delta){
    _navPending+=delta;
    requestAnimationFrame(()=>{
      if(_navPending!==0){
        shiftPeriod(_navPending);
        _navPending=0;
        renderAll();
      }
    });
  }
  el("prevWk").addEventListener("click",()=>_navShift(-1));
  el("nextWk").addEventListener("click",()=>_navShift( 1));
  el("todayBtn").addEventListener("click",()=>{let hj=new Date(); while(hj.getDay()===0||hj.getDay()===6)hj=addDays(hj,1); refDate=hj;weekStart=monday(hj);renderAll();});
  // troca de Visão (Por analista / Geral)
  el("viewSeg").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{viewMode=btn.dataset.v;renderAll();}));
  // Toggle de Escopo (Líder/GP): "Meus" vs "Geral" (somente leitura)
  el("scopeSeg").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{
    if(!podeAlternarVisao())return;
    _viewMode=btn.dataset.vm;
    aplicarEstadoViewMode();
    renderAll();
  }));
  // troca de Período (Dia / Semana / Mês)
  el("periodSeg").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{
    period=btn.dataset.p;
    if(period==="semana")weekStart=monday(refDate||new Date());
    // se a troca de período cair no passado, puxa para o período atual (piso = hoje)
    if(estaNoPisoOuAntes(-1) && !ehPeriodoAtual()){
      let hoje=new Date(); while(hoje.getDay()===0||hoje.getDay()===6)hoje=addDays(hoje,1); refDate=hoje; weekStart=monday(hoje);
    }
    renderAll();
  }));
  el("acoesBtn").addEventListener("click",openActions);
  // Fase 2: toggle da camada previsto + abertura do modal de conflitos
  { const pv=el("previstoSeg"); if(pv) pv.querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{ _showPrevisto=(btn.dataset.pv==="on"); renderAll(); })); }
  { const cb=el("conflitosBtn"); if(cb) cb.addEventListener("click",openConflitos); }
  { const cc=el("conflitosClose"); if(cc) cc.addEventListener("click",closeConflitos); }
  { const gp=el("gerarPrevBtn"); if(gp) gp.addEventListener("click",openGerarPrev); }
  { const gpc=el("gerarPrevClose"); if(gpc) gpc.addEventListener("click",closeGerarPrev); }
  // roteador de telas (Fase 1): links com data-nav alternam Home ↔ Grade
  document.querySelectorAll(".sb-link[data-nav]").forEach(l=>l.addEventListener("click",()=>irPara(l.dataset.nav)));
  try{ irPara("home"); }catch(e){}
  // hamburger mobile: abre/fecha a sidebar como drawer
  { const nt=el("navToggle"); if(nt)nt.addEventListener("click",()=>el("sidebar").classList.toggle("open"));
    // clicar em qualquer .sb-link fecha o drawer no mobile
    document.querySelectorAll(".sb-link").forEach(l=>l.addEventListener("click",()=>{if(window.innerWidth<=900)el("sidebar").classList.remove("open");})); }
  // sidebar recolhível (desktop): encolhe para 64px e o conteúdo ocupa o resto
  { const sc=el("sbCollapse"), app=document.body;
    if(sc&&app){
      try{ if(localStorage.getItem("nsaloc.sbCollapsed")==="1"){ app.classList.add("sb-collapsed"); sc.title="Expandir menu"; sc.setAttribute("aria-label","Expandir menu"); } }catch(e){}
      sc.addEventListener("click",()=>{
        const col=app.classList.toggle("sb-collapsed");
        sc.title=col?"Expandir menu":"Recolher menu";
        sc.setAttribute("aria-label",sc.title);
        try{ localStorage.setItem("nsaloc.sbCollapsed",col?"1":"0"); }catch(e){}
      });
    } }
  // clicar na versão do rodapé abre a aba Releases
  el("reportsBtn").addEventListener("click",openReports);
  el("repClose").addEventListener("click",closeReports);
  el("repOverlay").addEventListener("click",e=>{if(e.target.id==="repOverlay")closeReports();});
  el("kpisBtn").addEventListener("click",openKPIs);
  el("kpiClose").addEventListener("click",closeKPIs);
  el("kpiOverlay").addEventListener("click",e=>{if(e.target.id==="kpiOverlay")closeKPIs();});
  // Esteira de Projetos
  el("esteiraClose").addEventListener("click",closeEsteira);
  el("esteiraOverlay").addEventListener("click",e=>{if(e.target.id==="esteiraOverlay")closeEsteira();});
  el("estViews").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
    estView=b.dataset.ev;
    el("estViews").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));
    renderEsteira();
  }));
  // Discovery (rituais da fase de Discovery)
  el("discoveryClose").addEventListener("click",closeDiscovery);
  el("discoveryOverlay").addEventListener("click",e=>{if(e.target.id==="discoveryOverlay")closeDiscovery();});
  el("dscViews").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
    dscView=b.dataset.dv;
    el("dscViews").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));
    renderDiscovery();
  }));
  { let _dscSearchT=null; el("dscSearch").addEventListener("input",e=>{ dscSearch=e.target.value; clearTimeout(_dscSearchT); _dscSearchT=setTimeout(()=>{ if(dscFiltroAplicado) renderDiscovery(); },180); }); }
  el("dscFilterRito").addEventListener("change",e=>{ dscFilterRito=e.target.value; if(dscFiltroAplicado) renderDiscovery(); });
  el("dscFilterSituacao").addEventListener("change",e=>{ dscFilterSituacao=e.target.value; if(dscFiltroAplicado) renderDiscovery(); });
  el("dscRecebDe").addEventListener("change",e=>{ dscRecebDe=e.target.value; dscFiltroAplicado=false; renderDiscovery(); });
  el("dscRecebAte").addEventListener("change",e=>{ dscRecebAte=e.target.value; dscFiltroAplicado=false; renderDiscovery(); });
  const dscApply=el("dscApplyFilter"); if(dscApply)dscApply.addEventListener("click",aplicarFiltroDiscovery);
  { let _estSearchT=null; el("estSearch").addEventListener("input",e=>{ estSearch=e.target.value; clearTimeout(_estSearchT); _estSearchT=setTimeout(()=>{ if(estFiltroAplicado) renderEsteira(); },180); }); }
  el("estFilterEtapa").addEventListener("change",e=>{ estFilterEtapa=e.target.value; if(estFiltroAplicado) renderEsteira(); });
  el("estFilterStatus").addEventListener("change",e=>{ estFilterStatus=e.target.value; if(estFiltroAplicado) renderEsteira(); });
  const estDe=el("estPeriodoDe"); if(estDe)estDe.addEventListener("change",e=>{ estPeriodoDe=e.target.value; estFiltroAplicado=false; renderEsteira(); });
  const estAte=el("estPeriodoAte"); if(estAte)estAte.addEventListener("change",e=>{ estPeriodoAte=e.target.value; estFiltroAplicado=false; renderEsteira(); });
  const estApply=el("estApplyFilter"); if(estApply)estApply.addEventListener("click",aplicarFiltroEsteira);
  el("actClose").addEventListener("click",closeActions);
  el("actOverlay").addEventListener("click",e=>{if(e.target.id==="actOverlay")closeActions();});
  // Modal de consulta do slot
  el("mClose").addEventListener("click",closeAlloc);
  el("mFechar").addEventListener("click",closeAlloc);
  el("overlay").addEventListener("click",e=>{if(e.target.id==="overlay")closeAlloc();});
  { const ac=el("ataClose");  if(ac) ac.addEventListener("click",closeAta); }
  { const af=el("ataFechar"); if(af) af.addEventListener("click",closeAta); }
  { const as=el("ataSalvar"); if(as) as.addEventListener("click",salvarAta); }
  { const ai=el("ataImprimir"); if(ai) ai.addEventListener("click",imprimirAta); }
  { const ao=el("ataOverlay");if(ao) ao.addEventListener("click",e=>{if(e.target.id==="ataOverlay")closeAta();}); }
  { const ac=el("atasClose"); if(ac) ac.addEventListener("click",closeAtasReport); }
  { const aa=el("atasAplicar"); if(aa) aa.addEventListener("click",aplicarPeriodoAtas); }
  { const ao2=el("atasOverlay");if(ao2) ao2.addEventListener("click",e=>{if(e.target.id==="atasOverlay")closeAtasReport();}); }
  // Modal de Incluir Alocação
  el("incluirAlocBtn").addEventListener("click",()=>openIncluirAloc({}));
  el("incClose").addEventListener("click",closeIncluirAloc);
  el("iCancelar").addEventListener("click",closeIncluirAloc);
  el("incOverlay").addEventListener("click",e=>{if(e.target.id==="incOverlay")closeIncluirAloc();});
  el("iAnalista").addEventListener("change",()=>buildClienteSelectInc(el("iCliente").value));
  el("iAtividade").addEventListener("change",()=>{ buildClienteSelectInc(el("iCliente").value); atualizaCamposPorTipoInc(); });
  el("iCliente").addEventListener("change",()=>{
    const atv=el("iAtividade").value;
    renderAtividadeSelectInc(atv);
    atualizaCamposPorTipoInc();
  });
  el("iData").addEventListener("change",()=>{
    // sincroniza range start com a nova data
    const iso=el("iData").value;
    if(iso)el("iRangeFrom").value=iso;
  });
  el("iSave").addEventListener("click",saveIncluirAloc);
  el("iApplyDay").addEventListener("click",applyDayInc);
  el("iApplyWeek").addEventListener("click",applyWeekInc);
  el("iApplyRange").addEventListener("click",applyRangeInc);
  el("iApplyRitual").addEventListener("click",applyRitualInc);
  el("iRitualDows").addEventListener("click",e=>{
    const c=e.target.closest(".dow-chip"); if(!c)return;
    const wd=+c.dataset.wd;
    if(_ritualDows.has(wd))_ritualDows.delete(wd); else _ritualDows.add(wd);
    c.classList.toggle("on"); updateRitualPreview();
  });
  el("iRitualCad").addEventListener("change",updateRitualPreview);
  el("iRitualFrom").addEventListener("change",updateRitualPreview);
  el("iRitualTo").addEventListener("change",updateRitualPreview);
  el("logoutBtn").addEventListener("click",doLogout);
  el("authLoginBtn").addEventListener("click",doLogin);
  // O botão "configurar conexão" foi removido da tela de login (config vem do código fonte).
  // O modal #cfgOverlay continua existindo para uso interno/manual via console, se necessário.
  const _cfgBtn=el("authCfgBtn"); if(_cfgBtn)_cfgBtn.addEventListener("click",openCfg);
  el("cfgClose").addEventListener("click",closeCfg);
  el("cfgOverlay").addEventListener("click",e=>{if(e.target.id==="cfgOverlay")closeCfg();});
  // Modal de troca de senha
  el("pwdClose").addEventListener("click",closePwdModal);
  el("pwdLater").addEventListener("click",laterPwdModal);
  el("pwdSave").addEventListener("click",salvarNovaSenha);
  el("pwdOverlay").addEventListener("click",e=>{if(e.target.id==="pwdOverlay" && _pwdMode!=="force")el("pwdOverlay").classList.remove("open");});
  el("cfgSave").addEventListener("click",saveFirebaseConfig);
  el("cfgCopy").addEventListener("click",copyMyConfig);
  el("cfgClear").addEventListener("click",clearFirebaseConfig);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeAlloc();closeActions();closeCfg();closeReports();closeKPIs();closeEsteira();closeDiscovery();try{closeAta();}catch(_e){}try{closeAtasReport();}catch(_e){}try{closeConflitos();}catch(_e){}try{closeGerarPrev();}catch(_e){}}});
  el("resetBtn").addEventListener("click",()=>{
    if(!isAdmin()){alert("Apenas administradores podem restaurar os dados de exemplo.");return;}
    if(!confirm("Restaurar os dados de exemplo? Isso sobrescreve os cadastros e alocações atuais na nuvem."))return;
    REG={lideres:[],analistas:[],projetos:[],feriados:[],gps:[],lideresInativos:{},gpsInativos:{}};DATA={};PREV={};
    seedReg();seedAlloc();persist();persistPrev();renderConsultorSelect();renderAll();
  });
}

/* ===================== init ===================== */
(function(){
  // 1) carrega base local (pinta algo na hora; a nuvem assume depois do login)
  try{
    const reg=JSON.parse(localStorage.getItem(REG_KEY)||"null");
    const alloc=JSON.parse(localStorage.getItem(ALLOC_KEY)||"null");
    if(reg&&reg.analistas&&reg.analistas.length)REG=reg; else seedReg();
    if(alloc&&Object.keys(alloc).length)DATA=alloc; else seedAlloc();
    const prev=JSON.parse(localStorage.getItem(PREV_KEY)||"null"); if(prev&&typeof prev==="object")PREV=prev;
  }catch(e){seedReg();seedAlloc();}
  REG.feriados=REG.feriados||[];REG.gps=REG.gps||[];REG.lideresInativos=REG.lideresInativos||{};REG.gpsInativos=REG.gpsInativos||{};REG.lideresEmails=REG.lideresEmails||{};REG.gpsEmails=REG.gpsEmails||{};REG.atividades=REG.atividades&&REG.atividades.length?REG.atividades:seedAtividades();
  // refDate = hoje (pulando fim de semana). weekStart é SEMPRE ancorado na segunda
  // de refDate — assim a grade nunca abre numa semana passada por causa de um seed/
  // estado antigo, o que travava as setas de navegação (a regra de "piso" compara
  // sempre com hoje).
  if(!refDate){refDate=new Date(); while(refDate.getDay()===0||refDate.getDay()===6)refDate=addDays(refDate,1);}
  weekStart=monday(refDate);
  bind();
  lucideRefresh(); /* Fase 4: observador global removido; cobertura agora explicita por funcao */

  // 2) fluxo de autenticação (porteiro) — só mostra dados após login
  // === BLINDAGEM DE PRODUÇÃO ===
  // Se AUTH_ENABLED=false e o hostname NÃO é localhost/127.0.0.1/file://,
  // recusamos abrir o app sem autenticação. Isto impede que alguém:
  //   (a) hospede o HTML em domínio público e esqueça o flag em false; ou
  //   (b) baixe o HTML, troque o flag e logue como "admin" só localmente sem
  //       perceber que ainda assim o Firebase exigirá um token autenticado
  //       (lembrar: as Regras do RTDB devem bloquear escritas anônimas).
  const _isLocal = (location.hostname==="localhost" || location.hostname==="127.0.0.1" || location.protocol==="file:");
  const _devModeRequested = !AUTH_ENABLED;
  if(_devModeRequested && !_isLocal){
    // Bloqueio duro: mostra tela cheia de erro e impede continuação.
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:#fef2f2;display:flex;align-items:center;justify-content:center;padding:24px;z-index:999999">
        <div style="background:#fff;border:1px solid #fecaca;border-radius:16px;padding:32px;max-width:560px;text-align:center;box-shadow:0 12px 40px rgba(220,38,38,.12);font-family:'Inter',system-ui,sans-serif">
          <div style="font-size:48px;margin-bottom:12px">🔒</div>
          <h1 style="font-size:20px;color:#dc2626;margin:0 0 10px;font-weight:800;letter-spacing:-.01em">Configuração inválida para produção</h1>
          <p style="font-size:14px;color:#374151;line-height:1.5;margin:0 0 14px">O sistema NS ALOC foi publicado em um servidor remoto (<b>${location.hostname}</b>) com a constante <code style="background:#fef2f2;padding:2px 6px;border-radius:4px;color:#dc2626;font-family:monospace;font-size:13px">AUTH_ENABLED = false</code>.</p>
          <p style="font-size:14px;color:#374151;line-height:1.5;margin:0 0 14px">Este modo só funciona em <b>desenvolvimento local</b> (localhost). Em qualquer outro ambiente, é necessário ter autenticação ativa.</p>
          <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:14px 0 0">Para corrigir, edite o arquivo HTML e mude para <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;color:#111;font-family:monospace;font-size:12px">const AUTH_ENABLED = true;</code> antes de publicar.</p>
        </div>
      </div>`;
    console.error("[NS ALOC] AUTH_ENABLED=false em hostname público ("+location.hostname+"). App bloqueado.");
    return; // aborta initApp
  }

  if(!AUTH_ENABLED){
    // ----- Modo DEV LOCAL (login desativado) — APENAS em localhost/127.0.0.1/file:// -----
    // Esconde a tela de login, entra como admin local e segue para a grade.
    console.warn("[NS ALOC] AUTH_ENABLED=false em ambiente local ("+location.hostname+"). Entrando como admin sem login. Não use isto em produção.");
    // banner visível no topo do header pra você nunca esquecer
    const bn=document.createElement("div");
    bn.style.cssText="position:fixed;top:0;left:0;right:0;background:#b07a1e;color:#fff;font:600 11.5px 'Inter';text-align:center;padding:4px;z-index:200;letter-spacing:.04em";
    bn.textContent="⚠ MODO DE DESENVOLVIMENTO LOCAL · login desativado · só funciona em localhost · reative antes de publicar.";
    document.body.appendChild(bn);
    document.querySelector("header").style.top="22px"; // empurra o header pra baixo do banner
    hideAuth();
    _currentUser={email:"local@dev",uid:"local"};
    _currentRole="admin";
    setUserLabel("local@dev (sem login)");
    el("logoutBtn").style.display="none";  // sem login → sem logout
    applyRoleToUI();
    consultor=consultor||analistaNomes()[0]||null;
    renderConsultorSelect();renderAll();
    // Se houver Firebase configurado, ainda sincroniza com a nuvem (sem exigir login).
    // Atenção: isto só funcionará se as Regras do Realtime Database permitirem leitura/escrita
    // sem autenticação (NÃO recomendado em produção). Caso contrário, o app fica só local.
    if(_db){
      _fbReady=true;  // pula a checagem de auth para que persist() comece a salvar
      try{ startDataSync(); }catch(e){ console.warn("[Alocações] sync local falhou:",e); setSyncBadge("local"); }
    }else{
      setSyncBadge("local");
    }
  }
  else if(_db&&_auth){
    showAuth("loading");
    // proteção: se onAuthStateChanged não disparar em 5s, sai do loading
    let _authFired=false;
    const _authSafeguard=setTimeout(()=>{
      if(_authFired)return;
      console.warn("[Alocações] onAuthStateChanged não disparou em 5s — caindo para tela de login.");
      setUserLabel(""); showAuth("login");
    },5000);
    try{
      _auth.onAuthStateChanged(user=>{
        _authFired=true; clearTimeout(_authSafeguard);
        if(user){
          _currentUser=user; setUserLabel(user.email);
          checarAcessoCore(user).then(function(podeEntrar){
            if(!podeEntrar){ mostrarSemAcesso(user); return; }
            hideAuth();
            registerAndLoadRole(user).then(()=>startDataSync())
              .catch(err=>console.warn("[Alocações] erro ao carregar perfil:",err));
          }).catch(function(){
            // se a própria checagem explodir, segue o fluxo normal (fail-safe)
            hideAuth();
            registerAndLoadRole(user).then(()=>startDataSync())
              .catch(err=>console.warn("[Alocações] erro ao carregar perfil:",err));
          });
        }else{
          _syncStarted=false;_usersStarted=false;_initialLoadDone=false;_currentUser=null;_currentRole="leitura";_linkedAnalyst="";_linkedLider="";_linkedGp="";
          try{_db.ref(DB_PATH).off();_db.ref(USERS_PATH).off();}catch(e){}
          setUserLabel(""); showAuth("login");
        }
      }, err=>{
        _authFired=true; clearTimeout(_authSafeguard);
        console.error("[Alocações] erro no onAuthStateChanged:",err);
        el("authError").textContent="Erro de autenticação: "+(err.message||err.code||"desconhecido");
        setUserLabel(""); showAuth("login");
      });
    }catch(e){
      _authFired=true; clearTimeout(_authSafeguard);
      console.error("[Alocações] exceção em onAuthStateChanged:",e);
      setUserLabel(""); showAuth("login");
    }
  }else{
    // sem Firebase configurado ainda (projeto novo): pede a conexão
    setSyncBadge("local"); showAuth("config");
    consultor=consultor||analistaNomes()[0]||null;
    renderConsultorSelect();renderAll();
  }
})();

/* ===== INTEGRACAO FORMA -> NS ALOC (Fase 2 + 1b + de-para) - inicio ===== */
/* ========================================================================
   INTEGRACAO FORMA -> NS ALOC  (Fase 2 | ALOC puxa capacitacao em tempo real)
   - Leitura read-only do projeto Firebase de Capacitacao (capacitacaonstech)
   - Casamento de analista por e-mail corporativo (fallback: nome normalizado)
   - Tenta 'kmm5/publicSnapshot'; se ausente, usa 'kmm5/data' + 'kmm5/users' + 'kmm5/stageDefinitions'
   ====================================================================== */
const CAP_FB_CONFIG = { databaseURL: "https://capacitacaonstech-default-rtdb.firebaseio.com" };
let _capApp=null, _capDb=null, _capStarted=false, _capDataSubbed=false;
/* Fase 3: conecta a Capacitação sob demanda (idempotente via _capStarted).
   Após conectar, atualiza o header para o badge do consultor aparecer. */
function ensureCapIntegration(){
  if(_capStarted) return;
  try{ initCapIntegration(); }catch(e){ console.warn("[cap] init falhou:", e); }
}
let _capByEmail={}, _capByName={}, _capOk=false, _capUpdatedAt=0;
let _capStageDefs=null, _capUsersEmail={}, _capRawAnalysts=null;
let _capStages={};   // catalogo de etapas por trilha (vindo do FORMA) p/ o seletor de de-para

const _cNorm = s => (s==null?"":String(s)).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g," ");

function initCapIntegration(){
  if(_capStarted) return; _capStarted=true;  try{
    _capApp = (firebase.apps||[]).find(a=>a.name==="capReader") || firebase.initializeApp(CAP_FB_CONFIG, "capReader");
    _capDb  = _capApp.database();
  }catch(e){ console.warn("[cap] init app:", e); return; }

  _capDb.ref("kmm5/publicSnapshot").on("value", s=>{
    const v=s.val();
    if(v && (v.analysts||v.byAnalyst)){ _ingestCapSnapshot(v); }
    else { _subscribeCapData(); }
  }, e=>{ console.warn("[cap] publicSnapshot:", e); _subscribeCapData(); });
}

function _subscribeCapData(){
  if(_capDataSubbed) return; _capDataSubbed=true;
  _capDb.ref("kmm5/stageDefinitions").on("value", s=>{ _capStageDefs=s.val()||null; _rebuildCapFromData(); }, e=>console.warn("[cap] stageDefs:", e));
  _capDb.ref("kmm5/users").on("value", s=>{
    const u=s.val()||{}; const m={};
    Object.values(u).forEach(x=>{ if(x && x.linkedAnalystId && x.email) m[x.linkedAnalystId]=x.email; });
    _capUsersEmail=m; _rebuildCapFromData();
  }, e=>console.warn("[cap] users:", e));
  _capDb.ref("kmm5/data").on("value", s=>{
    const d=s.val()||{}; _capRawAnalysts=Array.isArray(d.analysts)?d.analysts:[]; _rebuildCapFromData();
  }, e=>console.warn("[cap] data:", e));
}

function _capRequired(track, stageName){
  try{
    const defs=(_capStageDefs && _capStageDefs[track]) ? _capStageDefs[track] : null;
    if(!defs) return 0;
    const def=defs.find(x=>x.name===stageName);
    const m=(def && def.duration)?String(def.duration).match(/(\d+)\s*projeto/i):null;
    return m?parseInt(m[1],10):0;
  }catch(e){ return 0; }
}

function _capRecord(a){
  // % da trilha a partir do checklist (mesma base do painel de evolucao do FORMA)
  let tot=0, done=0;
  const cl=a.checklist||{};
  Object.keys(cl).forEach(st=>{ const items=cl[st]||[]; tot+=items.length; done+=items.filter(i=>i&&i.done).length; });
  const pct = tot?Math.round((done/tot)*100):0;
  const stage=a.stage||"", status=a.status||"";
  const concl = /conclu/i.test(stage);
  let statusKey="formacao", statusLab="Em formacao";
  if(status==="Certificado" || /Trilha 02 Conclu/i.test(stage)){ statusKey="apto"; statusLab="Apto / Certificado"; }
  else if(concl){ statusKey="apto"; statusLab="Trilha concluida"; }
  else if(status==="Aguardando avaliacao" || status==="Aguardando avaliação"){ statusKey="avaliacao"; statusLab="Aguardando avaliacao"; }
  const req=_capRequired(a.track, stage);
  const theoretical = (req===0) && (statusKey==="formacao");
  return { nome:a.name||"", email:(a.email||_capUsersEmail[a.id]||""), track:a.track||"", module:a.module||"", stage:stage, pct:pct, statusKey:statusKey, statusLab:statusLab, requiredProjects:req, theoretical:theoretical };
}

function _rebuildCapFromData(){
  if(!Array.isArray(_capRawAnalysts)) return;
  _capByEmail={}; _capByName={};
  _capRawAnalysts.forEach(a=>{
    if(!a||!a.name) return;
    const r=_capRecord(a);
    _capByName[_cNorm(r.nome)]=r;
    if(r.email) _capByEmail[_cNorm(r.email)]=r;
  });
  _capOk=true; _capUpdatedAt=Date.now();
  try{ if(_capStageDefs){ const sg={}; Object.keys(_capStageDefs).forEach(tk=>{ sg[tk]=(_capStageDefs[tk]||[]).map(s=>s.name); }); _capStages=sg; } }catch(e){}
  _capRefreshUI();
}

function _ingestCapSnapshot(v){
  const list=v.analysts||Object.values(v.byAnalyst||{});
  _capByEmail={}; _capByName={};
  (list||[]).forEach(r=>{
    if(!r||!r.nome) return;
    r.statusKey=r.statusKey||"formacao";
    r.theoretical = (typeof r.theoretical==="boolean") ? r.theoretical : ((r.requiredProjects||0)===0 && r.statusKey==="formacao");
    _capByName[_cNorm(r.nome)]=r;
    if(r.email) _capByEmail[_cNorm(r.email)]=r;
  });
  _capOk=true; _capUpdatedAt=v.updatedAt||Date.now();
  if(v.stages && typeof v.stages==="object") _capStages=v.stages;
  _capRefreshUI();
}

function capStageSelectOptions(curTrack,curStage){
  const cur=(curTrack||curStage)?((curTrack||"")+"\u241F"+(curStage||"")):"";
  let html=`<option value="" ${cur===""?"selected":""}>\u2014 (nenhuma)</option>`;
  const tracks=Object.keys(_capStages||{});
  tracks.forEach(tk=>{
    html+=`<optgroup label="${enc(tk)}">`;
    (_capStages[tk]||[]).forEach(st=>{ const v=tk+"\u241F"+st; html+=`<option value="${enc(v)}" ${v===cur?"selected":""}>${enc(st)}</option>`; });
    html+=`</optgroup>`;
  });
  return html;
}

function findCapFor(nome){
  if(!nome) return null;
  let email=""; try{ email=emailAnalista(nome)||""; }catch(e){}
  if(email && _capByEmail[_cNorm(email)]) return _capByEmail[_cNorm(email)];
  if(_capByName[_cNorm(nome)]) return _capByName[_cNorm(nome)];
  return null;
}

function _capRefreshUI(){
  try{ if(typeof renderHeader==="function") renderHeader(); }catch(e){}
  try{
    const ov=el("kpiOverlay");
    if(ov && ov.classList.contains("open") && kpiTab==="capac" && typeof renderKPIs==="function") renderKPIs();
  }catch(e){}
}

function _capStageShort(s){ return String(s||"").replace(/^Etapa\s*\d+\s*[\u2014\-]\s*/i,"").trim() || s || "\u2014"; }

function capacBadgeFor(nome){
  const r=findCapFor(nome);
  if(!r){ return ""; }
  const pillCls = r.statusKey==="apto"?"cap-apto":(r.statusKey==="avaliacao"?"cap-aval":"cap-form");
  const trilha = r.track || "\u2014";
  const etapa  = _capStageShort(r.stage);
  return `<div class="cap-badge-wrap">
    <span class="cap-badge"><i data-lucide="graduation-cap"></i> ${enc(trilha)} &middot; <b>${enc(etapa)}</b></span>
    <span class="cap-badge cap-pct">${r.pct}%</span>
    <span class="cap-badge ${pillCls}">${enc(r.statusLab)}</span>
  </div>`;
}

function _capacKpiBody(ns, dias, fer){
  const recs = ns.map(n=>({ nome:n, rec:findCapFor(n) }));
  const comCap = recs.filter(x=>x.rec);
  const total = ns.length;
  const aptos = comCap.filter(x=>x.rec.statusKey==="apto").length;
  const aval  = comCap.filter(x=>x.rec.statusKey==="avaliacao").length;
  const form  = comCap.filter(x=>x.rec.statusKey==="formacao").length;
  const semCap= total - comCap.length;
  const t1 = comCap.filter(x=>/01/.test(x.rec.track)).length;
  const t2 = comCap.filter(x=>/02/.test(x.rec.track)).length;
  const pctMedio = comCap.length?Math.round(comCap.reduce((a,x)=>a+(x.rec.pct||0),0)/comCap.length):0;

  // RISCO: alocado em Implantacao real no periodo, porem ainda em etapa teorica
  const risco=[];
  recs.forEach(x=>{
    if(!x.rec || !x.rec.theoretical) return;
    let proj=0; try{ proj=(contarSlots(x.nome,dias,fer)||{}).proj||0; }catch(e){ proj=0; }
    if(proj>0) risco.push({ nome:x.nome, etapa:_capStageShort(x.rec.stage), track:x.rec.track, slots:proj });
  });

  const card=(l,n,sub,accent)=>`<div class="kpi-card ${accent||''}"><div class="kpi-l">${l}</div><div class="kpi-n">${n}</div><div class="kpi-sub">${enc(sub||'')}</div></div>`;

  const fonte = _capOk ? ("Sincronizado com FORMA"+(_capUpdatedAt?(" \u00b7 "+new Date(_capUpdatedAt).toLocaleString("pt-BR")):"")) : "Aguardando conexao com FORMA...";

  const riscoRows = risco.length
    ? risco.sort((a,b)=>b.slots-a.slots).map(r=>`<tr><td>${enc(r.nome)}</td><td>${enc(r.track||"\u2014")}</td><td>${enc(r.etapa)}</td><td>${r.slots} slot(s)</td></tr>`).join("")
    : `<tr><td colspan="4" class="cap-none">Nenhum risco detectado no periodo \u2014 ninguem em etapa teorica alocado em implantacao real.</td></tr>`;

  const tabela = comCap.length
    ? comCap.slice().sort((a,b)=>(b.rec.pct||0)-(a.rec.pct||0)).map(x=>{
        const r=x.rec; const cls=r.statusKey==="apto"?"cap-apto":(r.statusKey==="avaliacao"?"cap-aval":"cap-form");
        return `<tr><td>${enc(x.nome)}</td><td>${enc(r.track||"\u2014")}</td><td>${enc(_capStageShort(r.stage))}</td><td><div class="cap-mini-track"><div class="cap-mini-fill" style="width:${r.pct}%"></div></div><span class="cap-mini-pct">${r.pct}%</span></td><td><span class="cap-badge ${cls}">${enc(r.statusLab)}</span></td></tr>`;
      }).join("")
    : `<tr><td colspan="5" class="cap-none">Nenhum analista do escopo encontrado no FORMA (verifique e-mail/nome).</td></tr>`;

  return `
  <div class="cap-src-line">${enc(fonte)}</div>
  <div class="kpi-group">
    <div class="kpi-group-title"><span class="ico">\uD83C\uDF93</span> Capacitacao &middot; visao geral</div>
    <div class="kpi-grid">
      ${card("Aptos / Certificados", aptos, "prontos para projeto cliente", "accent-proj")}
      ${card("Em formacao", form, "ainda em capacitacao")}
      ${card("Aguardando avaliacao", aval, "etapa concluida, falta validar")}
      ${card("Sem vinculo no FORMA", semCap, "nao encontrados na Capacitacao")}
      ${card("Progresso medio", pctMedio+"%", "media de conclusao das trilhas")}
      ${card("Trilha 01 / 02", t1+" / "+t2, "distribuicao por trilha")}
    </div>
  </div>
  <div class="kpi-group">
    <div class="kpi-group-title"><span class="ico">\u26A0\uFE0F</span> Risco &middot; etapa teorica em implantacao real <span class="cap-risk-n">${risco.length}</span></div>
    <table class="cap-tbl"><thead><tr><th>Analista</th><th>Trilha</th><th>Etapa atual</th><th>Slots de implantacao</th></tr></thead><tbody>${riscoRows}</tbody></table>
  </div>
  <div class="kpi-group">
    <div class="kpi-group-title"><span class="ico">\uD83D\uDCCB</span> Capacitacao por analista (no escopo)</div>
    <table class="cap-tbl"><thead><tr><th>Analista</th><th>Trilha</th><th>Etapa atual</th><th>Progresso</th><th>Situacao</th></tr></thead><tbody>${tabela}</tbody></table>
  </div>`;
}

(function _capStyles(){
  if(typeof document==="undefined") return;
  if(document.getElementById("capStyleTag")) return;
  const css = ".cap-badge-wrap{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}"
  +".cap-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;border-radius:999px;padding:3px 9px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;line-height:1.2}"
  +".cap-badge [data-lucide]{width:13px;height:13px}"
  +".cap-badge.cap-pct{background:#fff7ed;color:#c2410c;border-color:#fed7aa}"
  +".cap-badge.cap-apto{background:#f0fdf4;color:#15803d;border-color:#bbf7d0}"
  +".cap-badge.cap-aval{background:#fffbeb;color:#b45309;border-color:#fde68a}"
  +".cap-badge.cap-form{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}"
  +".cap-src-line{font-size:11px;color:#9ca3af;margin:2px 2px 14px}"
  +".cap-risk-n{margin-left:auto;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:999px;font-size:12px;padding:1px 9px;font-weight:800}"
  +".cap-tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:4px}"
  +".cap-tbl th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;padding:6px 8px;border-bottom:1px solid #eef0f2;font-weight:700}"
  +".cap-tbl td{padding:7px 8px;border-bottom:1px solid #f3f4f6;color:#374151}"
  +".cap-none{color:#9ca3af;text-align:center;padding:14px}"
  +".cap-mini-track{display:inline-block;vertical-align:middle;width:84px;height:8px;background:#f1f3f5;border-radius:999px;overflow:hidden;margin-right:7px}"
  +".cap-mini-fill{height:100%;background:#E55810;border-radius:999px}"
  +".cap-mini-pct{font-size:11.5px;color:#6b7280;font-weight:700}";
  const tag=document.createElement("style"); tag.id="capStyleTag"; tag.textContent=css; document.head.appendChild(tag);
})();

/* ===== Publicador enxuto: alocacoes/publicSnapshot (consumido pelo FORMA) ===== */
function _alocCatBucket(reg){
  try{
    const c = categoria(reg); // c-proj,c-dsc,c-svc,c-rot,c-int,c-aus,c-livre,empty
    return ({ "c-proj":"proj","c-dsc":"dsc","c-svc":"svc","c-rot":"int","c-int":"int","c-aus":"aus" })[c] || null;
  }catch(e){ return null; }
}
function buildAlocSnapshot(dataMap){
  const _D = dataMap || DATA;
  const byNome={};
  const actStage={}; (REG.atividades||[]).forEach(x=>{ if(x&&x.nome&&(x.capStage||x.capTrack)) actStage[x.nome]={capTrack:x.capTrack||"",capStage:x.capStage||""}; });
  Object.keys(_D).forEach(k=>{
    const i=k.split("__"); const nome=i[0], iso=i[1], slot=i[2];
    if(!nome||!iso||!slot) return;
    const reg=_D[k]; const cat=_alocCatBucket(reg);
    if(!cat) return;
    const cli=(reg&&typeof reg==="object")?(reg.cliente||""):(typeof reg==="string"?reg:"");
    const atv=(reg&&typeof reg==="object")?(reg.atividade||""):"";
    const obs=(reg&&typeof reg==="object")?(reg.obs||""):"";
    let email=""; try{ email=emailAnalista(nome)||""; }catch(e){}
    let lider=""; try{ lider=liderDe(nome)||""; }catch(e){}
    if(!byNome[nome]) byNome[nome]={nome:nome,email:email,lider:lider,entries:[],buckets:{proj:0,dsc:0,svc:0,int:0,aus:0},projetos:{}};
    const ag=byNome[nome];
    const _ms=actStage[atv]||actStage[cli]||null;
    ag.entries.push({iso:iso,slot:slot,atividade:atv,cliente:cli,obs:obs,cat:cat,capTrack:(_ms&&_ms.capTrack)||"",capStage:(_ms&&_ms.capStage)||""});
    ag.buckets[cat]=(ag.buckets[cat]||0)+1;
    if(cat==="proj" && cli) ag.projetos[cli]=(ag.projetos[cli]||0)+1;
  });
  const analysts=Object.keys(byNome).map(k=>byNome[k]);
  const refs=new Set(); analysts.forEach(a=>Object.keys(a.projetos).forEach(p=>refs.add(p)));
  const projetos={};
  (REG.projetos||[]).forEach(p=>{ if(p&&p.nome&&refs.has(p.nome)) projetos[p.nome]={tipo:p.tipo||"",gp:p.gp||"",lider:p.lider||"",segmentacao:p.segmentacao||"",status:p.status||""}; });
  return { analysts:analysts, projetos:projetos, updatedAt:Date.now() };
}
function _publishAlocSnapshot(){
  if(!_db) return;
  if(ALLOC_WINDOWED_READ){
    // Em modo janela, DATA é parcial: monta o snapshot a partir de TODOS os buckets.
    _lerTodosBuckets().then(full=>{
      try{
        const snap=sanitizeForFirebase(buildAlocSnapshot(full));
        _db.ref("alocacoes/publicSnapshot").set(snap).catch(e=>{ if(!(e&&e.code==="PERMISSION_DENIED")) console.warn("[pub-aloc]",e); });
      }catch(e){ console.warn("[pub-aloc build]",e); }
    }).catch(e=>console.warn("[pub-aloc buckets]",e));
    return;
  }
  try{
    const snap=sanitizeForFirebase(buildAlocSnapshot());
    _db.ref("alocacoes/publicSnapshot").set(snap).catch(e=>{ if(!(e&&e.code==="PERMISSION_DENIED")) console.warn("[pub-aloc]",e); });
  }catch(e){ console.warn("[pub-aloc build]",e); }
}
setTimeout(function(){ try{ if(typeof _initialLoadDone!=="undefined" && _initialLoadDone) _publishAlocSnapshot(); }catch(e){} }, 5000);

/* ===== INTEGRACAO FORMA -> NS ALOC - fim ===== */
