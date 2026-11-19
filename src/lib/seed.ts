export type Comm = {
  id: number;
  n: string;
  d: string;
  p: number;
  m: number;
  o: string;
};
export type Cmt = { n: string; t: string };
export type Post = {
  id: number;
  n: string;
  vf: boolean;
  t: string;
  img: string | null;
  c: number;
  l: number;
  s: number;
  cm: Cmt[];
  when: string;
  mine?: boolean;
};

// Provisional: luego vendra de Supabase Auth
export const ME = { n: "Juan P\u00e9rez", av: null as string | null };

export const T = {
  placeholder:
    "Comparte una reflexi\u00f3n, un testimonio o una petici\u00f3n de oraci\u00f3n",
  publico: "P\u00fablico",
  reporte: "Reporte enviado al equipo de moderaci\u00f3n.",
  compartida: "Publicaci\u00f3n compartida. Enlace copiado.",
  dot: " \u00b7 ",
  subPronto: "La suscripci\u00f3n se conecta en el siguiente paso.",
  videoPronto: "El video se conecta en el siguiente paso.",
  pronto: "Esta pantalla se construye en el siguiente paso.",
};

export const art = (a: string, b: string, k: number) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220"><rect width="400" height="220" fill="${a}"/><circle cx="${80 + k * 55}" cy="60" r="90" fill="${b}" opacity=".35"/><circle cx="330" cy="190" r="110" fill="${b}" opacity=".25"/><path d="M0 170Q100 120 200 170T400 150V220H0Z" fill="${b}" opacity=".5"/></svg>`
  );

export const COMMS: Comm[] = [
  {
    id: 1,
    n: "J\u00f3venes en la Palabra",
    d: "Estudio b\u00edblico semanal y retos de lectura.",
    p: 0,
    m: 1240,
    o: "Iglesia Vida Nueva",
  },
  {
    id: 2,
    n: "Alabanza y Adoraci\u00f3n",
    d: "Tutoriales, ensayos y arreglos exclusivos.",
    p: 4.99,
    m: 860,
    o: "Ministerio Shalom",
  },
  {
    id: 3,
    n: "Matrimonios con Prop\u00f3sito",
    d: "Cursos y mentor\u00edas para parejas.",
    p: 9.99,
    m: 410,
    o: "Pastor Andr\u00e9s Mej\u00eda",
  },
];

export const POSTS0: Post[] = [
  {
    id: 1,
    n: "Iglesia Vida Nueva",
    vf: true,
    t: "Hoy comenzamos la serie \u201cHacer una pausa\u201d en el culto de las 10:00. Los esperamos en vivo y en persona.",
    img: art("#1F3A5F", "#F2B544", 1),
    c: 0,
    l: 48,
    s: 6,
    cm: [],
    when: "1 h",
  },
  {
    id: 2,
    n: "Ministerio Shalom",
    vf: true,
    t: "Nuevo tutorial exclusivo: acordes y arreglos para el ensayo de esta semana.",
    img: art("#2d5f7a", "#F2B544", 2),
    c: 2,
    l: 31,
    s: 2,
    cm: [],
    when: "2 h",
  },
  {
    id: 3,
    n: "Pastor Andr\u00e9s Mej\u00eda",
    vf: true,
    t: "Tres h\u00e1bitos que fortalecen un matrimonio: orar juntos, escuchar sin interrumpir y agradecer cada d\u00eda.",
    img: null,
    c: 0,
    l: 76,
    s: 14,
    cm: [],
    when: "1 d",
  },
];