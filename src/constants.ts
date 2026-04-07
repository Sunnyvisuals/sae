export interface Verse {
  text: string;
  translation: string;
  landscapeUrl: string;
}

export interface GameFragment {
  id: string;
  text: string;
  order: number;
}

export interface GameQuote {
  id: string;
  fullText: string;
  fragments: GameFragment[];
  imageUrl: string;
}

export const POEMS: Verse[] = [
  {
    text: "Je t'écris de ce pays où le soleil ne se couche jamais sur le désir.",
    translation: "I write to you from this land where the sun never sets on desire.",
    landscapeUrl: "https://images.unsplash.com/photo-1548670107-79395c33223d?q=80&w=1920&auto=format&fit=crop"
  },
  {
    text: "Nous avons bâti notre demeure sur le sable et le vent, mais nos racines sont de feu.",
    translation: "We built our home on sand and wind, but our roots are of fire.",
    landscapeUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1920&auto=format&fit=crop"
  },
  {
    text: "Le sang de la terre coule dans mes veines, et chaque mot est une pierre de l'édifice.",
    translation: "The blood of the earth flows in my veins, and every word is a stone of the edifice.",
    landscapeUrl: "https://images.unsplash.com/photo-1547132832-68045952f416?q=80&w=1920&auto=format&fit=crop"
  }
];

export const GAME_QUOTES: GameQuote[] = [
  {
    id: "sun-master",
    fullText: "Le soleil est notre seul maître et notre seul espoir.",
    imageUrl: "https://images.unsplash.com/photo-1445262102387-5fbb30a5e59d?q=80&w=1920&auto=format&fit=crop",
    fragments: [
      { id: "s1", text: "Le soleil", order: 0 },
      { id: "s2", text: "est", order: 1 },
      { id: "s3", text: "notre", order: 2 },
      { id: "s4", text: "seul", order: 3 },
      { id: "s5", text: "maître", order: 4 },
      { id: "s6", text: "et", order: 5 },
      { id: "s7", text: "notre", order: 6 },
      { id: "s8", text: "seul", order: 7 },
      { id: "s9", text: "espoir.", order: 8 }
    ]
  },
  {
    id: "algerie-heureuse",
    fullText: "Algérie heureuse, Algérie de la lumière.",
    imageUrl: "https://images.unsplash.com/photo-1505189947622-4ad9c44d0d94?q=80&w=1920&auto=format&fit=crop",
    fragments: [
      { id: "a1", text: "Algérie", order: 0 },
      { id: "a2", text: "heureuse,", order: 1 },
      { id: "a3", text: "Algérie", order: 2 },
      { id: "a4", text: "de", order: 3 },
      { id: "a5", text: "la", order: 4 },
      { id: "a6", text: "lumière.", order: 5 }
    ]
  },
  {
    id: "poete-peuple",
    fullText: "Le poète est le témoin du peuple.",
    imageUrl: "https://images.unsplash.com/photo-1548670107-79395c33223d?q=80&w=1920&auto=format&fit=crop",
    fragments: [
      { id: "p1", text: "Le poète", order: 0 },
      { id: "p2", text: "est", order: 1 },
      { id: "p3", text: "le", order: 2 },
      { id: "p4", text: "témoin", order: 3 },
      { id: "p5", text: "du", order: 4 },
      { id: "p6", text: "peuple.", order: 5 }
    ]
  }
];
