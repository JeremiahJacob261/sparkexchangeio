# ✅ Reverted to ChangeNOW

**Date:** December 27, 2025

## Changes Made

All exchange and swap functionality has been switched back to **ChangeNOW API v2**.

### Updated Components

#### 1. Exchange Widget (`/src/components/exchange-widget.tsx`)
- ✅ Currency fetching: `/api/changenow/currencies`
- ✅ Estimate endpoint: `/api/changenow/estimate`
- ✅ Exchange creation: `/api/changenow/exchange`
- ✅ Status polling: `/api/changenow/transaction/[id]`

#### 2. Status Page (`/src/app/status/[id]/page.tsx`)
- ✅ Transaction status: `/api/changenow/transaction/[id]`
- ✅ Proper field mapping for ChangeNOW response

#### 3. Admin Dashboard (`/src/app/admin/dashboard/page.tsx`)
- ✅ Sync function uses ChangeNOW as primary provider
- ✅ Supports both `changenow_id` and `stealthex_id` in database

### ChangeNOW API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/api/changenow/currencies` | List available cryptocurrencies |
| `/api/changenow/estimate` | Get exchange rate estimate |
| `/api/changenow/exchange` | Create new exchange |
| `/api/changenow/transaction/[id]` | Get transaction status |

### Configuration Required

Add to `.env.local`:
```env
CHANGENOW_API_KEY=your_changenow_api_key_here
```

Get your API key from: https://changenow.io/for-partners

### Features

✅ **1% Markup** - Automatically applied on estimates  
✅ **Network Support** - Handles multiple blockchain networks  
✅ **Status Tracking** - Real-time transaction status updates  
✅ **Refund Addresses** - Optional refund address support  
✅ **Database Recording** - All transactions saved to Supabase  

### Status Values

ChangeNOW uses the following statuses:
- `waiting` - Awaiting deposit
- `confirming` - Confirming blockchain transaction
- `exchanging` - Performing exchange
- `sending` - Sending to recipient
- `finished` - Successfully completed
- `failed` - Exchange failed
- `refunded` - Funds refunded to user
- `expired` - Exchange window expired

### Database Compatibility

The `transactions` table works with both providers:
- `changenow_id` - ChangeNOW transaction ID
- `stealthex_id` - StealthEX transaction ID (legacy support)
- `payin_address` - Deposit address
- `payout_address` - Recipient address
- `status` - Transaction status

### StealthEX Files

StealthEX integration files remain in `/src/app/api/stealthex/` for potential future use or legacy transaction tracking, but are no longer actively used by the frontend.

## Current Status

✅ **ACTIVE PROVIDER: ChangeNOW**

The application is now fully using ChangeNOW for all new exchanges.
