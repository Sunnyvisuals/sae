import type { AppLanguage } from "../stores/languageStore";
import type { RevelationWord } from "../components/Immersive/mapWordData";
import {
  ACT1_PHRASE_STRIP_STEPS_AR,
  ACT1_PHRASE_STRIP_STEPS_FR,
} from "./act1IntroBridge";

export type PhraseStripStep = {
  word: RevelationWord;
  before: string;
  after: string;
};

export type PoetryLevel = {
  text: string;
  missing: string[];
  options: string[];
};

/** Textes persistants hors React — une seule source pour FR / العربية الجزائرية */
type Copy = {
  act1HudSubtitleDone: string;
  act1HudSubtitleFind: string;
  act1TutorialHeading: string;
  act1TutorialLine1: string;
  act1TutorialLine2: string;
  act1ScaleLabel: string;
  act1ScaleAria: (zoomText: string) => string;
  act1HeaderLine: string;
  act1BottomTitle: string;
  act1BottomChapter: string;
  act1AriaHud: string;
  act1AriaStripWord: string;
  phraseStripComplete: string;
  phraseStripSteps: PhraseStripStep[];
  revelationWordAria: Record<RevelationWord, string>;
  chapterToastKicker: string;
  chapterToastTitle: string;
  chapterToastSubtitle: string;
  menuAria: string;
  daKicker: string;
  daTitle: string;
  daSubtitle: string;
  act2IframeTitle: string;
  orientationBreadcrumbAria: string;
  orientationCreditsLabel: string;
  orientationCreditsSummary: string;
  orientationFutureAct3: string;
  orientationFutureAct4: string;
  orientationLockedIntro: string;
  orientationLockedAct1: string;
  orientationLockedAct2: string;
  orientationPhaseIntroLabel: string;
  orientationPhaseAct1Label: string;
  orientationPhaseAct2Label: string;
  orientationSummaries: { intro: string; act1: string; act2: string };
  orientationFlux: string;
  orientationFluxCredits: string;
  orientationFluxScroll: string;
  orientationMiniMap: string;
  orientationParcours: string;
  orientationReplayHint: string;
  orientationOpenPanel: string;
  orientationCollapsePanel: string;
  menuClose: string;
  menuPause: string;
  menuQuote: string;
  menuSound: string;
  menuAmbientMuteOn: string;
  menuAmbientMuteOff: string;
  menuAmbientVolume: string;
  languageSectionHeading: string;
  languageFrenchBtn: string;
  languageArabicBtn: string;
  /** Annonce vocal (pause) lors du fondu langue — accessibilité */
  languageMorphLive: string;
  /** Court libellé visible sous la pastille (optionnel dans l’overlay) */
  languageMorphVisible: string;
  /** Kicker DA (comme « Changement de ciel ») pour l’overlay changement de langue */
  languageMorphKicker: string;
  menuContinue: string;
  menuReplayVideo: string;
  menuReplayHint: string;
  menuRestart: string;
  menuCreditsBy: string;
  menuMusicLine: string;
  menuEmbeddedParcours: string;
  menuNavAria: string;
  introDevPreviewCreditsTitle: string;
  introAlRihlaSubtitle: string;
  introJeanSenacSubtitle: string;
  scrollNudge: string;
  chapterCompleteAria: string;
  hintTitles: { act1: string; act2: string };
  hintCloseAria: string;
  hintStepsAct1: { label: string; desc: string }[];
  hintStepsAct2: { label: string; desc: string }[];
  poetry: {
    ariaClose: string;
    rebuildVerse: string;
    fragment: (cur: number, total: number) => string;
    reset: string;
    successTitle: string;
    successBody: string;
    nextFragment: string;
    backToJourney: string;
  };
  poetryLevels: PoetryLevel[];
  introVideoAria: string;
  introVideoSkip: string;
  introVideoMuteOn: string;
  introVideoMuteOff: string;
  introVideoVolumeRange: string;
};

const FR: Copy = {
  act1HudSubtitleDone: "Les cinq feux sont rallumés - la carte respire.",
  act1HudSubtitleFind:
    "En vous souvenant de la vidéo, retrouvez chaque fragment sur la carte, dans l’ordre des passages.",
  act1TutorialHeading: "Consignes",
  act1TutorialLine1: "Survolez - clic sur le fragment attendu -",
  act1TutorialLine2: "Molette zoom",
  act1ScaleLabel: "Échelle",
  act1ScaleAria: (zoomText) =>
    `Échelle de la carte, grossissement ${zoomText}`,
  act1HeaderLine: "Acte I - L'algérie",
  act1BottomTitle: "Acte I - L'algérie",
  act1BottomChapter: "La Naissance",
  act1AriaHud: "Acte I, L'algérie, La Naissance",
  act1AriaStripWord: "Mot à trouver :",
  phraseStripComplete:
    "Sous l’oasis du texte, la phrase entière se lit - le vers vous retient encore un instant.",
  phraseStripSteps: [...ACT1_PHRASE_STRIP_STEPS_FR],
  revelationWordAria: {
    naissance: "Mot à trouver : naissance",
    soleil: "Mot à trouver : soleil",
    mère: "Mot à trouver : mère",
    liberté: "Mot à trouver : liberté",
    corps: "Mot à trouver : corps",
  },
  chapterToastKicker: "Chapitre accompli",
  chapterToastTitle: "La Naissance",
  chapterToastSubtitle:
    "Les cinq feux sont rallumés - la carte respire. Le voyage continue.",
  menuAria: "Menu - options et pause",
  daKicker: "Changement de ciel",
  daTitle: "La nuit s'ouvre",
  daSubtitle: "Le désert quitte l'or chaud. Le fil devient constellation.",
  act2IframeTitle: "Jean Sénac - frise narrative",
  orientationBreadcrumbAria: "Fil d'Ariane",
  orientationCreditsLabel: "Crédits",
  orientationCreditsSummary: "Générique de fin, remerciements et fermeture de ce voyage.",
  orientationFutureAct3: "Acte III - ?",
  orientationFutureAct4: "Acte IV - ?",
  orientationLockedIntro: "Intro - ?",
  orientationLockedAct1: "Acte I - ?",
  orientationLockedAct2: "Acte II - ?",
  orientationPhaseIntroLabel: "Intro - Prologue",
  orientationPhaseAct1Label: "Acte I - L'algérie",
  orientationPhaseAct2Label: "Acte II - (suite)",
  orientationSummaries: {
    intro: "Voix et paysage désert avant d'entrer dans la carte-mémoire.",
    act1: "Une carte où cinq fragments viennent compléter le vers de Sénac dans l'Algérie.",
    act2:
      "Le rouleau nocturne : le poème, les archives au fil du défilement dans le bleu.",
  },
  orientationFlux: "Flux",
  orientationFluxCredits:
    "Générique : laisse défiler puis Échapper pour fermer quand les commandes sont visibles.",
  orientationFluxScroll: "Défiler pour poursuivre",
  orientationMiniMap: "Mini-carte",
  orientationParcours: "Parcours",
  orientationReplayHint:
    "Après le générique de fin — choisis une étape ci-dessus pour la revivre.",
  orientationOpenPanel: "Ouvrir le panneau Parcours",
  orientationCollapsePanel: "Réduire le panneau Parcours",
  menuClose: "Fermer le menu (Échap)",
  menuPause: "Pause",
  menuQuote: "Reprenez le voyage, ou ouvrez un autre passage.",
  menuSound: "Son",
  menuAmbientMuteOn: "Réactiver le son ambiant",
  menuAmbientMuteOff: "Couper le son ambiant",
  menuAmbientVolume: "Volume du son",
  languageSectionHeading: "Langue",
  languageFrenchBtn: "Français",
  languageArabicBtn: "العربية الجزائرية",
  languageMorphLive: "Changement de langue en cours.",
  languageMorphVisible: "Changement…",
  languageMorphKicker: "Une autre voix",
  menuContinue: "Continuer",
  menuReplayVideo: "Revoir la vidéo d’introduction",
  menuReplayHint:
    "Lecture par-dessus l’expérience, pas de rechargement, votre progression est conservée.",
  menuRestart: "Recommencer l’expérience",
  menuCreditsBy: "Une création de",
  menuMusicLine: "Musique · © Rafael Krux",
  menuEmbeddedParcours: "Parcours",
  menuNavAria: "Actions du menu pause",
  introDevPreviewCreditsTitle: "Prévisualiser le générique de fin (?previewCredits=1)",
  introAlRihlaSubtitle: "Jean Sénac",
  introJeanSenacSubtitle: "Jean Sénac",
  scrollNudge: "Molette · défiler",
  chapterCompleteAria: "révélation carte-mémoire",
  hintTitles: { act1: "Premiers gestes", act2: "Comment naviguer" },
  hintCloseAria: "Fermer les consignes",
  hintStepsAct1: [
    {
      label: "Survolez",
      desc: "Passez la souris sur un mot pour le faire briller",
    },
    {
      label: "Cliquez",
      desc: "Cliquez sur le fragment attendu pour le valider",
    },
    {
      label: "Zoom",
      desc: "Molette ou pincement pour zoomer sur la carte",
    },
  ],
  hintStepsAct2: [
    {
      label: "Défilez",
      desc: "Faites défiler pour traverser le poème - les fragments se révèlent au passage",
    },
  ],
  poetry: {
    ariaClose: "Fermer",
    rebuildVerse: "Reconstituez le vers",
    fragment: (cur, total) => `Fragment ${cur} / ${total}`,
    reset: "Réinitialiser",
    successTitle: "Éclatant",
    successBody: "Vous avez restauré un fragment de lumière",
    nextFragment: "Fragment suivant",
    backToJourney: "Retour au voyage",
  },
  poetryLevels: [
    {
      text: "Le soleil est mon corps, le sable est ma mémoire.",
      missing: ["soleil", "sable", "mémoire"],
      options: ["soleil", "sable", "mémoire", "vent", "mer", "silence"],
    },
    {
      text: "Un cri de lumière dans l'immensité du désert.",
      missing: ["cri", "lumière", "désert"],
      options: ["cri", "lumière", "désert", "chant", "ombre", "ciel"],
    },
    {
      text: "Écrire c'est tracer un chemin de feu sur l'eau.",
      missing: ["Écrire", "chemin", "feu"],
      options: ["Écrire", "chemin", "feu", "Lire", "rêve", "sang"],
    },
  ],
  introVideoAria: "Introduction - Al-Rihla",
  introVideoSkip: "Passer l'introduction",
  introVideoMuteOn: "Couper le son",
  introVideoMuteOff: "Activer le son",
  introVideoVolumeRange: "Volume",
};

const AR: Copy = {
  act1HudSubtitleDone:
    "النجوم الخمس تشعل من جديد والخريطة تنبض.",
  act1HudSubtitleFind:
    "بالذاكرة ديال الفيديو، دور على كل مقطع على الخريطة، بنفس الترتيب اللي سمعتو فيه.",
  act1TutorialHeading: "التعليمات",
  act1TutorialLine1: "دوّاف - كليك على الشقّة المطلوبة -",
  act1TutorialLine2: "الحرّاف يقرّب",
  act1ScaleLabel: "المدى",
  act1ScaleAria: (zoomText) => `مقياس الخريطة، تكبير ${zoomText}`,
  act1HeaderLine: "المشهد الأول - الجزائر",
  act1BottomTitle: "المشهد الأول - الجزائر",
  act1BottomChapter: "الولادة",
  act1AriaHud: "المشهد الأول، الجزائر، الولادة",
  act1AriaStripWord: "كلمة لتُوجَد:",
  phraseStripComplete:
    "تحت واحة النص تقرأ الجملة كاملة - البيت ما زال يمسككم لحظة.",
  phraseStripSteps: [...ACT1_PHRASE_STRIP_STEPS_AR],
  revelationWordAria: {
    naissance: "كلمة لتُوجَد: الولادة",
    soleil: "كلمة لتُوجَد: الشمس",
    mère: "كلمة لتُوجَد: الأم",
    liberté: "كلمة لتُوجَد: الحرّية",
    corps: "كلمة لتُوجَد: الجسد",
  },
  chapterToastKicker: "المشهد مكمّل",
  chapterToastTitle: "الولادة",
  chapterToastSubtitle:
    "النجوم الخمس تشعل من جديد والخريطة تنبض. الرحلة تكمل.",
  menuAria: "القائمة - الخيارات والوقفة",
  daKicker: "تبدّل السماء",
  daTitle: "الليل تنفتح",
  daSubtitle: "الصحراء تخلّي الذهب الحار الخيط يولّي كواكب.",
  act2IframeTitle: "جان السنّاك - الزمن السردي",
  orientationBreadcrumbAria: "مسار الرحلة",
  orientationCreditsLabel: "التذييل",
  orientationCreditsSummary: "التذييل النهائي، شكر وهدايا، وكتامة الدرب.",
  orientationFutureAct3: "المشهد الثالث - ؟",
  orientationFutureAct4: "المشهد الرابع - ؟",
  orientationLockedIntro: "المقدمة - ؟",
  orientationLockedAct1: "المشهد الأول - ؟",
  orientationLockedAct2: "المشهد الثاني - ؟",
  orientationPhaseIntroLabel: "المقدمة - تمهيد",
  orientationPhaseAct1Label: "المشهد الأول - الجزائر",
  orientationPhaseAct2Label: "المشهد الثاني - مواصلة",
  orientationSummaries: {
    intro: "صوت ومشهد صحر قبل ما تدخل لخريطة الذاكرة.",
    act1: "خريطة فيها خمس قطع تكمّل بيت ساناك ما بين أرض الجزائر.",
    act2:
      "الطبقة الليلانية: القصيدة والمحفوظات كلّها على التصفّر في الزّرقة.",
  },
  orientationFlux: "التموّج",
  orientationFluxCredits:
    "التذييل خليه يحم، وبعد تعال زر ESC باش تسكر كي تبان الأوامر.",
  orientationFluxScroll: "حم باش تكمّل الدرب",
  orientationMiniMap: "خريطة مصغّرة",
  orientationParcours: "مسار الرحلة",
  orientationReplayHint:
    "من بعد تذييل نهاية الرحلة — نقط مرحلة فوق باش تعيشها من جديد.",
  orientationOpenPanel: "يفتح لوحة مسار الرحلة",
  orientationCollapsePanel: "يقلّص لوحة مسار الرحلة",
  menuClose: "سكر القائمة (Esc)",
  menuPause: "وقفة",
  menuQuote: "كمّل الرحلة، ولا ولّوج لمجال آخر.",
  menuSound: "الصوت",
  menuAmbientMuteOn: "رجّع الصوت المحيطي",
  menuAmbientMuteOff: "كمّ الصوت المحيطي",
  menuAmbientVolume: "قوة الصوت المحيطي",
  languageSectionHeading: "اللغة",
  languageFrenchBtn: "فرنساوي",
  languageArabicBtn: "العربية الجزائرية",
  languageMorphLive: "جاري تطبيق اللغة.",
  languageMorphVisible: "تطبيق…",
  languageMorphKicker: "صوت آخر",
  menuContinue: "كمّل",
  menuReplayVideo: "عاود فيديو المقدّمة",
  menuReplayHint:
    "يشغّل فوق التجرّبة، ماكاش إعادة تحميل؛ التقدّم يبقى محفوظ.",
  menuRestart: "عاود التجرّبة من الأول",
  menuCreditsBy: "من وحدة:",
  menuMusicLine: "موسيقى · © Rafael Krux",
  menuEmbeddedParcours: "مسار الرحلة",
  menuNavAria: "أزرار قائمة الوقفة",
  introDevPreviewCreditsTitle: "تشوف التذييل النهاية (?previewCredits=1)",
  introAlRihlaSubtitle: "جان ساناك",
  introJeanSenacSubtitle: "جان ساناك",
  scrollNudge: "الحرّاف",
  chapterCompleteAria: "كشوف خريطة الذاكرة",
  hintTitles: { act1: "أول خطوات", act2: "كيف تمشي في الموقع" },
  hintCloseAria: "سكر الإرشادات",
  hintStepsAct1: [
    {
      label: "طوّاف",
      desc: "دير السوريس على الكلمة باش تتلألّع",
    },
    {
      label: "كليك",
      desc: "ضغطة على الشقّة المتوقعة باش تأكّدها",
    },
    {
      label: "تكبير",
      desc: "الحرّاف أو لمستين باش تقرّب على الخريطة",
    },
  ],
  hintStepsAct2: [
    {
      label: "حم",
      desc: "زيد تحم باش تقطع القصيدة؛ الشّقايح تبان مع التحرّاك",
    },
  ],
  poetry: {
    ariaClose: "سكر",
    rebuildVerse: "ركّب البيت من جديد",
    fragment: (cur, total) => `قطعة ${cur} / ${total}`,
    reset: "من جديد",
    successTitle: "يلمع",
    successBody: "رجّعت واحدة قطعة من النور",
    nextFragment: "القطعة الجاية",
    backToJourney: "الرجوع للرحلة",
  },
  poetryLevels: [
    {
      text: "الشمس هي جسدي والرمال هي ذاكرتي.",
      missing: ["الشمس", "الرمال", "ذاكرتي"],
      options: ["الشمس", "الرمال", "ذاكرتي", "الريح", "البحر", "السكينة"],
    },
    {
      text: "صرخة ضوء في وسع الصحراء.",
      missing: ["صرخة", "ضوء", "الصحراء"],
      options: ["صرخة", "ضوء", "الصحراء", "أغنية", "ظل", "سماء"],
    },
    {
      text: "الكتابة ترسم سبيلَ نارٍ على الماء.",
      missing: ["الكتابة", "سبيل", "نار"],
      options: ["الكتابة", "سبيل", "نار", "القراءة", "الحلم", "الدم"],
    },
  ],
  introVideoAria: "تمهيد الرحلة - الريحلة",
  introVideoSkip: "دوز المقدّمة",
  introVideoMuteOn: "كمّ الصوت",
  introVideoMuteOff: "فعّل الصوت",
  introVideoVolumeRange: "مستوى الصوت",
};

export function copyFor(language: AppLanguage): Copy {
  return language === "ar-dz" ? AR : FR;
}

/** عرض الكلمة المفتّوحة تحت العربية بدل المفتاح الفرنسي */
export function revelationWordUISurface(word: RevelationWord, language: AppLanguage): string {
  if (language !== "ar-dz") return word;
  const map: Record<RevelationWord, string> = {
    naissance: "الولادة",
    soleil: "الشمس",
    mère: "الأم",
    liberté: "الحرّية",
    corps: "الجسد",
  };
  return map[word] ?? word;
}
