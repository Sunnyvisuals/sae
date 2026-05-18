import type { AppLanguage } from "../stores/languageStore";
import type { RevelationWord } from "../components/Immersive/mapWordData";
import {
  ACT1_PHRASE_STRIP_STEPS_AR,
  ACT1_PHRASE_STRIP_STEPS_FR,
  ACT1_REVELATION_SEQUENCE,
} from "./act1IntroBridge";
import { MAP_WORD_ARABIC_LABEL } from "./mapWordArabicDisplay";

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
  menuRestartConfirmKicker: string;
  menuRestartConfirmTitle: string;
  menuRestartConfirmDetail: string;
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
  /** Acte II : invite au défilement du parchemin (pas au zoom carte). */
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
  voyageCreditsCloseAria: string;
  voyageCreditsFin: string;
  voyageCreditsBlocks: VoyageCreditsBlock[];
  act3Aria: string;
  act3IntroLine1: string;
  act3IntroLine2: string;
  act3IntroLine3: string;
  act3SelectHint: string;
  /** Consigne au-dessus du champ prénom (acte III). */
  act3ConfirmIdentityHint: string;
  /** Indication Entrée (sous le champ, DA minimaliste). */
  act3ConfirmEnterHint: string;
  act3ConfirmCta: string;
  act3Submitting: string;
  act3SubmitError: string;
  act3LoadingStars: string;
  act3ViewMyStar: string;
  act3ConstellationContinue: string;
  act3ConstellationScrollCue: string;
  act3ConstellationScrollCueUp: string;
  act3ConstellationScrollCueDown: string;
  act3ConstellationScrollLoading: string;
  act3OutroLine1: string;
  act3OutroLine2: string;
  act3OutroLine3: string;
  act3CreditsCta: string;
};

function act1RevelationWordAria(language: AppLanguage): Record<RevelationWord, string> {
  const prefix = language === "ar-dz" ? "كلمة لتُوجَد:" : "Mot à trouver :";
  return Object.fromEntries(
    ACT1_REVELATION_SEQUENCE.map((word) => [
      word,
      language === "ar-dz"
        ? `${prefix} ${MAP_WORD_ARABIC_LABEL[word] ?? word}`
        : `${prefix} ${word}`,
    ]),
  ) as Record<RevelationWord, string>;
}

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
  revelationWordAria: act1RevelationWordAria("fr"),
  chapterToastKicker: "Chapitre accompli",
  chapterToastTitle: "Sahara",
  chapterToastSubtitle:
    "Les cinq feux sont rallumés, la carte respire. Le voyage continue.",
  menuAria: "Menu - options et pause",
  menuHintDiscover: "Découvrir le passage",
  daKicker: "Changement de ciel",
  daTitle: "La nuit s'ouvre",
  daSubtitle: "Là où la carte devient constellation.",
  act2IframeTitle: "Jean Sénac - frise narrative",
  act2NavigateActIII: "Acte III — Constellation",
  act2NavigateActIIIAria:
    "Choisis un mot de Sénac et rejoins le ciel partagé ; vous pouvez revenir au rouleau d’ici.",
  lazySuspenseAct1: "Préparation de la carte-mémoire…",
  lazySuspenseAct2: "Ouverture du rouleau - chargement du parchemin…",
  lazySuspenseAct3: "Ouverture du ciel — constellation…",
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
  orientationPhaseAct3Label: "Acte III — Constellation",
  orientationSummaries: {
    intro: "Voix et paysage désert avant d'entrer dans la carte-mémoire.",
    act1: "Une carte où cinq fragments posent cinq vers du désert dans l’Algérie.",
    act2:
      "Le rouleau nocturne : le poème, les archives au fil du défilement dans le bleu.",
    act3:
      "Choisis un mot de Sénac : il devient étoile dans le ciel partagé de tous les voyageurs.",
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
  menuRestartConfirmKicker: "Attention",
  menuRestartConfirmTitle: "Repartir du début ?",
  menuRestartConfirmDetail:
    "Votre progression, vos choix et la constellation locale seront effacés.",
  menuRestartConfirmYes: "Oui, recommencer",
  menuRestartConfirmNo: "Non, continuer",
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
  zoomNudge: "Rapprochez la carte",
  scrollNudge: "Molette · vers le bas",
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
  introVideoSkip: "Entrer dans la rumeur",
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
  voyageCreditsClose: "Quitter la nuit",
  voyageCreditsCloseAria: "Quitter la nuit (touche Échap)",
  voyageCreditsFin: "Merci d’avoir mené cette traversée jusqu’au bout de la nuit.",
  voyageCreditsBlocks: [
    {
      heading: "Réalisation",
      lead: "Yacine Bouabdallah",
      lines: [
        "Conception, direction artistique et développement",
        "Carte mémoire · frise Jean Sénac · écriture interactive",
        "Montage, générique et intégration",
      ],
    },
    {
      heading: "Textes",
      lines: [
        "Jean Sénac · fragments et citations",
        "Reproduction pédagogique (art. L. 122 5 CPI)",
        "Projet BUT MMI · usage non commercial",
      ],
    },
    {
      heading: "Images & archives",
      lines: [
        "Portraits et documents · dossier pédagogique",
        "Archives photographiques",
      ],
    },
    {
      heading: "Musique",
      lines: [
        "« Zina » · Raïna Raï",
        "« Switzerland » · Thomas James White",
        "« Emotional Arabian Oud » · acte II",
      ],
    },
    {
      heading: "Image & son",
      lines: [
        "Prologue et transitions · Yacine Bouabdallah",
        "Plans additionnels · Artlist",
        "Design sonore des transitions",
      ],
    },
    {
      heading: "Avec l’aide de",
      lines: ["Outils d’intelligence artificielle · débogage et conception"],
    },
    {
      heading: "Technologies",
      groups: [
        {
          label: "Post production",
          lines: ["Adobe Creative Cloud", "DaVinci Resolve", "Blender"],
        },
        {
          label: "Développement",
          lines: [
            "React · TypeScript · Vite",
            "GSAP · Motion · Three.js",
            "Tailwind · Lenis · Howler · Zustand",
          ],
        },
        {
          label: "Données & typographie",
          lines: [
            "Natural Earth · Turf.js",
            "Google Fonts · Bahlull",
            "Bibliothèques open source",
          ],
        },
      ],
    },
  ],
  act3Aria: "Acte III — la carte devient constellation",
  act3IntroLine1: "Le voyage s’achève.",
  act3IntroLine2: "Ou recommence.",
  act3IntroLine3: "Quel mot de Sénac reste en toi ?",
  act3SelectHint: "Touche un mot",
  act3ConfirmIdentityHint: "Ton prénom",
  act3ConfirmEnterHint: "Appuie sur Entrée",
  act3ConfirmCta: "Rejoindre la constellation",
  act3Submitting: "Ton étoile monte…",
  act3SubmitError: "L’étoile n’a pas pu rejoindre le ciel. Réessaie dans un instant.",
  act3LoadingStars: "Les étoiles apparaissent…",
  act3ViewMyStar: "Voir mon étoile",
  act3ConstellationContinue: "Poursuivre",
  act3ConstellationScrollCue: "Monte pour charger",
  act3ConstellationScrollCueUp: "Monte pour charger",
  act3ConstellationScrollCueDown: "Descends pour décharger",
  act3ConstellationScrollLoading: "Chargement…",
  act3OutroLine1: "Jean Sénac est mort en 1973.",
  act3OutroLine2: "Assassiné.",
  act3OutroLine3: "Ses mots, eux, continuent de briller.",
  act3CreditsCta: "Voir les crédits",
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
  revelationWordAria: act1RevelationWordAria("ar-dz"),
  chapterToastKicker: "المشهد مكمّل",
  chapterToastTitle: "الصحراء",
  chapterToastSubtitle:
    "النجوم الخمس تشعل من جديد والخريطة تنبض. الرحلة تكمل.",
  menuAria: "القائمة - الخيارات والوقفة",
  menuHintDiscover: "اكتشف الممر",
  daKicker: "تبدّل السماء",
  daTitle: "الليل تنفتح",
  daSubtitle: "حيث تولّي الخريطة كوكبة.",
  act2IframeTitle: "جان السنّاك - الزمن السردي",
  act2NavigateActIII: "المشهد الثالث — الكوكبة",
  act2NavigateActIIIAria: "اختار كلمة من سنّاك وانضمّ للسماء المشتركة؛ ترجع للرّقّ من هنا وقت ما تحب.",
  lazySuspenseAct1: "تجهيز خريطة الذاكرة…",
  lazySuspenseAct2: "فتح المخطوف وتحميل الرّقّ…",
  lazySuspenseAct3: "فتح السماء — الكوكبة…",
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
  orientationPhaseAct3Label: "المشهد الثالث - الكوكبة",
  orientationSummaries: {
    intro: "صوت ومشهد صحر قبل ما تدخل لخريطة الذاكرة.",
    act1: "خريطة فيها خمس قطع تكمّل بيت ساناك ما بين أرض الجزائر.",
    act2:
      "الطبقة الليلانية: القصيدة والمحفوظات كلّها على التصفّر في الزّرقة.",
    act3:
      "اختار كلمة من سنّاك: تصير نجمة في سماء يشاركها كل المسافرين.",
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
  menuRestartConfirmKicker: "تنبيه",
  menuRestartConfirmTitle: "تعاود من الأول؟",
  menuRestartConfirmDetail: "التقدّم، الاختيارات والكوكبة المحلية غادي يتمسحو.",
  menuRestartConfirmYes: "إيه، امسح كلش",
  menuRestartConfirmNo: "لا، كمّل",
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
  zoomNudge: "قرّب الخريطة",
  scrollNudge: "لتحت · الحرّاف",
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
  introVideoSkip: "الولوج إلى الهمس",
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
  voyageCreditsClose: "غادر الليل",
  voyageCreditsCloseAria: "غادر الليل (Esc)",
  voyageCreditsFin: "شكرًا لأنك كملت هاد المسيرة حتى كتامة الليل.",
  voyageCreditsBlocks: [
    {
      heading: "الإنجاز",
      lead: "ياسين بوعبد الله",
      lines: [
        "الإعداد، الإخراج الفنّي والتطوير",
        "خريطة الذاكرة · خط جان سنّاك · كتابة تفاعلية",
        "المونتاج، التذييل والدمج",
      ],
    },
    {
      heading: "النصوص",
      lines: [
        "جان سنّاك · مقتطفات واقتباسات",
        "إعادة إنتاج تربوي (المادة 122 5)",
        "مشروع BUT MMI · غير تجاري",
      ],
    },
    {
      heading: "الصور والأرشيف",
      lines: [
        "صور ومستندات · ملفّ تربوي",
        "أرشيفات فوتوغرافية",
      ],
    },
    {
      heading: "الموسيقى",
      lines: [
        "« Zina » · Raïna Raï",
        "« Switzerland » · Thomas James White",
        "« Emotional Arabian Oud » · الجزء الثاني",
      ],
    },
    {
      heading: "الصورة والصوت",
      lines: [
        "المقدّمة والانتقالات · ياسين بوعبد الله",
        "لقطات إضافية · Artlist",
        "تصميم صوتي للانتقالات",
      ],
    },
    {
      heading: "بمساعدة",
      lines: ["أدوات الذكاء الاصطناعي · تصميم وتصحيح"],
    },
    {
      heading: "التقنيات",
      groups: [
        {
          label: "ما بعد الإنتاج",
          lines: ["Adobe Creative Cloud", "DaVinci Resolve", "Blender"],
        },
        {
          label: "التطوير",
          lines: [
            "React · TypeScript · Vite",
            "GSAP · Motion · Three.js",
            "Tailwind · Lenis · Howler · Zustand",
          ],
        },
        {
          label: "البيانات والخطوط",
          lines: [
            "Natural Earth · Turf.js",
            "Google Fonts · Bahlull",
            "مكتبات مفتوحة المصدر",
          ],
        },
      ],
    },
  ],
  act3Aria: "المشهد الثالث — الخريطة تصير كوكبة",
  act3IntroLine1: "الرحلة تكمل.",
  act3IntroLine2: "أو تعاود من الأول.",
  act3IntroLine3: "أشنوّا من كلمات سنّاك بقات فيك؟",
  act3SelectHint: "المس كلمة",
  act3ConfirmIdentityHint: "اسمك",
  act3ConfirmEnterHint: "اضغط إنتر",
  act3ConfirmCta: "انضمّ للكوكبة",
  act3Submitting: "نجمتك طالعة…",
  act3SubmitError: "النجمة ما قدرتش توصل للسماء. عاود جرّب.",
  act3LoadingStars: "النجوم تبان…",
  act3ViewMyStar: "شوف نجمتي",
  act3ConstellationContinue: "كمّل",
  act3ConstellationScrollCue: "طلّع باش تتحمّل",
  act3ConstellationScrollCueUp: "طلّع باش تتحمّل",
  act3ConstellationScrollCueDown: "نزّل باش ينقص",
  act3ConstellationScrollLoading: "قاعد يتحمّل…",
  act3OutroLine1: "جان سنّاك مات سنة 1973.",
  act3OutroLine2: "اغتيل.",
  act3OutroLine3: "كلامه، هو، يبان.",
  act3CreditsCta: "شوف التذييل",
};

export function copyFor(language: AppLanguage): Copy {
  return language === "ar-dz" ? AR : FR;
}

/** عرض الكلمة المفتّوحة تحت العربية بدل المفتاح الفرنسي */
export function revelationWordUISurface(word: RevelationWord, language: AppLanguage): string {
  if (language !== "ar-dz") return word;
  return MAP_WORD_ARABIC_LABEL[word] ?? word;
}
