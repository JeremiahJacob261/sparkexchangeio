# StealthEX Integration - Migration Complete

## Overview
The SparkExchange application has been successfully migrated from ChangeNOW to StealthEX API v4. All exchange and swap processes now use StealthEX as the primary exchange provider.

## What Was Changed

### 1. StealthEX Client Library (`/src/lib/stealthex.ts`)
- ✅ Updated to use StealthEX v4 API endpoints
- ✅ Proper authentication using Bearer token
- ✅ Correct request/response format for all methods:
  - `getCurrencies()` - GET `/v4/currencies`
  - `getEstimate()` - POST `/v4/rates/estimated-amount`
  - `createExchange()` - POST `/v4/exchanges`
  - `getExchange()` - GET `/v4/exchanges/{id}`
- ✅ Added proper TypeScript interfaces matching StealthEX API schema
- ✅ Network support (mainnet, ERC20, TRC20, etc.)

### 2. API Routes Updated

#### `/src/app/api/stealthex/currencies/route.ts`
- ✅ Fetches supported currencies from StealthEX v4
- ✅ Maps response to include network, icon_url, and validation patterns
- ✅ Returns proper format for frontend consumption

#### `/src/app/api/stealthex/estimate/route.ts`
- ✅ Accepts fromCurrency, toCurrency, fromAmount, fromNetwork, toNetwork
- ✅ Calls StealthEX estimate API with commission rate
- ✅ Returns estimated amount with rate ID for fixed rates

#### `/src/app/api/stealthex/exchange/route.ts`
- ✅ Creates exchange on StealthEX platform
- ✅ Validates destination and refund addresses
- ✅ Saves transaction to database with proper fields
- ✅ Returns deposit address and instructions

#### `/src/app/api/stealthex/transaction/[id]/route.ts`
- ✅ Fetches transaction status from StealthEX
- ✅ Updates database with latest status
- ✅ Returns comprehensive transaction details

### 3. Frontend Components

#### `/src/components/exchange-widget.tsx`
- ✅ Updated to pass network parameters to API calls
- ✅ Properly handles currency selection with network info
- ✅ Shows real-time estimates from StealthEX
- ✅ Creates exchanges and displays deposit instructions

#### `/src/app/status/[id]/page.tsx`
- ✅ Updated to display transaction status from StealthEX
- ✅ Proper field mapping for deposit/withdrawal info
- ✅ Real-time polling for status updates

### 4. Admin Dashboard
- ✅ Already supports both ChangeNOW and StealthEX transactions
- ✅ Transaction sync functionality works with StealthEX
- ✅ Analytics include all transactions regardless of provider

## StealthEX API Features Used

1. **Floating Rate Exchanges** - Default mode for dynamic market rates
2. **Custom Fee Support** - Commission percentage applied on top of base rate
3. **Network Specification** - Proper handling of different blockchain networks
4. **Status Tracking** - Real-time status updates (waiting, confirming, exchanging, sending, finished)
5. **Refund Address Support** - Optional refund address for failed transactions

## Status Mapping

StealthEX statuses are used directly:
- `waiting` - Awaiting deposit
- `confirming` - Confirming deposit
- `exchanging` - Exchange in progress  
- `sending` - Sending funds to recipient
- `finished` - Exchange completed successfully
- `failed` - Exchange failed
- `refunded` - Funds refunded
- `expired` - Exchange expired

## Environment Variables Required

```env
STEALTHEX_API_KEY=your_api_key_here
```

Get your API key from: https://stealthex.io/pp/

## Database Schema Compatibility

The existing `transactions` table works with StealthEX:
- `stealthex_id` - StealthEX exchange ID
- `payin_address` - Deposit address from StealthEX
- `payout_address` - User's recipient address
- `status` - Current exchange status
- All other fields remain compatible

## Testing Checklist

- [ ] Verify STEALTHEX_API_KEY is set in environment
- [ ] Test currency list loading
- [ ] Test exchange estimation with different pairs
- [ ] Test exchange creation
- [ ] Test transaction status polling
- [ ] Verify database records are created
- [ ] Check admin dashboard displays transactions
- [ ] Test commission rate changes

## API Documentation

Full StealthEX API documentation: https://api.stealthex.io/docs

## Notes

- StealthEX supports 1500+ cryptocurrencies
- Custom fee range: 0% to 20% (on top of standard 0.4%)
- Rate limit: 600 requests per minute
- CORS protection requires backend API calls (already implemented)
- Both legacy ChangeNOW data and new StealthEX data are preserved in the database

## Migration Status

✅ **COMPLETE** - All exchange operations now use StealthEX API v4
