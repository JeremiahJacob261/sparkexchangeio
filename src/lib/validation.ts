
export const isValidPolygonAddress = (address: string): boolean => {
    // Polygon uses Ethereum-style addresses (0x followed by 40 hex characters)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
};

export const isValidBtcAddress = (address: string): boolean => {
    // Basic Regex for BTC addresses (Legacy, SegWit, Bech32)
    // Starts with 1, 3, or bc1
    const btcRegex = /^(1|3|bc1)[a-zA-Z0-9]{25,59}$/;
    return btcRegex.test(address);
};

export const isValidTrxAddress = (address: string): boolean => {
    // TRON addresses start with T and are 34 characters long
    const trxRegex = /^T[a-zA-Z0-9]{33}$/;
    return trxRegex.test(address);
};

export const validateAddress = (address: string, network: string): boolean => {
    const net = network.toLowerCase();
    if (net === 'matic' || net === 'eth' || net === 'bsc' || net === 'ethereum') return isValidPolygonAddress(address);
    if (net === 'btc' || net === 'bitcoin') return isValidBtcAddress(address);
    if (net === 'trx' || net === 'tron') return isValidTrxAddress(address);
    // Default fallback (lax)
    return address.length > 10;
};
