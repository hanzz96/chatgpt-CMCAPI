import axios from "axios";

/**
 * this function call API CMC to get latest cryptocurrency price based on slug
 * @param {*} symbol 
 * @param {*} slug 
 * @returns 
 */
export async function getCryptoPrice(symbol, slug) {
    try {
        const response = await axios.get(`${process.env.URL_COIN_MARKET_CAP}/v2/cryptocurrency/quotes/latest`, {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.API_KEY_COIN_MARKET
            },
            params: {   
                // id:1,
                // symbol: symbol.toUpperCase(),
                slug: slug.toLowerCase()
            }
        });
        return response;
    } catch (error) {
        console.error('Error fetching cryptocurrency price:', error);
        return null;
    }
}

export async function getTopNCrypto(n = 100, typeCrypto = 'all') {
    try {
        const response = await axios.get(`${process.env.URL_COIN_MARKET_CAP}/v1/cryptocurrency/listings/latest?start=1&limit=${n}&cryptocurrency_type=${typeCrypto}`, {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.API_KEY_COIN_MARKET
            },
            params: {   
                
            }
        });
        return response;
    } catch (error) {
        console.error('Error fetching cryptocurrency price:', error);
        return null;
    }
}

/**
 * im not using this.
 * @param {} symbol 
 * @param {*} slug 
 * @returns 
 */
export async function getCryptoCurrencyMap(symbol, slug) {
    try {
        const response = await axios.get(`${process.env.URL_COIN_MARKET_CAP}/v1/cryptocurrency/map`, {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.API_KEY_COIN_MARKET
            },
            params: {   
                symbol: symbol.toUpperCase(),
            }
        });
        return response;
    } catch (error) {
        console.error('Error fetching cryptocurrency price:', error);
        return null;
    }
}