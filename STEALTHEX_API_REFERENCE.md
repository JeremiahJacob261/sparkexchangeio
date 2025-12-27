# StealthEX API Quick Reference

## Key Differences from ChangeNOW

### 1. Network Parameter Required
StealthEX requires explicit network specification for each currency:
- Bitcoin: `mainnet`
- Ethereum tokens: `mainnet` (native ETH) or specific network
- USDT can be: `mainnet` (ERC20), `tron` (TRC20), `bsc` (BEP20), etc.

### 2. Request Structure
All estimate and exchange requests use nested route objects:
```typescript
{
  route: {
    from: { symbol: "btc", network: "mainnet" },
    to: { symbol: "eth", network: "mainnet" }
  },
  amount: 0.1,
  estimation: "direct",
  rate: "floating"
}
```

### 3. Response Structure
Exchange responses include separate deposit and withdrawal objects:
```typescript
{
  id: "exchangeId",
  status: "waiting",
  deposit: {
    symbol: "btc",
    network: "mainnet",
    address: "bc1q...",
    expected_amount: 0.1,
    amount: 0,
    extra_id: null,
    tx_hash: null
  },
  withdrawal: {
    symbol: "eth",
    network: "mainnet",
    address: "0x...",
    expected_amount: 1.79,
    amount: 0,
    extra_id: null,
    tx_hash: null
  }
}
```

## API Endpoints Used

| Purpose | Method | Endpoint | Body/Query |
|---------|--------|----------|------------|
| List Currencies | GET | `/v4/currencies` | Query: limit, offset, network, rate |
| Estimate | POST | `/v4/rates/estimated-amount` | Body: route, amount, estimation, rate |
| Create Exchange | POST | `/v4/exchanges` | Body: route, amount, estimation, rate, address |
| Get Exchange | GET | `/v4/exchanges/{id}` | - |

## Authentication
Uses Bearer token in header:
```
Authorization: Bearer YOUR_API_KEY
```

## Common Status Values
- `waiting` - Awaiting user deposit
- `confirming` - Confirming blockchain transaction
- `exchanging` - Performing the exchange
- `sending` - Sending to recipient
- `verifying` - Additional verification (rare)
- `finished` - Successfully completed
- `failed` - Exchange failed
- `refunded` - Funds refunded to user
- `expired` - Exchange expired

## Custom Fee
StealthEX charges 0.4% base fee. You can add additional fee:
- Parameter: `additional_fee_percent`
- Range: 0 to 20 (%)
- Example: 0.6 = 0.6% additional fee (making total 1%)

## Networks Reference

Common network identifiers:
- `mainnet` - Bitcoin, Ethereum, most base layer blockchains
- `bsc` - Binance Smart Chain (BEP20)
- `tron` - Tron Network (TRC20)
- `polygon` - Polygon Network
- `arbitrum` - Arbitrum
- `optimism` - Optimism
- `avalanche` - Avalanche C-Chain

Always check the `/v4/currencies` endpoint for the exact network identifier for each currency.

## Error Handling

StealthEX returns errors in this format:
```json
{
  "err": {
    "kind": "InvalidAmount",
    "details": "Amount is below minimum"
  }
}
```

Common error kinds:
- `InvalidAmount` - Amount outside valid range
- `NoPair` - Currency pair not supported
- `NotAllowed` - Operation not allowed
- `RouteIsDisabled` - Route temporarily disabled
- `MarketUnavailable` - Market conditions prevent exchange
- `RateId` - Invalid or expired rate ID (for fixed rates)

## Rate Limits
- 600 requests per minute
- Returns HTTP 429 when limit exceeded
- Check `Retry-After` header for wait time

## Important Notes

1. **Client-side CORS**: StealthEX blocks client-side JavaScript requests. All API calls must go through your backend (already implemented).

2. **Network Matching**: Always ensure the network parameter matches the actual currency network. Using wrong network can result in lost funds.

3. **Address Validation**: Always validate recipient addresses client-side before submitting to API.

4. **Fixed vs Floating**: 
   - Floating: Rate changes based on market (default)
   - Fixed: Rate locked for specified time (requires rate_id from estimate)

5. **Extra ID**: Some currencies (like XRP, XLM) require memo/destination tag. Check `extra_id` field in currency data.

## Testing

Use small amounts first:
1. Test with minimum amounts (usually 0.001-0.01)
2. Verify deposit address generation
3. Test status polling
4. Confirm database recording

## Support
- Email: support@stealthex.io
- Partner support: partners@stealthex.io
- Docs: https://api.stealthex.io/docs
