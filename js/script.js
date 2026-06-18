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
  const colHStyle = dayW ? `min-width:${dayW}px;width
