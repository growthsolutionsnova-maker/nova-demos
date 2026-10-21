// Textos bíblicos de licencia abierta (alternativa mientras llega el permiso de NVI / NIV / NVI-PT).
// Fuente: eBible.org (corpus BibleNLP/ebible). Por defecto cada idioma usa su versión principal;
// `VER` marca los versículos que vienen de otra versión del mismo idioma.
// Cambios marcados (lo exige CC BY-SA): en PDDPT "Yavé" → "el Señor" y "ʼElohim" → "Dios";
// en BLIVRE Sal 34:18 se corrige la errata "sava" → "salva". Se citan porciones de algunos versículos.
export const OPEN_TEXT = {
  rom12_2: {
    es: 'No sean moldeados por este mundo, sino sean transformados por la renovación de la mente.',
    en: 'Don’t be conformed to this world, but be transformed by the renewing of your mind.',
    pt: 'Não sigam os caminhos deste mundo. Em vez disso, sejam transformados pela renovação espiritual de sua mente.',
  },
  '1pe5_7': {
    es: 'Echen toda su ansiedad sobre Él, porque Él tiene cuidado de ustedes.',
    en: 'Casting all your worries on him, because he cares for you.',
    pt: 'Entreguem nas mãos de Deus todas as suas preocupações, pois ele cuida de vocês.',
  },
  sal34_18: {
    es: 'Cercano está el Señor a los quebrantados de corazón, y salva a los contritos de espíritu.',
    en: 'The LORD is near to those who have a broken heart, and saves those who have a crushed spirit.',
    pt: 'O SENHOR está perto daqueles que estão com o coração partido, e salva os aflitos de espírito.',
  },
  mt11_28: {
    es: 'Vengan a Mí todos los que están agotados y cargados, y Yo los haré descansar.',
    en: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.',
    pt: 'Venham a mim, todos que lutam e que carregam um peso grande demais. Eu lhes darei descanso.',
  },
  jn14_27: {
    es: 'Paz les dejo. Les doy mi paz. Yo no se la doy como el mundo la da. No se atribule ni se atemorice su corazón.',
    en: 'Peace I leave with you. My peace I give to you; not as the world gives, I give to you. Don’t let your heart be troubled, neither let it be fearful.',
    pt: 'Eu deixo com vocês a paz. Eu lhes dou a minha paz. A paz que eu lhes dou não é como a paz que o mundo dá. Não fiquem angustiados e não tenham medo.',
  },
  is41_10: {
    es: 'No temas, porque Yo estoy contigo. No desmayes, porque Yo soy tu Dios que te esfuerzo. Te ayudaré siempre.',
    en: 'Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you.',
    pt: 'Não temas, porque eu estou contigo; não te assombres, porque eu sou teu Deus. Eu te fortaleço, te ajudo.',
  },
  heb13_5: {
    es: 'Yo estaré contigo en todo momento, no te desampararé.',
    en: 'I will in no way leave you, neither will I in any way forsake you.',
    pt: 'Eu nunca irei decepcioná-los. Eu nunca desistirei de vocês.',
  },
  ef4_26: {
    es: 'Aírense, pero no pequen. El sol no se ponga sobre su enojo.',
    en: 'Be angry, and don’t sin. Don’t let the sun go down on your wrath.',
    pt: 'Não pequem por estarem furiosos, não fiquem o dia todo com raiva.',
  },
  sal118_24: {
    es: 'Este es el día que hizo el Señor. ¡Regocijémonos y alegrémonos en él!',
    en: 'This is the day that the LORD has made. We will rejoice and be glad in it!',
    pt: 'Este é o dia em que o SENHOR agiu; alegremos e enchamos de alegria nele.',
  },
  sal4_8: {
    es: 'En paz me acostaré y así dormiré, porque solo Tú, Señor, me haces vivir confiado.',
    en: 'In peace I will both lay myself down and sleep, for you alone, LORD, make me live in safety.',
    pt: 'Eu deitarei, e dormirei em paz; porque só tu, SENHOR, me fazes descansar seguro.',
  },
  mt6_34: {
    es: 'No se afanen por el mañana, porque el mañana se preocupa de sí mismo.',
    en: 'Don’t be anxious for tomorrow, for tomorrow will be anxious for itself.',
    pt: 'Então, não se preocupem com o amanhã, porque o amanhã pode se preocupar consigo mesmo.',
  },
  lam3_22: {
    es: 'Sus compasiones no fallan. Nuevas son cada mañana. Grande es tu fidelidad.',
    en: 'His mercies don’t fail. They are new every morning. Great is your faithfulness.',
    pt: 'Suas misericórdias não têm fim. Elas são novas a cada manhã; grande é a tua fidelidade.',
  },
  jn11_35: { es: 'Jesús lloró.', en: 'Jesus wept.', pt: 'Jesus chorou.' },
  sal56_3: {
    es: 'El día cuando temo, confío en Ti.',
    en: 'When I am afraid, I will put my trust in you.',
    pt: 'No dia em que eu tiver medo, eu confiarei em ti.',
  },
  is40_31: {
    es: 'Los que esperan en el Señor tienen nuevas fuerzas. Levantarán las alas como águilas.',
    en: 'Those who wait for the LORD will renew their strength. They will mount up with wings like eagles.',
    pt: 'Mas os que confiam no SENHOR renovarão as forças, subirão com asas como águias.',
  },
  jn10_11: {
    es: 'Yo soy el excelente Pastor. El excelente Pastor da su vida por las ovejas.',
    en: 'I am the good shepherd. The good shepherd lays down his life for the sheep.',
    pt: 'Eu sou o bom pastor. O bom pastor dá a vida pelas ovelhas.',
  },
  '1ts5_18': {
    es: 'Den gracias en todo, porque esta es la voluntad de Dios para ustedes en Cristo Jesús.',
    en: 'In everything give thanks, for this is the will of God in Christ Jesus toward you.',
    pt: 'Sejam agradecidos em todas as situações. Façam assim, pois é isso o que Deus, em Cristo Jesus, quer que vocês façam.',
  },
};

// En portugués, el Antiguo Testamento (que la BLPT aún no tiene) y Juan 11:35 vienen de la Bíblia Livre.
const OT_PT = ['sal34_18', 'is41_10', 'sal118_24', 'sal4_8', 'lam3_22', 'jn11_35', 'sal56_3', 'is40_31'];
export const VER = Object.fromEntries(OT_PT.map((id) => [id, { pt: 'BLIVRE' }]));
VER.heb13_5 = { es: 'BES' };

export const OPEN_VERSIONS = {
  es: { active: 'PDDPT', target: 'NVI', license: 'CC BY-SA 4.0. Hebreos 13:5: BES, CC BY 4.0.',
    credit: 'Biblia Palabra de Dios para Todos (PDDPT) © 2020 Asociación Bíblica Latinoamericana, CC BY-SA 4.0, adaptada ("Yavé" como "el Señor"). Hebreos 13:5: La Biblia en Español Sencillo © 2018 AudioBiblia.org / Irma Flores, CC BY 4.0. Fuente: eBible.org.' },
  en: { active: 'WEB', target: 'NIV', license: 'Dominio público.',
    credit: 'World English Bible (WEB), public domain. Source: eBible.org.' },
  pt: { active: 'BLPT', target: 'NVI', license: 'CC BY-SA 4.0 y CC BY 3.0 BR.',
    credit: 'Bíblia Livre Para Todos (BLPT) © 2022 Free Bible Ministry, CC BY-SA 4.0. Antigo Testamento: Bíblia Livre (BLIVRE) © Diego Santos, Mario Sérgio e Marco Teles, fevereiro de 2018, CC BY 3.0 BR. Fonte: eBible.org.' },
};
