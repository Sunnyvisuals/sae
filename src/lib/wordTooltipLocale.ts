import { metaForWord } from "../components/Immersive/mapWordData";

const AR_LINES: Record<string, { verse: string; poem: string }> = {
  soleil: { verse: "يا شمس، يا شمس، تحرق فمي", poem: "دعوة الشجرة" },
  sable: { verse: "الرمال تحفظ أثر الريح", poem: "ديوان النون" },
  mémoire: { verse: "ذاكرتي بحر بلا سواحل", poem: "جسم مرجان" },
  lumière: { verse: "النور هنا جرح لطيف", poem: "مواطنو الجمال" },
  désert: { verse: "الصحراء ليست غيابًا، هي حضور مطلق", poem: "صباحي لشعبي" },
  algérie: { verse: "يا جزائر يا حبي يا وجعي", poem: "مواطنو الجمال" },
  liberté: { verse: "يا حريّتي أكتب اسمك على الرمل", poem: "صباحي لشعبي" },
  nuit: { verse: "الليل هنا ذوق الياسمين", poem: "ديوان النون" },
  horizon: { verse: "الأفق وعد تحتفظ به الشمس", poem: "جسم مرجان" },
  silence: { verse: "سكينة الحجارة صوت يتكلّم", poem: "دعوة الشجرة" },
  vent: { verse: "الريح تحمل أسماء المفقودين", poem: "ديوان النون" },
  étoile: { verse: "كل نجمة عين تنظر إلينا", poem: "جسم مرجان" },
  feu: { verse: "النار لسان الأجداد", poem: "صباحي لشعبي" },
  terre: { verse: "هذه الأرض لحمي ودمي", poem: "مواطنو الجمال" },
  naissance: { verse: "ولادة القصيدة ولادة النهار", poem: "مواطنو الجمال" },
  immensité: {
    verse: "الفسحة تقاس بالصمت الذي بداخلها",
    poem: "ديوان النون",
  },
  corps: { verse: "جسد مرجان، جسد النار والملح", poem: "جسم مرجان" },
  mère: { verse: "أرض أم، والشمس فوق جبين الأمواج", poem: "صباحي لشعبي" },
  cri: { verse: "صرخة تولّد بين الحلق والضوء", poem: "مجموعات" },
  dune: { verse: "الكثيب يمشي ويتبدّل مع الريح", poem: "ديوان النون" },
  racine: { verse: "كلّ جذر يعبّر بلغة تحت التراب", poem: "دعوة الشجرة" },
  eau: { verse: "الماء اسم رقيق للعودة", poem: "جسم مرجان" },
  ombre: { verse: "الظلّ حفظ للنور حين يثقل", poem: "مواطنو الجمال" },
  aube: { verse: "الفجر يقطع الليل بخيط رقيق", poem: "صباحي لشعبي" },
  poème: { verse: "القصيدة بيت تُفتح ويُغلق بالصمت", poem: "مجموعات" },
  voix: { verse: "الصوت جسر بين الشفاه والبعيد", poem: "مجموعات" },
  rêve: { verse: "الحلم بلد بلا حدود بين الجفنين", poem: "ديوان النون" },
  sang: { verse: "الدم ينقش اسمه في الملح", poem: "جسم مرجان" },
  pierre: { verse: "الحجارة تحفظ عدّ النهارات", poem: "دعوة الشجرة" },
  sel: { verse: "الملح يذكّر بالبحر والعرق", poem: "جسم مرجان" },
  oasis: { verse: "الواحة لقاء بين العطش والظل", poem: "صباحي لشعبي" },
  caravane: { verse: "القافلة تحمل أسماء الطرق", poem: "ديوان النون" },
  aurore: { verse: "الشفق يفتح الباب للنهار", poem: "مواطنو الجمال" },
  souffle: { verse: "النَفَس يمرّ ويغيّر وجه الصحراء", poem: "جسم مرجان" },
  source: { verse: "العين سرّ يتفجّر تحت الرمل", poem: "دعوة الشجرة" },
  vague: { verse: "الموجة تكتب ثم تمحو فورًا", poem: "جسم مرجان" },
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
