import type { AppLanguage } from "../stores/languageStore";
import type { RevelationWord } from "../components/Immersive/mapWordData";
import {
  ACT1_PHRASE_STRIP_STEPS_AR,
  ACT1_PHRASE_STRIP_STEPS_FR,
} from "./act1IntroBridge";

type PhraseStripStep = {
  word: RevelationWord;
  before: string;
  after: string;
};

type PoetryLevel = {
  text: string;
  missing: string[];
  options: string[];
};

export type VoyageCreditsBlock = {
  heading: string;
  /** Nom ou crédit principal du bloc (ex. réalisateur). */
  lead?: string;
  lines?: string[];
  groups?: { label: string; lines: string[] }[];
};

/** Textes persistants hors React - une seule source pour FR / العربية الجزائرية */
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
  menuHintDiscover: string;
  daKicker: string;
  daTitle: string;
  daSubtitle: string;
  act2IframeTitle: string;
  act2NavigateActIII: string;
  act2NavigateActIIIAria: string;
  /** Suspense lazy : message pendant le chargement du chunk acte I */
  lazySuspenseAct1: string;
  /** Suspense lazy : message pendant le chargement du chunk acte II */
  lazySuspenseAct2: string;
  lazySuspenseAct3: string;
  orientationBreadcrumbAria: string;
  orientationCreditsLabel: string;
  orientationCreditsSummary: string;
  orientationFutureAct3: string;
  /** Dernière ligne du fil (placeholder) : points d’interrogation, non cliquable. */
  orientationFutureAct4: string;
  /** Sous-texte du même placeholder (même ton mystère). */
  orientationFutureAct4Summary: string;
  orientationLockedIntro: string;
  orientationLockedAct1: string;
  orientationLockedAct2: string;
  orientationPhaseIntroLabel: string;
  orientationPhaseAct1Label: string;
  orientationPhaseAct2Label: string;
  orientationPhaseAct3Label: string;
  orientationSummaries: { intro: string; act1: string; act2: string; act3: string };
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
  /** Pause / intro : mode curseur (fluide vs basique). */
  cursorSectionHeading: string;
  cursorOptionFluid: string;
  cursorOptionFluidHint: string;
  /** Pastille sur l’option Mirage (onboarding + menu). */
  cursorOptionDefaultBadge: string;
  cursorOptionBasic: string;
  cursorOptionBasicHint: string;
  cursorOnboardingCurtainFr: string;
  cursorOnboardingCurtainAr: string;
  languageSectionHeading: string;
  languageFrenchBtn: string;
  languageArabicBtn: string;
  /** Annonce vocal (pause) lors du fondu langue - accessibilité */
  languageMorphLive: string;
  /** Court libellé visible sous la pastille (optionnel dans l’overlay) */
  languageMorphVisible: string;
  /** Kicker DA (comme « Changement de ciel ») pour l’overlay changement de langue */
  languageMorphKicker: string;
  menuContinue: string;
  menuReplayVideo: string;
  menuReplayHint: string;
  menuRestart: string;
  /** Dialogue de confirmation avant reset complet */
  menuRestartConfirmAria: string;
  menuRestartConfirmMessage: string;
  menuRestartConfirmYes: string;
  menuRestartConfirmNo: string;
  menuCreditsBy: string;
  menuMusicLine: string;
  menuEmbeddedParcours: string;
  menuNavAria: string;
  /** Bandeau arrivée + menu pause */
  fullscreenPromptTitle: string;
  /** Court sous-titre optionnel (vide = rien d’affiché). */
  fullscreenPromptBody: string;
  /** Description complète pour lecteurs d’écran (aria-label du bandeau). */
  fullscreenPromptAria: string;
  fullscreenPromptAccept: string;
  fullscreenPromptLater: string;
  fullscreenPromptNever: string;
  menuFullscreenSection: string;
  menuFullscreenEnter: string;
  menuFullscreenExit: string;
  menuFullscreenUnsupported: string;
  menuFullscreenStateLabel: string;
  menuFullscreenStateOn: string;
  menuFullscreenStateOff: string;
  menuFullscreenShortcutEnter: string;
  menuFullscreenShortcutExit: string;
  introDevPreviewCreditsTitle: string;
  introAlRihlaSubtitle: string;
  introJeanSenacSubtitle: string;
  zoomNudge: string;
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
  /** Bande lumineuse à droite du prologue : volume à la molette (lecteur d’écran). */
  introPrologueVolumeAuraAria: string;
  introProloguePausedAria: string;
  introProloguePlayingAria: string;
  /** Suspense intro vidéo - même typo que l’écran langue (sourcil + titre + filet). */
  introSuspenseEyebrow: string;
  introSuspenseTitle: string;
  introSuspenseProgressAria: string;
  /** Tutoriel gamifié avant la vidéo prologue (skip puis volume molette). */
  introTutorialMission: string;
  introTutorialSkipEyebrow: string;
  introTutorialSkipTitle: string;
  introTutorialSkipBody: string;
  introTutorialSkipFullscreenHint: string;
  introTutorialSkipCta: string;
  introTutorialFullscreenCta: string;
  introTutorialFullscreenAria: string;
  introTutorialFullscreenExitAria: string;
  introTutorialFullscreenActive: string;
  introTutorialVolumeEyebrow: string;
  introTutorialVolumeTitle: string;
  introTutorialVolumeBody: string;
  introTutorialVolumeSaviezEyebrow: string;
  introTutorialVolumeSaviezBody: string;
  introTutorialVolumeScrollHint: string;
  introTutorialVolumeScrollAria: string;
  introTutorialVolumeLabel: string;
  introTutorialVolumeProgressAria: string;
  introTutorialVolumeSuccess: string;
  introTutorialVolumeLaunchCta: string;
  /** Mission 2 : relire le texte de la mission 1 sans perdre la jauge. */
  introTutorialReviewMission1: string;
  /** Vidéo pont avant l’Acte III (même commande « passer » que l’introduction, phrase distincte). */
  act23BridgeVideoSkip: string;
  /** Clôture Acte II · phrase à compléter avant crédits */
  act2FinaleAria: string;
  act2FinaleStem: string;
  act2FinalePlaceholder: string;
  act2FinaleHint: string;
  act2FinaleSubmit: string;
  voyageCreditsTitle: string;
  voyageCreditsSubtitle: string;
  voyageCreditsClose: string;
  voyageCreditsFin: string;
  voyageCreditsBlocks: VoyageCreditsBlock[];
  act3Aria: string;
  act3Kicker: string;
  act3Hint: string;
  /** En-tête panneau liste (acte III) - typo consignes / HintPanel */
  act3FragmentsPanelTitle: string;
  act3FragmentsPanelSub: string;
  act3CompositionPanelTitle: string;
  act3CompositionPanelSub: string;
  /** Zone vide - composition encore sans ligne */
  act3CompositionEmptyBody: string;
  act3ContinueCredits: string;
  act3BackScroll: string;
  act3FinaleWrong: string;
  act3FinaleEnterHint: string;
  act3FinaleLoading: string;
  act3FinaleRedirecting: string;
  /** Libellé court au-dessus de l’indice différé (gate finale acte III). */
  act3FinaleTimedHintKicker: string;
};

const FR: Copy = {
  act1HudSubtitleDone: "Les cinq feux sont rallumés, la carte respire.",
  act1HudSubtitleFind:
    "La vidéo que vous venez de voir, ainsi que les vers affichés en bas, vous indiquent comment retrouver chaque fragment sur la carte, dans l’ordre des différents passages.",
  act1TutorialHeading: "Consignes",
  act1TutorialLine1: "Survolez - clic sur le fragment attendu -",
  act1TutorialLine2: "Molette zoom",
  act1ScaleLabel: "Échelle",
  act1ScaleAria: (zoomText) =>
    `Échelle de la carte, grossissement ${zoomText}`,
  act1HeaderLine: "Acte I - L'algérie",
  act1BottomTitle: "Acte I - L'algérie",
  act1BottomChapter: "Sahara",
  act1AriaHud: "Acte I - L’Algérie, Sahara",
  act1AriaStripWord: "Mot à trouver :",
  phraseStripComplete:
    "Sous cette calligraphie de sable, les cinq vers se rejoignent, le vent vous retient encore un instant.",
  phraseStripSteps: [...ACT1_PHRASE_STRIP_STEPS_FR],
  revelationWordAria: {
    désert: "Mot à trouver : désert",
    silence: "Mot à trouver : silence",
    dune: "Mot à trouver : dune",
    nuit: "Mot à trouver : nuit",
    immensité: "Mot à trouver : immensité",
  },
  chapterToastKicker: "Chapitre accompli",
  chapterToastTitle: "Sahara",
  chapterToastSubtitle:
    "Les cinq feux sont rallumés, la carte respire. Le voyage continue.",
  menuAria: "Menu - options et pause",
  menuHintDiscover: "Découvrir le passage",
  daKicker: "Changement de ciel",
  daTitle: "La nuit s'ouvre",
  daSubtitle: "Le désert quitte l'or chaud. Le fil devient constellation.",
  act2IframeTitle: "Jean Sénac - frise narrative",
  act2NavigateActIII: "Acte III - L’écriture",
  act2NavigateActIIIAria:
    "Ouvre la poésie interactive sur une page dédiée ; vous pouvez ensuite revenir au rouleau d’ici.",
  lazySuspenseAct1: "Préparation de la carte-mémoire…",
  lazySuspenseAct2: "Ouverture du rouleau - chargement du parchemin…",
  lazySuspenseAct3: "Ouverture de l’écriture - souffle et fragments…",
  orientationBreadcrumbAria: "Fil d'Ariane",
  orientationCreditsLabel: "Crédits",
  orientationCreditsSummary: "Générique de fin, remerciements et fermeture de ce voyage.",
  orientationFutureAct3: "Acte III",
  orientationFutureAct4: "Suite du voyage",
  orientationFutureAct4Summary: "À venir",
  orientationLockedIntro: "Prologue",
  orientationLockedAct1: "Acte I",
  orientationLockedAct2: "Acte II",
  orientationPhaseIntroLabel: "Intro - Prologue",
  orientationPhaseAct1Label: "Acte I - L'algérie",
  orientationPhaseAct2Label: "Acte II - (suite)",
  orientationPhaseAct3Label: "Acte III - L’écriture",
  orientationSummaries: {
    intro: "Voix et paysage désert avant d'entrer dans la carte-mémoire.",
    act1: "Une carte où cinq fragments posent cinq vers du désert dans l’Algérie.",
    act2:
      "Le rouleau nocturne : le poème, les archives au fil du défilement dans le bleu.",
    act3:
      "Une dernière feuille : les voix rencontrées se rassemblent en un même vers.",
  },
  orientationFlux: "Flux",
  orientationFluxCredits:
    "Générique : laisse défiler puis Échapper pour fermer quand les commandes sont visibles.",
  orientationFluxScroll: "Défiler pour poursuivre",
  orientationMiniMap: "Mini-carte",
  orientationParcours: "Parcours",
  orientationReplayHint:
    "Après le générique de fin - choisis une étape ci-dessus pour la revivre.",
  orientationOpenPanel: "Ouvrir le panneau Parcours",
  orientationCollapsePanel: "Réduire le panneau Parcours",
  menuClose: "Fermer le menu (Échap)",
  menuPause: "Pause",
  menuQuote: "Reprenez le voyage, ou ouvrez un autre passage.",
  menuSound: "Son",
  menuAmbientMuteOn: "Réactiver le son ambiant",
  menuAmbientMuteOff: "Couper le son ambiant",
  menuAmbientVolume: "Volume du son",
  cursorSectionHeading: "Curseur",
  cursorOptionFluid: "Mirage",
  cursorOptionFluidHint: "Brume de lumière qui suit le geste - losange du voyage et halos dorés.",
  cursorOptionDefaultBadge: "voie d'accueil",
  cursorOptionBasic: "Signe",
  cursorOptionBasicHint: "Point précis et léger - cercle sobre, sans brume animée.",
  cursorOnboardingCurtainFr: "Choisissez votre curseur",
  cursorOnboardingCurtainAr: "اختر مؤشّرك",
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
  menuRestartConfirmAria: "Confirmation avant de recommencer l’expérience",
  menuRestartConfirmMessage: "Êtes-vous sûr de vouloir recommencer l’expérience ?",
  menuRestartConfirmYes: "Oui",
  menuRestartConfirmNo: "Non",
  menuCreditsBy: "Une création de",
  menuMusicLine: "Musique · © Rafael Krux",
  menuEmbeddedParcours: "Parcours",
  menuNavAria: "Actions du menu pause",
  fullscreenPromptTitle: "Plein écran",
  fullscreenPromptBody: "",
  fullscreenPromptAria:
    "Proposition d’affichage en plein écran pour masquer les barres du navigateur. Vous pourrez quitter ce mode avec la touche Échap ou depuis le menu pause.",
  fullscreenPromptAccept: "Activer (F11)",
  fullscreenPromptLater: "Plus tard",
  fullscreenPromptNever: "Ne plus proposer",
  menuFullscreenSection: "Plein écran",
  menuFullscreenEnter: "Passer en plein écran",
  menuFullscreenExit: "Quitter le plein écran",
  menuFullscreenUnsupported: "Indisponible dans ce navigateur.",
  menuFullscreenStateLabel: "État actuel",
  menuFullscreenStateOn: "Activé",
  menuFullscreenStateOff: "Désactivé",
  menuFullscreenShortcutEnter: "F11",
  menuFullscreenShortcutExit: "Échap",
  introDevPreviewCreditsTitle: "Prévisualiser le générique de fin (-previewCredits=1)",
  introAlRihlaSubtitle: "Jean Sénac",
  introJeanSenacSubtitle: "« La traversée »",
  zoomNudge: "Zoom vers le haut",
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
  introPrologueVolumeAuraAria:
    "Volume du prologue : molette sur la bande lumineuse à droite - vers le haut augmente, vers le bas diminue. Flèches haut et bas quand la zone est sélectionnée.",
  introProloguePausedAria: "Vidéo en pause - appuyez sur Espace pour reprendre.",
  introProloguePlayingAria: "Lecture en cours.",
  introSuspenseEyebrow: "Prologue",
  introSuspenseTitle: "Le voyage va commencer",
  introSuspenseProgressAria: "Progression du chargement",
  introTutorialMission: "Étape",
  introTutorialSkipEyebrow: "Avant le départ",
  introTutorialSkipTitle: "Immersion",
  introTutorialSkipBody:
    "Franchis une fois le plein écran : un seuil suffit, inutile d'y demeurer.\nIl est préférable d'écouter au casque : le désert ne livre ses murmures qu'à qui s'y abandonne.",
  introTutorialSkipFullscreenHint:
    "Franchis le plein écran une fois pour continuer",
  introTutorialSkipCta: "Suivant",
  introTutorialFullscreenCta: "Plein écran (F11)",
  introTutorialFullscreenAria: "Activer le plein écran",
  introTutorialFullscreenExitAria: "Quitter le plein écran",
  introTutorialFullscreenActive: "Quitter le plein écran",
  introTutorialVolumeEyebrow: "Teste le niveau sonore",
  introTutorialVolumeTitle: "Réveille l'écho",
  introTutorialVolumeBody:
    "À droite, monte le volume en faisant défiler la molette vers le haut,\njusqu'à ce que le son te convienne.",
  introTutorialVolumeSaviezEyebrow: "Saviez-vous ?",
  introTutorialVolumeSaviezBody:
    "« Zina », que vous écoutez, est un refrain du raï algérien,\nla même époque que Jean Sénac célébrait dans sa poésie, entre soleil et Méditerranée.",
  introTutorialVolumeScrollHint: "Molette\nvers le haut",
  introTutorialVolumeScrollAria:
    "Fais défiler la molette de la souris vers le haut pour régler le volume",
  introTutorialVolumeLabel: "Flamme sonore",
  introTutorialVolumeProgressAria: "Progression de la résonance",
  introTutorialVolumeSuccess: "Le seuil est franchi - le prologue commence.",
  introTutorialVolumeLaunchCta: "Lancer la vidéo",
  introTutorialReviewMission1: "Reprendre l'accueil",
  act23BridgeVideoSkip: "Franchir le passage",
  act2FinaleAria: "Clôture du voyage - complétez la phrase pour accéder aux crédits",
  act2FinaleStem: "Une traversée existe vraiment quand",
  act2FinalePlaceholder: "… quelques mots suffisent",
  act2FinaleHint:
    "Écrivez votre fin de phrase ci-dessous. Ce n’est ni un test ni une notation - seulement votre trace.",
  act2FinaleSubmit: "Voir les crédits",
  voyageCreditsTitle: "Al Rihla",
  voyageCreditsSubtitle: "Hommage à Jean Sénac",
  voyageCreditsClose: "Fermer (Échap)",
  voyageCreditsFin: "Merci d’avoir traversé cette nuit.",
  voyageCreditsBlocks: [
    {
      heading: "Conception & réalisation",
      lead: "Yacine Bouabdallah",
      lines: [
        "Direction artistique & développement",
        "Carte mémoire, frise Jean Sénac, écriture, générique",
        "React, TypeScript, Vite, GSAP, Motion",
        "Tailwind, Lenis, Howler, Zustand",
        "Aide IA : débugage, conception du site web",
        "Toute la partie développement",
      ],
    },
    {
      heading: "Textes & citations",
      lines: [
        "Fragments et citations de Jean Sénac",
        "Reproduction pédagogique (art. L.122-5 CPI)",
        "Projet BUT MMI, usage non commercial",
      ],
    },
    {
      heading: "Images & archives",
      lines: [
        "Portraits et documents dans le parchemin",
        "Archives photographiques du dossier pédagogique",
      ],
    },
    {
      heading: "Musique",
      lines: [
        "Raïna Raï, Zina",
        "Switzerland, Thomas James White",
        "Emotional Arabian Oud (Acte II)",
      ],
    },
    {
      heading: "Vidéo & son",
      lines: [
        "Intro & transitions (al-rihla.mp4, ponts)",
        "Tournage, montage et prologue par Yacine Bouabdallah",
        "Plans sous licence Artlist",
        "Effets whoosh & transitions (local)",
      ],
    },
    {
      heading: "Technique & sources",
      groups: [
        {
          label: "Création",
          lines: ["Adobe CC, DaVinci Resolve, Blender"],
        },
        {
          label: "Web & 3D",
          lines: [
            "Three.js, scène 3D de l’arche",
            "Modèle public/models/model.glb",
            "Turf.js, carte mémoire",
          ],
        },
        {
          label: "Données & typo",
          lines: [
            "Natural Earth 50 m, contour Algérie",
            "Google Fonts, Bahlull (locale)",
            "Bibliothèques open source",
          ],
        },
      ],
    },
  ],
  act3Aria: "Acte III - poésie interactive, recomposition des fragments du voyage",
  act3Kicker: "écriture",
  act3Hint:
    "Touchez les fragments retrouvés sur votre route (intro, carte, parchemin) pour les aligner ici, à la façon du bandeau du premier acte. L’ordre est libre : rassemblez-les tous pour que le dernier vers apparaisse.",
  act3FragmentsPanelTitle: "Souvenirs du parcours",
  act3FragmentsPanelSub:
    "Introduction, lignes carte-mémoire et passages du rouleau : tout ce qui vous est déjà apparu dans le voyage.",
  act3CompositionPanelTitle: "Vers recomposés",
  act3CompositionPanelSub:
    "Une ligne après l’autre, dans l’ordre que vous imposez jusqu’à la clôture du poème.",
  act3CompositionEmptyBody:
    "Touchez une première ligne à gauche pour qu’elle s’installe ici comme un vers central.",
  act3ContinueCredits: "Voir les crédits",
  act3BackScroll: "Retour au parchemin",
  act3FinaleWrong: "Ce n’est pas le mot attendu, réessayez.",
  act3FinaleEnterHint: "Entrée : valider le mot, le bon mot ouvre les crédits du voyage.",
  act3FinaleLoading: "Préparation du dernier vers…",
  act3FinaleRedirecting: "Ouverture des crédits…",
  act3FinaleTimedHintKicker: "Indice",
};

const AR: Copy = {
  act1HudSubtitleDone:
    "النجوم الخمس تشعل من جديد والخريطة تنبض.",
  act1HudSubtitleFind:
    "الفيديو والأبيات اللي تبان فوق وتحت كيعاونوك : دور على كل مقطع على الخريطة، بنفس ترتيب المقاطع.",
  act1TutorialHeading: "التعليمات",
  act1TutorialLine1: "دوّاف - كليك على الشقّة المطلوبة -",
  act1TutorialLine2: "الحرّاف يقرّب",
  act1ScaleLabel: "المدى",
  act1ScaleAria: (zoomText) => `مقياس الخريطة، تكبير ${zoomText}`,
  act1HeaderLine: "المشهد الأول - الجزائر",
  act1BottomTitle: "المشهد الأول - الجزائر",
  act1BottomChapter: "الصحراء",
  act1AriaHud: "المشهد الأول، الجزائر، الصحراء",
  act1AriaStripWord: "كلمة لتُوجَد:",
  phraseStripComplete:
    "تحت خطّ الرمل هذي تجتمع الخمس قطع البيت واحد واحد ما زالوا يخلّوه يتمّ.",
  phraseStripSteps: [...ACT1_PHRASE_STRIP_STEPS_AR],
  revelationWordAria: {
    désert: "كلمة لتُوجَد: الصحراء",
    silence: "كلمة لتُوجَد: الصمت",
    dune: "كلمة لتُوجَد: الكِسيب",
    nuit: "كلمة لتُوجَد: الليل",
    immensité: "كلمة لتُوجَد: الفَسحة",
  },
  chapterToastKicker: "المشهد مكمّل",
  chapterToastTitle: "الصحراء",
  chapterToastSubtitle:
    "النجوم الخمس تشعل من جديد والخريطة تنبض. الرحلة تكمل.",
  menuAria: "القائمة - الخيارات والوقفة",
  menuHintDiscover: "اكتشف الممر",
  daKicker: "تبدّل السماء",
  daTitle: "الليل تنفتح",
  daSubtitle: "الصحراء تخلّي الذهب الحار الخيط يولّي كواكب.",
  act2IframeTitle: "جان السنّاك - الزمن السردي",
  act2NavigateActIII: "المشهد الثالث - الكتابة",
  act2NavigateActIIIAria: "صفحة خاصّة لتجميع الشقوف كقصيدة؛ ترجع للرّقّ من هنا وقت ما تحب.",
  lazySuspenseAct1: "تجهيز خريطة الذاكرة…",
  lazySuspenseAct2: "فتح المخطوف وتحميل الرّقّ…",
  lazySuspenseAct3: "فتح الكتابة - نَفَس وشقوف…",
  orientationBreadcrumbAria: "مسار الرحلة",
  orientationCreditsLabel: "التذييل",
  orientationCreditsSummary: "التذييل النهائي، شكر وهدايا، وكتامة الدرب.",
  orientationFutureAct3: "المشهد الثالث",
  orientationFutureAct4: "تتمة الرحلة",
  orientationFutureAct4Summary: "قريبًا",
  orientationLockedIntro: "المقدمة",
  orientationLockedAct1: "المشهد الأول",
  orientationLockedAct2: "المشهد الثاني",
  orientationPhaseIntroLabel: "المقدمة - تمهيد",
  orientationPhaseAct1Label: "المشهد الأول - الجزائر",
  orientationPhaseAct2Label: "المشهد الثاني - مواصلة",
  orientationPhaseAct3Label: "المشهد الثالث - الكتابة",
  orientationSummaries: {
    intro: "صوت ومشهد صحر قبل ما تدخل لخريطة الذاكرة.",
    act1: "خريطة فيها خمس قطع تكمّل بيت ساناك ما بين أرض الجزائر.",
    act2:
      "الطبقة الليلانية: القصيدة والمحفوظات كلّها على التصفّر في الزّرقة.",
    act3:
      "ورقة آخيرة: تجمع الأصوات اللي قطعتي معاكم وتولّد بيت وحيد.",
  },
  orientationFlux: "التموّج",
  orientationFluxCredits:
    "التذييل خليه يحم، وبعد تعال زر ESC باش تسكر كي تبان الأوامر.",
  orientationFluxScroll: "حم باش تكمّل الدرب",
  orientationMiniMap: "خريطة مصغّرة",
  orientationParcours: "مسار الرحلة",
  orientationReplayHint:
    "من بعد تذييل نهاية الرحلة - نقط مرحلة فوق باش تعيشها من جديد.",
  orientationOpenPanel: "يفتح لوحة مسار الرحلة",
  orientationCollapsePanel: "يقلّص لوحة مسار الرحلة",
  menuClose: "سكر القائمة (Esc)",
  menuPause: "وقفة",
  menuQuote: "كمّل الرحلة، ولا ولّوج لمجال آخر.",
  menuSound: "الصوت",
  menuAmbientMuteOn: "رجّع الصوت المحيطي",
  menuAmbientMuteOff: "كمّ الصوت المحيطي",
  menuAmbientVolume: "قوة الصوت المحيطي",
  cursorSectionHeading: "المؤشّر",
  cursorOptionFluid: "سراب",
  cursorOptionFluidHint: "ضباب ضوء يتبع الحركة - معين الرحلة وهالات ذهبية.",
  cursorOptionDefaultBadge: "طريق الاستقبال",
  cursorOptionBasic: "أثر",
  cursorOptionBasicHint: "نقطة صافية وخفيفة - دائرة هادئة بلا ضباب متحرك.",
  cursorOnboardingCurtainFr: "Choisissez votre curseur",
  cursorOnboardingCurtainAr: "اختر مؤشّرك",
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
  menuRestartConfirmAria: "تأكيد قبل ما تعاود التجرّبة من الأول",
  menuRestartConfirmMessage: "واش راك متأكد باغي تعاود التجرّبة من الأول؟",
  menuRestartConfirmYes: "إيه",
  menuRestartConfirmNo: "لا",
  menuCreditsBy: "من وحدة:",
  menuMusicLine: "موسيقى · © Rafael Krux",
  menuEmbeddedParcours: "مسار الرحلة",
  menuNavAria: "أزرار قائمة الوقفة",
  fullscreenPromptTitle: "ملء الشاشة",
  fullscreenPromptBody: "",
  fullscreenPromptAria:
    "اقتراح باش تخدم ملء الشاشة وتخبي أشرطة المتصفح. تقدر تخرج بـ Esc ولا من القائمة.",
  fullscreenPromptAccept: "فعّل",
  fullscreenPromptLater: "بعد",
  fullscreenPromptNever: "ما تعاودش",
  menuFullscreenSection: "ملء الشاشة",
  menuFullscreenEnter: "دير ملء الشاشة دابا",
  menuFullscreenExit: "خرج من ملء الشاشة",
  menuFullscreenUnsupported: "ما كاينش في هاد المتصفح.",
  menuFullscreenStateLabel: "الحالة دابا",
  menuFullscreenStateOn: "مفعّل",
  menuFullscreenStateOff: "مطفّي",
  menuFullscreenShortcutEnter: "F11",
  menuFullscreenShortcutExit: "Esc",
  introDevPreviewCreditsTitle: "تشوف التذييل النهاية (-previewCredits=1)",
  introAlRihlaSubtitle: "جان ساناك",
  introJeanSenacSubtitle: "« المسيرة »",
  zoomNudge: "لفوق · التكبير",
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
  introPrologueVolumeAuraAria:
    "صوت المقدّمة: عجلة الفأرة على الشريط المضيء يمين الشاشة - لفّة للأعلى ترفع، للأسفل تخفّض. أسهم للأعلى والأسفل عند التركيز على المنطقة.",
  introProloguePausedAria: "الفيديو متوقّف - إضغط مسافة باش تكمل.",
  introProloguePlayingAria: "التشغيل جاري.",
  introSuspenseEyebrow: "مقدّمة",
  introSuspenseTitle: "الرحلة غادي تبدا",
  introSuspenseProgressAria: "تقدّم التحميل",
  introTutorialMission: "مرحلة",
  introTutorialSkipEyebrow: "قبل الانطلاق",
  introTutorialSkipTitle: "الانغماس",
  introTutorialSkipBody:
    "اعبر مرة إلى ملء الشاشة - يكفي عبور، ما تحتاجش تثبت فيه.\nالأفضل تسمع بالسمّاعات : الصحراء ما تهمس إلا لمن يستسلم ليها.",
  introTutorialSkipFullscreenHint:
    "اعبر ملء الشاشة مرة باش تكمل",
  introTutorialSkipCta: "التالي",
  introTutorialFullscreenCta: "ملء الشاشة (F11)",
  introTutorialFullscreenAria: "فعّل ملء الشاشة",
  introTutorialFullscreenExitAria: "اطلع من ملء الشاشة",
  introTutorialFullscreenActive: "اطلع من ملء الشاشة",
  introTutorialVolumeEyebrow: "جرّب مستوى الصوت",
  introTutorialVolumeTitle: "أيقظ الصدى",
  introTutorialVolumeBody:
    "على اليمين، ارفع الصوت بتدوير عجلة الفأرة للأعلى،\nحتى يناسبك المستوى.",
  introTutorialVolumeSaviezEyebrow: "هل تعلم؟",
  introTutorialVolumeSaviezBody:
    "« زينة » اللي تسمعوها، أنشودة راي جزائرية، نفس العصر\nاللي كان جان سيناك يمجّد في شعره، بين الشمس والبحر.",
  introTutorialVolumeScrollHint: "عجلة الفأرة\nللأعلى",
  introTutorialVolumeScrollAria: "دوّر عجلة الفأرة للأعلى لضبط مستوى الصوت",
  introTutorialVolumeLabel: "لهب الصوت",
  introTutorialVolumeProgressAria: "تقدّم الصدى",
  introTutorialVolumeSuccess: "العتبة تجاوزت - المقدّمة تبدا.",
  introTutorialVolumeLaunchCta: "شغّل الفيديو",
  introTutorialReviewMission1: "رجع للاستقبال",
  act23BridgeVideoSkip: "اجتياز الممر",
  act2FinaleAria: "ختام الرحلة - أكمّل الجملة باش توصل لتذييل الفريق",
  act2FinaleStem: "المسيرة تكون حقيقية كي",
  act2FinalePlaceholder: "… بكلمات قلّال يكفي",
  act2FinaleHint:
    "كتب خواتيس الجملة. ماكاش تقييم - غير أثر تنخلّيه وأنت تنقرا.",
  act2FinaleSubmit: "شوف التذييل",
  voyageCreditsTitle: "الرحلة",
  voyageCreditsSubtitle: "تحية لجان سنّاك",
  voyageCreditsClose: "سكر (Esc)",
  voyageCreditsFin: "شكرًا على اجتياز هاد الليل.",
  voyageCreditsBlocks: [
    {
      heading: "الإعداد والإنجاز",
      lead: "ياسين بوعبد الله",
      lines: [
        "الإخراج الفنّي والتطوير",
        "خريطة الذاكرة، خط جان سنّاك، الكتابة، التذييل",
        "React, TypeScript, Vite, GSAP, Motion",
        "Tailwind, Lenis, Howler, Zustand",
        "مساعدة الذكاء الاصطناعي : تصحيح، تصميم الموقع",
        "جزء التطوير بالكامل",
      ],
    },
    {
      heading: "النصوص والاقتباسات",
      lines: [
        "مقتطفات واقتباسات جان سنّاك",
        "إعادة إنتاج تربوي (المادة 122-5)",
        "مشروع BUT MMI، غير تجاري",
      ],
    },
    {
      heading: "الصور والأرشيف",
      lines: [
        "صور ومستندات في الرّقّ",
        "أرشيفات فوتوغرافية من الملفّ التربوي",
      ],
    },
    {
      heading: "الموسيقى",
      lines: [
        "Raïna Raï, Zina",
        "Switzerland, Thomas James White",
        "Emotional Arabian Oud (الجزء الثاني)",
      ],
    },
    {
      heading: "الفيديو والصوت",
      lines: [
        "مقدّمة وانتقالات (al-rihla.mp4، جسور)",
        "تصوير ومونتاج وتمرين المقدّمة، ياسين بوعبد الله",
        "لقطات برخصة Artlist",
        "مؤثرات whoosh وانتقالات (محلي)",
      ],
    },
    {
      heading: "التقنية والمصادر",
      groups: [
        {
          label: "الإبداع",
          lines: ["Adobe CC, DaVinci Resolve, Blender"],
        },
        {
          label: "الويب والثلاثي الأبعاد",
          lines: [
            "Three.js، مشهد القوس",
            "نموذج public/models/model.glb",
            "Turf.js، خريطة الذاكرة",
          ],
        },
        {
          label: "البيانات والخطوط",
          lines: [
            "Natural Earth 50 m، حدود الجزائر",
            "Google Fonts، Bahlull (محلي)",
            "مكتبات المصدر المفتوح",
          ],
        },
      ],
    },
  ],
  act3Aria: "المشهد الثالث - قصيدة تفاعلية، إعادة تجميع الشقوف",
  act3Kicker: "الكتابة",
  act3Hint:
    "قطع وأبيات كانوا معاك في الطريق تظهرو كلهم كقطع مختارة؛ نقرة على وحدة وباش تطبّقها وسط الواجهة مثل خطّ البيت في الدخول الأول. الترتيب حر، لازم تجمع كلّ الشقايح قبل آخر لفظة الدرب.",
  act3FragmentsPanelTitle: "أثر المسيرة",
  act3FragmentsPanelSub:
    "من المقدّمة وفيديو، من خريطة الذاكرة ومقاطع من الرّقّ: كل هادّي دار معاكم.",
  act3CompositionPanelTitle: "بيت يتجمّع",
  act3CompositionPanelSub:
    "سطر فوق سطر؛ كي تكمّلي القائمة كلّها، تقفل القصيدة بنفس وحدة خطّ الأحرف.",
  act3CompositionEmptyBody:
    "ابدءي بنقلة على قطعة طرف « أثر المسيرة »؛ تزاد هنا وسط الواجهة كالبيت المركز.",
  act3ContinueCredits: "شوف التذييل",
  act3BackScroll: "ارجع للرّقّ",
  act3FinaleWrong: "هاذي مش الكلمة المنتظرة، جرب من جديد.",
  act3FinaleEnterHint: "Entrée (الدخول) يثبّت الكلمة، الكلمة الصحيحة تفتح تذييل الرحلة.",
  act3FinaleLoading: "تجهيز البيت الأخير…",
  act3FinaleRedirecting: "فتح التذييل…",
  act3FinaleTimedHintKicker: "تلميح",
};

export function copyFor(language: AppLanguage): Copy {
  return language === "ar-dz" ? AR : FR;
}

/** عرض الكلمة المفتّوحة تحت العربية بدل المفتاح الفرنسي */
export function revelationWordUISurface(word: RevelationWord, language: AppLanguage): string {
  if (language !== "ar-dz") return word;
  const map: Record<RevelationWord, string> = {
    désert: "الصحراء",
    silence: "الصمت",
    dune: "الكسيب",
    nuit: "الليل",
    immensité: "الفسحة",
  };
  return map[word] ?? word;
}
