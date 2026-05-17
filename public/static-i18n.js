/**
 * FR / العربية للصفحات الثابتة (parchemin Acte II، 404).
 * يقرأ اللغة من localStorage: al-rihla-language (= ar-dz أو غير ذلك → فرنسي)
 */
(function () {
  "use strict";

  var STORAGE_KEY = "al-rihla-language";

  function getLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "ar-dz" ? "ar" : "fr";
    } catch (e) {
      return "fr";
    }
  }

  function applyDataI18n(root, dict) {
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (k && dict[k] != null) el.textContent = dict[k];
    });
    root.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-html");
      if (k && dict[k] != null) el.innerHTML = dict[k];
    });
    [["data-i18n-aria", "aria-label"], ["data-i18n-title", "title"], ["data-i18n-alt", "alt"]].forEach(
      function (pair) {
        var attr = pair[0];
        var dom = pair[1];
        root.querySelectorAll("[" + attr + "]").forEach(function (el) {
          var k = el.getAttribute(attr);
          if (k && dict[k] != null) el.setAttribute(dom, dict[k]);
        });
      },
    );
  }

  var PAR = {
    fr: {
      doc_title: "Al Rihla · Acte II",
      js_cinema_callout_html:
        '<p class="senac-cinema-explore-callout__text">Pour poursuivre la traversée, appuie sur <strong>Exploration</strong> en bas à gauche.</p><div class="senac-cinema-explore-callout__arrows" aria-hidden="true"><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span></div>',
      js_scroll_nudge_label: "Scroll vers le bas",
      smc_aria: "Choisir un mode de lecture",
      smc_curtain_ar: "اختر نمط القراءة",
      smc_curtain_fr: "Choisissez votre mode de lecture",
      smc_mode_eyebrow: "Mode",
      smc_kicker: "La traversée",
      smc_caption_html:
        'Deux rythmes pour la même <span class="smc-caption-em">traversée</span> avant d\'entrer dans la nuit.',
      smc_cinema_label: "Cinéma",
      smc_cinema_sub: "défilement guidé",
      smc_explore_label: "Exploration",
      smc_explore_sub: "à ton rythme",
      smt_aria: "Mode de défilement",
      smt_cinema_title: "Mode Cinéma (défilement auto)",
      smt_cinema_pause_title: "Pause — défilement Cinéma",
      smt_cinema_resume_title: "Reprendre le défilement Cinéma",
      smt_cinema_paused: "Pause",
      smt_explore_title: "Mode Exploration (manuel)",
      smt_cinema: "Cinéma",
      smt_explore: "Exploration",
      hero_curtain_ar: "التواريخ تصبح كوكبات",
      hero_curtain_fr: "Chronologie et archives",
      hero_kicker: "Acte II - Nuits sahariennes",
      act2_garde_act: "Acte II",
      act2_garde_title: "La vie de Jean Sénac",
      act2_garde_scroll_aria: "Faire défiler vers le contenu",
      hero_eyebrow: "Chronologie et archives · Acte II",
      hero_title: "Al Rihla",
      hero_subtitle: "« La traversée »",
      hero_copy: "Jean Sénac - dates, archives, constellations.",
      cross_nav_status_kicker: "Al Rihla · suite du parcours",
      cross_nav_group_aria: "Raccourcis facultatifs",
      cross_nav_lede: "La frise commence ici.",
      cross_nav_chip_video: "Vidéo",
      cross_nav_chip_map: "Carte",
      cross_nav_hint: "Facultatif · Acte I parcouru",
      cross_nav_hint_locked: "Termine l'Acte I pour déverrouiller",
      cross_nav_act1_birth_html:
        'Carte-mémoire : <button type="button" class="senac-cross-nav__link" data-senac-navigate="act1-map" data-nav-picto="star">fragment « Naissance »</button>',
      cross_nav_act1_poetry_html:
        'Carte-mémoire : <button type="button" class="senac-cross-nav__link" data-senac-navigate="act1-map" data-nav-picto="dune">vers du désert (Acte I)</button>',
      cross_nav_act3_html:
        'Acte III - réécrire le voyage : <button type="button" class="senac-cross-nav__link" data-senac-navigate="act3-writing" data-nav-picto="quill">Poésie interactive</button>',
      hero_img_alt: "Jean Sénac assis sur des rochers, face à la mer.",
      scroll_cue_aria: "Faire défiler vers la frise narrative",
      scroll_cue_label: "Molette · vers le bas",
      timeline_aria: "Frise narrative Jean Sénac",
      didyouknow_kicker: "Saviez-vous",
      s1926_date: "29 novembre, Alger, Belcourt",
      s1926_h2: "Naissance",
      s1926_p:
        "Jean Sénac naît le 29 novembre 1926 à Alger, quartier de Belcourt. Fils d'instituteur, il grandit entre la Casbah, la mer et les langues mêlées, arabe, berbère, français, qui feront de lui un passeur culturel avant d'être poète.",
      s1926_p2:
        "Belcourt, c'est le bidonville lumineux, les terrasses, le port tout proche. Plus tard, il dira que sa poésie est née de ce croisement de soleils et de mots, longtemps avant qu'il prenne la plume au sérieux.",
      fig1_alt: "Jean Sénac au bord de la mer.",
      fig1_cap: "Jeunesse à Alger, mer, rochers, premiers horizons",
      s1940_date: "Années sombres",
      s1940_h2: "L'adolescence et la guerre",
      s1940_p:
        "Adolescent pendant la Seconde Guerre mondiale et les années de privation, Sénac découvre la lecture comme respiration : Rimbaud, Lautréamont, puis les poètes français d'outre-mer. Il écrit déjà, en secret, des textes brûlants.",
      s1940_p2:
        "À Alger, il fréquente le lycée et les cafés où l'on débat de politique et de littérature. La guerre lui apprend la faim du monde ; la poésie, l'exigence d'une parole qui ne triche pas.",
      quote1_html: "«&nbsp;Je parle avec l'accent de ma solitude.&nbsp;»",
      quote1_cite: "Jean Sénac",
      s1950_date: "1950-1960",
      s1950_h2: "L'engagement littéraire",
      s1950_p1:
        "Publications, revues, amitiés littéraires : Sénac trace une trajectoire d'écrivain engagé, entre Alger et Paris, portant haut l'idée d'une littérature algérienne de langue française, libre et exigeante.",
      s1950_p2:
        "À la radio comme à la plume, il défend la parole poétique comme lieu de vérité, jamais décor, jamais poudre aux yeux.",
      s1950_p3:
        "Il côtoie Camus, Charlot, de nombreux écrivains du Maghreb. Sénac revendique une « algérianité » de la littérature : écrire en français depuis l'Afrique, sans renier la terre ni le peuple.",
      fig2_alt: "Vue d'Alger et de son port, photographie d'archive.",
      fig2_cap: "Alger, années 1950-1960, scène littéraire et engagement",
      ghost_soleils: "Soleils",
      s_soleils_date: "1949, livre",
      s_soleils_h2: "Soleils séparés",
      s_soleils_p_html:
        "Paru en 1949, <em>Soleils séparés</em> est souvent lu comme le livre-fondation : une voix qui assume le désir, la guerre d'Algérie déjà latente, et l'impossible partage entre l'Europe et le Sud.",
      s_soleils_p2:
        "Le titre lui-même est un programme : des soleils qui ne se rejoignent pas, des identités multiples. Sénac y invente une sensualité politique qui dérange encore la critique bien-pensante.",
      quote2_bq: "Soleils séparés",
      quote2_cite: "un titre comme une constellation",
      panel_stack_aria: "Traversée en plein écran",
      panel_stack_1: "Les dates deviennent constellations",
      panel_stack_2: "Alger, la mer, les langues",
      panel_stack_3: "La jeunesse allume la nuit",
      panel_stack_4: "Écrire contre l'ombre",
      panel_stack_5: "Poursuis la traversée",
      panel_stack_date_1: "1949",
      panel_stack_date_2: "1950",
      panel_stack_date_3: "1955",
      panel_stack_date_4: "1960",
      panel_stack_date_5: "Suite",
      ghost_corps: "Corps",
      s_corps_date: "Présence assumée",
      s_corps_h2: "Engagement & désir",
      s_corps_p:
        "Homosexuel assumé dans un contexte de censure et de rejet, Sénac incarne une visibilité rare. Il refuse l'armoire : le corps, l'amour des hommes et l'amour du peuple s'écrivent dans la même versification.",
      s_corps_p2:
        "Ses textes célèbrent la beauté masculine, la fraternité, la révolte. Pour lui, libérer le désir et libérer l'Algérie sont deux faces d'une même lutte contre le mensonge.",
      fig3_alt: "Jean Sénac à son bureau, lisant un manuscrit.",
      fig3_cap: "Sénac à son bureau, le poète au travail",
      s1973_date: "30 août, Alger",
      s1973_h2: "La mort à Alger",
      s1973_p:
        "Le 30 août 1973, Jean Sénac est retrouvé mort chez lui, rue Monticelli à Alger. L'assassinat reste non élucidé ; la rumeur et l'absence d'enquête nourrissent encore le deuil collectif.",
      s1973_p2:
        "Son testament spirituel, c'est une œuvre intacte : des dizaines de livres, des milliers d'auditeurs marqués par sa voix à la radio, une génération d'écrivains algériens qu'il a encouragés.",
      fig4_alt: "Jean Sénac, souvenir photographique.",
      fig4_cap: "Mémoire de Sénac, derniers feux d'une voix libre",
      ghost_legs: "Legs",
      s_legs_date: "Aujourd'hui",
      s_legs_h2: "La trace vive",
      s_legs_p:
        "Poète, animateur culturel, passeur entre les rives méditerranéennes, Sénac reste une figure tutélaire de la modernité algérienne. Son nom est lié à la librairie, aux festivals, aux jeunes auteurs.",
      s_legs_p2:
        "Des rues d'Alger aux bibliothèques de France, son œuvre continue d'interroger : comment habiter deux mondes, comment aimer sans renoncer, comment écrire libre.",
      s_belcourt_date: "1947, jeunesse",
      s_belcourt_h2: "Le groupe de Belcourt",
      s_belcourt_p:
        "Dans les années 1947, Sénac fonde avec des amis le groupe littéraire de Belcourt. On y lit, on s'affiche, on invente une scène poétique algérienne avant la lettre.",
      s_belcourt_p2:
        "Ce n'est pas un salon parisien : c'est la rue, le thé, la mer. Une culture populaire et lettrée qui annonce les indépendances culturelles du Maghreb.",
      ghost_radio: "Radio",
      s_radio_date: "1962, voix publique",
      s_radio_h2: "La radio, le peuple",
      s_radio_p:
        "À la Chaîne II d'Alger, Sénac devient une voix familière : émissions sur la poésie, la chanson, la littérature maghrébine. On l'écoute comme un grand frère.",
      s_radio_p2:
        "Il fait entendre des auteurs rarement invités ailleurs, donne des nouvelles aux jeunes, explique pourquoi la poésie peut accompagner un peuple en marche vers la liberté.",
      s_peuple_date: "1964, anthologie",
      s_peuple_h2: "Préface pour un peuple",
      s_peuple_p_html:
        "En 1964 paraît <em>Préface pour un peuple en marche</em>, anthologie de la poésie algérienne de langue française. Sénac y trace une généalogie : de la colonisation à l'indépendance.",
      s_peuple_p2:
        "Le livre affirme qu'une nation peut penser sa modernité dans la langue héritée, transformée, réappropriée. C'est un acte politique autant qu'esthétique.",
      s_arch_date: "Descente de l'arche",
      s_arch_h2: "Le portail du voyage",
      s_arch_p:
        "En continuant à défiler, vous approchez de l'arche, passage vers l'Acte III. Le modèle 3D descend avec votre lecture : monument imaginaire, seuil entre mémoire et écriture.",
      s_arch_p2:
        "Jean Sénac croyait que chaque lecteur franchit un seuil. Cette arche est la vôtre : un instant pour regarder, respirer, puis réécrire le voyage en poésie.",
      ch3_kicker: "Suite du voyage",
      ch3_h2: "Chapitre III",
      ch3_p:
        "La nuit se dissipe. Le fil d'or quitte la frise et ouvre un autre territoire.",
      ch3_btn_credits: "Crédits du voyage",
      ch3_back: "Retour à l'expérience",
      ch3_replay: "Revoir la frise",
      vc_title: "Al Rihla",
      vc_subtitle: "Hommage à Jean Sénac",
      vc_h_conception: "Réalisation",
      vc_l_conception_1: "Yacine Bouabdallah",
      vc_l_conception_2:
        "Conception · direction artistique · carte mémoire · frise · écriture · générique",
      vc_h_textes: "Textes",
      vc_l_textes_1: "Jean Sénac · fragments et citations",
      vc_l_textes_2: "Reproduction pédagogique (art. L. 122 5 CPI) · BUT MMI, usage non commercial",
      vc_h_images: "Images & archives",
      vc_l_images: "Portraits et documents · dossier pédagogique · archives photographiques",
      vc_h_video: "Image & son",
      vc_l_video:
        "Prologue et transitions · Yacine Bouabdallah · plans Artlist · design sonore des transitions",
      vc_h_audio: "Musique",
      vc_l_audio:
        "« Zina » · Raïna Raï · « Switzerland » · Thomas James White · « Emotional Arabian Oud » · acte II",
      vc_h_outils: "Technologies",
      vc_l_outils_1:
        "React · TypeScript · Vite · GSAP · Motion · Three.js · Tailwind · Lenis · Howler · Zustand",
      vc_l_outils_2:
        "Post production : Adobe Creative Cloud, DaVinci Resolve, Blender · Natural Earth · Turf.js · Google Fonts · Bahlull",
      vc_h_favicon: "Avec l’aide de",
      vc_l_favicon: "Outils d’intelligence artificielle · débogage et conception",
      vc_fin: "Merci d'avoir mené cette traversée jusqu'au bout de la nuit.",
      vc_skip_title: "Quitter la nuit (affiché à la fin du générique)",
      vc_skip_btn: "Quitter la nuit",
    },
    ar: {
      doc_title: "الرحلة · الجزء الثاني",
      js_cinema_callout_html:
        '<p class="senac-cinema-explore-callout__text">باش تكمّل المسيرة، ضغط على <strong>استكشاف</strong> لتحت على اليسار.</p><div class="senac-cinema-explore-callout__arrows" aria-hidden="true"><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span></div>',
      js_scroll_nudge_label: "لتحت · الحرّاف",
      smc_aria: "اختَر نمط القراءة",
      smc_curtain_ar: "اختر نمط القراءة",
      smc_curtain_fr: "Choisissez votre mode de lecture",
      smc_mode_eyebrow: "الوضع",
      smc_kicker: "المسيرة",
      smc_caption_html:
        'إيقاعان لنفس <span class="smc-caption-em">المسيرة</span> قبل ما تدخل لليل.',
      smc_cinema_label: "سينما",
      smc_cinema_sub: "تمرير موجّه",
      smc_explore_label: "استكشاف",
      smc_explore_sub: "على وَتِير تناسبك",
      smt_aria: "نمط التمرير",
      smt_cinema_title: "نمط سينما (تمرير تلقائي)",
      smt_cinema_pause_title: "إيقاف — تمرير السينما",
      smt_cinema_resume_title: "استئناف تمرير السينما",
      smt_cinema_paused: "إيقاف",
      smt_explore_title: "نمط استكشاف (يدوي)",
      smt_cinema: "سينما",
      smt_explore: "استكشاف",
      hero_curtain_ar: "التواريخ تصبح كوكبات",
      hero_curtain_fr: "Chronologie et archives",
      hero_kicker: "الجزء الثاني - ليالٍ صحراوية",
      act2_garde_act: "الجزء الثاني",
      act2_garde_title: "حياة جان سنّاك",
      act2_garde_scroll_aria: "التمرير نحو المحتوى",
      hero_eyebrow: "أرشيف وزمن · الجزء الثاني",
      hero_title: "الرحلة",
      hero_subtitle: "« المسيرة »",
      hero_copy: "جان سنّاك - تواريخ، أرشيف، كواكب.",
      cross_nav_chip_video: "فيديو",
      cross_nav_chip_map: "خريطة",
      cross_nav_hint: "اختياري · الجزء الأول مكمّل",
      cross_nav_status_kicker: "الرحلة · تتمّة المسار",
      cross_nav_group_aria: "اختصارات اختيارية",
      cross_nav_lede: "الخط الزمني يبدأ من هنا.",
      cross_nav_chip_video: "فيديو المقدمة",
      cross_nav_chip_map: "خريطة الذاكرة",
      cross_nav_hint: "اختياري · الجزء الأول مكمّل",
      cross_nav_hint_locked: "أكمّل الجزء الأول باش تفتح الاختصارات",
      cross_nav_act1_birth_html:
        'خريطة الذاكرة : <button type="button" class="senac-cross-nav__link" data-senac-navigate="act1-map" data-nav-picto="star">قطعة « الميلاد »</button>',
      cross_nav_act1_poetry_html:
        'خريطة الذاكرة : <button type="button" class="senac-cross-nav__link" data-senac-navigate="act1-map" data-nav-picto="dune">الشعر فالصحرا (الجزء الأول)</button>',
      cross_nav_act3_html:
        'الجزء الثالث - إعادة كتابة الرحلة : <button type="button" class="senac-cross-nav__link" data-senac-navigate="act3-writing" data-nav-picto="quill">شعر تفاعلي</button>',
      hero_img_alt: "جان سنّاك قاعد على صخور، ورا البحر.",
      scroll_cue_aria: "مرّر باش توصل للخط الزمني",
      scroll_cue_label: "زيد تنزّل",
      timeline_aria: "الخط الزمني - جان سنّاك",
      didyouknow_kicker: "هل تعلم؟",
      s1926_date: "٢٩ نوفمبر، الجزائر، بلكور",
      s1926_h2: "الميلاد",
      s1926_p:
        "ولد جان سنّاك في 29 نوفمبر 1926 بالجزائر، حيّ بلكور. ابن معلّم، نشأ بين القصبة والبحر والألسنة المختلطة، عربي، أمازيغي، فرنسي، فصار جسرًا ثقافيًا قبل أن يصير شاعرًا.",
      s1926_p2:
        "بلكور: أزقة مضيئة، شرفات، ميناء قريب. لاحقًا سيقول إن شعره وُلد من تقاطع الشموس والكلمات، قبل أن يأخذ القلم على محمل الجدّ.",
      fig1_alt: "جان سنّاك على شاطئ البحر.",
      fig1_cap: "شباب بالجزائر، بحر، صخور، أولى الأفق",
      s1940_date: "سنوات مظلمة",
      s1940_h2: "المراهقة والحرب",
      s1940_p:
        "مراهق أثناء الحرب العالمية وسنوات الشحّ، يكتشف سنّاك القراءة كتنفّس: رامبو، لوتريامون، ثم شعراء ما وراء البحار. يكتب سرًا نصوصًا ملتهبة.",
      s1940_p2:
        "بالجزائر، يرتاد الثانوية والمقاهي حيث تُناقش السياسة والأدب. الحرب تعلّمه جوع العالم؛ الشعر يعلّمه كلمة لا تغشّ.",
      quote1_html: "«&nbsp;أنا نهضر بلكنت وحدتي.&nbsp;»",
      quote1_cite: "جان سنّاك",
      s1950_date: "١٩٥٠-١٩٦٠",
      s1950_h2: "الانخراط الأدبي",
      s1950_p1:
        "إصدارات، مجلات، صداقات أدبية: سنّاك يرسم مسار كاتب متورّط، بين الجزائر وباريس، يعلي فكرة أدب جزائري بالفرنسية حرّ وصارم.",
      s1950_p2:
        "بالإذاعة وبالمقلم، يدافع على الكلمة الشعرية كمحلّ للحقيقة، موش زينة، ولا سحب عين.",
      s1950_p3:
        "يخالط كامو وشارلو وكثيرًا من كتّاب المغرب. يرفع سنّاك راية «جزائرية» الأدب: الكتابة بالفرنسية من أفريقيا، بلا إنكار للأرض والشعب.",
      s_belcourt_date: "1947، شباب",
      s_belcourt_h2: "جماعة بلكور",
      s_belcourt_p:
        "في أواخر الأربعينيات، يؤسّس سنّاك مع أصدقاء جماعة بلكور الأدبية. يقرؤون، يعلنون، يخترعون مشهدًا شعريًا جزائريًا قبل الأوان.",
      s_belcourt_p2:
        "ليست صالونًا باريسيًا: إنها الشارع والشاي والبحر. ثقافة شعبية ومثقفة تبشّر باستقلالات ثقافية في المغرب.",
      fig2_alt: "منظر للجزائر ومينائها، صورة أرشيفية.",
      fig2_cap: "الجزائر، الستينات، مشهد أدبي وانخراط",
      ghost_soleils: "شموس",
      s_soleils_date: "١٩٤٩، كتاب",
      s_soleils_h2: "شموس متفرّقة",
      s_soleils_p_html:
        "صدر عام 1949، يُقرأ <em>شموس متفرّقة</em> غالبًا كتابًا مؤسّسًا: صوت يعترف بالرغبة، بحرب الجزائر الكامنة، وباستحالة القسمة بين أوروبا والجنوب.",
      s_soleils_p2:
        "العنوان برنامج: شموس لا تلتقي، هويات متعددة. يخترع سنّاك حسّية سياسية ما زالت تزعج النقد المحافظ.",
      ghost_radio: "إذاعة",
      s_radio_date: "1962، صوت علني",
      s_radio_h2: "الإذاعة والشعب",
      s_radio_p:
        "في إذاعة الجزائر الثانية، يصبح سنّاك صوتًا مألوفًا: برامج عن الشعر والأغنية والأدب المغاربي. يُستمع إليه كأخ كبير.",
      s_radio_p2:
        "يُسمع كتّابًا نادرًا في غيرها، يخبر الشباب، يشرح لماذا يمكن للشعر أن يرافق شعبًا نحو الحرية.",
      quote2_bq: "شموس متفرّقة",
      quote2_cite: "عنوان كنجمّة",
      panel_stack_aria: "عبور بملء الشاشة",
      panel_stack_1: "التواريخ تصير كواكب",
      panel_stack_2: "الجزائر، البحر، اللغات",
      panel_stack_3: "الشباب يضوي الليل",
      panel_stack_4: "الكتابة ضد الظل",
      panel_stack_5: "كمل العبور",
      panel_stack_date_1: "1949",
      panel_stack_date_2: "1950",
      panel_stack_date_3: "1955",
      panel_stack_date_4: "1960",
      panel_stack_date_5: "تتمة",
      ghost_corps: "جسد",
      s_corps_date: "حضور معترف بيه",
      s_corps_h2: "الانخراط والرغبة",
      s_corps_p:
        "مثليّ معترف بيه في سياق رقابة ورفض، يجسّد وضوحًا نادرًا. يرفض الخزانة: الجسد وحبّ الرجال وحبّ الشعب في نفس التفعيلة.",
      s_corps_p2:
        "نصوصه تحتفي بالجمال الذكوري والأخوة والثورة. عنده، تحرير الرغبة وتحرير الجزائر وجهان لنضال واحد ضد الكذب.",
      s_peuple_date: "1964، مختارات",
      s_peuple_h2: "مقدّمة لشعب",
      s_peuple_p_html:
        "في 1964 يصدر <em>مقدّمة لشعب في سير</em>، مختارات للشعر الجزائري بالفرنسية. يرسم سنّاك نسبًا: من الاستعمار إلى الاستقلال.",
      s_peuple_p2:
        "يؤكّد الكتاب أن أمةً يمكنها أن تفكّر حداثتها بلغة موروثة، محوّلة، مُستردّة. فعل سياسي بقدر ما هو جمالي.",
      fig3_alt: "جان سنّاك في مكتبو، يقرا مخطوطة.",
      fig3_cap: "سنّاك في مكتبو، الشاعر والشغل",
      s1973_date: "٣٠ أوت، الجزائر",
      s1973_h2: "الوفاة بالجزائر",
      s1973_p:
        "في 30 أوت 1973، يُعثر على جان سنّاك ميتًا في بيته بشارع مونتيسيلي بالجزائر. الجريمة بلا حلّ؛ الشائعات وغياب التحقيق يغذّيان الحداد الجماعي.",
      s1973_p2:
        "وصيته الروحية عمل سليم: عشرات الكتب، آلاف مستمعين بصوته في الإذاعة، جيل من الكتّاب الجزائريين شجّعهم.",
      fig4_alt: "جان سنّاك، صورة تذكارية.",
      fig4_cap: "ذاكرة سنّاك، بقايا صوت حرّ",
      ghost_legs: "أثر",
      s_legs_date: "اليوم",
      s_legs_h2: "الأثر الحيّ",
      s_legs_p:
        "شاعر، منشّط ثقافي، جسر بين ضفتي المتوسط، سنّاك شخصية مرجعية للحداثة الجزائرية. اسمه مرتبط بالمكتبات والمهرجانات والشباب.",
      s_legs_p2:
        "من شوارع الجزائر إلى مكتبات فرنسا، عمله يواصل السؤال: كيف نعيش عالمين، كيف نحبّ بلا تنازل، كيف نكتب حرّين.",
      s_arch_date: "نزول القوس",
      s_arch_h2: "بوابة الرحلة",
      s_arch_p:
        "بمواصلة التمرير تقتربون من القوس، ممرّ نحو الفصل الثالث. النموذج ثلاثي الأبعاد ينزل مع قراءتكم: نصب خيالي، عتبة بين الذاكرة والكتابة.",
      s_arch_p2:
        "كان سنّاك يؤمن أن كل قارئ يعبر عتبة. هذا القوس لكم: لحظة للنظر والتنفّس، ثم إعادة كتابة الرحلة شعرًا.",
      ch3_kicker: "تتمة الرحلة",
      ch3_h2: "الفصل الثالث",
      ch3_p: "الليل يفكّ. الخيط الذهبي يفارق الخط الزمني ويفتح إقليم آخر.",
      ch3_btn_credits: "شهادات الرحلة",
      ch3_back: "رجوع للتجربة",
      ch3_replay: "عاود الخط الزمني",
      vc_title: "الرحلة",
      vc_subtitle: "تحية لجان سنّاك",
      vc_h_conception: "الإنجاز",
      vc_l_conception_1: "ياسين بوعبد الله",
      vc_l_conception_2:
        "الإعداد · الإخراج الفنّي · خريطة الذاكرة · الخط الزمني · الكتابة · التذييل",
      vc_h_textes: "النصوص",
      vc_l_textes_1: "جان سنّاك · مقتطفات واقتباسات",
      vc_l_textes_2: "إعادة إنتاج تربوي (المادة 122 5) · BUT MMI، غير تجاري",
      vc_h_images: "الصور والأرشيف",
      vc_l_images: "صور ومستندات · ملفّ تربوي · أرشيفات فوتوغرافية",
      vc_h_video: "الصورة والصوت",
      vc_l_video:
        "المقدّمة والانتقالات · ياسين بوعبد الله · لقطات Artlist · تصميم صوتي للانتقالات",
      vc_h_audio: "الموسيقى",
      vc_l_audio:
        "« Zina » · Raïna Raï · « Switzerland » · Thomas James White · « Emotional Arabian Oud » · الجزء الثاني",
      vc_h_outils: "التقنيات",
      vc_l_outils_1:
        "React · TypeScript · Vite · GSAP · Motion · Three.js · Tailwind · Lenis · Howler · Zustand",
      vc_h_favicon: "بمساعدة",
      vc_l_favicon: "أدوات الذكاء الاصطناعي · تصميم وتصحيح",
      vc_l_outils_2:
        "ما بعد الإنتاج: Adobe Creative Cloud، DaVinci Resolve، Blender · Natural Earth · Turf.js · Google Fonts · Bahlull",
      vc_fin: "شكرًا لأنك كملت هاد المسيرة حتى كتامة الليل.",
      vc_skip_title: "غادر الليل (يظهر في نهاية الشهادات)",
      vc_skip_btn: "غادر الليل",
    },
  };

  var P404 = {
    fr: {
      p404_doc_title: "404 · Al-Rihla",
      p404_err_aria: "Erreur 404",
      p404_kicker: "Al-Rihla · Médiation culturelle",
      p404_line: "La nuit ne mène pas ici.",
      p404_btn_aria: "Retourner à l'expérience Al-Rihla",
      p404_btn_label: "Reprendre le voyage",
      p404_btn_sub: "retour à l'expérience",
    },
    ar: {
      p404_doc_title: "٤٠٤ · الرحلة",
      p404_err_aria: "خطأ ٤٠٤",
      p404_kicker: "الرحلة · وساطة ثقافية",
      p404_line: "الليل ما يقودش لهنا.",
      p404_btn_aria: "رجوع لتجربة الرحلة",
      p404_btn_label: "كمّل الرحلة",
      p404_btn_sub: "رجوع للتجربة",
    },
  };

  function applySenac() {
    var lang = getLang();
    var dict = PAR[lang] || PAR.fr;
    document.documentElement.lang = lang === "ar" ? "ar-DZ" : "fr";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    applyDataI18n(document, dict);
    if (dict.doc_title) document.title = dict.doc_title;
  }

  function apply404Page() {
    var lang = getLang();
    var dict = P404[lang] || P404.fr;
    document.documentElement.lang = lang === "ar" ? "ar-DZ" : "fr";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    applyDataI18n(document, dict);
    if (dict.p404_doc_title) document.title = dict.p404_doc_title;
  }

  function run() {
    if (document.body && document.body.classList.contains("senac-night")) {
      applySenac();
    } else if (document.getElementById("num404")) {
      apply404Page();
    }
    window.AL_RIHLA_LANG = getLang();
    window.SENAC_T = function (key) {
      var L = getLang();
      return (PAR[L] && PAR[L][key]) || PAR.fr[key] || "";
    };
    /** Réapplique FR/AR (menu pause parent ou autre onglet). */
    window.AL_RIHLA_APPLY_STATIC_I18N = function () {
      if (document.body && document.body.classList.contains("senac-night")) {
        applySenac();
        window.AL_RIHLA_LANG = getLang();
      } else if (document.getElementById("num404")) {
        apply404Page();
      }
    };
    window.addEventListener("storage", function (e) {
      if (e.key !== STORAGE_KEY) return;
      if (typeof window.AL_RIHLA_APPLY_STATIC_I18N === "function") {
        window.AL_RIHLA_APPLY_STATIC_I18N();
      }
      if (typeof window.AL_RIHLA_REFRESH_SENAC_DOM === "function") {
        window.AL_RIHLA_REFRESH_SENAC_DOM();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
