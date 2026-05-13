import type { RevelationWord } from '../components/Immersive/mapWordData';
import { isRevelationWord } from '../components/Immersive/mapWordData';
import { revelationWordUISurface } from './appCopy';

/** Étiquettes arabe-darija / MSA pour les clés françaises des particules carte (canvas + UI homogène) */
const MAP_WORD_ARABIC_LABEL: Record<string, string> = {
  soleil: 'الشمس',
  sable: 'الرمال',
  mémoire: 'الذاكرة',
  lumière: 'النور',
  désert: 'الصحراء',
  algérie: 'الجزائر',
  liberté: 'الحرّية',
  nuit: 'الليل',
  horizon: 'الأفق',
  silence: 'الصمت',
  vent: 'الريح',
  étoile: 'النجم',
  feu: 'النار',
  terre: 'الأرض',
  naissance: 'الولادة',
  immensité: 'الفسحة',
  corps: 'الجسد',
  mère: 'الأم',
  cri: 'الصرخة',
  dune: 'الكسيب',
  racine: 'الجذر',
  eau: 'الماء',
  ombre: 'الظلّ',
  aube: 'الفجر',
  poème: 'القصيدة',
  voix: 'الصوت',
  rêve: 'الحلم',
  sang: 'الدم',
  pierre: 'الحجر',
  sel: 'الملح',
  oasis: 'الواحة',
  caravane: 'القافلة',
  aurore: 'الشفق',
  souffle: 'النَفَس',
  source: 'العين',
  vague: 'الموجة',
  dieu: 'الله',
  peuple: 'الشعب',
  chant: 'الغناء',
  chemin: 'السبيل',
  éclat: 'البريق',
};

export function arabicPoemWordLabel(word: string): string {
  if (isRevelationWord(word)) {
    return revelationWordUISurface(word as RevelationWord, 'ar-dz');
  }
  return MAP_WORD_ARABIC_LABEL[word] ?? word;
}
