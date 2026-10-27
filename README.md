# ⏱️ FOCUS

<p align="center">
  <strong>Temporizador Pomodoro minimalista de alta precisão, focado em produtividade sem distrações e privacidade local-first.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Vitest-5.0-green?logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Oxlint-passing-brightgreen" alt="Oxlint" />
  <img src="https://img.shields.io/badge/Storage-IndexedDB-orange" alt="IndexedDB" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" alt="License" />
</p>

---

## 🎯 Sobre o Projeto

O **FOCUS** é uma aplicação web progressiva (PWA) de gerenciamento de tempo e produtividade baseada na técnica Pomodoro. Desenvolvido com uma estética minimalista monocromática (preto e branco), o projeto elimina elementos visuais supérfluos para proporcionar máxima concentração e imersão nas suas sessões de trabalho e estudo.

Todos os dados são armazenados localmente no navegador via **IndexedDB** (`idb`), garantindo total privacidade e funcionamento offline sem a necessidade de contas ou servidores externos.

---

## ✨ Funcionalidades Principais

- ⏱️ **Motor de Timer Robusto**:
  - Ciclos de Foco (25 min padrão), Pausa Curta (5 min) e Pausa Longa (15 min).
  - Cálculo preciso de tempo baseado em timestamps do relógio (`Date.now()`), imune a suspensão de abas ou atrasos de `setInterval`.
  - Transições de estado automáticas ou manuais configuráveis.
  - Tela de confirmação amigável para pausas antecipadas (*early exit*).

- 📋 **Gestão de Tarefas Integrada**:
  - Criação, edição e conclusão de tarefas com estimativa de pomodoros.
  - Associação de tarefas à sessão ativa e rastreamento de pomodoros executados por item.

- 📊 **Estatísticas e Histórico**:
  - Métricas diárias de tempo em foco e progresso em relação à meta diária.
  - Gráfico de histórico dos últimos 7 dias e distribuição de tempo por tarefa.
  - Histórico detalhado de sessões concluídas e interrompidas com filtros por período.

- 🔔 **Áudio, Notificações & Wake Lock**:
  - Alertas sonoros sintetizados nativamente via **Web Audio API** (sem dependência de arquivos externos).
  - Notificações nativas do navegador com suporte a permissão assíncrona.
  - **Screen Wake Lock API** para impedir que a tela do dispositivo apague durante uma sessão ativa.
  - Título e favicon dinâmicos que refletem o progresso e o tempo restante diretamente na aba.

- ⌨️ **Atalhos de Teclado Rápidos**:
  - `Espaço`: Iniciar / Pausar
  - `S`: Pular sessão
  - `R`: Reiniciar timer
  - `M`: Alternar som ligado/desligado

- 💾 **Privacidade & Backup Completo**:
  - Exportação e importação de dados em formato JSON para fácil backup e portabilidade.
  - Reset de dados com confirmação de segurança.

- 📱 **Progressive Web App (PWA)**:
  - Instalável no desktop ou celular via `manifest.json`.
  - Cache offline com Service Worker registrado.

---

## 📁 Estrutura de Diretórios

O projeto segue uma arquitetura modular, com separação clara de responsabilidades entre regras de negócio (*Domain*), interfaces com o navegador (*Services*), estado React (*Hooks*) e apresentação (*Components*):

```
focus/
├── .github/
│   └── workflows/
│       └── ci.yml               # Pipeline de integração contínua (GitHub Actions)
├── public/
│   ├── favicon.svg              # Ícone SVG da aplicação
│   ├── icons.svg                # Sprite de ícones SVG
│   ├── manifest.json            # Manifesto PWA
│   └── sw.js                    # Service Worker para suporte offline
├── src/
│   ├── assets/                  # Recursos visuais e gráficos
│   ├── components/              # Componentes de interface (CSS Modules isolados)
│   │   ├── DailySummary/        # Resumo do progresso diário
│   │   ├── EarlyExitModal/      # Modal de confirmação de desistência/reset
│   │   ├── Greeting/            # Saudação com base na hora do dia
│   │   ├── Header/              # Cabeçalho da aplicação
│   │   ├── MotivationalQuote/   # Frases motivacionais dinâmicas
│   │   ├── Onboarding/          # Tutorial inicial para novos usuários
│   │   ├── SessionHistory/      # Histórico completo de sessões
│   │   ├── SessionIntention/    # Campo para definição da intenção de foco
│   │   ├── SessionSelector/     # Alternador de modos (Foco / Pausa Curta / Pausa Longa)
│   │   ├── Settings/            # Modal de configurações completas
│   │   ├── Sidebar/             # Barra de navegação lateral
│   │   ├── Statistics/          # Painel de métricas e gráficos de produtividade
│   │   ├── TaskItem/            # Item individual de tarefa com ações
│   │   ├── TaskList/            # Lista de tarefas pendentes e concluídas
│   │   ├── Timer/               # Mostrador circular minimalista e tempo restante
│   │   ├── TimerControls/       # Controles de play/pause, skip e reset
│   │   └── index.ts             # Barrel export unificado dos componentes
│   ├── config/                  # Constantes e configurações padrão da aplicação
│   │   ├── app.ts               # Constantes globais
│   │   ├── defaults.ts          # Configurações padrão de usuário e timer
│   │   └── index.ts             # Barrel export
│   ├── data/                    # Dados estáticos (ex.: frases motivacionais)
│   │   └── phrases.ts
│   ├── domain/                  # Lógica pura de negócio (independente de UI)
│   │   ├── phraseEngine.ts      # Seleção e rotação de frases de incentivo
│   │   ├── sessionRules.ts      # Regras de transição de sessão e ciclo Pomodoro
│   │   ├── stats.ts             # Cálculos de métricas, metas e distribuições
│   │   ├── taskParser.ts        # Sanitização e parsing de tarefas
│   │   ├── timerEngine.ts       # Máquina de estados precisa do cronômetro
│   │   ├── types.ts             # Definições de tipos TypeScript centrais
│   │   └── index.ts             # Barrel export
│   ├── hooks/                   # Custom Hooks do React
│   │   ├── useDynamicFaviconAndTitle.ts  # Atualização da aba com status e tempo
│   │   ├── useKeyboardShortcuts.ts       # Tratamento de atalhos globais
│   │   ├── useSessions.ts                # Operações assíncronas com sessões
│   │   ├── useSettings.ts                # Leitura e persistência de preferências
│   │   ├── useTasks.ts                   # Gerenciamento de tarefas
│   │   ├── useTimer.ts                   # Integração do TimerEngine com o ciclo de vida React
│   │   └── index.ts             # Barrel export
│   ├── services/                # Serviços de infraestrutura e APIs do navegador
│   │   ├── backupService.ts     # Exportação e importação de JSON com validação
│   │   ├── notificationService.ts # API de Notificações do browser
│   │   ├── sessionService.ts    # Persistência de sessões no IndexedDB
│   │   ├── settingsService.ts   # Persistência de preferências de usuário
│   │   ├── soundService.ts      # Síntese de áudio via Web Audio API
│   │   ├── storage.ts           # Inicialização e esquema do IndexedDB
│   │   ├── taskService.ts       # Persistência e consultas de tarefas
│   │   ├── wakeLockService.ts   # Manutenção da tela ativa
│   │   └── index.ts             # Barrel export
│   ├── styles/                  # Estilos globais e tokens CSS
│   │   ├── global.css           # Estilos base e reset
│   │   └── tokens.css           # Variáveis e design tokens monocromáticos
│   ├── App.module.css           # Estilos de layout principal
│   ├── App.tsx                  # Componente raiz da aplicação
│   ├── index.css                # Ponto de entrada CSS
│   └── main.tsx                 # Ponto de montagem React 19
├── tests/                       # Suíte de testes automatizados com Vitest
│   ├── backupService.test.ts    # Testes de integridade de backup e export/import
│   ├── phraseEngine.test.ts     # Testes da seleção e rotação de frases
│   ├── stats.test.ts            # Testes dos cálculos de estatísticas e metas
│   ├── taskService.test.ts      # Testes das operações de tarefas com IndexedDB simulado
│   ├── timerEngine.test.ts      # Testes da máquina de estados do timer
│   └── timerExperience.test.ts  # Testes de regras de experiência e transições
├── .editorconfig                # Configurações de padronização de editores
├── .gitattributes               # Tratamento de quebras de linha e arquivos binários
├── .gitignore                   # Arquivos ignorados pelo controle de versão
├── .oxlintrc.json               # Configuração do linter Oxlint
├── index.html                   # HTML principal da SPA
├── LICENSE                      # Licença de código aberto MIT
├── package.json                 # Metadados e dependências do projeto
├── tsconfig.app.json            # Configuração TypeScript da aplicação
├── tsconfig.json                # Configuração TypeScript raiz
├── tsconfig.node.json           # Configuração TypeScript de ferramentas Node
└── vite.config.ts               # Configuração do empacotador Vite
```

---

## 🚀 Como Começar

### Pré-requisitos

- **Node.js** versão 20 ou superior (recomendado Node 22+)
- Gerenciador de pacotes **npm** (já incluso com Node.js)

### Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/databyiara/focus.git
cd focus
npm install
```

### Desenvolvimento

Inicie o servidor de desenvolvimento local com Hot Module Replacement (HMR):

```bash
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no seu navegador.

### Testes

Execute a suíte de testes unitários com Vitest:

```bash
npm test
```

### Linting

Verifique regras e conformidade de código com Oxlint:

```bash
npm run lint
```

### Build de Produção

Compile o projeto TypeScript e gere os artefatos otimizados para produção:

```bash
npm run build
```

Para visualizar a versão de produção compilada localmente:

```bash
npm run preview
```

---

## 🛠️ Tecnologias Utilizadas

- **[React 19](https://react.dev/)**: Biblioteca para interfaces declarativas e reativas.
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática rigorosa para robustez de código.
- **[Vite](https://vitejs.dev/)**: Ferramenta de build e bundling ultrarrápida.
- **[CSS Modules](https://github.com/css-modules/css-modules)**: Estilização com escopo local sem vazamento de seletores.
- **[IndexedDB (`idb`)](https://github.com/jakearchibald/idb)**: Banco de dados cliente estruturado e assíncrono.
- **[Vitest](https://vitest.dev/)**: Framework de testes unitários veloz com suporte nativo a ESM e TypeScript.
- **[Oxlint](https://oxc.rs/)**: Linter de alta performance em Rust.
- **[Lucide React](https://lucide.dev/)**: Conjunto de ícones leves e consistentes.

---

## 📄 Licença

Este projeto está sob a licença [MIT](./LICENSE). Sinta-se à vontade para utilizar, modificar e distribuir.
