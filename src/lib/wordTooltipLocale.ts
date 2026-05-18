import { metaForWord } from "../components/Immersive/mapWordData";
import { ACT1_REVELATION_VERSE_AR } from "./act1PoemCorpsPays";

const CORPS_PAYS = "جسد وطني — جان سيناك";

const AR_LINES: Record<string, { verse: string; poem: string }> = {
  soleil: {
    verse: "يا من يحفرها الشمس وتعانقها البحر !",
    poem: CORPS_PAYS,
  },
  sable: {
    verse: "انظر : لون حبّنا الرمال،",
    poem: CORPS_PAYS,
  },
  mémoire: {
    verse: "يا جسد وطني، يا أرض الذاكرة،",
    poem: CORPS_PAYS,
  },
  lumière: { verse: "قُبارَا جديد كل صبح من بعد اللّيل الطويل", poem: CORPS_PAYS },
  désert: { verse: "كلمة وحدة والفْم ولّا صحراو", poem: CORPS_PAYS },
  algérie: {
    verse: "الجزائر، يا أمّي ذات الوجه الحجر،",
    poem: CORPS_PAYS,
  },
  liberté: {
    verse: "من رآكِ حرّة لا ينساكِ.",
    poem: CORPS_PAYS,
  },
  nuit: { verse: "ليل الصحرا ولادة أخرى", poem: CORPS_PAYS },
  horizon: { verse: "راك قبيل ومورا تحت سماء بلا رحمة", poem: CORPS_PAYS },
  silence: {
    verse: "العرق الرملي بحر اختار الصمت",
    poem: CORPS_PAYS,
  },
  vent: {
    verse: "الريح تنحت الليل وبكري تولّي أرض جديدة",
    poem: CORPS_PAYS,
  },
  étoile: { verse: "نجوم تهبّط وبينْشْربوا وكامل", poem: CORPS_PAYS },
  feu: { verse: "طُبولة في الزّرس، وفْق في الفوم", poem: CORPS_PAYS },
  terre: { verse: "هني الزّمان مادة، نقعد عليها", poem: CORPS_PAYS },
  naissance: { verse: "ليل الصحرا ولادة أخرى", poem: CORPS_PAYS },
  immensité: {
    verse: "يمكن قطع الفسحة بلا ما في الكفوف",
    poem: CORPS_PAYS,
  },
  corps: { verse: "صْغْير وحْدَك وحْدَك حبة رمل وبين الزّراير", poem: CORPS_PAYS },
  mère: { verse: "تيميمّون الحْمْرا راقدة تحت ورْق الزّاكْر وبَالْرماد", poem: CORPS_PAYS },
  cri: { verse: "صرخة تولّد بين الحلق والضوء", poem: "مجموعات" },
  dune: { verse: "كل كسيب موجة واقفة في اندفاعها", poem: CORPS_PAYS },
  racine: { verse: "كلّ جذر يعبّر بلغة تحت التراب", poem: "دعوة الشجرة" },
  eau: { verse: "الماء اسم رقيق للعودة", poem: "جسم مرجان" },
  ombre: { verse: "الظلّ حفظ للنور حين يثقل", poem: "مواطنو الجمال" },
  aube: { verse: "الفجر يقطع الليل بخيط رقيق", poem: "صباحي لشعبي" },
  poème: { verse: "القصيدة بيت تُفتح ويُغلق بالصمت", poem: "مجموعات" },
  voix: { verse: "الصوت جسر بين الشفاه والبعيد", poem: "مجموعات" },
  rêve: { verse: "الحلم بلد بلا حدود بين الجفنين", poem: "ديوان النون" },
  sang: { verse: "الدم ينقش اسمه في الملح", poem: "جسم مرجان" },
  pierre: { verse: "تحت طاس السود حجرة عظْم الزّْمانْ", poem: CORPS_PAYS },
  sel: { verse: "الملح يذكّر بالبحر والعرق", poem: "جسم مرجان" },
  oasis: { verse: "الواحة لقاء بين العطش والظل", poem: "صباحي لشعبي" },
  caravane: { verse: "القافلة تحمل أسماء الطرق", poem: "ديوان النون" },
  aurore: { verse: "الشفق يفتح الباب للنهار", poem: "مواطنو الجمال" },
  souffle: { verse: "النَفَس يمرّ ويغيّر وجه الصحراء", poem: "جسم مرجان" },
  source: { verse: "العين سرّ يتفجّر تحت الرمل", poem: "دعوة الشجرة" },
  vague: { verse: "الموجة وحدة وحدة رمل وقفت في حركتها", poem: CORPS_PAYS },
  dieu: { verse: "الاسم الأعلى في صمت الليل", poem: "مجموعات" },
  peuple: { verse: "الشعب صوت يتجاوز الحدود", poem: "صباحي لشعبي" },
  chant: { verse: "الغناء جسر فوق العطش", poem: "مواطنو الجمال" },
  chemin: { verse: "السبيل يُمشى ويُعاد اختراعه", poem: "ديوان النون" },
  éclat: { verse: "البريق لحظة تقاوم الظلام", poem: "جسم مرجان" },
};

export function wordTooltipLines(word: string, arabicUi: boolean) {
  const m = metaForWord(word);
  if (!arabicUi) return { verse: m.verse, poem: m.poem };
  const revealAr = ACT1_REVELATION_VERSE_AR[word as keyof typeof ACT1_REVELATION_VERSE_AR];
  if (revealAr) return { verse: revealAr, poem: CORPS_PAYS };
  return AR_LINES[word] ?? { verse: m.verse, poem: m.poem };
}
