import { metaForWord } from "../components/Immersive/mapWordData";

const SAH = "صحراء — شفيف";

const AR_LINES: Record<string, { verse: string; poem: string }> = {
  soleil: { verse: "رفّانة كانها بشرة حضّناها الشمس طويلًا", poem: SAH },
  sable: { verse: "خطّ رُمل ماكاش وحدة ماكاش خطّات اسمها", poem: SAH },
  mémoire: {
    verse: "فارِغ اليَدين، والقلْب مفتَوح بحال الخيمة",
    poem: SAH,
  },
  lumière: { verse: "قُبارَا جديد كل صبح من بعد اللّيل الطويل", poem: SAH },
  désert: { verse: "كلمة وحدة والفْم ولّا صحراو", poem: SAH },
  algérie: {
    verse: "تمنْراست وجان وَتيميمون، الاسم موسيقى قبل ما يكون بلاصة",
    poem: SAH,
  },
  liberté: {
    verse: "تْوصَل لبلاصة روح وحدة ومازورتْهاش قبل هكذا",
    poem: SAH,
  },
  nuit: { verse: "ليل الصحرا ولادة أخرى", poem: SAH },
  horizon: { verse: "راك قبيل ومورا تحت سماء بلا رحمة", poem: SAH },
  silence: {
    verse: "العرق الرملي بحر اختار الصمت",
    poem: SAH,
  },
  vent: {
    verse: "الريح تنحت الليل وبكري تولّي أرض جديدة",
    poem: SAH,
  },
  étoile: { verse: "نجوم تهبّط وبينْشْربوا وكامل", poem: SAH },
  feu: { verse: "طُبولة في الزّرس، وفْق في الفوم", poem: SAH },
  terre: { verse: "هني الزّمان مادة، نقعد عليها", poem: SAH },
  naissance: { verse: "ليل الصحرا ولادة أخرى", poem: SAH },
  immensité: {
    verse: "يمكن قطع الفسحة بلا ما في الكفوف",
    poem: SAH,
  },
  corps: { verse: "صْغْير وحْدَك وحْدَك حبة رمل وبين الزّراير", poem: SAH },
  mère: { verse: "تيميمّون الحْمْرا راقدة تحت ورْق الزّاكْر وبَالْرماد", poem: SAH },
  cri: { verse: "صرخة تولّد بين الحلق والضوء", poem: "مجموعات" },
  dune: { verse: "كل كسيب موجة واقفة في اندفاعها", poem: SAH },
  racine: { verse: "كلّ جذر يعبّر بلغة تحت التراب", poem: "دعوة الشجرة" },
  eau: { verse: "الماء اسم رقيق للعودة", poem: "جسم مرجان" },
  ombre: { verse: "الظلّ حفظ للنور حين يثقل", poem: "مواطنو الجمال" },
  aube: { verse: "الفجر يقطع الليل بخيط رقيق", poem: "صباحي لشعبي" },
  poème: { verse: "القصيدة بيت تُفتح ويُغلق بالصمت", poem: "مجموعات" },
  voix: { verse: "الصوت جسر بين الشفاه والبعيد", poem: "مجموعات" },
  rêve: { verse: "الحلم بلد بلا حدود بين الجفنين", poem: "ديوان النون" },
  sang: { verse: "الدم ينقش اسمه في الملح", poem: "جسم مرجان" },
  pierre: { verse: "تحت طاس السود حجرة عظْم الزّْمانْ", poem: SAH },
  sel: { verse: "الملح يذكّر بالبحر والعرق", poem: "جسم مرجان" },
  oasis: { verse: "الواحة لقاء بين العطش والظل", poem: "صباحي لشعبي" },
  caravane: { verse: "القافلة تحمل أسماء الطرق", poem: "ديوان النون" },
  aurore: { verse: "الشفق يفتح الباب للنهار", poem: "مواطنو الجمال" },
  souffle: { verse: "النَفَس يمرّ ويغيّر وجه الصحراء", poem: "جسم مرجان" },
  source: { verse: "العين سرّ يتفجّر تحت الرمل", poem: "دعوة الشجرة" },
  vague: { verse: "الموجة وحدة وحدة رمل وقفت في حركتها", poem: SAH },
  dieu: { verse: "الاسم الأعلى في صمت الليل", poem: "مجموعات" },
  peuple: { verse: "الشعب صوت يتجاوز الحدود", poem: "صباحي لشعبي" },
  chant: { verse: "الغناء جسر فوق العطش", poem: "مواطنو الجمال" },
  chemin: { verse: "السبيل يُمشى ويُعاد اختراعه", poem: "ديوان النون" },
  éclat: { verse: "البريق لحظة تقاوم الظلام", poem: "جسم مرجان" },
};

export function wordTooltipLines(word: string, arabicUi: boolean) {
  const m = metaForWord(word);
  if (!arabicUi) return { verse: m.verse, poem: m.poem };
  return AR_LINES[word] ?? { verse: m.verse, poem: m.poem };
}
