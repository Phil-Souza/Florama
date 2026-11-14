export type Category = "Tudo" | "Rosas" | "Tulipas" | "Girassóis" | "Lírios" | "Margaridas" | "Gérberas" | "Orquídeas" | "Buquês";

export type ProductId = string;

export type Product = {
  id: ProductId;
  name: string;
  detail: string;
  priceCents: number;
  category: Exclude<Category, "Tudo">;
  flower: string;
  color: string;
};

export const categories: Category[] = ["Tudo", "Rosas", "Tulipas", "Girassóis", "Lírios", "Margaridas", "Gérberas", "Orquídeas", "Buquês"];

export const categorySymbols: Record<Category, string> = {
  "Tudo": "✽",
  "Rosas": "✿",
  "Tulipas": "❀",
  "Girassóis": "☀",
  "Lírios": "✿",
  "Margaridas": "✿",
  "Gérberas": "❋",
  "Orquídeas": "✿",
  "Buquês": "❋",
};

export const products: Product[] = [
  { id: "rosas-monalisa", name: "Monalisa", detail: "1 rosa", priceCents: 1500, category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { id: "rosas-triana", name: "Triana", detail: "3 rosas", priceCents: 3000, category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { id: "rosas-septalia", name: "Septália", detail: "7 rosas", priceCents: 6500, category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { id: "rosas-decada", name: "Década", detail: "10 rosas", priceCents: 9000, category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { id: "rosas-donzela", name: "Donzela", detail: "12 rosas", priceCents: 11000, category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { id: "rosas-quinzel", name: "Quinzel", detail: "15 rosas", priceCents: 13000, category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { id: "rosas-octelle", name: "Octelle", detail: "18 rosas", priceCents: 15500, category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { id: "tulipas-primavera", name: "Primavera", detail: "1 tulipa", priceCents: 1500, category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { id: "tulipas-turban", name: "Turban", detail: "3 tulipas", priceCents: 3000, category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { id: "tulipas-holanda", name: "Holanda", detail: "7 tulipas", priceCents: 6500, category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { id: "tulipas-tulipar", name: "Tulipar", detail: "10 tulipas", priceCents: 9000, category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { id: "tulipas-jardim", name: "Jardim", detail: "12 tulipas", priceCents: 11000, category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { id: "tulipas-amsterdam", name: "Amsterdam", detail: "15 tulipas", priceCents: 13000, category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { id: "tulipas-campo", name: "Campo", detail: "18 tulipas", priceCents: 15500, category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { id: "girassois-solitario-dourado", name: "Solitário Dourado", detail: "1 girassol", priceCents: 2000, category: "Girassóis", flower: "🌻", color: "#fff2d8" },
  { id: "girassois-trio-solar", name: "Trio Solar", detail: "3 girassóis", priceCents: 5500, category: "Girassóis", flower: "🌻", color: "#fff2d8" },
  { id: "girassois-campo-de-sol", name: "Campo de Sol", detail: "5 girassóis", priceCents: 8500, category: "Girassóis", flower: "🌻", color: "#fff2d8" },
  { id: "lirios-elegance", name: "Lírio Elegance", detail: "1 haste", priceCents: 2500, category: "Lírios", flower: "🌸", color: "#f5edf1" },
  { id: "lirios-duo", name: "Duo de Lírios", detail: "2 hastes", priceCents: 4800, category: "Lírios", flower: "🌸", color: "#f5edf1" },
  { id: "lirios-em-flor", name: "Lírios em Flor", detail: "3 hastes", priceCents: 7000, category: "Lírios", flower: "🌸", color: "#f5edf1" },
  { id: "margaridas-do-campo", name: "Margaridas do Campo", detail: "6 flores", priceCents: 3500, category: "Margaridas", flower: "🌼", color: "#f7f3df" },
  { id: "margaridas-jardim", name: "Jardim de Margaridas", detail: "12 flores", priceCents: 6000, category: "Margaridas", flower: "🌼", color: "#f7f3df" },
  { id: "gerberas-classica", name: "Gérbera Clássica", detail: "1 flor", priceCents: 1500, category: "Gérberas", flower: "🌺", color: "#f8e9e6" },
  { id: "gerberas-mix-colorido", name: "Mix Colorido", detail: "6 gérberas", priceCents: 7000, category: "Gérberas", flower: "🌺", color: "#f8e9e6" },
  { id: "orquideas-mini", name: "Mini Orquídea", detail: "Planta em vaso", priceCents: 7500, category: "Orquídeas", flower: "🪴", color: "#f1eaf5" },
  { id: "orquideas-phalaenopsis", name: "Orquídea Phalaenopsis", detail: "Planta em vaso", priceCents: 12000, category: "Orquídeas", flower: "🪴", color: "#f1eaf5" },
  { id: "buques-rosa-adormecida", name: "Rosa Adormecida", detail: "Buquê artesanal em cetim", priceCents: 7000, category: "Buquês", flower: "💐", color: "#f3eaf0" },
  { id: "buques-rosa-de-ouro", name: "Rosa de Ouro", detail: "Buquê artesanal em cetim", priceCents: 7000, category: "Buquês", flower: "💐", color: "#f3eee0" },
  { id: "buques-aurora", name: "Aurora", detail: "Composição de rosas e tulipas", priceCents: 13000, category: "Buquês", flower: "💐", color: "#f3eaf0" },
  { id: "buques-sol-da-manha", name: "Sol da Manhã", detail: "Composição de girassóis", priceCents: 11000, category: "Buquês", flower: "💐", color: "#fff2d8" },
  { id: "buques-jardim-colorido", name: "Jardim Colorido", detail: "Composição de gérberas e margaridas", priceCents: 11500, category: "Buquês", flower: "💐", color: "#f7f0e6" },
  { id: "buques-brisa", name: "Brisa", detail: "Composição de lírios", priceCents: 9500, category: "Buquês", flower: "💐", color: "#f5edf1" },
  { id: "buques-romance-vermelho", name: "Romance Vermelho", detail: "Composição de rosas", priceCents: 13500, category: "Buquês", flower: "💐", color: "#f5e9e8" },
  { id: "buques-primavera-mix", name: "Primavera Mix", detail: "Composição de tulipas e folhagens", priceCents: 10500, category: "Buquês", flower: "💐", color: "#edf1e8" },
];
