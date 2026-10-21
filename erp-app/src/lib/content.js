// Contenido por defecto del motor. TODO es dato: Emilia y Queren lo editan en Admin.
// Estado: BORRADOR v1 escrito por el equipo de producto, pendiente de revisión clínica (Dra. Emilia)
// y teológica. Ningún texto diagnostica: solo da un "parecer".

const t = (es, en, pt) => ({ es, en, pt });

// ---------- Pantallas del flujo (grafo) ----------
// type: 'choice' (1–4 opciones) | 'reflect' (pausa + nombrar + línea opcional)
// Cada opción tiene un código estable (para análisis) y un "next" opcional.
// next especial: '@crisis' interrumpe el juego. '@result' muestra el parecer.
export const screens = {
  mood: {
    type: 'choice', key: 'animo', title: 'Ánimo general',
    prompt: t('¿Cómo te sientes ahora?', 'How do you feel right now?', 'Como você se sente agora?'),
    options: [
      { code: 'bien', emoji: '😊', label: t('Bien', 'Good', 'Bem'), next: 'feel_good' },
      { code: 'regular', emoji: '😐', label: t('Más o menos', 'So-so', 'Mais ou menos'), next: 'feel_meh' },
      { code: 'mal', emoji: '😔', label: t('Mal', 'Not good', 'Mal'), next: 'feel_bad' },
      { code: 'muy_mal', emoji: '😣', label: t('Muy mal', 'Really bad', 'Muito mal'), next: 'feel_worst' },
    ],
  },
  feel_good: {
    type: 'choice', key: 'emocion', title: 'Emoción (bien)',
    prompt: t('¡Qué bueno! ¿Cuál se parece más?', 'Nice! Which one fits best?', 'Que bom! Qual combina mais?'),
    options: [
      { code: 'alegria', emoji: '😄', color: 'verde', label: t('Alegre', 'Happy', 'Alegre') },
      { code: 'paz', emoji: '😌', color: 'verde', label: t('En paz', 'At peace', 'Em paz') },
      { code: 'gratitud', emoji: '🙏', color: 'verde', label: t('Con gratitud', 'Thankful', 'Com gratidão') },
      { code: 'energia', emoji: '💪', color: 'verde', label: t('Con energía', 'Full of energy', 'Com energia') },
    ],
    next: 'good_source',
  },
  feel_meh: {
    type: 'choice', key: 'emocion', title: 'Emoción (más o menos)',
    prompt: t('¿Cuál se parece más a ti hoy?', 'Which one is most like you today?', 'Qual parece mais com você hoje?'),
    options: [
      { code: 'cansancio', emoji: '🥱', color: 'azul', label: t('Cansancio', 'Tired', 'Cansaço') },
      { code: 'preocupacion', emoji: '😟', color: 'morado', label: t('Mi cabeza no para', "My mind won't stop", 'Minha cabeça não para') },
      { code: 'impulsivo', emoji: '🌀', color: 'naranja', label: t('Hago cosas sin pensar', 'Doing things without thinking', 'Faço coisas sem pensar') },
      { code: 'aburrimiento', emoji: '😑', color: 'gris', label: t('No siento nada', "I don't feel anything", 'Não sinto nada') },
    ],
    next: 'sleep',
  },
  feel_bad: {
    type: 'choice', key: 'emocion', title: 'Emoción (mal)',
    prompt: t('Gracias por contarme. ¿Cuál se parece más?', 'Thanks for telling me. Which one fits best?', 'Obrigado por me contar. Qual combina mais?'),
    options: [
      { code: 'tristeza', emoji: '😢', color: 'azul', label: t('Tristeza', 'Sad', 'Tristeza') },
      { code: 'ansiedad', emoji: '😰', color: 'amarillo', label: t('Nervios, acelerado', 'Nervous, restless', 'Nervoso, agitado') },
      { code: 'rabia', emoji: '😠', color: 'rojo', label: t('Rabia', 'Angry', 'Raiva') },
      { code: 'desanimo', emoji: '😞', color: 'azul', label: t('Sin ganas de nada', 'No energy for anything', 'Sem vontade de nada') },
    ],
    next: 'sleep',
  },
  feel_worst: {
    type: 'choice', key: 'emocion', title: 'Emoción (muy mal)',
    prompt: t('Estoy aquí contigo. ¿Qué sientes más fuerte?', "I'm here with you. What feels strongest?", 'Estou aqui com você. O que está mais forte?'),
    options: [
      { code: 'miedo', emoji: '😱', color: 'amarillo', label: t('Miedo', 'Scared', 'Medo') },
      { code: 'soledad', emoji: '💔', color: 'azul', label: t('Soledad', 'Lonely', 'Solidão') },
      { code: 'agotamiento', emoji: '😩', color: 'azul', label: t('Agotamiento', 'Worn out', 'Esgotamento') },
      { code: 'no_puedo', emoji: '🌧️', color: 'azul', label: t('No puedo más', "I can't go on", 'Não aguento mais') },
    ],
    next: 'safety',
  },
  safety: {
    type: 'choice', key: 'seguridad', title: 'Chequeo de seguridad', safety: true,
    prompt: t('Antes de seguir: ¿estás a salvo ahora mismo?', 'Before we go on: are you safe right now?', 'Antes de continuar: você está em segurança agora?'),
    options: [
      { code: 'a_salvo', emoji: '🏠', label: t('Sí, estoy a salvo', "Yes, I'm safe", 'Sim, estou em segurança'), next: 'sleep' },
      { code: 'no_seguro', emoji: '❔', label: t('No lo sé', "I'm not sure", 'Não tenho certeza'), next: '@crisis' },
      { code: 'hacerme_dano', emoji: '🆘', label: t('Pienso en hacerme daño', 'I think about hurting myself', 'Penso em me machucar'), next: '@crisis' },
      { code: 'me_hacen_dano', emoji: '🛑', label: t('Alguien me hace daño', 'Someone is hurting me', 'Alguém está me machucando'), next: '@crisis' },
    ],
  },
  good_source: {
    type: 'choice', key: 'fuente_bien', title: '¿Qué ayudó? (bien)',
    prompt: t('¿Qué crees que te ayudó hoy?', 'What do you think helped today?', 'O que você acha que ajudou hoje?'),
    options: [
      { code: 'descanso', emoji: '😴', label: t('Dormí bien', 'I slept well', 'Dormi bem') },
      { code: 'personas', emoji: '🤗', label: t('Estuve con alguien', 'I was with someone', 'Estive com alguém') },
      { code: 'logro', emoji: '⭐', label: t('Hice algo bien', 'I did something well', 'Fiz algo bem') },
      { code: 'dios', emoji: '✨', label: t('Sentí a Dios cerca', 'I felt God close', 'Senti Deus perto') },
    ],
    next: 'reflect',
  },
  sleep: {
    type: 'choice', key: 'sueno', title: 'Sueño',
    prompt: t('¿Cómo dormiste anoche?', 'How did you sleep last night?', 'Como você dormiu ontem à noite?'),
    options: [
      { code: 'bien', emoji: '😴', label: t('Bien', 'Well', 'Bem') },
      { code: 'poco', emoji: '🥱', label: t('Poquito', 'Not much', 'Pouco') },
      { code: 'mal', emoji: '😵', label: t('Muy mal', 'Badly', 'Muito mal') },
    ],
    next: 'food',
  },
  food: {
    type: 'choice', key: 'comida', title: 'Alimentación',
    prompt: t('¿Has comido bien hoy?', 'Have you eaten well today?', 'Você comeu bem hoje?'),
    options: [
      { code: 'si', emoji: '🍽️', label: t('Sí', 'Yes', 'Sim') },
      { code: 'poco', emoji: '🍪', label: t('Un poquito', 'A little', 'Um pouquinho') },
      { code: 'no', emoji: '🚫', label: t('No', 'No', 'Não') },
    ],
    next: 'body',
  },
  body: {
    type: 'choice', key: 'cuerpo', title: 'Cuerpo',
    prompt: t('¿Y tu cuerpo, cómo está?', 'And your body, how is it?', 'E o seu corpo, como está?'),
    options: [
      { code: 'bien', emoji: '💪', label: t('Bien', 'Fine', 'Bem') },
      { code: 'enfermo', emoji: '🤒', label: t('Gripa o malestar', 'Sick', 'Gripe ou mal-estar') },
      { code: 'dolor', emoji: '🤕', label: t('Con dolor', 'In pain', 'Com dor') },
      { code: 'ciclo', emoji: '🌙', label: t('En mis días', 'On my period', 'Naqueles dias') },
    ],
    next: 'mind',
  },
  mind: {
    type: 'choice', key: 'tema', title: 'Tema en la mente',
    prompt: t('¿Qué ocupa tu mente hoy?', "What's on your mind today?", 'O que ocupa sua mente hoje?'),
    options: [
      { code: 'dinero', emoji: '💰', label: t('Dinero', 'Money', 'Dinheiro') },
      { code: 'trabajo', emoji: '💼', label: t('Trabajo o estudio', 'Work or school', 'Trabalho ou estudo') },
      { code: 'personas', emoji: '👨‍👩‍👧', label: t('Personas que quiero', 'People I love', 'Pessoas que amo') },
      { code: 'otra', emoji: '➕', label: t('Otra cosa', 'Something else', 'Outra coisa'), next: 'mind2' },
    ],
    next: 'reflect',
  },
  mind2: {
    type: 'choice', key: 'tema', title: 'Tema en la mente (2)',
    prompt: t('¿Cuál de estas?', 'Which of these?', 'Qual destas?'),
    options: [
      { code: 'futuro', emoji: '🔮', label: t('El futuro', 'The future', 'O futuro') },
      { code: 'noticias', emoji: '📱', label: t('Noticias o redes', 'News or social media', 'Notícias ou redes') },
      { code: 'soledad', emoji: '🏠', label: t('Estar sin compañía', 'Being alone', 'Estar sem companhia') },
      { code: 'nada', emoji: '🤷', label: t('Nada en especial', 'Nothing special', 'Nada em especial') },
    ],
    next: 'reflect',
  },
  reflect: {
    type: 'reflect', key: 'necesidad', title: 'Reflexión',
    prompt: t('Respira un momento. Si tu corazón pudiera hablar, ¿qué pediría?', 'Take a breath. If your heart could talk, what would it ask for?', 'Respire um pouco. Se seu coração pudesse falar, o que pediria?'),
    options: [
      { code: 'descansar', emoji: '🛌', label: t('Descansar', 'Rest', 'Descansar') },
      { code: 'escucha', emoji: '👂', label: t('Que alguien me escuche', 'Someone to listen', 'Alguém que me ouça') },
      { code: 'esperanza', emoji: '🌅', label: t('Saber que todo estará bien', 'To know it will be okay', 'Saber que tudo vai ficar bem') },
      { code: 'no_se', emoji: '💭', label: t('No sé todavía', "I don't know yet", 'Ainda não sei') },
    ],
    next: '@result',
  },
};

export const startScreen = 'mood';

// Preguntas que van después del resultado (siempre iguales).
export const after = {
  feelNow: {
    key: 'animo_final',
    prompt: t('Y ahora, ¿cómo te sientes?', 'And now, how do you feel?', 'E agora, como você se sente?'),
    options: [
      { code: 'bien', emoji: '😊', label: t('Bien', 'Good', 'Bem') },
      { code: 'regular', emoji: '😐', label: t('Más o menos', 'So-so', 'Mais ou menos') },
      { code: 'mal', emoji: '😔', label: t('Mal', 'Not good', 'Mal') },
      { code: 'muy_mal', emoji: '😣', label: t('Muy mal', 'Really bad', 'Muito mal') },
    ],
  },
  helped: {
    key: 'ayudo',
    prompt: t('¿Te ayudó este momento?', 'Did this moment help?', 'Esse momento ajudou?'),
    options: [
      { code: 'si', emoji: '👍', label: t('Sí', 'Yes', 'Sim') },
      { code: 'poco', emoji: '👌', label: t('Un poco', 'A little', 'Um pouco') },
      { code: 'no', emoji: '👎', label: t('No', 'No', 'Não') },
    ],
  },
  frequency: {
    key: 'frecuencia',
    prompt: t('¿Te sientes así solo hoy o pasa seguido?', 'Do you feel like this only today, or often?', 'Você se sente assim só hoje ou com frequência?'),
    options: [
      { code: 'hoy', emoji: '📍', label: t('Solo hoy', 'Only today', 'Só hoje') },
      { code: 'dias', emoji: '📅', label: t('Hace unos días', 'For a few days', 'Há alguns dias') },
      { code: 'siempre', emoji: '🔁', label: t('Casi siempre', 'Almost always', 'Quase sempre') },
    ],
  },
};

// ---------- Código de colores (Dra. Emilia) ----------
// El color nunca va solo: siempre acompaña a la palabra y a la carita. Sirve para ver patrones
// ("3 días con rabia") y para elegir el ejercicio. Los nombres describen lo que se siente, no diagnostican.
export const colors = {
  verde: { hex: '#3DBE74', name: t('Bien', 'Good', 'Bem'), desc: t('Tranquilo, puedo hacer mis cosas', 'Calm, I can get things done', 'Tranquilo, consigo fazer minhas coisas') },
  amarillo: { hex: '#F2B92F', name: t('Acelerado', 'Restless', 'Agitado'), desc: t('Nervios, no paro, muy agitado', "Nervous, can't stop, very restless", 'Nervoso, não paro, muito agitado') },
  naranja: { hex: '#FF8A3D', name: t('Impulsivo', 'Impulsive', 'Impulsivo'), desc: t('Hago cosas sin pensar', 'Doing things without thinking', 'Faço coisas sem pensar') },
  rojo: { hex: '#EE5A52', name: t('Con rabia', 'Angry', 'Com raiva'), desc: t('Mucha rabia o enojo', 'A lot of anger', 'Muita raiva') },
  morado: { hex: '#9468EE', name: t('Mente que no para', "Mind that won't stop", 'Mente que não para'), desc: t('Pienso y pienso, no me calmo', "I keep thinking, I can't settle", 'Penso e penso, não me acalmo') },
  azul: { hex: '#4A9BEA', name: t('Sin ganas', 'Low', 'Sem vontade'), desc: t('Triste o cansado, solo quiero dormir', 'Sad or tired, I just want to sleep', 'Triste ou cansado, só quero dormir') },
  gris: { hex: '#9AA3B2', name: t('Neutro', 'Numb', 'Neutro'), desc: t('No siento nada', "I don't feel anything", 'Não sinto nada') },
};

// ---------- 3 sugerencias para mantener lo logrado ----------
export const suggestions = {
  dormir: { icon: 'moon', text: t('Esta noche acuéstate un poco más temprano', 'Go to bed a little earlier tonight', 'Hoje à noite, deite um pouco mais cedo') },
  comer: { icon: 'bowl', text: t('Come algo sencillo y nutritivo', 'Eat something simple and nourishing', 'Coma algo simples e nutritivo') },
  agua: { icon: 'drop', text: t('Toma un vaso de agua ahora', 'Drink a glass of water now', 'Beba um copo de água agora') },
  descansar: { icon: 'bed', text: t('Dale a tu cuerpo un rato de descanso', 'Give your body some rest', 'Dê ao seu corpo um tempo de descanso') },
  aire: { icon: 'sun', text: t('Sal 10 minutos a tomar aire', 'Step outside for 10 minutes', 'Saia 10 minutos para tomar ar') },
  persona: { icon: 'chat', text: t('Cuéntale a alguien de confianza cómo estás', 'Tell someone you trust how you are', 'Conte a alguém de confiança como você está') },
  una_cosa: { icon: 'check', text: t('Elige una sola cosa pequeña para hoy', 'Pick one small thing for today', 'Escolha uma única coisa pequena para hoje') },
  pantallas: { icon: 'phone', text: t('Tómate una hora sin redes', 'Take one hour off social media', 'Fique uma hora sem redes') },
  gracias: { icon: 'flower', text: t('Antes de dormir, di tres cosas por las que das gracias', 'Before bed, name three things you are thankful for', 'Antes de dormir, diga três coisas pelas quais é grato') },
  versiculo: { icon: 'book', text: t('Lee tu versículo otra vez antes de dormir', 'Read your verse again before bed', 'Leia seu versículo de novo antes de dormir') },
};
// Qué respuesta trae qué sugerencia (en orden). Siempre se completan 3.
export const suggestionRules = [
  { when: { sueno: ['mal', 'poco'] }, id: 'dormir' },
  { when: { comida: ['no', 'poco'] }, id: 'comer' },
  { when: { cuerpo: ['enfermo', 'dolor', 'ciclo'] }, id: 'descansar' },
  { when: { tema: ['dinero', 'trabajo', 'futuro'] }, id: 'una_cosa' },
  { when: { tema: ['personas', 'soledad'] }, id: 'persona' },
  { when: { tema: ['noticias'] }, id: 'pantallas' },
  { when: { emocion: ['soledad', 'tristeza', 'desanimo'] }, id: 'persona' },
  { when: { animo: ['bien'] }, id: 'gracias' },
];
export const suggestionDefaults = ['agua', 'aire', 'versiculo'];

// ---------- Reglas: respuestas → factor probable (el "parecer") ----------
// Se evalúan todas; gana el de mayor peso. Emilia ajusta pesos y condiciones.
export const rules = [
  { id: 'r_sueno_mal', when: { sueno: ['mal'] }, factor: 'sueno', weight: 5 },
  { id: 'r_sueno_poco', when: { sueno: ['poco'] }, factor: 'sueno', weight: 3 },
  { id: 'r_comida_no', when: { comida: ['no'] }, factor: 'comida', weight: 4 },
  { id: 'r_comida_poco', when: { comida: ['poco'] }, factor: 'comida', weight: 2 },
  { id: 'r_cuerpo', when: { cuerpo: ['enfermo', 'dolor'] }, factor: 'cuerpo', weight: 4 },
  { id: 'r_ciclo', when: { cuerpo: ['ciclo'] }, factor: 'ciclo', weight: 4 },
  { id: 'r_dinero', when: { tema: ['dinero'] }, factor: 'dinero', weight: 3.5 },
  { id: 'r_trabajo', when: { tema: ['trabajo'] }, factor: 'trabajo', weight: 3.5 },
  { id: 'r_personas', when: { tema: ['personas'] }, factor: 'personas', weight: 3.5 },
  { id: 'r_futuro', when: { tema: ['futuro'] }, factor: 'futuro', weight: 3 },
  { id: 'r_noticias', when: { tema: ['noticias'] }, factor: 'noticias', weight: 3 },
  { id: 'r_soledad_tema', when: { tema: ['soledad'] }, factor: 'soledad', weight: 3.5 },
  { id: 'r_soledad_emo', when: { emocion: ['soledad'] }, factor: 'soledad', weight: 4.5 },
  { id: 'r_bien', when: { animo: ['bien'] }, factor: 'positivo', weight: 10 },
];

// ---------- Pareceres por factor (lenguaje seguro: "puede que…") ----------
export const insights = {
  sueno: {
    reason: t('Puede que el cansancio esté influyendo en cómo te sientes. Cuando dormimos poco, todo pesa más.', 'Tiredness might be part of how you feel. When we sleep little, everything feels heavier.', 'Pode ser que o cansaço esteja influenciando como você se sente. Quando dormimos pouco, tudo pesa mais.'),
    tip: t('Esta noche intenta acostarte un poquito más temprano.', 'Tonight, try going to bed a little earlier.', 'Hoje à noite, tente deitar um pouquinho mais cedo.'),
  },
  comida: {
    reason: t('Puede que tu cuerpo necesite energía. Con hambre, las emociones se sienten más fuertes.', 'Your body might need energy. When we are hungry, feelings get stronger.', 'Pode ser que seu corpo precise de energia. Com fome, as emoções ficam mais fortes.'),
    tip: t('Come algo sencillo y toma un vaso de agua.', 'Eat something simple and drink a glass of water.', 'Coma algo simples e beba um copo de água.'),
  },
  cuerpo: {
    reason: t('Tu cuerpo no está al cien, y eso también cansa el corazón.', "Your body isn't at its best, and that tires the heart too.", 'Seu corpo não está cem por cento, e isso também cansa o coração.'),
    tip: t('Descansa hoy. Si el malestar sigue, habla con un médico.', 'Rest today. If you keep feeling unwell, talk to a doctor.', 'Descanse hoje. Se o mal-estar continuar, fale com um médico.'),
  },
  ciclo: {
    reason: t('Los cambios del cuerpo durante el mes pueden mover las emociones. Es normal y pasa.', 'Body changes during the month can stir up feelings. It is normal and it passes.', 'As mudanças do corpo durante o mês podem mexer com as emoções. É normal e passa.'),
    tip: t('Hoy sé amable contigo. Algo calientito y descanso ayudan.', 'Be kind to yourself today. Something warm and some rest help.', 'Hoje seja gentil com você. Algo quentinho e descanso ajudam.'),
  },
  dinero: {
    reason: t('Puede que las preocupaciones de dinero estén ocupando mucho espacio en tu mente.', 'Money worries might be taking up a lot of space in your mind.', 'Pode ser que as preocupações com dinheiro estejam ocupando muito espaço na sua mente.'),
    tip: t('Escribe una sola cosa pequeña que sí puedes hacer hoy.', 'Write down one small thing you can do today.', 'Escreva uma única coisa pequena que você pode fazer hoje.'),
  },
  trabajo: {
    reason: t('Puede que el trabajo o los estudios te estén pidiendo mucho.', 'Work or school might be asking a lot of you.', 'Pode ser que o trabalho ou os estudos estejam exigindo muito de você.'),
    tip: t('Elige una sola tarea para hoy. Una. Las demás pueden esperar.', 'Pick just one task for today. One. The rest can wait.', 'Escolha uma única tarefa para hoje. Uma. As outras podem esperar.'),
  },
  personas: {
    reason: t('Lo que pasa con las personas que quieres te importa mucho, y eso se siente.', 'What happens with the people you love matters a lot to you, and you feel it.', 'O que acontece com as pessoas que você ama importa muito, e isso se sente.'),
    tip: t('Si puedes, habla con alguien de confianza sobre esto.', 'If you can, talk about it with someone you trust.', 'Se puder, converse com alguém de confiança sobre isso.'),
  },
  futuro: {
    reason: t('Pensar en lo que no sabemos del futuro puede llenar la mente de preguntas.', "Thinking about what we don't know about the future can fill the mind with questions.", 'Pensar no que não sabemos do futuro pode encher a mente de perguntas.'),
    tip: t('Por ahora, piensa solo en hoy. Hoy sí lo puedes vivir.', 'For now, think only about today. Today you can live.', 'Por agora, pense só no hoje. O hoje você consegue viver.'),
  },
  noticias: {
    reason: t('Lo que ves en noticias y redes puede cargar el corazón sin que lo notes.', 'What you see in the news and online can weigh on your heart without you noticing.', 'O que você vê em notícias e redes pode pesar no coração sem você perceber.'),
    tip: t('Prueba una hora sin redes hoy.', 'Try one hour without social media today.', 'Experimente uma hora sem redes hoje.'),
  },
  soledad: {
    reason: t('Sentir soledad es muy difícil. Tiene sentido que te afecte.', 'Feeling lonely is really hard. It makes sense that it affects you.', 'Sentir solidão é muito difícil. Faz sentido que isso te afete.'),
    tip: t('Manda un mensaje corto a alguien que te quiere.', 'Send a short message to someone who cares about you.', 'Mande uma mensagem curta para alguém que gosta de você.'),
  },
  ninguno: {
    reason: t('A veces no hay una sola razón, y está bien no saberlo todo hoy.', "Sometimes there isn't just one reason, and it's okay not to know everything today.", 'Às vezes não existe um único motivo, e tudo bem não saber tudo hoje.'),
    tip: t('Escucha a tu cuerpo: agua, aire y un descanso cortito.', 'Listen to your body: water, fresh air and a short break.', 'Escute seu corpo: água, ar e uma pausa curtinha.'),
  },
  positivo: {
    reason: t('¡Qué bueno sentirte así! Fíjate en qué te ayudó, para repetirlo.', 'So good to feel this way! Notice what helped, so you can do it again.', 'Que bom se sentir assim! Repare no que ajudou, para repetir.'),
    tip: t('Comparte algo bueno con alguien hoy.', 'Share something good with someone today.', 'Compartilhe algo bom com alguém hoje.'),
  },
};

// Validación antes del parecer (por emoción). "Tiene sentido sentirse así."
export const validations = {
  default: t('Tiene sentido sentirse así.', 'It makes sense to feel this way.', 'Faz sentido se sentir assim.'),
  positive: t('Guarda este momento en tu corazón.', 'Keep this moment in your heart.', 'Guarde este momento no coração.'),
};

// ---------- Acciones de 1 minuto ----------
export const actions = {
  atencion: { emoji: '🌊', icon: 'waves', interactive: 'attention', title: t('Pasea por el riachuelo', 'Walk by the creek', 'Passeie pelo riacho'), text: t('Vas a oír lluvia, agua y truenos. Pon tu atención en un solo sonido a la vez.', 'You will hear rain, water and thunder. Put your attention on one sound at a time.', 'Você vai ouvir chuva, água e trovão. Preste atenção em um som de cada vez.') },
  bilateral: { emoji: '✨', icon: 'stars', interactive: 'bilateral', title: t('Vuela con la mariposa', 'Fly with the butterfly', 'Voe com a borboleta'), text: t('Sigue las estrellas de un lado al otro. Con audífonos, el sonido también cambia de oído.', 'Follow the stars from side to side. With headphones, the sound switches ears too.', 'Siga as estrelas de um lado para o outro. Com fone, o som também troca de ouvido.') },
  respirar: { emoji: '🦋', icon: 'butterfly', interactive: 'breath', title: t('Respira con la mariposa', 'Breathe with the butterfly', 'Respire com a borboleta'), text: t('Cuando las alas se abren, toma aire. Cuando se cierran, suéltalo despacio.', 'When the wings open, breathe in. When they close, breathe out slowly.', 'Quando as asas abrirem, puxe o ar. Quando fecharem, solte devagar.') },
  ventana: { icon: 'window', emoji: '🪟', title: t('Ve a la ventana', 'Go to a window', 'Vá até a janela'), text: t('Mira el cielo 30 segundos y respira hondo tres veces.', 'Look at the sky for 30 seconds and take three deep breaths.', 'Olhe o céu por 30 segundos e respire fundo três vezes.') },
  agua: { icon: 'drop', emoji: '💧', title: t('Toma agua', 'Drink water', 'Beba água'), text: t('Toma un vaso de agua despacio, sorbo a sorbo.', 'Drink a glass of water slowly, sip by sip.', 'Beba um copo de água devagar, gole a gole.') },
  llamar: { icon: 'chat', emoji: '📞', title: t('Escribe a alguien', 'Message someone', 'Escreva para alguém'), text: t('Manda esto a alguien que te quiere: "Hola, pensé en ti".', 'Send this to someone who cares: "Hi, I thought of you."', 'Mande isto para alguém que gosta de você: "Oi, pensei em você".') },
  voz_alta: { icon: 'speaker', emoji: '🗣️', title: t('Dilo en voz alta', 'Say it out loud', 'Diga em voz alta'), text: t('Lee el versículo de abajo en voz alta tres veces.', 'Read the verse below out loud three times.', 'Leia o versículo abaixo em voz alta três vezes.') },
  escribir: { icon: 'pencil', emoji: '✏️', title: t('Escribe una línea', 'Write one line', 'Escreva uma linha'), text: t('Escribe en un papel una cosa que te preocupa. Luego dóblalo.', 'Write one worry on a piece of paper. Then fold it.', 'Escreva num papel uma coisa que te preocupa. Depois dobre.') },
  moverse: { icon: 'stretch', emoji: '🙆', title: t('Estírate', 'Stretch', 'Alongue-se'), text: t('Sube los brazos al cielo, cuenta hasta 10 y bájalos despacio.', 'Raise your arms to the sky, count to 10, and lower them slowly.', 'Levante os braços para o céu, conte até 10 e abaixe devagar.') },
  gracias: { icon: 'flower', emoji: '🌻', title: t('Tres gracias', 'Three thanks', 'Três obrigados'), text: t('Di tres cosas por las que hoy das gracias.', 'Say three things you are thankful for today.', 'Diga três coisas pelas quais você agradece hoje.') },
};

// Emoción → acción sugerida
export const actionByEmotion = {
  // Ejercicio según el color (Dra. Emilia): acelerado o mente que no para → respirar;
  // rabia o impulsivo → bilateral; sin ganas o neutro → atención. Se edita en Admin.
  ansiedad: 'respirar', miedo: 'respirar', preocupacion: 'respirar', no_puedo: 'respirar',
  rabia: 'bilateral', impulsivo: 'bilateral',
  tristeza: 'atencion', desanimo: 'atencion', cansancio: 'atencion', agotamiento: 'atencion', aburrimiento: 'atencion', soledad: 'atencion',
  alegria: 'gracias', paz: 'atencion', gratitud: 'gracias', energia: 'llamar',
};

// ---------- Versículos ----------
// Versión objetivo del equipo: NVI (es) / NIV (en) / NVI (pt) — pendiente de licencia de Biblica.
// Mientras tanto se usan textos de dominio público: Reina-Valera 1909 (ortografía actualizada),
// King James Version y Almeida (edición de dominio público). Cambiar de versión = editar estos datos.
export const bibleVersions = {
  es: { active: 'RV1909', target: 'NVI', license: 'Dominio público. NVI requiere permiso de Biblica.' },
  en: { active: 'KJV', target: 'NIV', license: 'Dominio público. NIV requiere permiso de Biblica.' },
  pt: { active: 'Almeida', target: 'NVI', license: 'Dominio público (verificar edición). NVI requiere permiso de Biblica.' },
};

export const verses = [
  { id: 'rom12_2', ref: t('Romanos 12:2', 'Romans 12:2', 'Romanos 12:2'), emotions: ['paz', 'energia', 'impulsivo'],
    text: t('No os conforméis a este siglo; mas reformaos por la renovación de vuestro entendimiento.', 'Be not conformed to this world: but be ye transformed by the renewing of your mind.', 'Não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento.'),
    reflection: t('Dios no quiere que solo repitas cosas. Quiere transformarte por dentro, como la larva que se vuelve mariposa.', "God doesn't want you to just repeat things. He wants to change you from the inside, like a caterpillar becoming a butterfly.", 'Deus não quer que você só repita coisas. Ele quer te transformar por dentro, como a lagarta que vira borboleta.') },
  { id: '1pe5_7', ref: t('1 Pedro 5:7', '1 Peter 5:7', '1 Pedro 5:7'), emotions: ['preocupacion', 'ansiedad'],
    text: t('Echando toda vuestra solicitud en él, porque él tiene cuidado de vosotros.', 'Casting all your care upon him; for he careth for you.', 'Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.'),
    reflection: t('Jesús no se cansa de tus preocupaciones. Puedes dárselas una por una.', "Jesus never gets tired of your worries. You can hand them to him one by one.", 'Jesus não se cansa das suas preocupações. Você pode entregá-las uma por uma.') },
  { id: 'sal34_18', ref: t('Salmos 34:18', 'Psalm 34:18', 'Salmos 34:18'), emotions: ['tristeza', 'no_puedo', 'soledad'],
    text: t('Cercano está el Señor a los quebrantados de corazón; y guardará a los contritos de espíritu.', 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.', 'Perto está o Senhor dos que têm o coração quebrantado, e salva os contritos de espírito.'),
    reflection: t('Cuando el corazón duele, Dios no se aleja. Se acerca.', "When your heart hurts, God doesn't move away. He comes closer.", 'Quando o coração dói, Deus não se afasta. Ele se aproxima.') },
  { id: 'mt11_28', ref: t('Mateo 11:28', 'Matthew 11:28', 'Mateus 11:28'), emotions: ['cansancio', 'agotamiento', 'desanimo'],
    text: t('Venid a mí todos los que estáis trabajados y cargados, que yo os haré descansar.', 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.'),
    reflection: t('Jesús no te pide que llegues fuerte. Te invita a llegar con tu cansancio, tal como estás.', "Jesus doesn't ask you to come strong. He invites you to come tired, just as you are.", 'Jesus não pede que você chegue forte. Ele te convida a chegar com seu cansaço, do jeito que está.') },
  { id: 'jn14_27', ref: t('Juan 14:27', 'John 14:27', 'João 14:27'), emotions: ['ansiedad', 'miedo', 'paz'],
    text: t('La paz os dejo, mi paz os doy: no como el mundo la da, yo os la doy. No se turbe vuestro corazón, ni tenga miedo.', 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.', 'Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.'),
    reflection: t('La paz de Jesús no depende de que todo salga bien. Es un regalo que te da hoy.', "Jesus' peace doesn't depend on everything going right. It's a gift he gives you today.", 'A paz de Jesus não depende de tudo dar certo. É um presente que ele te dá hoje.') },
  { id: 'is41_10', ref: t('Isaías 41:10', 'Isaiah 41:10', 'Isaías 41:10'), emotions: ['miedo', 'ansiedad', 'desanimo'],
    text: t('No temas, que yo soy contigo; no desmayes, que yo soy tu Dios que te esfuerzo: siempre te ayudaré.', 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.', 'Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo.'),
    reflection: t('Dios está contigo en esto. Promete ayudarte, no que nunca tendrás miedo.', "You are not alone in this. God promises to help you, not that you'll never be afraid.", 'Deus está com você nisso. Ele promete te ajudar, não que você nunca terá medo.') },
  { id: 'heb13_5', ref: t('Hebreos 13:5', 'Hebrews 13:5', 'Hebreus 13:5'), emotions: ['soledad'],
    text: t('No te desampararé, ni te dejaré.', 'I will never leave thee, nor forsake thee.', 'Não te deixarei, nem te desampararei.'),
    reflection: t('Aunque te sientas sin compañía, Jesús se quedó contigo. No se va.', 'Even when you feel alone, Jesus stays with you. He does not leave.', 'Mesmo quando a solidão aperta, Jesus fica com você. Ele não vai embora.') },
  { id: 'ef4_26', ref: t('Efesios 4:26', 'Ephesians 4:26', 'Efésios 4:26'), emotions: ['rabia'],
    text: t('Airaos, y no pequéis; no se ponga el sol sobre vuestro enojo.', 'Be ye angry, and sin not: let not the sun go down upon your wrath.', 'Irai-vos e não pequeis; não se ponha o sol sobre a vossa ira.'),
    reflection: t('Sentir rabia no está mal. Lo importante es qué haces con ella antes de dormir.', "Feeling angry isn't wrong. What matters is what you do with it before you sleep.", 'Sentir raiva não é errado. O importante é o que você faz com ela antes de dormir.') },
  { id: 'sal118_24', ref: t('Salmos 118:24', 'Psalm 118:24', 'Salmos 118:24'), emotions: ['alegria', 'energia'],
    text: t('Este es el día que hizo el Señor: nos gozaremos y alegraremos en él.', 'This is the day which the LORD hath made; we will rejoice and be glad in it.', 'Este é o dia que fez o Senhor; regozijemo-nos e alegremo-nos nele.'),
    reflection: t('Hoy también es un regalo. Disfrútalo con Dios.', 'Today is a gift too. Enjoy it with God.', 'Hoje também é um presente. Aproveite com Deus.') },
  { id: 'sal4_8', ref: t('Salmos 4:8', 'Psalm 4:8', 'Salmos 4:8'), emotions: ['cansancio', 'paz'],
    text: t('En paz me acostaré, y asimismo dormiré; porque solo tú, Señor, me harás estar confiado.', 'I will both lay me down in peace, and sleep: for thou, LORD, only makest me dwell in safety.', 'Em paz também me deitarei e dormirei, porque só tu, Senhor, me fazes habitar em segurança.'),
    reflection: t('Puedes descansar. Dios sigue cuidando mientras duermes.', 'You can rest. God keeps watching over you while you sleep.', 'Você pode descansar. Deus continua cuidando enquanto você dorme.') },
  { id: 'mt6_34', ref: t('Mateo 6:34', 'Matthew 6:34', 'Mateus 6:34'), emotions: ['preocupacion', 'impulsivo'],
    text: t('No os congojéis por el día de mañana; que el día de mañana traerá su fatiga: basta al día su afán.', 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself.', 'Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo.'),
    reflection: t('Jesús te invita a vivir un día a la vez. Mañana tendrá su propia ayuda.', 'Jesus invites you to live one day at a time. Tomorrow will have its own help.', 'Jesus te convida a viver um dia de cada vez. O amanhã terá sua própria ajuda.') },
  { id: 'lam3_22', ref: t('Lamentaciones 3:22-23', 'Lamentations 3:22-23', 'Lamentações 3:22-23'), emotions: ['desanimo', 'tristeza', 'aburrimiento'],
    text: t('Nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad.', 'His compassions fail not. They are new every morning: great is thy faithfulness.', 'As suas misericórdias não têm fim; novas são cada manhã; grande é a tua fidelidade.'),
    reflection: t('Cada mañana Dios empieza de nuevo contigo. Mañana también.', 'Every morning God starts fresh with you. Tomorrow too.', 'Cada manhã Deus recomeça com você. Amanhã também.') },
  { id: 'jn11_35', ref: t('Juan 11:35', 'John 11:35', 'João 11:35'), emotions: ['tristeza', 'soledad'],
    text: t('Y lloró Jesús.', 'Jesus wept.', 'Jesus chorou.'),
    reflection: t('Jesús también lloró. Tu tristeza no lo asusta; él la entiende.', "Jesus cried too. Your sadness doesn't scare him; he understands it.", 'Jesus também chorou. Sua tristeza não o assusta; ele a entende.') },
  { id: 'sal56_3', ref: t('Salmos 56:3', 'Psalm 56:3', 'Salmos 56:3'), emotions: ['miedo', 'ansiedad'],
    text: t('En el día que temo, yo en ti confío.', 'What time I am afraid, I will trust in thee.', 'Em qualquer tempo em que eu temer, confiarei em ti.'),
    reflection: t('Tener miedo y confiar pueden pasar al mismo tiempo. Eso también es fe.', 'Being afraid and trusting can happen at the same time. That is faith too.', 'Ter medo e confiar podem acontecer ao mesmo tempo. Isso também é fé.') },
  { id: 'is40_31', ref: t('Isaías 40:31', 'Isaiah 40:31', 'Isaías 40:31'), emotions: ['agotamiento', 'cansancio', 'energia'],
    text: t('Los que esperan al Señor tendrán nuevas fuerzas; levantarán las alas como águilas.', 'They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.', 'Os que esperam no Senhor renovarão as forças, subirão com asas como águias.'),
    reflection: t('Las fuerzas nuevas vienen de Dios, no de esforzarte más.', 'New strength comes from God, not from trying harder.', 'As forças novas vêm de Deus, não de se esforçar mais.') },
  { id: 'jn10_11', ref: t('Juan 10:11', 'John 10:11', 'João 10:11'), emotions: ['soledad', 'miedo', 'paz', 'no_puedo'],
    text: t('Yo soy el buen pastor: el buen pastor su vida da por las ovejas.', 'I am the good shepherd: the good shepherd giveth his life for the sheep.', 'Eu sou o bom Pastor; o bom Pastor dá a sua vida pelas ovelhas.'),
    reflection: t('Jesús es como un pastor que cuida a cada oveja por su nombre. También a ti.', 'Jesus is like a shepherd who knows each sheep by name. You too.', 'Jesus é como um pastor que cuida de cada ovelha pelo nome. De você também.') },
  { id: '1ts5_18', ref: t('1 Tesalonicenses 5:18', '1 Thessalonians 5:18', '1 Tessalonicenses 5:18'), emotions: ['gratitud', 'alegria'],
    text: t('Dad gracias en todo; porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.', 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.', 'Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.'),
    reflection: t('Dar gracias abre los ojos a lo bueno que ya está aquí.', 'Giving thanks opens your eyes to the good that is already here.', 'Agradecer abre os olhos para o bem que já está aqui.') },
];

// ---------- Protocolo de crisis ----------
// Verificar cada número antes de habilitar un país (fecha en "verified").
export const helplines = {
  US: { name: t('Línea 988 de Crisis y Suicidio', '988 Suicide & Crisis Lifeline', 'Linha 988 de Crise e Suicídio'), number: '988', sms: '988', emergency: '911', verified: '2026-10-17' },
  MX: { name: t('Línea de la Vida', 'Línea de la Vida', 'Línea de la Vida'), number: '800 911 2000', emergency: '911', verified: 'pendiente' },
  CO: { name: t('Línea 192, opción 4 (salud mental)', 'Line 192, option 4 (mental health)', 'Linha 192, opção 4 (saúde mental)'), number: '192', emergency: '123', verified: '2026-10-17' },
  BR: { name: t('CVV – Centro de Valorización de la Vida', 'CVV – Centro de Valorização da Vida', 'CVV – Centro de Valorização da Vida'), number: '188', emergency: '192', verified: 'pendiente' },
  ES: { name: t('Línea 024 de atención a la conducta suicida', '024 Suicide Prevention Line', 'Linha 024 de prevenção ao suicídio'), number: '024', emergency: '112', verified: 'pendiente' },
  OTHER: { name: t('Número de emergencias de tu país', 'Your local emergency number', 'Número de emergência do seu país'), number: '', emergency: '', verified: '—' },
};

export const crisisCopy = {
  title: t('Gracias por decírmelo', 'Thank you for telling me', 'Obrigado por me contar'),
  body: t('Lo que sientes importa, y no tienes que pasarlo sin ayuda. Hablar con una persona ahora puede ayudar.', "What you feel matters, and you don't have to go through it alone. Talking to a person right now can help.", 'O que você sente importa, e você não precisa passar por isso sem ajuda. Conversar com uma pessoa agora pode ajudar.'),
  abuse: t('Si alguien te está haciendo daño, no es tu culpa. Busca a un adulto de confianza o llama a emergencias.', 'If someone is hurting you, it is not your fault. Find a trusted adult or call emergency services.', 'Se alguém está te machucando, a culpa não é sua. Procure um adulto de confiança ou ligue para a emergência.'),
  danger: t('Si estás en peligro ahora mismo, llama al', 'If you are in danger right now, call', 'Se você está em perigo agora, ligue para'),
  trusted: t('Escribe ahora a alguien de confianza: "¿Puedes hablar conmigo? No estoy bien."', 'Message someone you trust now: "Can you talk with me? I\'m not okay."', 'Escreva agora para alguém de confiança: "Você pode falar comigo? Não estou bem."'),
};

// Palabras que, en el texto libre, disparan el protocolo (revisión por reglas).
export const crisisKeywords = [
  'suicid', 'matarme', 'quitarme la vida', 'no quiero vivir', 'quiero morir', 'hacerme daño', 'cortarme', 'me pega', 'me golpea', 'abusa',
  'kill myself', 'end my life', 'want to die', 'hurt myself', 'cut myself', 'hits me', 'abuse',
  'me matar', 'tirar minha vida', 'quero morrer', 'me machucar', 'me cortar', 'me bate', 'abusa de mim',
];

// ---------- Metamorfosis ----------
// Crece por constancia y reflexión (máx. 2 hojas por día), nunca por velocidad. No se pierde nada.
export const stages = [
  { id: 'larvita', min: 0, name: t('Larvita', 'Little caterpillar', 'Lagartinha') },
  { id: 'larva', min: 4, name: t('Larva que crece', 'Growing caterpillar', 'Lagarta crescendo') },
  // La mariposa forma una crisálida colgante (el capullo es de las polillas). Corrección de la Dra. Emilia, 21-10.
  { id: 'capullo', min: 10, name: t('Crisálida', 'Chrysalis', 'Crisálida') },
  { id: 'capullo_luz', min: 18, name: t('Crisálida con luz', 'Glowing chrysalis', 'Crisálida com luz') },
  { id: 'mariposa', min: 28, name: t('Mariposa', 'Butterfly', 'Borboleta') },
];

export function defaultConfig() {
  return JSON.parse(JSON.stringify({
    version: 3,
    contentRev: 3,
    publishedAt: '2026-10-17T14:00:00Z',
    note: 'Borrador v3: Green Buddy, ritmos más lentos y crisálida. Pendiente revisión clínica y teológica.',
    screens, startScreen, after, rules, insights, validations, actions, actionByEmotion,
    bibleVersions, verses, helplines, crisisCopy, crisisKeywords, stages, colors, suggestions, suggestionRules, suggestionDefaults,
  }));
}
