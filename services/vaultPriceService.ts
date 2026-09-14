// ===== Vault Price Service — CoinGecko Free API =====
// No API key required. Rate limit: ~30 req/min

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface PriceCache {
    prices: Record<string, number>;
    timestamp: number;
}

// --- Price Cache (localStorage) ---
const getCachedPrices = (): PriceCache | null => {
    try {
        const raw = localStorage.getItem('vault_price_cache');
        if (!raw) return null;
        const cache: PriceCache = JSON.parse(raw);
        if (Date.now() - cache.timestamp > CACHE_TTL) return null;
        return cache;
    } catch {
        return null;
    }
};

const setCachedPrices = (prices: Record<string, number>) => {
    const cache: PriceCache = { prices, timestamp: Date.now() };
    localStorage.setItem('vault_price_cache', JSON.stringify(cache));
};

// --- Fetch Prices (batch) ---
export const fetchCryptoPrices = async (
    coingeckoIds: string[],
    vsCurrency: string = 'usd'
): Promise<Record<string, number>> => {
    if (coingeckoIds.length === 0) return {};

    // Check cache first
    const cached = getCachedPrices();
    const uncachedIds = cached
        ? coingeckoIds.filter(id => !(id in cached.prices))
        : coingeckoIds;

    if (uncachedIds.length === 0 && cached) {
        // All prices are cached
        const result: Record<string, number> = {};
        coingeckoIds.forEach(id => { result[id] = cached.prices[id] || 0; });
        return result;
    }

    try {
        // CoinGecko allows up to 250 ids per request
        const chunks: string[][] = [];
        for (let i = 0; i < uncachedIds.length; i += 250) {
            chunks.push(uncachedIds.slice(i, i + 250));
        }

        const allPrices: Record<string, number> = cached ? { ...cached.prices } : {};

        for (const chunk of chunks) {
            const ids = chunk.join(',');
            const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=${vsCurrency}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`CoinGecko API error: ${response.status}`);
                continue;
            }

            const data = await response.json();
            for (const [id, priceData] of Object.entries(data)) {
                allPrices[id] = (priceData as any)?.[vsCurrency] || 0;
            }
        }

        setCachedPrices(allPrices);

        // Return only requested ids
        const result: Record<string, number> = {};
        coingeckoIds.forEach(id => { result[id] = allPrices[id] || 0; });
        return result;

    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        // Fallback to cache if available
        if (cached) {
            const result: Record<string, number> = {};
            coingeckoIds.forEach(id => { result[id] = cached.prices[id] || 0; });
            return result;
        }
        return {};
    }
};

// --- Search Crypto Assets (autocomplete) ---
export interface CoinGeckoSearchResult {
    id: string;         // coingecko id
    name: string;       // e.g. "Bitcoin"
    symbol: string;     // e.g. "btc"
    thumb: string;      // small icon URL
    market_cap_rank: number | null;
}

// Search cache per query (session only)
const searchCache = new Map<string, { results: CoinGeckoSearchResult[]; ts: number }>();

export const searchCryptoAsset = async (query: string): Promise<CoinGeckoSearchResult[]> => {
    if (!query || query.length < 2) return [];

    const q = query.toLowerCase().trim();
    const cached = searchCache.get(q);
    if (cached && Date.now() - cached.ts < 60_000) return cached.results;

    try {
        const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(q)}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`CoinGecko search error: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const results: CoinGeckoSearchResult[] = (data.coins || [])
            .slice(0, 15)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                symbol: c.symbol,
                thumb: c.thumb,
                market_cap_rank: c.market_cap_rank,
            }));

        searchCache.set(q, { results, ts: Date.now() });
        return results;

    } catch (error) {
        console.error('Error searching crypto:', error);
        return [];
    }
};

// --- Popular Coins List (for quick add) ---
export const POPULAR_COINS: { id: string; name: string; symbol: string }[] = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
    { id: 'ripple', name: 'XRP', symbol: 'XRP' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
    { id: 'tron', name: 'TRON', symbol: 'TRX' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
    { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
    { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
    { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
    { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
    { id: 'matic-network', name: 'Polygon', symbol: 'POL' },
    { id: 'tether', name: 'Tether', symbol: 'USDT' },
    { id: 'usd-coin', name: 'USDC', symbol: 'USDC' },
];

// --- CSV Export Helper ---
export const exportToCSV = (
    headers: string[],
    rows: (string | number)[][],
    filename: string
) => {
    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            row.map(cell => {
                const str = String(cell);
                // Escape commas and quotes
                return str.includes(',') || str.includes('"')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};
