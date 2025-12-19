
import { QuoteData, QuoteStatus, INITIAL_QUOTE } from '../types';

const HISTORY_KEY = 'orcaFacil_history';

// --- MEMORY CACHE (Performance Layer) ---
// Evita ler do localStorage (lento e síncrono) em cada operação
let memoryCache: QuoteData[] | null = null;

// Helper to generate next Quote ID
const getNextQuoteId = (quotes: QuoteData[]): string => {
  const ids = quotes.map(q => {
    if (!q.id) return 0;
    const match = q.id.match(/^O(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  });
  
  const maxId = Math.max(0, ...ids);
  return `O${maxId + 1}`;
};

export interface PaginatedResponse {
  data: QuoteData[];
  total: number;
  page: number;
  totalPages: number;
}

const ensureCache = () => {
    if (memoryCache) return memoryCache;

    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (raw) {
            memoryCache = JSON.parse(raw);
        } else {
            memoryCache = [];
        }
    } catch (e) {
        console.error("Storage Error", e);
        memoryCache = [];
    }
    return memoryCache!;
};

const persistCache = () => {
    if (memoryCache) {
        // Usa microtask (setTimeout 0) para não travar a UI durante a escrita no disco
        setTimeout(() => {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(memoryCache));
        }, 0);
    }
};

export const storageService = {
  
  async getAll(): Promise<QuoteData[]> {
    const history = ensureCache();
    // Retorna uma cópia congelada para performance (evita mutações acidentais)
    return Object.freeze([...history].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))) as QuoteData[];
  },

  async getPaginated(page: number, limit: number, query: string = ''): Promise<PaginatedResponse> {
    const history = ensureCache();

    let filtered = history;
    if (query) {
        const term = query.toLowerCase();
        filtered = history.filter(q => 
            (q.id && q.id.toLowerCase().includes(term)) ||
            (q.client.name && q.client.name.toLowerCase().includes(term)) || 
            (q.number && q.number.toLowerCase().includes(term)) ||
            (q.client.document && q.client.document.includes(term)) ||
            (q.date && q.date.includes(term)) ||
            (q.company.nome_fantasia && q.company.nome_fantasia.toLowerCase().includes(term))
        );
    }

    // Ordenação (Sort é uma operação cara, fazemos apenas se necessário)
    const sorted = [...filtered].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

    const total = sorted.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = sorted.slice(startIndex, startIndex + limit);

    return { data, total, page, totalPages };
  },

  async getNextQuoteNumber(): Promise<string> {
      const quotes = ensureCache();
      let maxNumber = 0;

      for (const q of quotes) {
          if (!q.number) continue;
          const cleanNumber = q.number.toString().replace(/\D/g, ''); 
          if (cleanNumber) {
              const num = parseInt(cleanNumber, 10);
              if (!isNaN(num) && num > maxNumber) maxNumber = num;
          }
      }
      
      return `ORC${maxNumber + 1}`;
  },

  async save(quote: QuoteData): Promise<QuoteData> {
    const history = ensureCache();
    let quoteToSave: QuoteData;

    if (quote.id) {
        quoteToSave = {
            ...quote,
            lastUpdated: Date.now(),
            status: quote.status || 'pending'
        };
        const index = history.findIndex(q => q.id === quote.id);
        if (index >= 0) history[index] = quoteToSave;
    } else {
        quoteToSave = {
            ...quote,
            id: getNextQuoteId(history),
            lastUpdated: Date.now(),
            status: quote.status || 'pending'
        };
        history.push(quoteToSave);
    }

    persistCache(); 
    return quoteToSave;
  },

  async updateStatus(id: string, status: QuoteStatus): Promise<void> {
    const history = ensureCache();
    const index = history.findIndex(q => q.id === id);
    if (index >= 0) {
        history[index] = { ...history[index], status, lastUpdated: Date.now() };
        persistCache();
    }
  },

  async delete(id: string): Promise<void> {
    const history = ensureCache();
    memoryCache = history.filter(q => q.id !== id);
    persistCache();
  }
};
