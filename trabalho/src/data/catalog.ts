export type Category = "Tudo" | "Rosas" | "Tulipas" | "Girassóis" | "Lírios" | "Margaridas" | "Gérberas" | "Orquídeas" | "Buquês";

export type Product = {
  name: string;
  detail: string;
  price: string;
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
  { name: "Monalisa", detail: "1 rosa", price: "R$ 15,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Triana", detail: "3 rosas", price: "R$ 30,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Septália", detail: "7 rosas", price: "R$ 65,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Década", detail: "10 rosas", price: "R$ 90,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Donzela", detail: "12 rosas", price: "R$ 110,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Quinzel", detail: "15 rosas", price: "R$ 130,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Octelle", detail: "18 rosas", price: "R$ 155,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Primavera", detail: "1 tulipa", price: "R$ 15,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Turban", detail: "3 tulipas", price: "R$ 30,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Holanda", detail: "7 tulipas", price: "R$ 65,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Tulipar", detail: "10 tulipas", price: "R$ 90,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Jardim", detail: "12 tulipas", price: "R$ 110,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Amsterdam", detail: "15 tulipas", price: "R$ 130,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Campo", detail: "18 tulipas", price: "R$ 155,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Solitário Dourado", detail: "1 girassol", price: "R$ 20,00", category: "Girassóis", flower: "🌻", color: "#fff2d8" },
  { name: "Trio Solar", detail: "3 girassóis", price: "R$ 55,00", category: "Girassóis", flower: "🌻", color: "#fff2d8" },
  { name: "Campo de Sol", detail: "5 girassóis", price: "R$ 85,00", category: "Girassóis", flower: "🌻", color: "#fff2d8" },
  { name: "Lírio Elegance", detail: "1 haste", price: "R$ 25,00", category: "Lírios", flower: "🌸", color: "#f5edf1" },
  { name: "Duo de Lírios", detail: "2 hastes", price: "R$ 48,00", category: "Lírios", flower: "🌸", color: "#f5edf1" },
  { name: "Lírios em Flor", detail: "3 hastes", price: "R$ 70,00", category: "Lírios", flower: "🌸", color: "#f5edf1" },
  { name: "Margaridas do Campo", detail: "6 flores", price: "R$ 35,00", category: "Margaridas", flower: "🌼", color: "#f7f3df" },
  { name: "Jardim de Margaridas", detail: "12 flores", price: "R$ 60,00", category: "Margaridas", flower: "🌼", color: "#f7f3df" },
  { name: "Gérbera Clássica", detail: "1 flor", price: "R$ 15,00", category: "Gérberas", flower: "🌺", color: "#f8e9e6" },
  { name: "Mix Colorido", detail: "6 gérberas", price: "R$ 70,00", category: "Gérberas", flower: "🌺", color: "#f8e9e6" },
  { name: "Mini Orquídea", detail: "Planta em vaso", price: "R$ 75,00", category: "Orquídeas", flower: "🪴", color: "#f1eaf5" },
  { name: "Orquídea Phalaenopsis", detail: "Planta em vaso", price: "R$ 120,00", category: "Orquídeas", flower: "🪴", color: "#f1eaf5" },
  { name: "Rosa Adormecida", detail: "Buquê artesanal em cetim", price: "R$ 70,00", category: "Buquês", flower: "💐", color: "#f3eaf0" },
  { name: "Rosa de Ouro", detail: "Buquê artesanal em cetim", price: "R$ 70,00", category: "Buquês", flower: "💐", color: "#f3eee0" },
  { name: "Aurora", detail: "Composição de rosas e tulipas", price: "R$ 130,00", category: "Buquês", flower: "💐", color: "#f3eaf0" },
  { name: "Sol da Manhã", detail: "Composição de girassóis", price: "R$ 110,00", category: "Buquês", flower: "💐", color: "#fff2d8" },
  { name: "Jardim Colorido", detail: "Composição de gérberas e margaridas", price: "R$ 115,00", category: "Buquês", flower: "💐", color: "#f7f0e6" },
  { name: "Brisa", detail: "Composição de lírios", price: "R$ 95,00", category: "Buquês", flower: "💐", color: "#f5edf1" },
  { name: "Romance Vermelho", detail: "Composição de rosas", price: "R$ 135,00", category: "Buquês", flower: "💐", color: "#f5e9e8" },
  { name: "Primavera Mix", detail: "Composição de tulipas e folhagens", price: "R$ 105,00", category: "Buquês", flower: "💐", color: "#edf1e8" },
];
