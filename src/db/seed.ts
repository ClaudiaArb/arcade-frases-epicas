// Frases iniciales. Las imágenes viven en /public/img (no dentro de la base).
export interface SeedPhrase {
  text: string; es: string; character: string; source: string;
  category: "cine" | "juego"; img: string; votes: number;
}

const D = "Avengers: Doomsday", B = "Spider-Man: Brand New Day";

export const SEED: SeedPhrase[] = [
  { text: "Everything that they sacrificed will be for nothing if we do not stand together.", es: "Todo lo que sacrificaron será en vano si no nos mantenemos unidos.", character: "Thor", source: D, category: "cine", img: "doomsday-thor-unidos", votes: 24 },
  { text: "Something's coming. Something we may not be able to deter.", es: "Algo viene. Algo que quizás no podamos detener.", character: "Doctor Doom", source: D, category: "cine", img: "doomsday-doom-algo-viene", votes: 31 },
  { text: "We're going to need a miracle.", es: "Vamos a necesitar un milagro.", character: "Thor", source: D, category: "cine", img: "doomsday-thor-milagro", votes: 19 },
  { text: "I have no one.", es: "No tengo a nadie.", character: "Jean Grey", source: B, category: "cine", img: "brandnewday-jean", votes: 12 },
  { text: "The hell, Frank? You just hit me with a van!", es: "¿Qué demonios, Frank? ¡Me acabas de atropellar con una camioneta!", character: "Spider-Man", source: B, category: "cine", img: "brandnewday-spiderman-frank", votes: 27 },
  { text: "Because I'm not just Peter Parker. I'm Spider-Man.", es: "Porque no soy solo Peter Parker. Soy Spider-Man.", character: "Peter Parker", source: B, category: "cine", img: "brandnewday-peter-spiderman", votes: 41 },
  { text: "I am burdened with glorious purpose.", es: "Estoy cargado de un propósito glorioso.", character: "Loki", source: "Loki", category: "cine", img: "loki-proposito", votes: 36 },
  { text: "Love is a dagger.", es: "El amor es una daga.", character: "Loki", source: "Loki", category: "cine", img: "loki-dagger", votes: 22 },
  { text: "For all time. Always.", es: "Para todo el tiempo. Siempre.", character: "He Who Remains", source: "Loki", category: "cine", img: "loki-he-who-remains", votes: 17 },
  { text: "You forget a lot of things every day, make sure this one is one of them.", es: "Olvidas muchas cosas cada día, asegúrate de que esta sea una de ellas.", character: "GTA V", source: "Grand Theft Auto V", category: "juego", img: "gta5-olvidar", votes: 15 },
  { text: "I'm afraid.", es: "Tengo miedo.", character: "Arthur Morgan", source: "Red Dead Redemption 2", category: "juego", img: "rdr2-arthur", votes: 33 },
  { text: "You have to be better.", es: "Tienes que ser mejor.", character: "Kratos", source: "God of War (2018)", category: "juego", img: "gow-kratos", votes: 45 },
];
