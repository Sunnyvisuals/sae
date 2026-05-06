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
      doc_title: "Jean Sénac - Nuit saharienne",
      js_cinema_callout_html:
        '<p class="senac-cinema-explore-callout__text">Pour continuer, appuie sur <strong>Exploration</strong> en bas à gauche.</p><div class="senac-cinema-explore-callout__arrows" aria-hidden="true"><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span></div>',
      js_scroll_nudge_label: "Faire défiler",
      smc_aria: "Choisissez votre mode de navigation",
      smc_kicker: "Comment traverser cette nuit ?",
      smc_caption_html:
        'Choisis ci-dessous <span class="smc-caption-em">un mode</span> pour entrer dans la nuit.',
      smc_cinema_label: "Cinéma",
      smc_cinema_sub: "défilement automatique",
      smc_explore_label: "Exploration",
      smc_explore_sub: "à ton rythme",
      smt_aria: "Mode de défilement",
      smt_cinema_title: "Mode Cinéma (défilement auto)",
      smt_explore_title: "Mode Exploration (manuel)",
      smt_cinema: "Cinéma",
      smt_explore: "Exploration",
      hero_kicker: "Acte II - nuits sahariennes",
      hero_subtitle: "une vie en versants",
      hero_copy:
        "Une frise comme une traversée nocturne : les dates deviennent constellations, les fragments s'allument au passage, et la voix de Sénac avance dans le bleu.",
      hero_img_alt: "Jean Sénac assis sur des rochers, face à la mer.",
      hero_figcaption: "Jean Sénac - portrait d'archive",
      scroll_cue_aria: "Faire défiler vers la frise narrative",
      scroll_cue_label: "Faire défiler",
      timeline_aria: "Frise narrative Jean Sénac",
      s1926_date: "29 novembre - Alger, Belcourt",
      s1926_h2: "Naissance",
      s1926_p:
        "Naissance à Alger, à Belcourt, dans une famille modeste. L'enfance magnétise déjà la ville, la mer, les langues qui se croisent - un socle sensible pour tout ce qui viendra après.",
      fig1_alt: "Jean Sénac au bord de la mer.",
      fig1_cap: "Jeunesse à Alger - mer, rochers, premiers horizons",
      s1940_date: "Années sombres",
      s1940_h2: "L'adolescence et la guerre",
      s1940_p:
        "Guerre, privations, adolescence précipitée : le monde bascule, et la poésie devient refuge et révolte à la fois. Les premiers textes cherchent une voix franche, incisive, impossible à réduire.",
      quote1_html: "Je parle avec l'accent<br />de ma solitude.",
      quote1_cite: "Jean Sénac",
      s1950_date: "1950 - 1960",
      s1950_h2: "L'engagement littéraire",
      s1950_p1:
        "Publications, revues, amitiés littéraires : Sénac trace une trajectoire d'écrivain engagé, entre Alger et Paris, portant haut l'idée d'une littérature algérienne de langue française, libre et exigeante.",
      s1950_p2:
        "À la radio comme à la plume, il défend la parole poétique comme lieu de vérité - jamais décor, jamais poudre aux yeux.",
      fig2_alt: "Vue d'Alger et de son port, photographie d'archive.",
      fig2_cap: "Alger, années 1950-1960 - scène littéraire et engagement",
      ghost_soleils: "Soleils",
      s_soleils_date: "1949 - livre",
      s_soleils_h2: "Soleils séparés",
      s_soleils_p_html:
        "Parmi les livres qui marquent son œuvre, <em>Soleils séparés</em> condense une tension constante : celle d'un destin partagé entre cultures, entre amours, entre fronts politiques et intimes.",
      quote2_bq: "Soleils séparés",
      quote2_cite: "un titre comme une constellation",
      ghost_corps: "Corps",
      s_corps_date: "Présence assumée",
      s_corps_h2: "Engagement & désir",
      s_corps_p:
        "Homosexuel assumé dans un contexte de censure et de rejet, il incarne une visibilité rare et courageuse. Sa poésie politique et amoureuse ne se dissocie pas : même souffle, même risque.",
      fig3_alt: "Jean Sénac à son bureau, lisant un manuscrit.",
      fig3_cap: "Sénac à son bureau - le poète au travail",
      s1973_date: "30 août - Alger",
      s1973_h2: "La mort à Alger",
      s1973_p:
        "Mort à Alger, dans la violence d'un geste obscur. La nouvelle traverse la littérature francophone comme un coup porté au langage lui-même - mais les textes demeurent, intacts dans leur feu.",
      fig4_alt: "Jean Sénac, souvenir photographique.",
      fig4_cap: "Mémoire de Sénac - derniers feux d'une voix libre",
      ghost_legs: "Legs",
      s_legs_date: "Aujourd'hui",
      s_legs_h2: "La trace vive",
      s_legs_p:
        "Poète, animateur, figure tutélaire d'une modernité algérienne, Sénac continue d'éclairer les traversées entre mémoire et désir, entre terre natale et langue d'adoption.",
      ch3_kicker: "Suite du voyage",
      ch3_h2: "Chapitre III",
      ch3_p:
        "La nuit se dissipe. Le fil d'or quitte la frise et ouvre un autre territoire.",
      ch3_btn_credits: "Crédits du voyage",
      ch3_back: "Retour à l'expérience",
      ch3_replay: "Revoir la frise",
      vc_title: "Al-Rihla",
      vc_subtitle: "Médiation culturelle - Jean Sénac",
      vc_h_conception: "Conception & réalisation",
      vc_l_conception_1: "Direction artistique et développement expérience interactive",
      vc_l_conception_2: "Parcours : Carte mémoire - Frise narrative - Clôture",
      vc_h_textes: "Textes & citations",
      vc_l_textes_1:
        "Fragments poétiques et titres d'œuvres : Jean Sénac - à compléter avec références précises (éditions, années).",
      vc_l_textes_2: "Citations affichées sur la frise : vérifier droits et sources dans votre dossier.",
      vc_h_images: "Images & archives",
      vc_l_images:
        "Photographies et portraits intégrés au parchemin : crédits à reporter (institution, photographe, date).",
      vc_h_video: "Vidéo",
      vc_l_video:
        "<cite>Al-Rihla</cite> - fichier média du projet ; auteurs image / son / musique à mentionner ici.",
      vc_h_audio: "Musique & sons",
      vc_l_audio:
        "Ambiances et pistes utilisées : crédits et licences (ex. Creative Commons, bibliothèque).",
      vc_h_outils: "Outils",
      vc_l_outils_1: "React, Vite, Motion - Parchemin : Lenis, canvas & WebGL (selon activation).",
      vc_l_outils_2:
        "Création & post-production : Adobe Photoshop, Premiere Pro, After Effects, Blackmagic DaVinci Resolve.",
      vc_fin: "Merci d'avoir traversé cette nuit.",
      vc_skip_title: "Retour à l'expérience principale (affiché à la fin du générique)",
      vc_skip_btn: "Revenir à l'expérience",
    },
    ar: {
      doc_title: "جان سِنَاك — ليلٌ صحراوي",
      js_cinema_callout_html:
        '<p class="senac-cinema-explore-callout__text">لي تكمّل، ضغط على <strong>استكشاف</strong> لتحت على اليسار.</p><div class="senac-cinema-explore-callout__arrows" aria-hidden="true"><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span></div>',
      js_scroll_nudge_label: "زيد تنزّل",
      smc_aria: "ختار طريقة التصفّح ديالك",
      smc_kicker: "كيفاش غادي تعبر هاد الليلة؟",
      smc_caption_html:
        'ختار تحت<span class="smc-caption-em">واحد الطرائق</span> باش تدخل للّيل.',
      smc_cinema_label: "سينما",
      smc_cinema_sub: "التمرير تلقائي",
      smc_explore_label: "استكشاف",
      smc_explore_sub: "على وَتِير تناسبك",
      smt_aria: "نمط التمرير",
      smt_cinema_title: "نمط سينما (تمرير تلقائي)",
      smt_explore_title: "نمط استكشاف (يدوي)",
      smt_cinema: "سينما",
      smt_explore: "استكشاف",
      hero_kicker: "الجزء الثاني — ليالي صحراوية",
      hero_subtitle: "حياة على أكثر من ميل",
      hero_copy:
        "خط زمني كرحلة ليلية: الأعوام تنولّ نجوم، القطعات تنور مع المرور، وصوت سنّاك يمشي في الزرقة.",
      hero_img_alt: "جان سنّاك قاعد على صخور، ورا البحر.",
      hero_figcaption: "جان سنّاك — صورة من الأرشيف",
      scroll_cue_aria: "مرّر باش توصل للخط الزمني",
      scroll_cue_label: "زيد تنزّل",
      timeline_aria: "الخط الزمني — جان سنّاك",
      s1926_date: "٢٩ نوفمبر — الجزائر، بلكور",
      s1926_h2: "الميلاد",
      s1926_p:
        "تولّد بالجزائر، بلكور، في عائلة متواضعة. الطفولة كانت تقرب المدينة والبحر والألسنة المتداخلة — قاعدة حسّية لكلّ اللي جي من بعد.",
      fig1_alt: "جان سنّاك على شاطئ البحر.",
      fig1_cap: "شباب بالجزائر — بحر، صخور، أولى الأفق",
      s1940_date: "سنوات مظلمة",
      s1940_h2: "المراهقة والحرب",
      s1940_p:
        "حرب، محرومات، مراهقة متعجّلة: الدنيا تزلزل، والشعر يولّي ملجأ وثورة معًا. أولى النصوص تدور على صوت صافٍ، حاد، ما يتحبسش في قالب.",
      quote1_html: "أنا نهضر بلكنت<br />وحدتي.",
      quote1_cite: "جان سنّاك",
      s1950_date: "١٩٥٠ — ١٩٦٠",
      s1950_h2: "الانخراط الأدبي",
      s1950_p1:
        "إصدارات، مجلات، صداقات أدبية: سنّاك يرسم مسار كاتب متورّط، بين الجزائر وباريس، يعلي فكرة أدب جزائري بالفرنسية حرّ وصارم.",
      s1950_p2:
        "بالإذاعة وبالمقلم، يدافع على الكلمة الشعرية كمحلّ للحقيقة — موش زينة، ولا سحب عين.",
      fig2_alt: "منظر للجزائر ومينائها، صورة أرشيفية.",
      fig2_cap: "الجزائر، الستينات — مشهد أدبي وانخراط",
      ghost_soleils: "شموس",
      s_soleils_date: "١٩٤٩ — كتاب",
      s_soleils_h2: "شموس متفرّقة",
      s_soleils_p_html:
        "من بين الكتبان اللي تعلّم أدبو، <em>شموس متفرّقة</em> تكثّف توتر دائم: مصير مشترك بين حضارات، بين حبّات، بين جبهات سياسية وخاصّة.",
      quote2_bq: "شموس متفرّقة",
      quote2_cite: "عنوان كنجمّة",
      ghost_corps: "جسد",
      s_corps_date: "حضور معترف بيه",
      s_corps_h2: "الانخراط والرغبة",
      s_corps_p:
        "مثليّ معترف بيه في سياق رقابة ورفض، يجسّد وضوح نادر وشجاع. الشعر السياسي والعاطفي عندو نفس النفس، نفس المخاطرة.",
      fig3_alt: "جان سنّاك في مكتبو، يقرا مخطوطة.",
      fig3_cap: "سنّاك في مكتبو — الشاعر والشغل",
      s1973_date: "٣٠ أوت — الجزائر",
      s1973_h2: "الوفاة بالجزائر",
      s1973_p:
        "مات بالجزائر، في عنف لفظ غامض. الخبر يقطع الأدب الفرنكوفوني كضربة على اللغة نفسها — لكن النصوص تبقى، صامدة في نارها.",
      fig4_alt: "جان سنّاك، صورة تذكارية.",
      fig4_cap: "ذاكرة سنّاك — بقايا صوت حرّ",
      ghost_legs: "أثر",
      s_legs_date: "اليوم",
      s_legs_h2: "الأثر الحيّ",
      s_legs_p:
        "شاعر، منشّط، شخصية مرجعية لحداثة جزائرية، سنّاك يواصل ينور الممرّات بين الذاكرة والرغبة، بين أرض الميلاد ولغة التبنّي.",
      ch3_kicker: "تتمة الرحلة",
      ch3_h2: "الفصل الثالث",
      ch3_p: "الليل يفكّ. الخيط الذهبي يفارق الخط الزمني ويفتح إقليم آخر.",
      ch3_btn_credits: "شهادات الرحلة",
      ch3_back: "رجوع للتجربة",
      ch3_replay: "عاود الخط الزمني",
      vc_title: "الرحلة",
      vc_subtitle: "وساطة ثقافية — جان سنّاك",
      vc_h_conception: "الإعداد والإنجاز",
      vc_l_conception_1: "الإخراج الفنّي وتطوير التجربة التفاعلية",
      vc_l_conception_2: "المسار: خريطة الذاكرة — خط زمني — ختام",
      vc_h_textes: "النصوص والاقتباسات",
      vc_l_textes_1:
        "قطع شعرية وعناوين أعمال: جان سنّاك — يُكمَل بالمراجع الدقيقة (إصدارات، سنوات).",
      vc_l_textes_2: "الاقتباسات المعروضة على الخط: تثبّت الحقوق والمصادر في ملفّك.",
      vc_h_images: "الصور والأرشيف",
      vc_l_images:
        "الصور الفوتوغرافية والبورتريهات في الرقّ: تُذكر المصادر (مؤسسة، مصوّر، تاريخ).",
      vc_h_video: "الفيديو",
      vc_l_video:
        "<cite>الرحلة</cite> — ملفّ وسائط المشروع؛ يُذكر مؤلّفو الصورة / الصوت / الموسيقى هنا.",
      vc_h_audio: "الموسيقى والأصوات",
      vc_l_audio:
        "الأجواء والمقاطع المستعملة: شهادات وتراخيص (مثلاً Creative Commons، مكتبة).",
      vc_h_outils: "الأدوات",
      vc_l_outils_1: "React، Vite، Motion — الرقّ: Lenis، canvas و WebGL (حسب التفعيل).",
      vc_l_outils_2:
        "الإنشاء والما بعد: Adobe Photoshop، Premiere Pro، After Effects، DaVinci Resolve.",
      vc_fin: "شكرًا على اجتياز هاد الليل.",
      vc_skip_title: "رجوع للتجربة الرئيسية (يظهر في نهاية الشهادات)",
      vc_skip_btn: "رجوع للتجربة",
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
