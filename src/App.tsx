import { useState, useEffect, useRef } from "react";


import {
  Home, BookOpen, FlaskConical, Bot, StickyNote, BarChart3,
  Star, Settings, ChevronRight, Check, Play, Pause, RotateCcw,
  Timer, Calculator, Table2, Menu, X, Plus,
  Save, Trash2, Search, ChevronDown,
  Send, Sparkles, Zap, Eye, EyeOff
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, RadialBarChart, RadialBar
} from "recharts";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
// ─── Types ───────────────────────────────────────────────────────────────────

type View = "splash" | "home" | "aulas" | "quiz" | "ia" | "anotacoes" | "progresso" | "favoritos" | "ferramentas" | "config";

interface Lesson {
  id: number;
  title: string;
  desc: string;
  videoUrl: string;
  completed: boolean;
  notes: string;
  favorited: boolean;
}

interface QuizQuestion {
  id: number;
  topic: string;
  level: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface DisplayQuestion extends QuizQuestion {
  shuffledOptions: string[];
  shuffledCorrect: number;
}

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  color: string;
  favorited: boolean;
}

interface ChatMessage {
  id: number;
  role: "user" | "ai";
  text: string;
  time: string;
}

interface PeriodicElement {
  num: number;
  symbol: string;
  name: string;
  mass: string;
  cat: string;
  period: number;
  group: number;
}

// ─── Data ────────────────────────────────────────────────────────────────────

// ─── LINKS DAS AULAS ─────────────────────────────────────────────────────────
// Coloque o link do YouTube de cada aula no campo videoUrl abaixo.
// Ex: videoUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX"
// Deixe "" para exibir "Videoaula em breve…"
// ─────────────────────────────────────────────────────────────────────────────
const LESSONS: Lesson[] = [
  { id: 1,  title: "Introdução à Química",        desc: "O que é química, sua história e importância no cotidiano.",                  videoUrl: "https://youtu.be/XDBwYrWFZUQ?si=2dBboyyPcLY5qfJL", completed: false, notes: "", favorited: false },
  { id: 2,  title: "História da Química",          desc: "Evolução da química desde os alquimistas até a ciência moderna.",           videoUrl: "https://youtu.be/yFNXCagvPM4?si=XlxLFMHZKg_JHK6f", completed: false, notes: "", favorited: false },
  { id: 3,  title: "Matéria e Energia",            desc: "Conceitos fundamentais de matéria, energia e suas transformações.",         videoUrl: "https://youtu.be/tHR_GfagIEg?si=qukySw6raJ5R2WfK", completed: false, notes: "", favorited: false },
  { id: 4,  title: "Estados Físicos da Matéria",   desc: "Sólido, líquido, gasoso e plasma — características e mudanças de estado.", videoUrl: "https://youtu.be/ouooK7v8HnM?si=N0P-LMjcpUTJRWh2", completed: false, notes: "", favorited: false },
  { id: 5,  title: "Transformações Químicas",      desc: "Reações químicas, evidências e diferenças de transformações físicas.",      videoUrl: "https://youtu.be/-Q1bLUfRauE?si=ZcOhgpzOtQkKsF89", completed: false, notes: "", favorited: false },
  { id: 6,  title: "Propriedades da Matéria",      desc: "Propriedades físicas, químicas, gerais e específicas da matéria.",         videoUrl: "https://youtu.be/TMQGLstE7BQ?si=0qQfVOTRJIcGxIxQ", completed: false, notes: "", favorited: false },
  { id: 7,  title: "Estrutura Atômica",            desc: "Prótons, nêutrons, elétrons e a estrutura do átomo.",                      videoUrl: "https://youtu.be/jScFCzblS7w?si=ZY_LkdqAEnxh8CD1", completed: false, notes: "", favorited: false },
  { id: 8,  title: "Modelos Atômicos",             desc: "Dalton, Thomson, Rutherford, Bohr e o modelo quântico.",                   videoUrl: "https://youtu.be/kgg9sdpoKkQ?si=8dajP9mDNKkWKWHi", completed: false, notes: "", favorited: false },
  { id: 9,  title: "Tabela Periódica",             desc: "Organização, períodos, grupos e propriedades periódicas.",                 videoUrl: "https://youtu.be/qtXv7BZAIqg?si=74SMCIE4f-WPAT3E", completed: false, notes: "", favorited: false },
  { id: 10, title: "Ligações Químicas",            desc: "Ligações iônicas, covalentes e metálicas.",                                videoUrl: "https://youtu.be/UjXlHX3EEi0?si=NWJp1GVbVva3nNp5", completed: false, notes: "", favorited: false },
  { id: 11, title: "Geometria Molecular",          desc: "VSEPAR, formas moleculares e ângulos de ligação.",                        videoUrl: "https://youtu.be/QX2WA7coHZ0?si=JzLNqKplGyIHOvpN", completed: false, notes: "", favorited: false },
  { id: 12, title: "Polaridade",                   desc: "Moléculas polares, apolares e forças intermoleculares.",                   videoUrl: "https://youtu.be/QX2WA7coHZ0?si=JzLNqKplGyIHOvpN", completed: false, notes: "", favorited: false },
  { id: 13, title: "Funções Inorgânicas",          desc: "Classificação e nomenclatura das funções inorgânicas.",                   videoUrl: "https://youtu.be/zRggv75T7B4?si=LGVQXSjsJYqxawfz", completed: false, notes: "", favorited: false },
  { id: 14, title: "Ácidos",                       desc: "Teoria de Arrhenius, Brønsted-Lowry, nomenclatura e propriedades.",       videoUrl: "https://youtu.be/jJ0PfLUBKnQ?si=wAUD2OF7iFkbmvr0", completed: false, notes: "", favorited: false },
  { id: 15, title: "Bases",                        desc: "Conceito, nomenclatura, propriedades e exemplos de bases.",               videoUrl: "https://youtu.be/gHYNjKn_gpI?si=amzkNBzmgngwCnJV", completed: false, notes: "", favorited: false },
  { id: 16, title: "Sais",                         desc: "Formação, nomenclatura, solubilidade e propriedades dos sais.",           videoUrl: "https://youtu.be/TKn780feTFE?si=h_PaaKGOTLI1JedC", completed: false, notes: "", favorited: false },
  { id: 17, title: "Óxidos",                       desc: "Classificação, nomenclatura e reações dos óxidos.",                      videoUrl: "https://youtu.be/JfTWSnjhoT0?si=aYllF0qMdXxf1ckN", completed: false, notes: "", favorited: false },
  { id: 18, title: "Balanceamento de Equações",    desc: "Métodos de balanceamento e lei da conservação da massa.",                 videoUrl: "https://youtu.be/RUY7xNTWVLw?si=v99bO3nJhv4haiZ3", completed: false, notes: "", favorited: false },
  { id: 19, title: "Estequiometria",               desc: "Cálculos estequiométricos, mol e massas moleculares.",                   videoUrl: "https://youtu.be/SDyHraOMZsI?si=7bBNHOfgMuznIOLg", completed: false, notes: "", favorited: false },
  { id: 20, title: "Soluções",                     desc: "Tipos de soluções, soluto, solvente e solubilidade.",                    videoUrl: "https://youtu.be/m3mUEb6ULf8?si=Z60S5C8X-Vwrd8ND", completed: false, notes: "", favorited: false },
  { id: 21, title: "Concentração das Soluções",    desc: "Concentração comum, molar, título e partes por milhão.",                 videoUrl: "https://youtu.be/t_lTRmOIDz8?si=tE9IFrHq-d8RdQsh", completed: false, notes: "", favorited: false },
  { id: 22, title: "Termoquímica",                 desc: "Entalpia, reações exotérmicas, endotérmicas e Lei de Hess.",             videoUrl: "https://youtu.be/cJwHbZUJiAA?si=FYF0q8AXpXvn98Pc", completed: false, notes: "", favorited: false },
  { id: 23, title: "Cinética Química",             desc: "Velocidade das reações, fatores que influenciam e energia de ativação.", videoUrl: "https://youtube.com/playlist?list=PLrsojwmNR8-Hm4XiVZYZcwuMDXn6JCNm5&si=FdCBho6DjXHMI2qE", completed: false, notes: "", favorited: false },
  { id: 24, title: "Equilíbrio Químico",           desc: "Princípio de Le Chatelier, constante de equilíbrio Kc e Kp.",           videoUrl: "https://youtube.com/playlist?list=PLrsojwmNR8-Hm4XiVZYZcwuMDXn6JCNm5&si=FdCBho6DjXHMI2qE", completed: false, notes: "", favorited: false },
  { id: 25, title: "Eletroquímica",                desc: "Pilhas, eletrólise, oxidação, redução e potenciais de eletrodo.",        videoUrl: "https://youtube.com/playlist?list=PLkEeNC9TIQxe65QvNUG_6zYnpQo_flpGQ&si=M0MreXeQhWR1-vES", completed: false, notes: "", favorited: false },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 1, topic: "Estrutura Atômica", level: "easy", question: "Qual é a carga elétrica do próton?", options: ["Negativa", "Positiva", "Neutra", "Variável"], correct: 1, explanation: "O próton possui carga elétrica positiva (+1), enquanto o elétron é negativo e o nêutron é neutro." },
  { id: 2, topic: "Tabela Periódica", level: "easy", question: "Quantos elementos existem na tabela periódica atual?", options: ["92", "108", "118", "126"], correct: 2, explanation: "A tabela periódica atual possui 118 elementos reconhecidos pela IUPAC." },
  { id: 3, topic: "Ligações Químicas", level: "medium", question: "Qual tipo de ligação ocorre entre metais e não-metais com grande diferença de eletronegatividade?", options: ["Covalente apolar", "Metálica", "Covalente polar", "Iônica"], correct: 3, explanation: "A ligação iônica ocorre quando há transferência de elétrons, geralmente entre metal e não-metal com grande diferença de eletronegatividade (>1,7)." },
  { id: 4, topic: "Ácidos e Bases", level: "easy", question: "Segundo Arrhenius, ácido é toda substância que em água libera:", options: ["Íons OH⁻", "Íons H⁺", "Íons Na⁺", "Moléculas de H₂O"], correct: 1, explanation: "Pela teoria de Arrhenius, ácido é toda substância que, ao se dissolver em água, libera H⁺ como único cátion." },
  { id: 5, topic: "Estequiometria", level: "hard", question: "Quantas moléculas existem em 2 mols de H₂O? (Nₐ = 6,02 × 10²³)", options: ["6,02 × 10²³", "1,204 × 10²⁴", "3,01 × 10²³", "2,408 × 10²⁴"], correct: 1, explanation: "2 mols × 6,02 × 10²³ moléculas/mol = 1,204 × 10²⁴ moléculas." },
  { id: 6, topic: "Termoquímica", level: "medium", question: "Uma reação que libera calor para o ambiente é classificada como:", options: ["Endotérmica", "Exotérmica", "Catalítica", "Reversível"], correct: 1, explanation: "Reações exotérmicas liberam energia (calor) para o ambiente, apresentando ΔH negativo." },
  { id: 7, topic: "Soluções", level: "medium", question: "A concentração molar (molaridade) é expressa em:", options: ["g/L", "mol/L", "g/mL", "mol/kg"], correct: 1, explanation: "A molaridade (M) é definida como o número de mols de soluto por litro de solução: M = n/V(L)." },
  { id: 8, topic: "Cinética Química", level: "medium", question: "Qual fator NÃO influencia a velocidade de uma reação química?", options: ["Temperatura", "Concentração dos reagentes", "Cor da solução", "Presença de catalisador"], correct: 2, explanation: "A cor da solução não influencia a velocidade de reação. Os fatores que influenciam são: temperatura, concentração, catalisadores, superfície de contato e pressão (para gases)." },
  { id: 9, topic: "Equilíbrio Químico", level: "hard", question: "Segundo Le Chatelier, ao aumentar a pressão num sistema em equilíbrio com gases, o equilíbrio se desloca para:", options: ["O lado com maior número de mols de gás", "O lado com menor número de mols de gás", "A direita sempre", "Nenhum lado"], correct: 1, explanation: "Aumentar a pressão favorece o lado da reação com menor número de mols de gás, reduzindo o volume do sistema." },
  { id: 10, topic: "Eletroquímica", level: "hard", question: "Em uma pilha galvânica, a oxidação ocorre:", options: ["No cátodo", "No ânodo", "Em ambos os eletrodos", "No eletrólito"], correct: 1, explanation: "Na pilha galvânica, a oxidação (perda de elétrons) ocorre no ânodo, e a redução (ganho de elétrons) ocorre no cátodo." },
  { id: 11, topic: "Modelos Atômicos", level: "easy", question: "Qual cientista propôs o modelo atômico 'pudim de passas'?", options: ["Dalton", "Rutherford", "Thomson", "Bohr"], correct: 2, explanation: "J.J. Thomson propôs o modelo do 'pudim de passas', onde os elétrons estavam distribuídos em uma esfera de carga positiva." },
  { id: 12, topic: "Funções Inorgânicas", level: "medium", question: "NaCl é classificado como:", options: ["Ácido", "Base", "Sal", "Óxido"], correct: 2, explanation: "NaCl (cloreto de sódio) é um sal, formado pela reação entre ácido clorídrico (HCl) e hidróxido de sódio (NaOH)." },
  { id: 13, topic: "Matéria e Energia", level: "easy", question: "A fusão é a mudança de estado físico de:", options: ["Sólido para líquido", "Líquido para gás", "Gás para sólido", "Líquido para sólido"], correct: 0, explanation: "A fusão é a mudança do estado sólido para o estado líquido, como o derretimento do gelo." },
  { id: 14, topic: "Tabela Periódica", level: "medium", question: "Os elementos do grupo 1 da tabela periódica são chamados de:", options: ["Metais alcalinos-terrosos", "Halogênios", "Metais alcalinos", "Gases nobres"], correct: 2, explanation: "O grupo 1 (IA) contém os metais alcalinos: Li, Na, K, Rb, Cs, Fr — altamente reativos e com valência 1." },
  { id: 15, topic: "Ligações Químicas", level: "easy", question: "Quantos pares de elétrons são compartilhados em uma ligação dupla?", options: ["1", "2", "3", "4"], correct: 1, explanation: "Uma ligação dupla (=) envolve o compartilhamento de 2 pares de elétrons (4 elétrons no total)." },
  { id: 16, topic: "Ácidos e Bases", level: "medium", question: "O pH de uma solução neutra a 25°C é:", options: ["0", "7", "14", "1"], correct: 1, explanation: "Em soluções neutras a 25°C, [H⁺] = [OH⁻] = 10⁻⁷ mol/L, portanto pH = 7." },
  { id: 17, topic: "Balanceamento", level: "medium", question: "Na equação H₂ + O₂ → H₂O balanceada, os coeficientes são:", options: ["1, 1, 1", "2, 1, 2", "1, 2, 2", "2, 2, 2"], correct: 1, explanation: "2H₂ + O₂ → 2H₂O. Verifica-se: 4H e 2O em cada lado. Coeficientes: 2, 1, 2." },
  { id: 18, topic: "Óxidos", level: "medium", question: "CO₂ é classificado como:", options: ["Óxido básico", "Óxido ácido (anidro ácido)", "Óxido anfótero", "Óxido neutro"], correct: 1, explanation: "CO₂ é um óxido ácido (anidrido carbônico) pois reage com água formando ácido carbônico (H₂CO₃)." },
  { id: 19, topic: "Estequiometria", level: "hard", question: "A massa molar do CaCO₃ (Ca=40, C=12, O=16) é:", options: ["68 g/mol", "84 g/mol", "100 g/mol", "116 g/mol"], correct: 2, explanation: "M(CaCO₃) = 40 + 12 + 3×16 = 40 + 12 + 48 = 100 g/mol." },
  { id: 20, topic: "Soluções", level: "easy", question: "Em uma solução, o componente presente em maior quantidade é chamado de:", options: ["Soluto", "Solvente", "Solução", "Disperso"], correct: 1, explanation: "O solvente é o componente presente em maior quantidade na solução, responsável por dissolver o soluto." },
  { id: 21, topic: "Estrutura Atômica", level: "medium", question: "O número de massa (A) de um átomo é a soma de:", options: ["Prótons e elétrons", "Prótons e nêutrons", "Nêutrons e elétrons", "Prótons, nêutrons e elétrons"], correct: 1, explanation: "A = Z + N, onde Z é o número atômico (prótons) e N é o número de nêutrons." },
  { id: 22, topic: "Termoquímica", level: "hard", question: "A Lei de Hess afirma que a variação de entalpia de uma reação:", options: ["Depende do caminho percorrido", "Independe do caminho, dependendo só do estado inicial e final", "É sempre negativa", "Só se aplica a reações exotérmicas"], correct: 1, explanation: "A Lei de Hess estabelece que ΔH de uma reação é a mesma, independente do caminho percorrido, dependendo apenas dos estados inicial e final." },
  { id: 23, topic: "Geometria Molecular", level: "hard", question: "A molécula de H₂O tem geometria:", options: ["Linear", "Angular", "Trigonal plana", "Tetraédrica"], correct: 1, explanation: "A água (H₂O) tem geometria angular devido aos dois pares de elétrons não-ligantes no oxigênio." },
  { id: 24, topic: "Polaridade", level: "medium", question: "Uma molécula é apolar quando:", options: ["Todos os átomos são iguais", "Os vetores de momento dipolo se anulam", "Possui somente ligações iônicas", "Não tem elétrons livres"], correct: 1, explanation: "Uma molécula é apolar quando os vetores de momento de dipolo das ligações se cancelam, resultando em momento dipolo total nulo." },
  { id: 25, topic: "Cinética Química", level: "easy", question: "A energia mínima necessária para que uma reação química ocorra é chamada de:", options: ["Entalpia", "Energia de ativação", "Entropia", "Energia livre"], correct: 1, explanation: "A energia de ativação (Ea) é a energia mínima que os reagentes precisam possuir para que a reação possa ocorrer." },
  { id: 26, topic: "Tabela Periódica", level: "easy", question: "O elemento com símbolo Fe é:", options: ["Flúor", "Fósforo", "Ferro", "Frâncio"], correct: 2, explanation: "Fe vem do latim Ferrum, que significa ferro. É o elemento de número atômico 26." },
  { id: 27, topic: "Eletroquímica", level: "medium", question: "O processo de deposição de um metal sobre outro usando eletricidade é chamado de:", options: ["Galvanização", "Eletrodeposição (eletroplastia)", "Corrosão", "Oxidação"], correct: 1, explanation: "A eletrodeposição (ou galvanoplastia) é o processo eletrolítico de depositar um metal sobre uma superfície." },
  { id: 28, topic: "Sais", level: "medium", question: "O sal formado pela reação entre H₂SO₄ e NaOH é:", options: ["NaCl", "Na₂SO₄", "NaHSO₄", "Na₂SO₃"], correct: 1, explanation: "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O. O sulfato de sódio (Na₂SO₄) é o sal resultante." },
  { id: 29, topic: "Equilíbrio Químico", level: "medium", question: "Uma reação atinge o equilíbrio quando:", options: ["A reação para completamente", "As velocidades da reação direta e inversa se igualam", "Todos os reagentes são consumidos", "O catalisador é esgotado"], correct: 1, explanation: "O equilíbrio químico é atingido quando as velocidades da reação direta e inversa se igualam." },
  { id: 30, topic: "Bases", level: "easy", question: "A fórmula do hidróxido de cálcio é:", options: ["CaO", "Ca(OH)₂", "CaH₂", "Ca₂OH"], correct: 1, explanation: "O hidróxido de cálcio Ca(OH)₂, também conhecido como cal hidratada, é formado pelo cálcio e dois grupamentos hidroxila." },
];

const PHRASES = [
  "O conhecimento é a reação química que transforma sonhos em realidade. 🌷",
  "Cada equação resolvida é um passo mais perto do seu futuro incrível. ✨",
  "A química não é difícil, é mágica esperando para ser descoberta. 🧪",
  "Você é mais inteligente do que pensa. Continue assim, princesa! 💜",
  "O aprendizado floresce como uma tulipa: aos poucos, mas lindamente. 🌷",
  "Cada aula concluída é uma pétala do seu sucesso. Não pare agora! 🌸",
];

const PERIODIC_TABLE: PeriodicElement[] = [
  {num:1,symbol:"H",name:"Hidrogênio",mass:"1.008",cat:"nonmetal",period:1,group:1},
  {num:2,symbol:"He",name:"Hélio",mass:"4.003",cat:"noble",period:1,group:18},
  {num:3,symbol:"Li",name:"Lítio",mass:"6.941",cat:"alkali",period:2,group:1},
  {num:4,symbol:"Be",name:"Berílio",mass:"9.012",cat:"alkaline",period:2,group:2},
  {num:5,symbol:"B",name:"Boro",mass:"10.81",cat:"metalloid",period:2,group:13},
  {num:6,symbol:"C",name:"Carbono",mass:"12.01",cat:"nonmetal",period:2,group:14},
  {num:7,symbol:"N",name:"Nitrogênio",mass:"14.01",cat:"nonmetal",period:2,group:15},
  {num:8,symbol:"O",name:"Oxigênio",mass:"16.00",cat:"nonmetal",period:2,group:16},
  {num:9,symbol:"F",name:"Flúor",mass:"19.00",cat:"halogen",period:2,group:17},
  {num:10,symbol:"Ne",name:"Neônio",mass:"20.18",cat:"noble",period:2,group:18},
  {num:11,symbol:"Na",name:"Sódio",mass:"22.99",cat:"alkali",period:3,group:1},
  {num:12,symbol:"Mg",name:"Magnésio",mass:"24.31",cat:"alkaline",period:3,group:2},
  {num:13,symbol:"Al",name:"Alumínio",mass:"26.98",cat:"postTransition",period:3,group:13},
  {num:14,symbol:"Si",name:"Silício",mass:"28.09",cat:"metalloid",period:3,group:14},
  {num:15,symbol:"P",name:"Fósforo",mass:"30.97",cat:"nonmetal",period:3,group:15},
  {num:16,symbol:"S",name:"Enxofre",mass:"32.06",cat:"nonmetal",period:3,group:16},
  {num:17,symbol:"Cl",name:"Cloro",mass:"35.45",cat:"halogen",period:3,group:17},
  {num:18,symbol:"Ar",name:"Argônio",mass:"39.95",cat:"noble",period:3,group:18},
  {num:19,symbol:"K",name:"Potássio",mass:"39.10",cat:"alkali",period:4,group:1},
  {num:20,symbol:"Ca",name:"Cálcio",mass:"40.08",cat:"alkaline",period:4,group:2},
  {num:21,symbol:"Sc",name:"Escândio",mass:"44.96",cat:"transition",period:4,group:3},
  {num:22,symbol:"Ti",name:"Titânio",mass:"47.87",cat:"transition",period:4,group:4},
  {num:23,symbol:"V",name:"Vanádio",mass:"50.94",cat:"transition",period:4,group:5},
  {num:24,symbol:"Cr",name:"Cromo",mass:"52.00",cat:"transition",period:4,group:6},
  {num:25,symbol:"Mn",name:"Manganês",mass:"54.94",cat:"transition",period:4,group:7},
  {num:26,symbol:"Fe",name:"Ferro",mass:"55.85",cat:"transition",period:4,group:8},
  {num:27,symbol:"Co",name:"Cobalto",mass:"58.93",cat:"transition",period:4,group:9},
  {num:28,symbol:"Ni",name:"Níquel",mass:"58.69",cat:"transition",period:4,group:10},
  {num:29,symbol:"Cu",name:"Cobre",mass:"63.55",cat:"transition",period:4,group:11},
  {num:30,symbol:"Zn",name:"Zinco",mass:"65.38",cat:"transition",period:4,group:12},
  {num:31,symbol:"Ga",name:"Gálio",mass:"69.72",cat:"postTransition",period:4,group:13},
  {num:32,symbol:"Ge",name:"Germânio",mass:"72.63",cat:"metalloid",period:4,group:14},
  {num:33,symbol:"As",name:"Arsênio",mass:"74.92",cat:"metalloid",period:4,group:15},
  {num:34,symbol:"Se",name:"Selênio",mass:"78.96",cat:"nonmetal",period:4,group:16},
  {num:35,symbol:"Br",name:"Bromo",mass:"79.90",cat:"halogen",period:4,group:17},
  {num:36,symbol:"Kr",name:"Criptônio",mass:"83.80",cat:"noble",period:4,group:18},
  {num:37,symbol:"Rb",name:"Rubídio",mass:"85.47",cat:"alkali",period:5,group:1},
  {num:38,symbol:"Sr",name:"Estrôncio",mass:"87.62",cat:"alkaline",period:5,group:2},
  {num:39,symbol:"Y",name:"Ítrio",mass:"88.91",cat:"transition",period:5,group:3},
  {num:40,symbol:"Zr",name:"Zircônio",mass:"91.22",cat:"transition",period:5,group:4},
  {num:41,symbol:"Nb",name:"Nióbio",mass:"92.91",cat:"transition",period:5,group:5},
  {num:42,symbol:"Mo",name:"Molibdênio",mass:"95.96",cat:"transition",period:5,group:6},
  {num:43,symbol:"Tc",name:"Tecnécio",mass:"(98)",cat:"transition",period:5,group:7},
  {num:44,symbol:"Ru",name:"Rutênio",mass:"101.1",cat:"transition",period:5,group:8},
  {num:45,symbol:"Rh",name:"Ródio",mass:"102.9",cat:"transition",period:5,group:9},
  {num:46,symbol:"Pd",name:"Paládio",mass:"106.4",cat:"transition",period:5,group:10},
  {num:47,symbol:"Ag",name:"Prata",mass:"107.9",cat:"transition",period:5,group:11},
  {num:48,symbol:"Cd",name:"Cádmio",mass:"112.4",cat:"transition",period:5,group:12},
  {num:49,symbol:"In",name:"Índio",mass:"114.8",cat:"postTransition",period:5,group:13},
  {num:50,symbol:"Sn",name:"Estanho",mass:"118.7",cat:"postTransition",period:5,group:14},
  {num:51,symbol:"Sb",name:"Antimônio",mass:"121.8",cat:"metalloid",period:5,group:15},
  {num:52,symbol:"Te",name:"Telúrio",mass:"127.6",cat:"metalloid",period:5,group:16},
  {num:53,symbol:"I",name:"Iodo",mass:"126.9",cat:"halogen",period:5,group:17},
  {num:54,symbol:"Xe",name:"Xenônio",mass:"131.3",cat:"noble",period:5,group:18},
  {num:55,symbol:"Cs",name:"Césio",mass:"132.9",cat:"alkali",period:6,group:1},
  {num:56,symbol:"Ba",name:"Bário",mass:"137.3",cat:"alkaline",period:6,group:2},
  {num:57,symbol:"La",name:"Lantânio",mass:"138.9",cat:"lanthanide",period:9,group:3},
  {num:58,symbol:"Ce",name:"Cério",mass:"140.1",cat:"lanthanide",period:9,group:4},
  {num:59,symbol:"Pr",name:"Praseodímio",mass:"140.9",cat:"lanthanide",period:9,group:5},
  {num:60,symbol:"Nd",name:"Neodímio",mass:"144.2",cat:"lanthanide",period:9,group:6},
  {num:61,symbol:"Pm",name:"Promécio",mass:"(145)",cat:"lanthanide",period:9,group:7},
  {num:62,symbol:"Sm",name:"Samário",mass:"150.4",cat:"lanthanide",period:9,group:8},
  {num:63,symbol:"Eu",name:"Európio",mass:"152.0",cat:"lanthanide",period:9,group:9},
  {num:64,symbol:"Gd",name:"Gadolínio",mass:"157.3",cat:"lanthanide",period:9,group:10},
  {num:65,symbol:"Tb",name:"Térbio",mass:"158.9",cat:"lanthanide",period:9,group:11},
  {num:66,symbol:"Dy",name:"Disprósio",mass:"162.5",cat:"lanthanide",period:9,group:12},
  {num:67,symbol:"Ho",name:"Hólmio",mass:"164.9",cat:"lanthanide",period:9,group:13},
  {num:68,symbol:"Er",name:"Érbio",mass:"167.3",cat:"lanthanide",period:9,group:14},
  {num:69,symbol:"Tm",name:"Túlio",mass:"168.9",cat:"lanthanide",period:9,group:15},
  {num:70,symbol:"Yb",name:"Itérbio",mass:"173.1",cat:"lanthanide",period:9,group:16},
  {num:71,symbol:"Lu",name:"Lutécio",mass:"175.0",cat:"lanthanide",period:9,group:17},
  {num:72,symbol:"Hf",name:"Háfnio",mass:"178.5",cat:"transition",period:6,group:4},
  {num:73,symbol:"Ta",name:"Tântalo",mass:"180.9",cat:"transition",period:6,group:5},
  {num:74,symbol:"W",name:"Tungstênio",mass:"183.8",cat:"transition",period:6,group:6},
  {num:75,symbol:"Re",name:"Rênio",mass:"186.2",cat:"transition",period:6,group:7},
  {num:76,symbol:"Os",name:"Ósmio",mass:"190.2",cat:"transition",period:6,group:8},
  {num:77,symbol:"Ir",name:"Irídio",mass:"192.2",cat:"transition",period:6,group:9},
  {num:78,symbol:"Pt",name:"Platina",mass:"195.1",cat:"transition",period:6,group:10},
  {num:79,symbol:"Au",name:"Ouro",mass:"197.0",cat:"transition",period:6,group:11},
  {num:80,symbol:"Hg",name:"Mercúrio",mass:"200.6",cat:"transition",period:6,group:12},
  {num:81,symbol:"Tl",name:"Tálio",mass:"204.4",cat:"postTransition",period:6,group:13},
  {num:82,symbol:"Pb",name:"Chumbo",mass:"207.2",cat:"postTransition",period:6,group:14},
  {num:83,symbol:"Bi",name:"Bismuto",mass:"209.0",cat:"postTransition",period:6,group:15},
  {num:84,symbol:"Po",name:"Polônio",mass:"(209)",cat:"metalloid",period:6,group:16},
  {num:85,symbol:"At",name:"Ástato",mass:"(210)",cat:"halogen",period:6,group:17},
  {num:86,symbol:"Rn",name:"Radônio",mass:"(222)",cat:"noble",period:6,group:18},
  {num:87,symbol:"Fr",name:"Frâncio",mass:"(223)",cat:"alkali",period:7,group:1},
  {num:88,symbol:"Ra",name:"Rádio",mass:"(226)",cat:"alkaline",period:7,group:2},
  {num:89,symbol:"Ac",name:"Actínio",mass:"(227)",cat:"actinide",period:10,group:3},
  {num:90,symbol:"Th",name:"Tório",mass:"232.0",cat:"actinide",period:10,group:4},
  {num:91,symbol:"Pa",name:"Protactínio",mass:"231.0",cat:"actinide",period:10,group:5},
  {num:92,symbol:"U",name:"Urânio",mass:"238.0",cat:"actinide",period:10,group:6},
  {num:93,symbol:"Np",name:"Netúnio",mass:"(237)",cat:"actinide",period:10,group:7},
  {num:94,symbol:"Pu",name:"Plutônio",mass:"(244)",cat:"actinide",period:10,group:8},
  {num:95,symbol:"Am",name:"Amerício",mass:"(243)",cat:"actinide",period:10,group:9},
  {num:96,symbol:"Cm",name:"Cúrio",mass:"(247)",cat:"actinide",period:10,group:10},
  {num:97,symbol:"Bk",name:"Berquélio",mass:"(247)",cat:"actinide",period:10,group:11},
  {num:98,symbol:"Cf",name:"Califórnio",mass:"(251)",cat:"actinide",period:10,group:12},
  {num:99,symbol:"Es",name:"Einstênio",mass:"(252)",cat:"actinide",period:10,group:13},
  {num:100,symbol:"Fm",name:"Férmio",mass:"(257)",cat:"actinide",period:10,group:14},
  {num:101,symbol:"Md",name:"Mendelévio",mass:"(258)",cat:"actinide",period:10,group:15},
  {num:102,symbol:"No",name:"Nobélio",mass:"(259)",cat:"actinide",period:10,group:16},
  {num:103,symbol:"Lr",name:"Laurêncio",mass:"(266)",cat:"actinide",period:10,group:17},
  {num:104,symbol:"Rf",name:"Rutherfórdio",mass:"(267)",cat:"transition",period:7,group:4},
  {num:105,symbol:"Db",name:"Dúbnio",mass:"(268)",cat:"transition",period:7,group:5},
  {num:106,symbol:"Sg",name:"Seabórgio",mass:"(271)",cat:"transition",period:7,group:6},
  {num:107,symbol:"Bh",name:"Bóhrio",mass:"(270)",cat:"transition",period:7,group:7},
  {num:108,symbol:"Hs",name:"Hássio",mass:"(269)",cat:"transition",period:7,group:8},
  {num:109,symbol:"Mt",name:"Meitnério",mass:"(278)",cat:"transition",period:7,group:9},
  {num:110,symbol:"Ds",name:"Darmstádio",mass:"(281)",cat:"transition",period:7,group:10},
  {num:111,symbol:"Rg",name:"Roentgênio",mass:"(282)",cat:"transition",period:7,group:11},
  {num:112,symbol:"Cn",name:"Copernício",mass:"(285)",cat:"transition",period:7,group:12},
  {num:113,symbol:"Nh",name:"Nihônio",mass:"(286)",cat:"postTransition",period:7,group:13},
  {num:114,symbol:"Fl",name:"Fleróvio",mass:"(289)",cat:"postTransition",period:7,group:14},
  {num:115,symbol:"Mc",name:"Moscóvio",mass:"(290)",cat:"postTransition",period:7,group:15},
  {num:116,symbol:"Lv",name:"Livermório",mass:"(293)",cat:"postTransition",period:7,group:16},
  {num:117,symbol:"Ts",name:"Tenesso",mass:"(294)",cat:"halogen",period:7,group:17},
  {num:118,symbol:"Og",name:"Oganessônio",mass:"(294)",cat:"noble",period:7,group:18},
];

const CAT_COLORS: Record<string, { bg: string; border: string }> = {
  alkali:        { bg: "#ffcdd2", border: "#ef9a9a" },
  alkaline:      { bg: "#ffe0b2", border: "#ffcc80" },
  transition:    { bg: "#bbdefb", border: "#90caf9" },
  postTransition:{ bg: "#cfd8dc", border: "#b0bec5" },
  metalloid:     { bg: "#b2dfdb", border: "#80cbc4" },
  nonmetal:      { bg: "#fff9c4", border: "#fff176" },
  halogen:       { bg: "#c8e6c9", border: "#a5d6a7" },
  noble:         { bg: "#e1bee7", border: "#ce93d8" },
  lanthanide:    { bg: "#f8bbd0", border: "#f48fb1" },
  actinide:      { bg: "#ffccbc", border: "#ffab91" },
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGet(prefix: string, key: string, fallback: string): string {
  return localStorage.getItem(`${prefix}_${key}`) ?? fallback;
}
function lsSet(prefix: string, key: string, value: string) {
  localStorage.setItem(`${prefix}_${key}`, value);
}

// ─── Tulip SVG 3D ─────────────────────────────────────────────────────────────

function TulipSVG({ size = 40, color = "#f06292" }: { size?: number; color?: string }) {
  const uid = color.replace(/[^a-z0-9]/gi, "").slice(0, 6);
  return (
    <svg width={size} height={size} viewBox="0 0 60 82" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* main petal gradient — light top center to rich color at edges/base */}
        <radialGradient id={`pg${uid}`} cx="50%" cy="30%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="55%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </radialGradient>
        {/* side petal — darker */}
        <radialGradient id={`sp${uid}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.78" />
        </radialGradient>
        {/* inner highlight */}
        <linearGradient id={`hl${uid}`} x1="0.4" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        {/* stem gradient */}
        <linearGradient id={`stm${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4caf50" />
          <stop offset="50%" stopColor="#81c784" />
          <stop offset="100%" stopColor="#4caf50" />
        </linearGradient>
        {/* leaf gradient */}
        <linearGradient id={`lf${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#66bb6a" />
          <stop offset="100%" stopColor="#2e7d32" />
        </linearGradient>
        {/* drop shadow */}
        <filter id={`sh${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={color} floodOpacity="0.35" />
        </filter>
      </defs>

      {/* drop shadow ring at base of stem */}
      <ellipse cx="30" cy="80" rx="9" ry="3" fill={color} opacity="0.18" />

      {/* stem */}
      <path d="M30 50 Q28 62 30 80" stroke={`url(#stm${uid})`} strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* leaf */}
      <path d="M30 68 Q21 62 17 55 Q23 56 30 68Z" fill={`url(#lf${uid})`} />
      <path d="M30 68 Q21 62 17 55" stroke="#4caf50" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* left side petal */}
      <path d="M30 49 Q20 41 14 27 Q8 12 20 5 Q13 22 30 49Z" fill={`url(#sp${uid})`} />

      {/* right side petal */}
      <path d="M30 49 Q40 41 46 27 Q52 12 40 5 Q47 22 30 49Z" fill={`url(#sp${uid})`} />

      {/* center petal with shadow filter */}
      <path d="M30 49 Q18 36 16 21 Q14 6 30 3 Q46 6 44 21 Q42 36 30 49Z"
        fill={`url(#pg${uid})`} filter={`url(#sh${uid})`} />

      {/* inner highlight overlay for 3D gloss */}
      <path d="M30 49 Q21 37 20 24 Q20 11 30 8 Q36 10 37 20 Q36 36 30 49Z"
        fill={`url(#hl${uid})`} />

      {/* top shine dot */}
      <ellipse cx="26" cy="12" rx="4" ry="6" fill="white" opacity="0.22" transform="rotate(-18 26 12)" />
    </svg>
  );
}

// ─── Falling Petals ───────────────────────────────────────────────────────────

function FallingPetals() {
  const petals = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${3 + (i * 7) % 93}%`,
    delay: `${(i * 1.1) % 8}s`,
    duration: `${8 + (i * 1.3) % 6}s`,
    swayDur: `${3 + (i * 0.7) % 3}s`,
    color: ["#f48fb1", "#ce93d8", "#f8bbd0", "#e1bee7", "#ff80ab", "#ea80fc", "#f06292"][i % 7],
    scale: 0.65 + (i % 5) * 0.18,
    rot: (i * 27) % 360,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {petals.map((p) => (
        <div key={p.id} className="petal-fall" style={{
          left: p.left, top: "-5vh",
          animationDuration: `${p.duration}, ${p.swayDur}`,
          animationDelay: `${p.delay}, ${p.delay}`,
          transform: `scale(${p.scale}) rotate(${p.rot}deg)`,
        }}>
          <svg width="18" height="24" viewBox="0 0 18 24">
            <defs>
              <radialGradient id={`petal${p.id}`} cx="42%" cy="28%" r="65%">
                <stop offset="0%" stopColor="white" stopOpacity="0.75" />
                <stop offset="50%" stopColor={p.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={p.color} stopOpacity="0.7" />
              </radialGradient>
            </defs>
            {/* petal shape with rounded point */}
            <path d="M9 23 Q3 17 2 10 Q1 3 9 1 Q17 3 16 10 Q15 17 9 23Z"
              fill={`url(#petal${p.id})`} />
            {/* inner vein for depth */}
            <path d="M9 22 Q9 12 9 4" stroke="white" strokeWidth="0.7" strokeOpacity="0.35" strokeLinecap="round" fill="none" />
            {/* subtle highlight */}
            <ellipse cx="7" cy="7" rx="2.5" ry="4" fill="white" opacity="0.18" transform="rotate(-12 7 7)" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ─── Splash Screen ────────────────────────────────────────────────────────────

function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1100);
    const t2 = setTimeout(() => setStage(2), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #fce4ec 0%, #f8bbd0 20%, #f3e5f5 50%, #e1bee7 75%, #d1c4e9 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <FallingPetals />

      {/* 3D layered orbs for depth */}
      <div style={{ position: "absolute", top: "6%", left: "2%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.28) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "8%", right: "4%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(206,147,216,0.38) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", left: "30%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(233,30,140,0.12) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
      {/* grid lines for depth illusion */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(233,30,140,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(233,30,140,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      <div style={{ textAlign: "center", zIndex: 10, padding: "20px", maxWidth: 500 }}>
        {/* glowing disc behind tulip */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 24 }}>
          <div style={{
            position: "absolute", inset: -24,
            background: "radial-gradient(circle, rgba(233,30,140,0.22) 0%, transparent 65%)",
            borderRadius: "50%", filter: "blur(16px)",
          }} />
          <div className="tulip-bloom" style={{ position: "relative" }}>
            <TulipSVG size={112} color="#e91e8c" />
          </div>
        </div>

        {stage >= 1 && (
          <div className="fade-slide-up">
            <h1 style={{
              fontSize: "clamp(2rem, 6vw, 3.8rem)",
              fontWeight: 700,
              background: "linear-gradient(135deg, #ad1457 0%, #6a1b9a 60%, #4a148c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "0 0 10px",
              letterSpacing: "-0.02em",
              textShadow: "none",
              filter: "drop-shadow(0 4px 16px rgba(173,20,87,0.18))",
            }}>
              Química da Lohana
            </h1>
            <p style={{ fontSize: "1.15rem", color: "#7b1fa2", fontWeight: 700, marginBottom: 6 }}>
              🌷 Bem-vinda, Lohana!
            </p>
            <p style={{ fontSize: "0.95rem", color: "#9c4dcc", fontWeight: 500, lineHeight: 1.7, margin: "0 auto 32px" }}>
              Este espaço foi criado especialmente para acompanhar seus estudos de Química.
            </p>
          </div>
        )}

        {stage >= 2 && (
          <div className="fade-slide-up">
            <button onClick={onEnter} className="btn-primary" style={{ fontSize: "1rem", padding: "16px 42px", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <FlaskConical size={20} />
              Entrar no laboratório
            </button>
          </div>
        )}
      </div>

      {/* floating tulips at different depths */}
      <div style={{ position: "absolute", top: 28, right: 42, opacity: 0.5, filter: "drop-shadow(0 8px 16px rgba(206,147,216,0.4))" }} className="float-anim">
        <TulipSVG size={56} color="#ce93d8" />
      </div>
      <div style={{ position: "absolute", bottom: 36, left: 28, opacity: 0.42, filter: "drop-shadow(0 6px 12px rgba(244,143,177,0.35))" }} className="float-anim">
        <TulipSVG size={44} color="#f48fb1" />
      </div>
      <div style={{ position: "absolute", top: "42%", right: "5%", opacity: 0.28 }} className="float-anim">
        <TulipSVG size={30} color="#e91e8c" />
      </div>
      <div style={{ position: "absolute", top: "18%", left: "7%", opacity: 0.22 }} className="float-anim">
        <TulipSVG size={26} color="#9c4dcc" />
      </div>
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "home", label: "Início", icon: Home },
  { id: "aulas", label: "Aulas", icon: BookOpen },
  { id: "quiz", label: "Quiz", icon: FlaskConical },
  { id: "ia", label: "Tulipa IA", icon: Bot },
  { id: "anotacoes", label: "Anotações", icon: StickyNote },
  { id: "progresso", label: "Progresso", icon: BarChart3 },
  { id: "favoritos", label: "Favoritos", icon: Star },
  { id: "ferramentas", label: "Ferramentas", icon: Calculator },
  { id: "config", label: "Configurações", icon: Settings },
];

function NavBar({ view, onNav, darkMode }: { view: View; onNav: (v: View) => void; darkMode: boolean }) {
  const [open, setOpen] = useState(false);

  const navBg = darkMode
    ? "rgba(20,0,38,0.88)"
    : "rgba(253,236,246,0.82)";
  const borderCol = darkMode ? "rgba(206,147,216,0.18)" : "rgba(244,143,177,0.35)";
  const activeCol = "#e91e8c";
  const textActive = "#e91e8c";
  const textNormal = darkMode ? "#ce93d8" : "#7b1fa2";

  return (
    <>
      <nav style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 216,
        background: navBg,
        borderRight: `1px solid ${borderCol}`,
        display: "flex", flexDirection: "column",
        zIndex: 100,
        boxShadow: "4px 0 32px rgba(233,30,140,0.13), 1px 0 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
      }} className="hidden-mobile">
        <div style={{ padding: "22px 18px 18px", borderBottom: `1px solid ${borderCol}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TulipSVG size={30} color="#e91e8c" />
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: darkMode ? "#f48fb1" : "#ad1457", letterSpacing: "0.06em" }}>QUÍMICA DA</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: darkMode ? "#ce93d8" : "#6a1b9a" }}>LOHANA 🌷</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => onNav(id as View)} style={{
                width: "100%",
                display: "flex", alignItems: "center", gap: 11,
                padding: "11px 18px",
                background: active ? (darkMode ? "rgba(233,30,140,0.18)" : "rgba(233,30,140,0.09)") : "transparent",
                border: "none",
                borderLeft: `3px solid ${active ? activeCol : "transparent"}`,
                color: active ? textActive : textNormal,
                fontFamily: "Quicksand, sans-serif",
                fontWeight: active ? 700 : 600,
                fontSize: "0.87rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}>
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 18, textAlign: "center", opacity: 0.4 }}>
          <TulipSVG size={26} color="#f48fb1" />
        </div>
      </nav>

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 58,
        background: darkMode ? "rgba(26,0,37,0.96)" : "rgba(252,228,236,0.96)",
        backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${borderCol}`,
        display: "none", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", zIndex: 200,
      }} className="show-mobile">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TulipSVG size={22} color="#e91e8c" />
          <span style={{ fontWeight: 700, color: "#e91e8c", fontSize: "0.88rem" }}>Química da Lohana</span>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e91e8c" }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 190, background: "rgba(0,0,0,0.3)" }} onClick={() => setOpen(false)}>
          <div style={{
            position: "absolute", top: 58, left: 0, right: 0,
            background: darkMode ? "#1a0025" : "#fce4ec",
            padding: "10px 0",
            boxShadow: "0 10px 40px rgba(233,30,140,0.18)",
          }} onClick={e => e.stopPropagation()}>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { onNav(id as View); setOpen(false); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 22px",
                background: view === id ? "rgba(233,30,140,0.1)" : "transparent",
                border: "none",
                color: view === id ? "#e91e8c" : textNormal,
                fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: "0.93rem", cursor: "pointer", textAlign: "left",
              }}>
                <Icon size={17} /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .page-content { margin-left: 0 !important; padding-top: 70px !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .page-content { margin-left: 216px !important; }
        }
      `}</style>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Page({ children, darkMode }: { children: React.ReactNode; darkMode: boolean }) {
  return (
    <div className={`page-content fade-in ${darkMode ? "page-bg-dark" : "page-bg-light"}`} style={{
      minHeight: "calc(100vh - 52px)",
      padding: "36px 28px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* decorative orbs */}
      <div style={{
        position: "fixed", top: "12%", right: "3%", width: 320, height: 320,
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: darkMode
          ? "radial-gradient(circle, rgba(156,77,204,0.12) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(240,98,146,0.12) 0%, transparent 70%)",
        filter: "blur(2px)",
      }} />
      <div style={{
        position: "fixed", bottom: "10%", left: "8%", width: 240, height: 240,
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: darkMode
          ? "radial-gradient(circle, rgba(240,98,146,0.08) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(156,77,204,0.1) 0%, transparent 70%)",
        filter: "blur(2px)",
      }} />
      <div style={{ position: "fixed", top: 90, right: 18, opacity: 0.11, pointerEvents: "none", zIndex: 0 }} className="float-anim">
        <TulipSVG size={80} color="#e91e8c" />
      </div>
      <div style={{ position: "fixed", bottom: 80, right: 70, opacity: 0.07, pointerEvents: "none", zIndex: 0 }} className="float-anim">
        <TulipSVG size={60} color="#ce93d8" />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function Card({ children, style = {}, darkMode }: { children: React.ReactNode; style?: React.CSSProperties; darkMode?: boolean }) {
  return (
    <div className="card-hover card-3d" style={{
      background: darkMode
        ? "rgba(38,0,68,0.72)"
        : "rgba(255,255,255,0.78)",
      backdropFilter: "blur(22px) saturate(170%)",
      WebkitBackdropFilter: "blur(22px) saturate(170%)",
      border: `1px solid ${darkMode ? "rgba(206,147,216,0.22)" : "rgba(255,255,255,0.9)"}`,
      borderRadius: 22,
      padding: 24,
      boxShadow: darkMode
        ? "0 2px 4px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)"
        : "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(233,30,140,0.08), 0 24px 64px rgba(156,77,204,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ lessons, darkMode, onNav, lsPrefix }: { lessons: Lesson[]; darkMode: boolean; onNav: (v: View) => void; lsPrefix: string }) {
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  const completed = lessons.filter(l => l.completed).length;
  const qCount = parseInt(lsGet(lsPrefix, "quizCount", "0"));
  const avg = parseInt(lsGet(lsPrefix, "avgScore", "0"));
  const studySecs = parseInt(lsGet(lsPrefix, "studySecs", "0"), 10);
  const hours = formatStudyTime(studySecs);
  const weekGoal = Math.min(Math.round((completed / 25) * 100), 100);
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";

  return (
    <Page darkMode={darkMode}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <TulipSVG size={34} color="#e91e8c" />
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2rem)", fontWeight: 700, color: tc, margin: 0 }}>
            Olá, Lohana! 🌷
          </h1>
        </div>
        <div style={{
          background: darkMode
            ? "linear-gradient(135deg, rgba(233,30,140,0.14), rgba(156,77,204,0.14))"
            : "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,240,250,0.9))",
          border: "1px solid rgba(233,30,140,0.2)",
          borderRadius: 18, padding: "17px 22px",
          fontSize: "0.97rem", color: sc, fontWeight: 600, fontStyle: "italic",
          boxShadow: "0 4px 16px rgba(233,30,140,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)",
        }}>
          ✨ {phrase}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 26 }}>
        {[
          { label: "Aulas concluídas", value: `${completed}/25`, color: "#f06292", icon: BookOpen },
          { label: "Quizzes realizados", value: `${qCount}`, color: "#9c4dcc", icon: FlaskConical },
          { label: "Média de acertos", value: `${avg}%`, color: "#e91e8c", icon: Star },
          { label: "Tempo estudado", value: hours, color: "#ce93d8", icon: Timer },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} darkMode={darkMode}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `linear-gradient(135deg, ${color}28, ${color}10)`,
                boxShadow: `0 4px 12px ${color}24, inset 0 1px 0 rgba(255,255,255,0.5)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={19} color={color} />
              </div>
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: "0.78rem", color: sc, fontWeight: 600, marginTop: 5 }}>{label}</div>
          </Card>
        ))}
      </div>

      <Card darkMode={darkMode} style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 700, color: tc }}>🎯 Meta semanal — 25 módulos</span>
          <span style={{ fontWeight: 700, color: "#e91e8c" }}>{weekGoal}%</span>
        </div>
        <div style={{ height: 12, background: darkMode ? "rgba(255,255,255,0.09)" : "#fce4ec", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${weekGoal}%`, background: "linear-gradient(90deg, #f06292, #9c4dcc)", borderRadius: 8, transition: "width 1.2s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.78rem", color: sc, fontWeight: 500 }}>
          <span>{completed} concluídas</span>
          <span>{25 - completed} restantes</span>
        </div>
      </Card>

      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: tc, marginBottom: 14 }}>Acesso rápido</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: "Ver Aulas", icon: BookOpen, view: "aulas" as View, color: "#f06292" },
          { label: "Fazer Quiz", icon: FlaskConical, view: "quiz" as View, color: "#9c4dcc" },
          { label: "Tulipa IA", icon: Bot, view: "ia" as View, color: "#e91e8c" },
          { label: "Minhas Notas", icon: StickyNote, view: "anotacoes" as View, color: "#ce93d8" },
        ].map(({ label, icon: Icon, view, color }) => (
          <button key={label} onClick={() => onNav(view)} className="card-hover" style={{
            background: darkMode ? "rgba(45,0,80,0.58)" : "rgba(255,255,255,0.82)",
            border: `1px solid ${color}36`,
            borderRadius: 16, padding: 18, cursor: "pointer", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            boxShadow: `0 4px 20px ${color}16`,
            transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: `${color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={22} color={color} />
            </div>
            <span style={{ fontWeight: 700, color: tc, fontSize: "0.82rem" }}>{label}</span>
          </button>
        ))}
      </div>
    </Page>
  );
}

// ─── Aulas Page ───────────────────────────────────────────────────────────────

function AulasPage({ lessons, setLessons, darkMode, lsPrefix }: { lessons: Lesson[]; setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>; darkMode: boolean; lsPrefix: string }) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const completed = lessons.filter(l => l.completed).length;
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";
  const filtered = lessons.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));

  function update(id: number, patch: Partial<Lesson>) {
    setLessons(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }

  function toggleComplete(id: number, current: boolean) {
    update(id, { completed: !current });
  }

  return (
    <Page darkMode={darkMode}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <BookOpen size={26} color="#e91e8c" />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: tc, margin: 0 }}>Aulas de Química</h1>
      </div>
      <p style={{ color: sc, marginBottom: 22, fontWeight: 500, fontSize: "0.9rem" }}>{completed} de {lessons.length} módulos concluídos 🌷</p>

      <div style={{ position: "relative", marginBottom: 22 }}>
        <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#f06292" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar módulo..." style={{
          width: "100%", padding: "11px 11px 11px 42px", borderRadius: 50,
          border: "1px solid rgba(240,98,146,0.3)",
          background: darkMode ? "rgba(45,0,80,0.55)" : "rgba(255,255,255,0.82)",
          color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: "0.88rem",
        }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((lesson) => (
          <Card key={lesson.id} darkMode={darkMode} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "15px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 13 }}
              onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: lesson.completed ? "linear-gradient(135deg, #f06292, #9c4dcc)" : (darkMode ? "rgba(255,255,255,0.09)" : "#fce4ec"),
                display: "flex", alignItems: "center", justifyContent: "center",
                color: lesson.completed ? "white" : "#e91e8c", fontWeight: 700, fontSize: "0.82rem",
              }}>
                {lesson.completed ? <Check size={15} /> : lesson.id}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: tc, fontSize: "0.92rem" }}>{lesson.title}</div>
                <div style={{ color: sc, fontSize: "0.78rem", fontWeight: 500, marginTop: 2 }}>{lesson.desc}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); update(lesson.id, { favorited: !lesson.favorited }); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: lesson.favorited ? "#e91e8c" : "#ce93d8", flexShrink: 0, padding: 4 }}>
                <Star size={17} fill={lesson.favorited ? "#e91e8c" : "none"} />
              </button>
              <ChevronDown size={17} color={sc} style={{ transform: expandedId === lesson.id ? "rotate(180deg)" : "none", transition: "transform 0.3s", flexShrink: 0 }} />
            </div>

            {expandedId === lesson.id && (
              <div className="fade-in" style={{ padding: "0 18px 18px", borderTop: `1px solid ${darkMode ? "rgba(206,147,216,0.15)" : "rgba(244,143,177,0.18)"}` }}>
                <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* botão assistir — link vem do array LESSONS no código */}
                  {lesson.videoUrl ? (
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", alignSelf: "flex-start" }}>
                      <button className="btn-primary" style={{ padding: "11px 22px", fontSize: "0.88rem", display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Play size={16} /> Clique aqui para assistir a aula.
                      </button>
                    </a>
                  ) : (
                    <div style={{
                      padding: "11px 16px", borderRadius: 13,
                      background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(244,143,177,0.1)",
                      border: "1px dashed rgba(240,98,146,0.35)",
                      color: sc, fontSize: "0.83rem", fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      🎬 Videoaula em breve…
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9c4dcc", display: "block", marginBottom: 6 }}>📝 Observações pessoais</label>
                    <textarea value={lesson.notes} onChange={e => update(lesson.id, { notes: e.target.value })}
                      placeholder="Escreva suas anotações sobre esta aula..." rows={3}
                      style={{ width: "100%", padding: "9px 13px", borderRadius: 11, border: "1px solid rgba(156,77,204,0.28)", background: darkMode ? "rgba(45,0,80,0.4)" : "rgba(255,255,255,0.65)", color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 500, fontSize: "0.85rem", resize: "vertical" }} />
                  </div>

                  <button onClick={() => toggleComplete(lesson.id, lesson.completed)} style={{
                    padding: "9px 18px", borderRadius: 50, alignSelf: "flex-start",
                    border: lesson.completed ? "2px solid #e91e8c" : "none",
                    background: lesson.completed ? "transparent" : "linear-gradient(135deg, #f06292, #9c4dcc)",
                    color: lesson.completed ? "#e91e8c" : "white",
                    fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.3s ease",
                  }}>
                    <Check size={15} />
                    {lesson.completed ? "Desmarcar conclusão" : "Marcar como concluída"}
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Page>
  );
}

// ─── Quiz Page ────────────────────────────────────────────────────────────────

function QuizPage({ darkMode, lsPrefix }: { darkMode: boolean; lsPrefix: string }) {
  const [stage, setStage] = useState<"setup" | "playing" | "result">("setup");
  const [level, setLevel] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [questions, setQuestions] = useState<DisplayQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExpl, setShowExpl] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";
  const LEVEL_COLORS = { easy: "#4caf50", medium: "#ff9800", hard: "#f44336" };
  const LEVEL_LABELS = { easy: "🟢 Fácil", medium: "🟡 Médio", hard: "🔴 Difícil" };

  useEffect(() => {
    if (stage === "playing") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function startQuiz() {
    let pool = level === "all" ? QUIZ_QUESTIONS : QUIZ_QUESTIONS.filter(q => q.level === level);
    pool = shuffle(pool).slice(0, 10);
    const display: DisplayQuestion[] = pool.map(q => {
      const indexed = q.options.map((opt, i) => ({ opt, orig: i }));
      const shuffled = shuffle(indexed);
      const shuffledOptions = shuffled.map(x => x.opt);
      const shuffledCorrect = shuffled.findIndex(x => x.orig === q.correct);
      return { ...q, shuffledOptions, shuffledCorrect };
    });
    setQuestions(display);
    setAnswers(new Array(display.length).fill(null));
    setCurrent(0); setSelected(null); setShowExpl(false); setElapsed(0);
    setStage("playing");
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setShowExpl(true);
    const a = [...answers]; a[current] = idx; setAnswers(a);
  }

  function next() {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1); setSelected(null); setShowExpl(false);
    } else {
      const correct = answers.filter((a, i) => a === questions[i]?.shuffledCorrect).length;
      const pct = Math.round((correct / questions.length) * 100);
      const prev = parseInt(lsGet(lsPrefix, "avgScore", "0"));
      lsSet(lsPrefix, "avgScore", Math.round((prev + pct) / 2).toString());
      lsSet(lsPrefix, "quizCount", (parseInt(lsGet(lsPrefix, "quizCount", "0")) + 1).toString());
      setStage("result");
    }
  }

  function getMedal(score: number) {
    if (score >= 90) return { emoji: "🏆", label: "Mestre da Química!", color: "#ffd700" };
    if (score >= 70) return { emoji: "🥇", label: "Ouro", color: "#ffd700" };
    if (score >= 50) return { emoji: "🥈", label: "Prata", color: "#9e9e9e" };
    return { emoji: "🥉", label: "Bronze", color: "#cd7f32" };
  }

  if (stage === "setup") return (
    <Page darkMode={darkMode}>
      <div style={{ maxWidth: 580, margin: "0 auto", textAlign: "center" }}>
        <TulipSVG size={60} color="#e91e8c" />
        <h1 style={{ fontSize: "1.9rem", fontWeight: 700, color: tc, margin: "16px 0 8px" }}>Área de Quiz 🧪</h1>
        <p style={{ color: sc, fontWeight: 500, marginBottom: 32 }}>Teste seus conhecimentos em Química!</p>
        <Card darkMode={darkMode} style={{ textAlign: "left", marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, color: tc, marginBottom: 16 }}>Nível de dificuldade</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {(["all", "easy", "medium", "hard"] as const).map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{
                padding: "13px", borderRadius: 13,
                border: `2px solid ${level === l ? "#e91e8c" : "rgba(240,98,146,0.2)"}`,
                background: level === l ? "linear-gradient(135deg, rgba(233,30,140,0.13), rgba(156,77,204,0.13))" : "transparent",
                color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", transition: "all 0.2s ease",
              }}>
                {l === "all" ? "🎯 Todos os níveis" : LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
        </Card>
        <button onClick={startQuiz} className="btn-primary" style={{ width: "100%", padding: "15px", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Sparkles size={18} /> Iniciar Quiz (10 perguntas)
        </button>
      </div>
    </Page>
  );

  if (stage === "result") {
    const correct = answers.filter((a, i) => a === questions[i]?.shuffledCorrect).length;
    const score = Math.round((correct / questions.length) * 100);
    const medal = getMedal(score);
    const mins = Math.floor(elapsed / 60), secs = elapsed % 60;

    return (
      <Page darkMode={darkMode}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "4.5rem", marginBottom: 14 }}>{medal.emoji}</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: tc, marginBottom: 6 }}>Quiz Finalizado!</h1>
          <p style={{ color: medal.color, fontWeight: 700, fontSize: "1.1rem", marginBottom: 28 }}>{medal.label}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 28 }}>
            {[
              { label: "Acertos", value: `${correct}/${questions.length}`, color: "#4caf50" },
              { label: "Erros", value: `${questions.length - correct}/${questions.length}`, color: "#f44336" },
              { label: "Nota", value: `${score}%`, color: "#9c4dcc" },
              { label: "Tempo", value: `${mins}:${secs.toString().padStart(2, "0")}`, color: "#f06292" },
            ].map(({ label, value, color }) => (
              <Card key={label} darkMode={darkMode}>
                <div style={{ fontSize: "1.7rem", fontWeight: 700, color }}>{value}</div>
                <div style={{ color: sc, fontWeight: 600, fontSize: "0.82rem", marginTop: 4 }}>{label}</div>
              </Card>
            ))}
          </div>
          <div style={{ textAlign: "left", marginBottom: 28 }}>
            <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14 }}>📋 Correção comentada</h3>
            {questions.map((q, i) => {
              const ua = answers[i];
              const ok = ua === q.shuffledCorrect;
              return (
                <Card key={q.id} darkMode={darkMode} style={{ marginBottom: 10, borderLeft: `4px solid ${ok ? "#4caf50" : "#f44336"}` }}>
                  <div style={{ fontWeight: 700, color: tc, marginBottom: 5, fontSize: "0.88rem" }}>{ok ? "✅" : "❌"} {q.question}</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                    <span style={{ color: "#4caf50" }}>Correta: {q.shuffledOptions[q.shuffledCorrect]}</span>
                    {!ok && ua !== null && <span style={{ color: "#f44336" }}> | Sua resposta: {q.shuffledOptions[ua]}</span>}
                    <div style={{ color: sc, marginTop: 4 }}>💡 {q.explanation}</div>
                  </div>
                </Card>
              );
            })}
          </div>
          <button onClick={() => setStage("setup")} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <RotateCcw size={16} /> Fazer outro quiz
          </button>
        </div>
      </Page>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <Page darkMode={darkMode}>
      <div style={{ maxWidth: 660, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, color: tc }}>Pergunta {current + 1}/{questions.length}</span>
          <span style={{ fontWeight: 700, color: "#f06292", display: "flex", alignItems: "center", gap: 5 }}>
            <Timer size={15} />{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
          </span>
        </div>
        <div style={{ height: 8, background: darkMode ? "rgba(255,255,255,0.09)" : "#fce4ec", borderRadius: 4, marginBottom: 22, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #f06292, #9c4dcc)", borderRadius: 4, transition: "width 0.4s ease" }} />
        </div>
        <Card darkMode={darkMode} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <span style={{ padding: "3px 11px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, background: `${LEVEL_COLORS[q.level]}18`, color: LEVEL_COLORS[q.level] }}>
              {LEVEL_LABELS[q.level]}
            </span>
            <span style={{ fontSize: "0.76rem", color: sc, fontWeight: 600 }}>{q.topic}</span>
          </div>
          <h2 style={{ color: tc, fontWeight: 700, fontSize: "1rem", lineHeight: 1.55, margin: 0 }}>{q.question}</h2>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 22 }}>
          {q.shuffledOptions.map((opt, i) => {
            let border = "rgba(240,98,146,0.28)";
            let bgOver = "transparent";
            let color = tc;
            if (selected !== null) {
              if (i === q.shuffledCorrect) { bgOver = "rgba(76,175,80,0.14)"; border = "#4caf50"; color = "#4caf50"; }
              else if (i === selected) { bgOver = "rgba(244,67,54,0.14)"; border = "#f44336"; color = "#f44336"; }
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} style={{
                padding: "13px 17px", borderRadius: 13,
                border: `2px solid ${border}`,
                background: darkMode ? `rgba(45,0,80,0.5)` : `rgba(255,255,255,0.82)`,
                backgroundColor: bgOver || undefined,
                color, fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: "0.88rem",
                cursor: selected !== null ? "default" : "pointer", textAlign: "left", transition: "all 0.2s ease",
              }}>
                <span style={{ marginRight: 9, fontWeight: 700 }}>{String.fromCharCode(65 + i)}.</span>{opt}
              </button>
            );
          })}
        </div>
        {showExpl && (
          <div className="fade-in" style={{ padding: "13px 17px", borderRadius: 13, background: "linear-gradient(135deg, rgba(156,77,204,0.1), rgba(233,30,140,0.1))", border: "1px solid rgba(156,77,204,0.28)", marginBottom: 18 }}>
            <div style={{ fontWeight: 700, color: "#9c4dcc", marginBottom: 4, fontSize: "0.85rem" }}>💡 Explicação</div>
            <div style={{ color: sc, fontWeight: 500, fontSize: "0.85rem", lineHeight: 1.55 }}>{q.explanation}</div>
          </div>
        )}
        {selected !== null && (
          <button onClick={next} className="btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {current < questions.length - 1 ? "Próxima pergunta" : "Ver resultado"} <ChevronRight size={17} />
          </button>
        )}
      </div>
    </Page>
  );
}

// ─── Tulipa IA ────────────────────────────────────────────────────────────────

const IA_SUGGESTIONS_ONLINE = [
  "Bate papo comigo 💜",
  "Explique ligações químicas",
  "Crie 5 exercícios de estequiometria",
  "Me conte uma curiosidade legal",
  "Tabela periódica — resumo",
  "Termoquímica com exemplos",
  "Equilíbrio químico",
  "Me ajuda com matemática",
];

const IA_SUGGESTIONS_OFFLINE = [
  "Crie 5 exercícios de estequiometria",
  "Calcule: 2 mols de H₂O em gramas",
  "Exercícios sobre ácidos e bases",
  "Calcule a molaridade: 4g NaOH em 500mL",
  "Exercícios de termoquímica",
  "Balanceie: H₂ + O₂ → H₂O",
  "Monte flashcards de tabela periódica",
  "Calcule: massa molar do CO₂",
];

function getOfflineResponse(msg: string): string {
  const m = msg.toLowerCase();

  // ── cálculo direto ──
  const massaMolarMatch = m.match(/massa molar d[eo]\s+([a-z0-9₂₃₄]+)/i) || m.match(/massa molar[:\s]+([a-z0-9₂₃₄]+)/i);
  if (massaMolarMatch || m.includes("massa molar")) {
    const formulas: Record<string, number> = {
      h2: 2.016, h2o: 18.015, co2: 44.01, nacl: 58.44, naoh: 40.0,
      hcl: 36.46, h2so4: 98.08, nh3: 17.03, ch4: 16.04, caso4: 136.14,
      caco3: 100.09, al2o3: 101.96, fe2o3: 159.69, c6h12o6: 180.16,
    };
    const normalized = (massaMolarMatch?.[1] ?? "").toLowerCase()
      .replace(/₂/g,"2").replace(/₃/g,"3").replace(/₄/g,"4");
    if (normalized && formulas[normalized]) {
      return `⚗️ **Massa molar de ${massaMolarMatch?.[1]}:**\n\nM = ${formulas[normalized]} g/mol\n\n**Como calcular:**\nSome as massas atômicas de cada elemento (da tabela periódica), multiplicando pela quantidade de átomos de cada um.\n\n💡 Precisa de outra fórmula? É só pedir!`;
    }
    return `⚗️ **Como calcular massa molar:**\n\n1. Identifique os elementos da fórmula\n2. Multiplique a massa atômica pela quantidade de átomos\n3. Some tudo\n\n**Exemplos:**\n• H₂O → 2(1) + 16 = 18 g/mol\n• NaCl → 23 + 35,5 = 58,5 g/mol\n• CO₂ → 12 + 2(16) = 44 g/mol\n\n💡 Me diga a fórmula específica para eu calcular!`;
  }

  const molaridadeMatch = m.match(/molaridade[:\s]+(\d+[\.,]?\d*)\s*g?\s+([a-z]+)\s+em\s+(\d+)\s*ml/i);
  if (molaridadeMatch || m.includes("molaridade") || m.includes("concentração molar")) {
    if (molaridadeMatch) {
      const massa = parseFloat(molaridadeMatch[1].replace(",", "."));
      const vol_ml = parseFloat(molaridadeMatch[3]);
      const massas: Record<string, number> = { naoh: 40, nacl: 58.44, hcl: 36.46, h2so4: 98.08 };
      const subst = molaridadeMatch[2].toLowerCase();
      const mm = massas[subst];
      if (mm) {
        const mols = massa / mm;
        const vol_l = vol_ml / 1000;
        const M = mols / vol_l;
        return `🧮 **Cálculo de Molaridade:**\n\nDados: ${massa}g de ${molaridadeMatch[2].toUpperCase()} em ${vol_ml}mL\n\n**Passo 1** — Mols de soluto:\nn = m/M = ${massa}/${mm} = ${mols.toFixed(4)} mol\n\n**Passo 2** — Volume em litros:\nV = ${vol_ml}/1000 = ${vol_l} L\n\n**Passo 3** — Molaridade:\nC = n/V = ${mols.toFixed(4)}/${vol_l} = **${M.toFixed(2)} mol/L**\n\n✨ Molaridade = ${M.toFixed(2)} M`;
      }
    }
    return `🧮 **Molaridade (C) — Fórmula:**\n\nC = n / V\n\nOnde:\n• n = número de mols de soluto (mol)\n• V = volume da solução em **litros**\n\n**Exemplo:**\n4g de NaOH (MM = 40 g/mol) em 500 mL\n→ n = 4/40 = 0,1 mol\n→ V = 0,5 L\n→ C = 0,1/0,5 = **0,2 mol/L**\n\n💡 Me diga a massa, a substância e o volume para eu calcular!`;
  }

  const molsMatch = m.match(/(\d+[\.,]?\d*)\s*mols?\s+de\s+([a-záéíóúâêôãõç₂₃₄\w]+)\s+em\s+gramas/i);
  if (molsMatch) {
    const mols = parseFloat(molsMatch[1].replace(",", "."));
    const subst = molsMatch[2];
    const massas: Record<string, number> = { "h2o": 18.015, "co2": 44.01, "nacl": 58.44, "naoh": 40.0, "hcl": 36.46 };
    const key = subst.toLowerCase().replace(/₂/g,"2").replace(/₃/g,"3");
    if (massas[key]) {
      const massa = mols * massas[key];
      return `⚗️ **Cálculo de Massa:**\n\nDado: ${mols} mol(s) de ${subst.toUpperCase()}\nMassa molar de ${subst.toUpperCase()} = ${massas[key]} g/mol\n\n**Fórmula:** m = n × M\nm = ${mols} × ${massas[key]} = **${massa.toFixed(3)} g**\n\n✅ Massa = ${massa.toFixed(3)} gramas`;
    }
  }

  // ── balanceamento ──
  if (m.includes("balancei") || m.includes("balancear") || (m.includes("→") || m.includes("->")) && !m.includes("exercício")) {
    if (m.includes("h₂") || m.includes("h2") || m.includes("o₂") || m.includes("o2")) {
      return `⚖️ **Balanceamento: H₂ + O₂ → H₂O**\n\n**Passo 1** — Equação desbalanceada:\nH₂ + O₂ → H₂O\n(H: 2=2 ✅ | O: 2≠1 ❌)\n\n**Passo 2** — Balancear O colocando coef. 2 na água:\nH₂ + O₂ → 2H₂O\n(H: 2≠4 ❌ | O: 2=2 ✅)\n\n**Passo 3** — Balancear H colocando coef. 2 no H₂:\n**2H₂ + O₂ → 2H₂O** ✅\n(H: 4=4 ✅ | O: 2=2 ✅)\n\n🎯 Coeficientes: 2 · 1 · 2`;
    }
    return `⚖️ **Como Balancear Equações Químicas:**\n\n**Método da tentativa e erro:**\n1. Conte os átomos de cada lado\n2. Ajuste coeficientes (nunca os índices!)\n3. Comece pelo elemento que aparece em menos substâncias\n4. Deixe H e O por último\n\n**Exemplo:** 2H₂ + O₂ → 2H₂O\n\n💡 Me manda a equação específica que eu resolvo passo a passo!`;
  }

  // ── flashcards ──
  if (m.includes("flashcard") || m.includes("flash")) {
    if (m.includes("tabela") || m.includes("periódica") || m.includes("elemento")) {
      return `🃏 **Flashcards — Tabela Periódica:**\n\n❓ Símbolo do Ouro?\n✅ Au (Aurum, latim)\n\n❓ Número atômico do Carbono?\n✅ Z = 6 (6 prótons)\n\n❓ Qual elemento é líquido à temperatura ambiente?\n✅ Mercúrio (Hg) e Bromo (Br₂)\n\n❓ Grupo dos gases nobres?\n✅ Grupo 18 — He, Ne, Ar, Kr, Xe, Rn\n\n❓ Metal mais abundante na crosta terrestre?\n✅ Alumínio (Al)\n\n❓ Não-metal mais eletronegativo?\n✅ Flúor (F) — eletronegatividade 4,0\n\n🌷 Quer mais flashcards de outro tema?`;
    }
    return `🃏 **Flashcards — Ácidos e Bases:**\n\n❓ Ácido segundo Arrhenius?\n✅ Libera H⁺ em água.\n\n❓ pH neutro a 25°C?\n✅ pH = 7 (onde [H⁺] = [OH⁻] = 10⁻⁷)\n\n❓ Cite 3 bases fortes.\n✅ NaOH, KOH, Ca(OH)₂\n\n❓ O que é neutralização?\n✅ Ácido + Base → Sal + H₂O\n\n❓ pH de um ácido forte 0,1 mol/L?\n✅ pH = 1 (pois -log(0,1) = 1)\n\n🌷 Quer flashcards de outro assunto?`;
  }

  // ── exercícios por tema ──
  const EXERCICIOS: Record<string, string> = {
    estequiometria: `🧪 **5 Exercícios de Estequiometria:**\n\n1️⃣ Quantos gramas de NaCl são formados pela reação de 23g de Na com Cl₂ em excesso? (MM NaCl = 58,5)\n\n2️⃣ Quantos mols de H₂O são produzidos por 4 mols de H₂ reagindo com O₂ em excesso?\n\n3️⃣ Qual o volume (CNTP) de CO₂ produzido pela queima de 10g de CaCO₃?\n\n4️⃣ 56g de Fe reagem com HCl. Quantos mols de FeCl₂ se formam? (MM Fe = 56)\n\n5️⃣ Calcule a massa de Al₂O₃ (MM = 102 g/mol) produzida por 54g de Al (MM = 27)\n\n✅ Quer a resolução de algum deles?`,
    "ácidos": `🧪 **5 Exercícios sobre Ácidos e Bases:**\n\n1️⃣ Qual o pH de uma solução de HCl 0,01 mol/L? (ácido forte)\n\n2️⃣ Classifique cada ácido: HF, H₂SO₄, HNO₃, H₃PO₄ — força e número de hidrogênios.\n\n3️⃣ Calcule [H⁺] de uma solução com pH = 3.\n\n4️⃣ Quais produtos são formados na neutralização de HCl com NaOH?\n\n5️⃣ Um ácido de fórmula HₙA com n = 2 é chamado de ____? Cite um exemplo.\n\n✅ Quer a resolução?`,
    "termoquímica": `🌡️ **5 Exercícios de Termoquímica:**\n\n1️⃣ Classifique: combustão de gás (libera 890 kJ/mol). Exo ou endotérmica?\n\n2️⃣ Usando a Lei de Hess, calcule ΔH de: C + O₂ → CO₂, dados ΔH₁ e ΔH₂.\n\n3️⃣ 50g de água absorvem 2090 J. Qual a variação de temperatura? (c = 4,18 J/g°C)\n\n4️⃣ O que acontece com ΔG se ΔH < 0 e ΔS > 0?\n\n5️⃣ Cite 3 exemplos do cotidiano de reações exotérmicas.\n\n✅ Quer resolução detalhada?`,
    "equilíbrio": `⚖️ **5 Exercícios de Equilíbrio Químico:**\n\n1️⃣ Escreva a expressão de Kc para: N₂ + 3H₂ ⇌ 2NH₃\n\n2️⃣ Se Kc = 0,0003, o equilíbrio favorece reagentes ou produtos?\n\n3️⃣ O que acontece ao equilíbrio N₂+3H₂⇌2NH₃ se aumentar pressão?\n\n4️⃣ Calcule Kc se [NH₃]=0,2M, [N₂]=0,1M, [H₂]=0,3M\n\n5️⃣ Como um catalisador afeta o equilíbrio? E a constante Kc?\n\n✅ Quer resolução?`,
  };

  for (const [tema, exerc] of Object.entries(EXERCICIOS)) {
    if (m.includes(tema)) return exerc;
  }

  if (m.includes("exercício") || m.includes("exercicios") || m.includes("criar") || m.includes("crie")) {
    return EXERCICIOS["estequiometria"];
  }

  // ── conceitos gerais ──
  if (m.includes("ligação") || m.includes("ligações")) {
    return "🌷 **Ligações Químicas — Resumo:**\n\n**1. Iônica** (metal + não-metal, Δeletroneg. > 1,7)\n→ Transferência de elétrons | Ex: NaCl, KBr\n→ Ponto de fusão alto, conduz eletricidade quando dissolvido\n\n**2. Covalente** (não-metal + não-metal)\n→ Compartilhamento de elétrons | Ex: H₂O, CO₂, CH₄\n→ Simples (σ), dupla (σ+π), tripla (σ+2π)\n\n**3. Metálica** (metal + metal)\n→ \"Mar de elétrons\" | Ex: Fe, Cu, Al\n→ Boa condutividade elétrica e térmica\n\n💡 Dica de prova: ΔEN > 1,7 → iônica | 0,4~1,7 → covalente polar | < 0,4 → apolar";
  }
  if (m.includes("mol") || m.includes("avogadro")) {
    return "🔬 **O Mol e o Número de Avogadro:**\n\nNₐ = 6,022 × 10²³ partículas/mol\n\n**Fórmulas essenciais:**\n• n = m / M (mols = massa / massa molar)\n• n = N / Nₐ (mols = partículas / Avogadro)\n• n = V / 22,4 (mols de gás a CNTP)\n\n**Exemplo:**\n18g de H₂O → n = 18/18 = 1 mol → 6,022×10²³ moléculas\n\n💡 1 mol de grãos de areia cobriria a Terra com 600m de espessura!";
  }
  if (m.includes("tabela") || m.includes("periódica")) {
    return "📊 **Tabela Periódica — Resumo:**\n\n🔵 **Períodos** (linhas horizontais): 7 períodos = número de camadas eletrônicas\n🟣 **Grupos** (colunas): 18 grupos, propriedades similares\n\n**Famílias importantes:**\n• Grupo 1 → Metais Alcalinos (Li, Na, K…) — muito reativos\n• Grupo 2 → Alcalino-terrosos (Mg, Ca…)\n• Grupo 17 → Halogênios (F, Cl, Br…) — formam sais\n• Grupo 18 → Gases Nobres (He, Ne, Ar…) — inertes\n\n**Tendências periódicas:**\n↗ Eletronegatividade → direita e cima\n↙ Raio atômico → esquerda e baixo\n↗ Energia de ionização → direita e cima";
  }

  return `🌷 Olá, Lohana! No momento estou no **modo exercícios e cálculos** (IA offline).\n\nPosso te ajudar com:\n\n📝 **Exercícios** — estequiometria, ácidos/bases, termoquímica, equilíbrio, ligações…\n🧮 **Cálculos** — molaridade, massa molar, mols, conversões…\n⚖️ **Balanceamento** de equações químicas\n🃏 **Flashcards** para revisar\n📊 **Resumos** de qualquer tópico de química\n\nDigite o que precisa e eu resolvo! 💜`;
}

function TulipaIA({ darkMode, lsPrefix }: { darkMode: boolean; lsPrefix: string }) {
  const [aiEnabled, setAiEnabled] = useState(() => {
    const saved = localStorage.getItem("tulipa_ai_enabled");
    return saved !== null ? saved === "true" : true;
  });

  const useOnlineAI = aiEnabled;
  const welcomeText = useOnlineAI
    ? "🌷 Oi, Lohana! Sou a Tulipa IA — sua assistente pessoal!\n\nPosso conversar sobre qualquer assunto, te ajudar com:\n• Química e outras matérias 🧪\n• Dúvidas do dia a dia\n• Redação, história, matemática...\n• Ou simplesmente bater papo! 💬\n\nO que você quer fazer hoje? 💜"
    : "🌷 Olá, Lohana! Estou no modo **exercícios e cálculos**.\n\nPosso criar exercícios, resolver cálculos de química, fazer flashcards, balancear equações e fazer resumos de qualquer tema de química.\n\nO que precisa? 📚💜";

  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 1, role: "ai", text: welcomeText,
    time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  function toggleAI() {
    const next = !aiEnabled;
    setAiEnabled(next);
    localStorage.setItem("tulipa_ai_enabled", String(next));
    const newWelcome = next
      ? "🌷 IA ativada! Agora posso conversar sobre qualquer assunto. O que quer bater papo ou perguntar? 💜"
      : "🌷 Modo exercícios ativado! Pode pedir exercícios, cálculos, flashcards e resumos de química. 📚";
    setMessages([{
      id: Date.now(), role: "ai", text: newWelcome,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }]);
  }

  async function sendWithOpenAI(msg: string): Promise<string> {
  const resp = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: msg,
    }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data?.error || "Erro ao consultar a IA");
  }
  return data.answer ?? getOfflineResponse(msg);
}
  function send(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { id: Date.now(), role: "user", text: msg, time: now }]);
    setTyping(true);

    if (useOnlineAI) {
      sendWithOpenAI(msg)
        .then(reply => {
          setMessages(prev => [...prev, { id: Date.now() + 1, role: "ai", text: reply, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]);
          setTyping(false);
        })
        .catch((err: unknown) => {
          const errText = err instanceof Error ? err.message : String(err);
          // fallback: show error then reply with offline
          setMessages(prev => [...prev, {
            id: Date.now() + 1, role: "ai",
            text: `⚠️ Falha na IA online: ${errText}\n\nUsando modo local — posso criar exercícios e fazer cálculos de química! 🌷`,
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          }]);
          setTyping(false);
        });
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: "ai", text: getOfflineResponse(msg), time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]);
        setTyping(false);
      }, 600 + Math.random() * 500);
    }
  }

  const suggestions = useOnlineAI ? IA_SUGGESTIONS_ONLINE : IA_SUGGESTIONS_OFFLINE;

  return (
    <Page darkMode={darkMode}>
      <div style={{ maxWidth: 720, margin: "0 auto", height: "calc(100vh - 110px)", display: "flex", flexDirection: "column" }}>

        {/* ── header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 54, height: 54, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #f06292, #9c4dcc)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(240,98,146,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}>
            <TulipSVG size={34} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontWeight: 700, color: tc, fontSize: "1.35rem" }}>Tulipa IA 🌷</h1>
            <div style={{ fontSize: "0.77rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 5,
              color: useOnlineAI ? "#4caf50" : "#ff9800" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: useOnlineAI ? "#4caf50" : "#ff9800" }} />
              {useOnlineAI ? "IA online — GPT-4o mini" : "Modo exercícios & cálculos"}
            </div>
          </div>

          {/* ── AI toggle button ── */}
          <button onClick={toggleAI} style={{
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            padding: "9px 16px", borderRadius: 50,
            background: aiEnabled
              ? (darkMode ? "rgba(76,175,80,0.2)" : "rgba(76,175,80,0.12)")
              : (darkMode ? "rgba(255,152,0,0.2)" : "rgba(255,152,0,0.1)"),
            border: `2px solid ${aiEnabled ? "#4caf50" : "#ff9800"}`,
            color: aiEnabled ? "#4caf50" : "#ff9800",
            fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.8rem",
            cursor: "pointer", transition: "all 0.25s ease",
            boxShadow: aiEnabled
              ? "0 2px 12px rgba(76,175,80,0.2)"
              : "0 2px 12px rgba(255,152,0,0.2)",
          }}>
            <div style={{
              width: 28, height: 16, borderRadius: 8, position: "relative",
              background: aiEnabled ? "#4caf50" : "rgba(150,150,150,0.4)",
              transition: "background 0.25s ease",
            }}>
              <div style={{
                position: "absolute", top: 2,
                left: aiEnabled ? 14 : 2,
                width: 12, height: 12, borderRadius: "50%",
                background: "white",
                transition: "left 0.25s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </div>
            {aiEnabled ? "IA ligada" : "IA desligada"}
          </button>
        </div>

        {/* ── mode banner ── */}
        {!useOnlineAI && (
          <div className="fade-in" style={{
            padding: "10px 16px", borderRadius: 14, marginBottom: 12,
            background: darkMode ? "rgba(255,152,0,0.12)" : "rgba(255,248,225,0.95)",
            border: "1px solid rgba(255,152,0,0.35)",
            fontSize: "0.8rem", color: "#e65100", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 8px rgba(255,152,0,0.08)",
          }}>
            <span style={{ fontSize: "1.1rem" }}>📚</span>
            IA desativada. Ative o botão acima para conversar com a Tulipa IA.
          </div>
        )}

        {/* ── suggestions ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 6, scrollbarWidth: "none" }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              flexShrink: 0, padding: "7px 13px", borderRadius: 20,
              border: "1px solid rgba(240,98,146,0.3)",
              background: darkMode ? "rgba(45,0,80,0.55)" : "rgba(255,255,255,0.82)",
              color: sc, fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: "0.76rem",
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(240,98,146,0.06)",
            }}>
              {s}
            </button>
          ))}
        </div>

        {/* ── messages ── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 10 }}>
              {msg.role === "ai" && (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #f06292, #9c4dcc)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  boxShadow: "0 3px 10px rgba(240,98,146,0.3)",
                }}>
                  <TulipSVG size={22} color="white" />
                </div>
              )}
              <div style={{ maxWidth: "74%" }}>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #f06292, #9c4dcc)"
                    : (darkMode ? "rgba(45,0,80,0.78)" : "rgba(255,255,255,0.95)"),
                  border: msg.role === "ai" ? `1px solid ${darkMode ? "rgba(206,147,216,0.2)" : "rgba(240,98,146,0.15)"}` : "none",
                  color: msg.role === "user" ? "white" : tc,
                  fontSize: "0.86rem", fontWeight: 500, lineHeight: 1.64, whiteSpace: "pre-wrap",
                  boxShadow: msg.role === "user"
                    ? "0 4px 16px rgba(240,98,146,0.3)"
                    : "0 2px 12px rgba(0,0,0,0.06)",
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: "0.69rem", color: sc, marginTop: 3, textAlign: msg.role === "user" ? "right" : "left", fontWeight: 500 }}>{msg.time}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #f06292, #9c4dcc)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(240,98,146,0.3)" }}>
                <TulipSVG size={22} color="white" />
              </div>
              <div style={{ padding: "12px 18px", borderRadius: "18px 18px 18px 4px", background: darkMode ? "rgba(45,0,80,0.78)" : "rgba(255,255,255,0.95)", border: "1px solid rgba(240,98,146,0.15)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#f06292", animation: `pulse-soft 1s ease-in-out ${i * 0.22}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── input ── */}
        <div style={{
          display: "flex", gap: 10, marginTop: 14, padding: "11px 14px",
          background: darkMode ? "rgba(38,0,68,0.75)" : "rgba(255,255,255,0.9)",
          borderRadius: 22, border: `1px solid ${darkMode ? "rgba(206,147,216,0.25)" : "rgba(240,98,146,0.28)"}`,
          backdropFilter: "blur(16px)",
          boxShadow: "0 4px 20px rgba(233,30,140,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={useOnlineAI ? "Pergunte qualquer coisa ou só converse... 🌷" : "Peça exercícios, cálculos ou um resumo de química..."}
            style={{ flex: 1, background: "transparent", border: "none", color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: "0.88rem", padding: "2px 6px" }} />
          <button onClick={() => send()} style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "linear-gradient(135deg, #f06292, #9c4dcc)", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 3px 12px rgba(240,98,146,0.4)",
            transition: "transform 0.2s ease",
          }}>
            <Send size={17} color="white" />
          </button>
        </div>
      </div>
    </Page>
  );
}

// ─── Anotações ────────────────────────────────────────────────────────────────

const NOTE_COLORS = ["#fce4ec", "#f3e5f5", "#e8eaf6", "#e0f7fa", "#fff9c4", "#fbe9e7"];

function AnotacoesPage({ darkMode, notes, setNotes }: { darkMode: boolean; notes: Note[]; setNotes: React.Dispatch<React.SetStateAction<Note[]>> }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState(NOTE_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";

  function createNote() {
    if (!newTitle.trim()) return;
    setNotes(prev => [...prev, { id: Date.now(), title: newTitle, content: newContent, createdAt: new Date().toLocaleDateString("pt-BR"), color: newColor, favorited: false }]);
    setNewTitle(""); setNewContent(""); setNewColor(NOTE_COLORS[0]); setCreating(false);
  }

  function update(id: number, patch: Partial<Note>) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
  }

  return (
    <Page darkMode={darkMode}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <StickyNote size={26} color="#e91e8c" />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: tc, margin: 0 }}>Minhas Anotações</h1>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <Plus size={15} /> Nova nota
        </button>
      </div>

      {creating && (
        <Card darkMode={darkMode} style={{ marginBottom: 22, borderColor: "rgba(233,30,140,0.35)" }}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14 }}>📝 Nova anotação</h3>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título da anotação..."
            style={{ width: "100%", padding: "9px 13px", borderRadius: 11, marginBottom: 10, border: "1px solid rgba(240,98,146,0.28)", background: darkMode ? "rgba(45,0,80,0.4)" : "rgba(255,255,255,0.65)", color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.92rem" }} />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Escreva sua anotação..." rows={3}
            style={{ width: "100%", padding: "9px 13px", borderRadius: 11, marginBottom: 10, border: "1px solid rgba(240,98,146,0.28)", background: darkMode ? "rgba(45,0,80,0.4)" : "rgba(255,255,255,0.65)", color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 500, fontSize: "0.87rem", resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {NOTE_COLORS.map(c => (
              <button key={c} onClick={() => setNewColor(c)} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: newColor === c ? "3px solid #e91e8c" : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={createNote} className="btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Save size={15} /> Salvar
            </button>
            <button onClick={() => setCreating(false)} style={{ padding: "9px 18px", borderRadius: 50, border: "2px solid rgba(240,98,146,0.28)", background: "transparent", color: sc, fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
        {notes.map(note => (
          <div key={note.id} className="card-hover" style={{
            background: darkMode ? "rgba(45,0,80,0.6)" : note.color,
            borderRadius: 18, padding: 18,
            border: `1px solid ${darkMode ? "rgba(206,147,216,0.18)" : "rgba(244,143,177,0.28)"}`,
            boxShadow: "0 4px 20px rgba(233,30,140,0.07)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              {editingId === note.id
                ? <input value={note.title} onChange={e => update(note.id, { title: e.target.value })} style={{ fontWeight: 700, color: tc, fontSize: "0.92rem", background: "transparent", border: "none", width: "100%", fontFamily: "Quicksand, sans-serif" }} />
                : <h3 style={{ fontWeight: 700, color: tc, margin: 0, fontSize: "0.92rem" }}>{note.title}</h3>}
              <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 8 }}>
                <button onClick={() => update(note.id, { favorited: !note.favorited })} style={{ background: "none", border: "none", cursor: "pointer", color: note.favorited ? "#e91e8c" : "#ce93d8", padding: 2 }}>
                  <Star size={15} fill={note.favorited ? "#e91e8c" : "none"} />
                </button>
                <button onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#f44336", padding: 2 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {editingId === note.id
              ? <textarea value={note.content} onChange={e => update(note.id, { content: e.target.value })} rows={4} style={{ width: "100%", background: "transparent", border: "none", color: sc, fontFamily: "Quicksand, sans-serif", fontWeight: 500, fontSize: "0.82rem", resize: "none" }} />
              : <p style={{ color: sc, fontSize: "0.82rem", fontWeight: 500, lineHeight: 1.6, margin: "0 0 12px" }}>{note.content}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: sc, fontWeight: 600 }}>{note.createdAt}</span>
              <button onClick={() => setEditingId(editingId === note.id ? null : note.id)} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(240,98,146,0.28)", background: "transparent", color: "#e91e8c", fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer" }}>
                {editingId === note.id ? "✓ Salvar" : "✏️ Editar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

// ─── Progresso ────────────────────────────────────────────────────────────────

function ProgressoPage({ lessons, darkMode, lsPrefix }: { lessons: Lesson[]; darkMode: boolean; lsPrefix: string }) {
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";
  const completed = lessons.filter(l => l.completed).length;
  const pct = Math.round((completed / 25) * 100);

  const weekData = [
    { day: "Seg", aulas: 2, quiz: 1 }, { day: "Ter", aulas: 3, quiz: 2 },
    { day: "Qua", aulas: 1, quiz: 3 }, { day: "Qui", aulas: 4, quiz: 1 },
    { day: "Sex", aulas: 2, quiz: 2 }, { day: "Sáb", aulas: 5, quiz: 4 },
    { day: "Dom", aulas: completed, quiz: parseInt(lsGet(lsPrefix, "quizCount", "0")) },
  ];
  const evolutionData = [
    { week: "Sem 1", score: 45 }, { week: "Sem 2", score: 58 },
    { week: "Sem 3", score: 67 }, { week: "Atual", score: parseInt(lsGet(lsPrefix, "avgScore", "72")) },
  ];
  const radialData = [{ name: "Progresso", value: pct, fill: "#f06292" }];

  return (
    <Page darkMode={darkMode}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
        <BarChart3 size={26} color="#e91e8c" />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: tc, margin: 0 }}>Meu Progresso 📊</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Aulas concluídas", value: `${completed}/25`, color: "#f06292" },
          { label: "Progresso geral", value: `${pct}%`, color: "#9c4dcc" },
          { label: "Quizzes realizados", value: lsGet(lsPrefix, "quizCount", "0"), color: "#e91e8c" },
          { label: "Média nos quizzes", value: `${lsGet(lsPrefix, "avgScore", "0")}%`, color: "#ce93d8" },
        ].map(({ label, value, color }) => (
          <Card key={label} darkMode={darkMode}>
            <div style={{ fontSize: "1.9rem", fontWeight: 700, color }}>{value}</div>
            <div style={{ color: sc, fontWeight: 600, fontSize: "0.82rem", marginTop: 5 }}>{label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 18 }}>
        <Card darkMode={darkMode}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14, fontSize: "0.95rem" }}>📅 Atividade semanal</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(206,147,216,0.12)" : "rgba(240,98,146,0.12)"} />
              <XAxis dataKey="day" tick={{ fill: sc, fontSize: 11, fontFamily: "Quicksand" }} />
              <YAxis tick={{ fill: sc, fontSize: 11, fontFamily: "Quicksand" }} />
              <Tooltip contentStyle={{ background: darkMode ? "#2d0050" : "#fff0f8", border: "1px solid rgba(240,98,146,0.28)", borderRadius: 10, fontFamily: "Quicksand" }} />
              <Bar dataKey="aulas" fill="#f06292" radius={[4, 4, 0, 0]} name="Aulas" />
              <Bar dataKey="quiz" fill="#9c4dcc" radius={[4, 4, 0, 0]} name="Quizzes" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card darkMode={darkMode}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14, fontSize: "0.95rem" }}>📈 Evolução do desempenho</h3>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f06292" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#9c4dcc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(206,147,216,0.12)" : "rgba(240,98,146,0.12)"} />
              <XAxis dataKey="week" tick={{ fill: sc, fontSize: 11, fontFamily: "Quicksand" }} />
              <YAxis domain={[0, 100]} tick={{ fill: sc, fontSize: 11, fontFamily: "Quicksand" }} />
              <Tooltip contentStyle={{ background: darkMode ? "#2d0050" : "#fff0f8", border: "1px solid rgba(240,98,146,0.28)", borderRadius: 10, fontFamily: "Quicksand" }} />
              <Area type="monotone" dataKey="score" stroke="#f06292" fill="url(#scoreGrad)" strokeWidth={2} name="Média %" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card darkMode={darkMode} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14, fontSize: "0.95rem" }}>🎯 Progresso do curso</h3>
          <div style={{ position: "relative", width: 150, height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: darkMode ? "rgba(255,255,255,0.05)" : "#fce4ec" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontSize: "1.9rem", fontWeight: 700, color: "#f06292" }}>{pct}%</span>
              <span style={{ fontSize: "0.72rem", color: sc, fontWeight: 600 }}>concluído</span>
            </div>
          </div>
          <div style={{ marginTop: 10, color: sc, fontWeight: 600, fontSize: "0.82rem", textAlign: "center" }}>{completed} de 25 módulos</div>
        </Card>

        <Card darkMode={darkMode}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14, fontSize: "0.95rem" }}>🏆 Conquistas</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {[
              { label: "Primeira aula concluída", earned: completed >= 1, emoji: "🌱" },
              { label: "5 aulas concluídas", earned: completed >= 5, emoji: "🌸" },
              { label: "10 aulas concluídas", earned: completed >= 10, emoji: "🌷" },
              { label: "Curso completo!", earned: completed >= 25, emoji: "🏆" },
              { label: "Primeiro quiz feito", earned: parseInt(lsGet(lsPrefix, "quizCount", "0")) >= 1, emoji: "🧪" },
              { label: "Nota acima de 70%", earned: parseInt(lsGet(lsPrefix, "avgScore", "0")) >= 70, emoji: "⭐" },
            ].map(({ label, earned, emoji }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 11, opacity: earned ? 1 : 0.38 }}>
                <span style={{ fontSize: "1.3rem" }}>{emoji}</span>
                <span style={{ color: tc, fontWeight: 600, fontSize: "0.82rem", flex: 1 }}>{label}</span>
                {earned && <span style={{ color: "#4caf50", fontWeight: 700, fontSize: "0.76rem" }}>✓</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

// ─── Favoritos ────────────────────────────────────────────────────────────────

function FavoritosPage({ lessons, darkMode }: { lessons: Lesson[]; darkMode: boolean }) {
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";
  const favs = lessons.filter(l => l.favorited);

  return (
    <Page darkMode={darkMode}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <Star size={26} color="#e91e8c" fill="#e91e8c" />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: tc, margin: 0 }}>Favoritos ⭐</h1>
      </div>
      {favs.length === 0 ? (
        <Card darkMode={darkMode} style={{ textAlign: "center", padding: 48 }}>
          <TulipSVG size={60} color="#ce93d8" />
          <p style={{ color: sc, fontWeight: 600, marginTop: 16 }}>
            Nenhum favorito ainda! ⭐<br />
            <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>Favorita aulas clicando na estrela em cada módulo.</span>
          </p>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {favs.map(l => (
            <Card key={l.id} darkMode={darkMode}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: l.completed ? "linear-gradient(135deg, #f06292, #9c4dcc)" : "rgba(240,98,146,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {l.completed ? <Check size={16} color="white" /> : <BookOpen size={16} color="#f06292" />}
                </div>
                <Star size={15} color="#e91e8c" fill="#e91e8c" />
              </div>
              <h3 style={{ color: tc, fontWeight: 700, fontSize: "0.92rem", marginBottom: 6 }}>{l.title}</h3>
              <p style={{ color: sc, fontSize: "0.8rem", fontWeight: 500, lineHeight: 1.55, margin: "0 0 10px" }}>{l.desc}</p>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: l.completed ? "#4caf50" : "#f06292" }}>
                {l.completed ? "✅ Concluída" : "📚 Em andamento"}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}

// ─── Ferramentas ──────────────────────────────────────────────────────────────

function PomodoroClock({ darkMode }: { darkMode: boolean }) {
  const [totalSecs, setTotalSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const modeRef = useRef<"work" | "break">("work");
  const workMinsRef = useRef(25);
  const breakMinsRef = useRef(5);
  const [workMinsInput, setWorkMinsInput] = useState("25");
  const [breakMinsInput, setBreakMinsInput] = useState("5");
  const [displayMode, setDisplayMode] = useState<"work" | "break">("work");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTotalSecs(s => {
          if (s <= 1) {
            const nextMode = modeRef.current === "work" ? "break" : "work";
            modeRef.current = nextMode;
            setDisplayMode(nextMode);
            const nextSecs = nextMode === "work" ? workMinsRef.current * 60 : breakMinsRef.current * 60;
            return nextSecs;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function reset() {
    setRunning(false);
    modeRef.current = "work";
    setDisplayMode("work");
    setTotalSecs(workMinsRef.current * 60);
  }

  function applyWorkMins() {
    const v = parseInt(workMinsInput);
    if (!isNaN(v) && v > 0 && v <= 120) {
      workMinsRef.current = v;
      if (modeRef.current === "work") setTotalSecs(v * 60);
    }
  }

  function applyBreakMins() {
    const v = parseInt(breakMinsInput);
    if (!isNaN(v) && v > 0 && v <= 60) {
      breakMinsRef.current = v;
      if (modeRef.current === "break") setTotalSecs(v * 60);
    }
  }

  const totalForMode = displayMode === "work" ? workMinsRef.current * 60 : breakMinsRef.current * 60;
  const progress = ((totalForMode - totalSecs) / totalForMode) * 100;
  const circumference = 2 * Math.PI * 65;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: displayMode === "work" ? "#e91e8c" : "#4caf50", marginBottom: 10 }}>
        {displayMode === "work" ? "🍅 Foco" : "☕ Pausa"}
      </div>
      <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto 16px" }}>
        <svg width="150" height="150" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="75" cy="75" r="65" fill="none" stroke={darkMode ? "rgba(255,255,255,0.09)" : "#fce4ec"} strokeWidth="8" />
          <circle cx="75" cy="75" r="65" fill="none" stroke={displayMode === "work" ? "#f06292" : "#4caf50"} strokeWidth="8"
            strokeDasharray={`${circumference}`} strokeDashoffset={`${circumference * (1 - progress / 100)}`}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontSize: "2rem", fontWeight: 700, color: tc }}>{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <label style={{ fontSize: "0.7rem", color: sc, fontWeight: 600 }}>Foco (min)</label>
          <input type="number" value={workMinsInput} onChange={e => setWorkMinsInput(e.target.value)} onBlur={applyWorkMins}
            style={{ width: 56, padding: "4px 7px", borderRadius: 8, border: "1px solid rgba(240,98,146,0.28)", background: darkMode ? "rgba(45,0,80,0.4)" : "rgba(255,255,255,0.65)", color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.85rem", textAlign: "center" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <label style={{ fontSize: "0.7rem", color: sc, fontWeight: 600 }}>Pausa (min)</label>
          <input type="number" value={breakMinsInput} onChange={e => setBreakMinsInput(e.target.value)} onBlur={applyBreakMins}
            style={{ width: 56, padding: "4px 7px", borderRadius: 8, border: "1px solid rgba(240,98,146,0.28)", background: darkMode ? "rgba(45,0,80,0.4)" : "rgba(255,255,255,0.65)", color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.85rem", textAlign: "center" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => setRunning(r => !r)} className="btn-primary" style={{ padding: "9px 20px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 7 }}>
          {running ? <><Pause size={15} /> Pausar</> : <><Play size={15} /> {totalSecs === workMinsRef.current * 60 && displayMode === "work" ? "Iniciar" : "Continuar"}</>}
        </button>
        <button onClick={reset}
          style={{ padding: "9px 14px", borderRadius: 50, border: "2px solid rgba(240,98,146,0.28)", background: "transparent", color: sc, cursor: "pointer", fontFamily: "Quicksand, sans-serif", fontWeight: 700, display: "flex", alignItems: "center" }}>
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Periodic Table Component ─────────────────────────────────────────────────

function PeriodicTableView({ darkMode }: { darkMode: boolean }) {
  const [selEl, setSelEl] = useState<PeriodicElement | null>(null);
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";

  return (
    <div>
      <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14 }}>🧪 Tabela Periódica Completa (118 elementos)</h3>

      {selEl && (
        <Card darkMode={darkMode} style={{ marginBottom: 18, borderLeft: "4px solid #e91e8c" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 14, flexShrink: 0,
              background: CAT_COLORS[selEl.cat]?.bg || "#eee",
              border: `2px solid ${CAT_COLORS[selEl.cat]?.border || "#ccc"}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#555" }}>{selEl.num}</span>
              <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#222", lineHeight: 1 }}>{selEl.symbol}</span>
              <span style={{ fontSize: "0.48rem", fontWeight: 600, color: "#666" }}>{selEl.mass}</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: tc, fontSize: "1.1rem" }}>{selEl.name}</div>
              <div style={{ color: sc, fontWeight: 600, fontSize: "0.82rem" }}>Z = {selEl.num} | Período {selEl.period > 8 ? selEl.period - 2 : selEl.period} | Grupo {selEl.group}</div>
              <div style={{ color: sc, fontWeight: 600, fontSize: "0.82rem" }}>Massa atômica: {selEl.mass} u</div>
              <div style={{ marginTop: 4, display: "inline-block", padding: "2px 9px", borderRadius: 20, background: CAT_COLORS[selEl.cat]?.bg || "#eee", border: `1px solid ${CAT_COLORS[selEl.cat]?.border || "#ccc"}`, fontSize: "0.72rem", fontWeight: 700, color: "#444" }}>{selEl.cat}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {Object.entries(CAT_COLORS).map(([cat, col]) => (
          <span key={cat} style={{ padding: "2px 9px", borderRadius: 20, background: col.bg, border: `1px solid ${col.border}`, fontSize: "0.68rem", fontWeight: 700, color: "#444" }}>{cat}</span>
        ))}
      </div>

      {/* Grid table */}
      <div style={{ overflowX: "auto", paddingBottom: 12 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(18, minmax(52px, 1fr))",
          gridTemplateRows: "repeat(10, 62px)",
          gap: 3,
          minWidth: 980,
        }}>
          {/* Lanthanide placeholder at period=6, group=3 */}
          <div style={{
            gridColumn: 3, gridRow: 6,
            background: CAT_COLORS.lanthanide.bg,
            border: `2px solid ${CAT_COLORS.lanthanide.border}`,
            borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.6rem", fontWeight: 700, color: "#c2185b", textAlign: "center",
            cursor: "default",
          }}>★57-71</div>

          {/* Actinide placeholder at period=7, group=3 */}
          <div style={{
            gridColumn: 3, gridRow: 7,
            background: CAT_COLORS.actinide.bg,
            border: `2px solid ${CAT_COLORS.actinide.border}`,
            borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.6rem", fontWeight: 700, color: "#bf360c", textAlign: "center",
            cursor: "default",
          }}>★89-103</div>

          {PERIODIC_TABLE.map(el => {
            const c = CAT_COLORS[el.cat] || { bg: "#eee", border: "#ccc" };
            const isSelected = selEl?.num === el.num;
            return (
              <button
                key={el.num}
                onClick={() => setSelEl(isSelected ? null : el)}
                style={{
                  gridColumn: el.group,
                  gridRow: el.period,
                  padding: "3px 2px",
                  borderRadius: 7,
                  background: c.bg,
                  border: `2px solid ${isSelected ? "#e91e8c" : c.border}`,
                  cursor: "pointer",
                  textAlign: "center",
                  fontFamily: "Quicksand, sans-serif",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isSelected ? "0 0 0 2px #e91e8c44" : "none",
                  overflow: "hidden",
                }}
              >
                <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#555", lineHeight: 1 }}>{el.num}</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#222", lineHeight: 1.1 }}>{el.symbol}</div>
                <div style={{ fontSize: "0.44rem", fontWeight: 600, color: "#777", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{el.name.length > 8 ? el.name.slice(0, 7) + "…" : el.name}</div>
                <div style={{ fontSize: "0.42rem", fontWeight: 600, color: "#888", lineHeight: 1 }}>{el.mass}</div>
              </button>
            );
          })}

          {/* Row 8 separator is implicit (empty cells). Row 9 = lanthanides, Row 10 = actinides */}
          {/* Label for lanthanide row */}
          <div style={{ gridColumn: "1/3", gridRow: 9, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 4 }}>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: sc, textAlign: "right" }}>Lantanídeos</span>
          </div>
          <div style={{ gridColumn: "1/3", gridRow: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 4 }}>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: sc, textAlign: "right" }}>Actinídeos</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FerramentasPage({ darkMode }: { darkMode: boolean }) {
  const [activeTab, setActiveTab] = useState("pomodoro");
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [mass, setMass] = useState(""); const [mm, setMm] = useState(""); const [molResult, setMolResult] = useState("");
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";

  function safeCalc(expr: string): string {
    try {
      // Normalise operators
      let e = expr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        // √X  →  Math.sqrt(X)
        .replace(/√\s*(\d+\.?\d*)/g, "Math.sqrt($1)")
        // X%  →  (X/100)  so "50%" becomes "(50/100)"
        .replace(/(\d+\.?\d*)%/g, "($1/100)");
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + e + ')')() as number;
      if (!isFinite(result)) return "Erro";
      // Trim floating-point noise
      return String(parseFloat(result.toFixed(10)));
    } catch {
      return "Erro";
    }
  }

  function calcPress(val: string) {
    if (val === "=") {
      const r = safeCalc(calcInput);
      setCalcResult(r);
      if (r !== "Erro") setCalcInput(r); // carry result forward for chaining
    } else if (val === "√") {
      // If there's already a number, evaluate √ of it immediately
      const cur = calcResult || calcInput;
      const n = parseFloat(cur);
      if (!isNaN(n)) {
        const r = String(parseFloat(Math.sqrt(n).toFixed(10)));
        setCalcInput(r); setCalcResult(r);
      } else {
        setCalcInput(prev => prev + "√");
      }
    } else if (val === "%") {
      // Convert current display to percentage
      const cur = calcResult || calcInput;
      const n = parseFloat(cur);
      if (!isNaN(n)) {
        const r = String(parseFloat((n / 100).toFixed(10)));
        setCalcInput(r); setCalcResult(r);
      } else {
        setCalcInput(prev => prev + "%");
      }
    } else if (val === "C") {
      setCalcInput(""); setCalcResult("");
    } else if (val === "⌫") {
      setCalcInput(prev => prev.slice(0, -1));
      setCalcResult("");
    } else {
      // If last action was "=" and user presses an operator, continue from result
      if (calcResult && ["+","-","×","÷","*","/"].includes(val)) {
        setCalcInput(calcResult + val); setCalcResult("");
      } else if (calcResult && /\d/.test(val)) {
        // New number after result — start fresh
        setCalcInput(val); setCalcResult("");
      } else {
        setCalcInput(prev => prev + val);
      }
    }
  }

  function calcMol() {
    const m = parseFloat(mass), molarMass = parseFloat(mm);
    if (!isNaN(m) && !isNaN(molarMass) && molarMass > 0) {
      const mols = m / molarMass;
      setMolResult(`${mols.toFixed(4)} mol\n${(mols * 6.022e23).toExponential(3)} moléculas`);
    }
  }

  const TABS = [
    { id: "pomodoro", label: "⏱ Pomodoro" },
    { id: "calc", label: "🔢 Calculadora" },
    { id: "mol", label: "⚗️ Mol" },
    { id: "tabela", label: "🧪 Tabela" },
  ];

  const BTNS = ["7","8","9","÷","4","5","6","×","1","2","3","-","0",".","=","+","C","⌫","(",")","%","√"];

  return (
    <Page darkMode={darkMode}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <Zap size={26} color="#e91e8c" />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: tc, margin: 0 }}>Ferramentas 🛠️</h1>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "9px 16px", borderRadius: 50,
            background: activeTab === t.id ? "linear-gradient(135deg, #f06292, #9c4dcc)" : "transparent",
            border: `2px solid ${activeTab === t.id ? "transparent" : "rgba(240,98,146,0.28)"}`,
            color: activeTab === t.id ? "white" : sc,
            fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.83rem", cursor: "pointer",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "pomodoro" && (
        <Card darkMode={darkMode} style={{ maxWidth: 380, margin: "0 auto" }}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 20, textAlign: "center" }}>🍅 Técnica Pomodoro</h3>
          <PomodoroClock darkMode={darkMode} />
        </Card>
      )}

      {activeTab === "calc" && (
        <Card darkMode={darkMode} style={{ maxWidth: 300, margin: "0 auto" }}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14 }}>🔢 Calculadora</h3>
          <div style={{ background: darkMode ? "rgba(0,0,0,0.28)" : "#fce4ec", borderRadius: 11, padding: "11px 13px", marginBottom: 11, minHeight: 54 }}>
            <div style={{ color: sc, fontSize: "0.83rem", fontWeight: 600, minHeight: 18 }}>{calcInput || "0"}</div>
            {calcResult && <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e91e8c" }}>{calcResult}</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
            {BTNS.map(btn => (
              <button key={btn} onClick={() => calcPress(btn)} style={{
                padding: "13px 6px", borderRadius: 11, border: "none",
                background: btn === "=" ? "linear-gradient(135deg, #f06292, #9c4dcc)" : (darkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.82)"),
                color: btn === "=" ? "white" : tc,
                fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.92rem", cursor: "pointer", transition: "all 0.15s ease",
              }}>
                {btn}
              </button>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "mol" && (
        <Card darkMode={darkMode} style={{ maxWidth: 340, margin: "0 auto" }}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14 }}>⚗️ Calculadora de Mol</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 13 }}>
            <input value={mass} onChange={e => setMass(e.target.value)} placeholder="Massa (g)"
              style={{ padding: "9px 13px", borderRadius: 11, border: "1px solid rgba(240,98,146,0.28)", background: darkMode ? "rgba(45,0,80,0.4)" : "rgba(255,255,255,0.65)", color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: "0.88rem" }} />
            <input value={mm} onChange={e => setMm(e.target.value)} placeholder="Massa molar (g/mol)"
              style={{ padding: "9px 13px", borderRadius: 11, border: "1px solid rgba(240,98,146,0.28)", background: darkMode ? "rgba(45,0,80,0.4)" : "rgba(255,255,255,0.65)", color: tc, fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: "0.88rem" }} />
            <button onClick={calcMol} className="btn-primary" style={{ padding: "9px", fontSize: "0.85rem" }}>Calcular mols</button>
          </div>
          {molResult && (
            <div style={{ padding: "11px 13px", borderRadius: 11, background: "rgba(156,77,204,0.1)", border: "1px solid rgba(156,77,204,0.28)", whiteSpace: "pre-wrap", color: tc, fontWeight: 700, fontSize: "0.9rem" }}>
              {molResult}
            </div>
          )}
        </Card>
      )}

      {activeTab === "tabela" && <PeriodicTableView darkMode={darkMode} />}
    </Page>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

function ConfigPage({ darkMode, setDarkMode, lsPrefix }: { darkMode: boolean; setDarkMode: (v: boolean) => void; lsPrefix: string }) {
  const tc = darkMode ? "#f8bbd0" : "#4a0072";
  const sc = darkMode ? "#ce93d8" : "#7b1fa2";
  const aiActive = true

  return (
    <Page darkMode={darkMode}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
        <Settings size={26} color="#e91e8c" />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: tc, margin: 0 }}>Configurações ⚙️</h1>
      </div>
      <div style={{ maxWidth: 540 }}>
        <Card darkMode={darkMode} style={{ marginBottom: 18 }}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 16 }}>🎨 Aparência</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `1px solid ${darkMode ? "rgba(206,147,216,0.13)" : "rgba(244,143,177,0.18)"}` }}>
            <div>
              <div style={{ fontWeight: 700, color: tc, fontSize: "0.88rem" }}>Modo Escuro</div>
              <div style={{ color: sc, fontSize: "0.78rem", fontWeight: 500 }}>Alterne entre tema claro e escuro</div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} style={{
              width: 50, height: 27, borderRadius: 14,
              background: darkMode ? "linear-gradient(135deg, #f06292, #9c4dcc)" : "#e0c8e0",
              border: "none", cursor: "pointer", position: "relative", transition: "background 0.3s ease",
            }}>
              <div style={{ width: 19, height: 19, borderRadius: "50%", background: "white", position: "absolute", top: 4, left: darkMode ? 27 : 4, transition: "left 0.3s ease", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
          <div style={{ paddingTop: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, color: tc, fontSize: "0.88rem" }}>Tema atual</div>
              <div style={{ color: sc, fontSize: "0.78rem", fontWeight: 500 }}>{darkMode ? "Modo Escuro ativo" : "Modo Claro ativo"}</div>
            </div>
            <span style={{ fontSize: "1.5rem" }}>{darkMode ? "🌙" : "☀️"}</span>
          </div>
        </Card>

        <Card darkMode={darkMode} style={{ marginBottom: 18 }}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 12 }}>🤖 Tulipa IA</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: aiActive ? "#4caf50" : "#ff9800", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: tc, fontSize: "0.88rem" }}>
                {aiActive ? "Gemini ativo 🌷" : "Modo demonstração"}
              </div>
              <div style={{ color: sc, fontSize: "0.78rem", fontWeight: 500 }}>
                {aiActive ? "IA Gemini conectada e funcionando" : "IA indisponível"}
              </div>
            </div>
          </div>
        </Card>

        <Card darkMode={darkMode} style={{ marginBottom: 18 }}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 14 }}>📊 Dados de estudo</h3>
          {[
            ["Quizzes realizados", lsGet(lsPrefix, "quizCount", "0")],
            ["Média nos quizzes", `${lsGet(lsPrefix, "avgScore", "0")}%`],
            ["Tempo estudado", formatStudyTime(parseInt(lsGet(lsPrefix, "studySecs", "0"), 10))],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: sc, fontWeight: 600, fontSize: "0.85rem" }}>{l}</span>
              <span style={{ color: "#e91e8c", fontWeight: 700, fontSize: "0.85rem" }}>{v}</span>
            </div>
          ))}
          <button onClick={() => {
            lsSet(lsPrefix, "quizCount", "0");
            lsSet(lsPrefix, "avgScore", "0");
            lsSet(lsPrefix, "studySecs", "0");
            window.location.reload();
          }}
            style={{ marginTop: 10, padding: "8px 16px", borderRadius: 50, border: "2px solid #f44336", background: "transparent", color: "#f44336", fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
            🗑️ Limpar estatísticas
          </button>
        </Card>

        <Card darkMode={darkMode}>
          <h3 style={{ color: tc, fontWeight: 700, marginBottom: 8 }}>🌷 Sobre o site</h3>
          <p style={{ color: sc, fontWeight: 500, fontSize: "0.86rem", lineHeight: 1.72, margin: 0 }}>
            Feito com muito amor para Lohana. Este é um espaço exclusivo de estudos de Química, cheio de carinho, tulipas e dedicação. Bons estudos, princesa! 💜
          </p>
          <div style={{ marginTop: 10, fontSize: "0.76rem", color: sc, fontWeight: 500 }}>Versão 11.0 — 2026</div>
        </Card>
      </div>
    </Page>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="page-content" style={{
      textAlign: "center", padding: "14px 26px",
      fontSize: "0.8rem", fontWeight: 600,
      color: darkMode ? "#ce93d8" : "#9c4dcc",
      borderTop: `1px solid ${darkMode ? "rgba(206,147,216,0.13)" : "rgba(244,143,177,0.18)"}`,
    }}>
      🌷 Feito com muito amor para minha princesa. — Luís
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

// ─── Formata segundos totais → "Xh Ym Zs" ────────────────────────────────────
function formatStudyTime(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function App() {
  const [view, setView] = useState<View>("splash");
  const [user, setUser] = useState<User | null>(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [authLoading, setAuthLoading] = useState(true);
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setAuthLoading(false);
  });

  return () => unsubscribe();
}, []);
const handleRegister = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Conta criada com sucesso! 💗");
  } catch (error: any) {
    alert("Erro ao criar conta: " + error.message);
  }
};

const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    alert("E-mail ou senha incorretos.");
  }
};

const handleLogout = async () => {
  await signOut(auth);
};
  const [darkMode, setDarkMode] = useState(false);
  const [lsPrefix, setLsPrefix] = useState("lohana_default");
  const [lessons, setLessons] = useState<Lesson[]>(LESSONS);
  const [notes, setNotes] = useState<Note[]>([{
    id: 1, title: "Tabela Periódica — dicas",
    content: "Os metais alcalinos ficam no grupo 1. Gases nobres no grupo 18. Halogênios no grupo 17. Lembrar: Sódio (Na) = grupo 1, período 3.",
    createdAt: "22/07/2026", color: "#fce4ec", favorited: false,
  }]);

  // ── Cronômetro de tempo estudado ──────────────────────────────────────────
  // Conta segundos reais enquanto a aba está visível. Salva no localStorage.
  const studyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lsPrefixRef = useRef("lohana_default");

  // mantém ref sincronizado para uso dentro do interval (evita stale closure)
  useEffect(() => { lsPrefixRef.current = lsPrefix; }, [lsPrefix]);

  useEffect(() => {
    function startTimer() {
      if (studyTimerRef.current) return;
      studyTimerRef.current = setInterval(() => {
        if (document.visibilityState === "hidden") return;
        const cur = parseInt(localStorage.getItem(`${lsPrefixRef.current}_studySecs`) ?? "0", 10);
        localStorage.setItem(`${lsPrefixRef.current}_studySecs`, String(cur + 1));
      }, 1000);
    }

    function stopTimer() {
      if (studyTimerRef.current) {
        clearInterval(studyTimerRef.current);
        studyTimerRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") startTimer();
      else stopTimer();
    }

    startTimer();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Fetch IP and set up localStorage namespace
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(({ ip }) => {
        const prefix = `lohana_${ip.replace(/\./g, "_")}`;
        setLsPrefix(prefix);

        // Load persisted data
        const dm = localStorage.getItem(`${prefix}_darkMode`);
        if (dm !== null) setDarkMode(dm === "true");

        const savedLessons = localStorage.getItem(`${prefix}_lessons`);
        if (savedLessons) {
          try {
            const parsed: Lesson[] = JSON.parse(savedLessons);
            // always use videoUrl from source code, not from localStorage
            setLessons(LESSONS.map(src => {
              const saved = parsed.find(p => p.id === src.id);
              return saved ? { ...saved, videoUrl: src.videoUrl } : src;
            }));
          } catch { /* ignore */ }
        }

        const savedNotes = localStorage.getItem(`${prefix}_notes`);
        if (savedNotes) {
          try { setNotes(JSON.parse(savedNotes)); } catch { /* ignore */ }
        }
      })
      .catch(() => {
        // IP fetch failed — load from default prefix
        const prefix = "lohana_default";
        const dm = localStorage.getItem(`${prefix}_darkMode`);
        if (dm !== null) setDarkMode(dm === "true");
        const savedLessons = localStorage.getItem(`${prefix}_lessons`);
        if (savedLessons) {
          try {
            const parsed: Lesson[] = JSON.parse(savedLessons);
            setLessons(LESSONS.map(src => {
              const saved = parsed.find(p => p.id === src.id);
              return saved ? { ...saved, videoUrl: src.videoUrl } : src;
            }));
          } catch { /* */ }
        }
        const savedNotes = localStorage.getItem(`${prefix}_notes`);
        if (savedNotes) { try { setNotes(JSON.parse(savedNotes)); } catch { /* */ } }
      });
  }, []);

  // Persist lessons
  useEffect(() => {
    localStorage.setItem(`${lsPrefix}_lessons`, JSON.stringify(lessons));
  }, [lessons, lsPrefix]);

  // Persist notes
  useEffect(() => {
    localStorage.setItem(`${lsPrefix}_notes`, JSON.stringify(notes));
  }, [notes, lsPrefix]);

  // Persist darkMode
  useEffect(() => {
    lsSet(lsPrefix, "darkMode", String(darkMode));
  }, [darkMode, lsPrefix]);

  function nav(v: View) { setView(v); window.scrollTo(0, 0); }

  if (view === "splash") return <SplashScreen onEnter={() => nav("home")} />;
if (authLoading) {
  return <div>Carregando...</div>;
}

if (!user) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fce4ec"
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "24px",
        width: "350px",
        textAlign: "center"
      }}>
        <h1>🌷 Química da Lohana</h1>
        <p>Entre para continuar seus estudos 💗</p>

        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "10px" }}
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "15px" }}
        />

        <button onClick={handleLogin}>
          Entrar
        </button>

        <button onClick={handleRegister}>
          Criar conta
        </button>
      </div>
    </div>
  );
}
  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0d0015" : "#fce4ec", fontFamily: "Quicksand, sans-serif" }}>
      <NavBar view={view} onNav={nav} darkMode={darkMode} />
      <FallingPetals />
      {view === "home"        && <HomePage lessons={lessons} darkMode={darkMode} onNav={nav} lsPrefix={lsPrefix} />}
      {view === "aulas"       && <AulasPage lessons={lessons} setLessons={setLessons} darkMode={darkMode} lsPrefix={lsPrefix} />}
      {view === "quiz"        && <QuizPage darkMode={darkMode} lsPrefix={lsPrefix} />}
      {view === "ia"          && <TulipaIA darkMode={darkMode} lsPrefix={lsPrefix} />}
      {view === "anotacoes"   && <AnotacoesPage darkMode={darkMode} notes={notes} setNotes={setNotes} />}
      {view === "progresso"   && <ProgressoPage lessons={lessons} darkMode={darkMode} lsPrefix={lsPrefix} />}
      {view === "favoritos"   && <FavoritosPage lessons={lessons} darkMode={darkMode} />}
      {view === "ferramentas" && <FerramentasPage darkMode={darkMode} />}
      {view === "config"      && <ConfigPage darkMode={darkMode} setDarkMode={setDarkMode} lsPrefix={lsPrefix} />}
      <Footer darkMode={darkMode} />
    </div>
  );
}
