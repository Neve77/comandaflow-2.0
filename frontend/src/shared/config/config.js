// Configurações da aplicação
export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: import.meta.env.VITE_JWT_SECRET || 'fallback-secret',
};

// Constantes de status
export const BRACELET_STATUS = {
  LIVRE: 'livre',
  EM_USO: 'em_uso',
  BLOQUEADA: 'bloqueada',
};

export const COMANDA_STATUS = {
  ABERTA: 'aberta',
  FECHADA: 'fechada',
};

// Categorias de produtos
export const PRODUCT_CATEGORIES = [
  'Bebidas',
  'Pizzas',
  'Lanches',
  'Saladas',
  'Sobremesas',
  'Acompanhamentos',
];