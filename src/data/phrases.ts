export type PhraseCategory =
  | 'antes_de_iniciar'
  | 'durante_foco'
  | 'fim_de_foco'
  | 'pausa_curta'
  | 'pausa_longa'
  | 'meta_batida'
  | 'retorno_apos_ausencia'
  | 'dia_dificil';

export interface PhraseCategoryInfo {
  id: PhraseCategory;
  label: string;
  description: string;
  count: number;
}

export const PHRASES: Record<PhraseCategory, readonly string[]> = {
  antes_de_iniciar: [
    'Você não precisa ter tudo pronto. Só precisa começar.',
    'Uma tarefa de cada vez. Só essa.',
    'Defina o que importa para este bloco. O resto pode esperar.',
    'Coloque o foco no processo, não na perfeição.',
    'O primeiro minuto é sempre o mais difícil. Comece pequeno.',
    'Silencie o ruído ao redor. Agora é só você e esta etapa.',
    'Um passo de cada vez constrói todo o caminho.',
    'Não pense no todo agora. Pense apenas neste bloco.',
    'O que você fizer nestes minutos já é progresso real.',
    'Apenas comece. O ritmo vem depois que você der a partida.',
    'Menos distrações, mais clareza para este ciclo.',
    'Respire fundo e dê o primeiro clique. Você é capaz.',
    'Trabalhe no seu tempo. O importante é a consistência.',
    'Concentre-se apenas no próximo passo palpável.',
  ],

  durante_foco: [
    'Mantenha a atenção nesta única linha de ação.',
    'Se a mente divagar, apenas retorne com gentileza.',
    'A distração é passageira; seu objetivo permanece.',
    'Presença e calma. Um segundo após o outro.',
    'Deixe outras ideias anotadas para depois. Siga aqui.',
    'Este momento merece sua atenção dedicada.',
    'Você está construindo algo sólido, minuto a minuto.',
    'Não acelere além do necessário. Mantenha o compasso.',
    'Confie no método. Continue no ritmo que estabeleceu.',
    'Foco não é força bruta, é persistência serena.',
    'Aos poucos, o difícil se torna concluído.',
    'Mantenha a postura confortável e os olhos no que importa.',
    'Cada minuto dedicado agora alivia o seu dia amanhã.',
    'Fique presente. O resto do mundo pode aguardar.',
  ],

  fim_de_foco: [
    'Ciclo concluído. Levante, beba água e relaxe os olhos.',
    'Excelente bloco. Seu esforço foi registrado.',
    'Mais um ciclo cumprido com dedicação. Muito bem.',
    'Mais perto do que quando começou. Faça uma pausa merecida.',
    'Respire com calma. Você entregou presença neste período.',
    'Bloco finalizado. Alongue os ombros e descanse a mente.',
    'Um passo a mais dado hoje. Hora de recarregar.',
    'Você concluiu este intervalo de foco com integridade.',
    'Parabéns por sustentar a atenção até o fim deste ciclo.',
    'Missão cumprida neste bloco. Deixe a mente desacelerar.',
    'Consistência demonstrada na prática. Bom trabalho.',
    'Olhe com satisfação: este ciclo já está feito.',
    'Tempo bem investido. Permita-se respirar agora.',
    'Foco finalizado com sucesso. Aproveite o intervalo.',
  ],

  pausa_curta: [
    'Respira. O próximo ciclo pode esperar dois minutos.',
    'Afaste o olhar das telas e olhe para o horizonte.',
    'Levante-se, estique o corpo e tome um pouco de água.',
    'Pausa curta é parte do trabalho, não desperdício de tempo.',
    'Deixe os ombros caírem e relaxe a musculatura do rosto.',
    'Alguns minutos para renovar sua clareza mental.',
    'Não use a pausa para acumular novas preocupações.',
    'Um respiro consciente renova a energia para o próximo passo.',
    'Solte a tensão das mãos e dos olhos agora.',
    'A mente precisa de pausas para consolidar o aprendizado.',
    'Tome um ar fresco antes de retornar.',
    'Descanso honesto gera concentração profunda.',
    'Feche os olhos por um momento e esvazie os pensamentos.',
    'Um breve respiro para manter a lucidez ao longo do dia.',
  ],

  pausa_longa: [
    'Você completou uma boa sequência. Desconecte-se de verdade.',
    'Hora de um intervalo maior. Saia da mesa e mude de ambiente.',
    'Sua mente trabalhou bastante. Permita-se uma pausa completa.',
    'Caminhe um pouco, faça um lanche leve e descanse a vista.',
    'Grandes resultados exigem pausas à altura. Aproveite o momento.',
    'Deixe as tarefas de lado pelos próximos minutos.',
    'Recarregar as baterias garante energia para todo o resto do dia.',
    'Excelente ritmo até aqui. Agora, descanso merecido e sem culpa.',
    'Dê espaço para sua mente divagar e descansar sem cobranças.',
    'Desconecte-se das obrigações por alguns instantes.',
    'Um intervalo longo protege você da exaustão. Aproveite.',
    'Aproveite para se hidratar e respirar sem olhar o relógio.',
    'O trabalho rende mais quando você respeita seu descanso.',
    'Pausa profunda. Seu cérebro agradece o cuidado.',
  ],

  meta_batida: [
    'Meta de hoje alcançada! Parabéns pela disciplina e constância.',
    'Você atingiu o objetivo planejado para o dia de hoje.',
    'Excelente trabalho. Tudo o que vier além disso agora é bônus.',
    'Meta batida com solidez. Reconheça seu próprio esforço.',
    'O compromisso que você assumiu com seu dia foi cumprido.',
    'Você provou sua capacidade de foco mais uma vez hoje.',
    'Sensação de dever cumprido. Você merece este momento.',
    'Dia produtivo fechado com maestria. Orgulhe-se do caminho.',
    'Meta concluída! Descanse com a mente tranquila hoje.',
    'Constância gera resultados reais, e hoje foi prova disso.',
    'Você fechou o plano diário. Missão cumprida!',
    'Seu objetivo foi alcançado com paciência e método.',
    'Mais um dia vencido com clareza e determinação.',
    'Comemore a vitória de hoje: sua meta foi conquistada.',
  ],

  retorno_apos_ausencia: [
    'Que bom ter você de volta. O importante é recomeçar sem peso.',
    'Não importa quantos dias passaram. O que conta é o dia de hoje.',
    'Acolha seu ritmo de retorno. Comece com apenas um ciclo leve.',
    'Voltar é um ato de coragem e compromisso. Bom retorno.',
    'Esqueça a pausa que ficou para trás. Foque no próximo bloco.',
    'Nenhuma culpa por dias ausentes. A jornada se constrói no presente.',
    'Bom ver você por aqui novamente. Vamos sem pressa, um bloco de cada vez.',
    'Pausas na vida acontecem. O valor está em saber retomar o caminho.',
    'Recomece com gentileza consigo. Um único ciclo já faz a diferença.',
    'Sua mesa de foco estava esperando. Respire fundo e recomece.',
    'O hábito não foi perdido; ele só estava guardado esperando sua volta.',
    'Retomar com calma é o melhor jeito de construir constância duradoura.',
    'Cada novo dia é um ponto de partida limpo. Seja bem-vindo(a).',
    'Sem cobranças pelo ontem. O seu foco recomeça agora.',
  ],

  dia_dificil: [
    'Foi menos do que planejou? Ainda é muito mais do que zero.',
    'Dias difíceis acontecem. Qualquer esforço de hoje já é vitória.',
    'Interrupções fazem parte da rotina real. Não se cobre em excesso.',
    'Se hoje o ritmo foi truncado, amanhã é uma folha em branco.',
    'Respira fundo. Fazer dez minutos já vale muito mais que desistir.',
    'Não meça o seu valor apenas pelos dias em que tudo correu perfeitamente.',
    'Parar e recomeçar várias vezes também exige muita força de vontade.',
    'Tudo bem se este ciclo for o último do dia. Você fez o que foi possível.',
    'Gentileza com o seu momento. Amanhã recomeçamos de novo.',
    'A produtividade não é uma linha reta. Oscilações são naturais.',
    'O cansaço é real. Respeite seus limites sem julgamento.',
    'Você tentou e compareceu, mesmo quando estava difícil. Isso tem valor.',
    'Reconheça o esforço em vez de focar nas pausas forçadas.',
    'Dias desafiadores também constroem resiliência. Vá com calma.',
  ],
};

export const PHRASE_CATEGORIES_INFO: PhraseCategoryInfo[] = [
  {
    id: 'antes_de_iniciar',
    label: 'Antes de Iniciar',
    description: 'Tela parada em modo Foco preparando o início da sessão',
    count: PHRASES.antes_de_iniciar.length,
  },
  {
    id: 'durante_foco',
    label: 'Durante o Foco',
    description: 'Abaixo do timer, troca a cada ~8 min discretamente',
    count: PHRASES.durante_foco.length,
  },
  {
    id: 'fim_de_foco',
    label: 'Fim de Foco',
    description: 'Ao concluir um ciclo de foco com sucesso',
    count: PHRASES.fim_de_foco.length,
  },
  {
    id: 'pausa_curta',
    label: 'Pausa Curta',
    description: 'Durante o intervalo de descanso breve',
    count: PHRASES.pausa_curta.length,
  },
  {
    id: 'pausa_longa',
    label: 'Pausa Longa',
    description: 'Durante o intervalo estendido após um ciclo completo',
    count: PHRASES.pausa_longa.length,
  },
  {
    id: 'meta_batida',
    label: 'Meta Batida',
    description: 'Quando a meta diária planejada é alcançada',
    count: PHRASES.meta_batida.length,
  },
  {
    id: 'retorno_apos_ausencia',
    label: 'Retorno após Ausência',
    description: 'Acolhimento após 1+ dia sem estudar, sem tom de culpa',
    count: PHRASES.retorno_apos_ausencia.length,
  },
  {
    id: 'dia_dificil',
    label: 'Dia Difícil',
    description: 'Sessões interrompidas várias vezes com tom gentil de recomeço',
    count: PHRASES.dia_dificil.length,
  },
];
