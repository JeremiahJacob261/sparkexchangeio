# API Documentation

This directory contains the backend API routes for the SparkExchange application, built using Next.js App Router. The API serves as a bridge between the frontend, the Supabase database, and the external ChangeNOW API.

## File Structure

- `admin/` - Administrative endpoints
  - `login/route.ts` - Admin authentication
  - `transactions/route.ts` - Admin dashboard data and analytics
- `changenow/` - ChangeNOW integration endpoints
  - `currencies/route.ts` - Available cryptocurrencies
  - `estimate/route.ts` - Exchange rate estimation
  - `exchange/route.ts` - Transaction creation
  - `min-amount/route.ts` - Minimum exchange amounts
  - `transaction/[id]/route.ts` - Transaction status polling

---

## Authentication

### Admin Authentication
The application uses a simple cookie-based authentication for the admin panel.
- **Cookie Name**: `admin_session`
- **Value**: `authenticated`
- **Security**: `httpOnly`, `secure` (in production)

---

## Endpoint Details

### 1. Admin Login
**File**: `src/app/api/admin/login/route.ts`
**Method**: `POST`

Handles administrator login. Currently uses hardcoded credentials.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin" // Hardcoded for prototype
}
```

**Response:**
- `200 OK`: Login successful (Sets `admin_session` cookie)
- `401 Unauthorized`: Invalid credentials

---

### 2. Admin Transactions
**File**: `src/app/api/admin/transactions/route.ts`
**Method**: `GET`
**Protected**: Yes (Requires `admin_session` cookie)

Fetches transaction history and calculates platform analytics.

**Response:**
```json
{
  "success": true,
  "transactions": [ ... ], // Array of Supabase transaction records
  "analytics": {
    "totalTransactions": number,
    "totalVolume": number, // Raw sum of 'to_amount'
    "successRate": string // Percentage formatted to 1 decimal
  }
}
```

---

### 3. Get Currencies
**File**: `src/app/api/changenow/currencies/route.ts`
**Method**: `GET`
**Caching**: 5 minutes (`next: { revalidate: 300 }`)

Fetches list of available cryptocurrencies from ChangeNOW.

**Query Parameters:**
- `network` (optional): Filter currencies by network (e.g., 'eth', 'bsc').
- `active` (optional): Set 'false' to include inactive currencies (default: true).

**Response:**
Returns a filtered and optimized list of currencies containing minimal payloads (ticker, name, image, network).

---

### 4. Get Exchange Estimate
**File**: `src/app/api/changenow/estimate/route.ts`
**Method**: `GET`

Calculates the estimated exchange amount.
**IMPORTANT**: This endpoint automatically applies a **1% markup** to the received amount.

**Query Parameters:**
- `fromCurrency`: Source currency ticker (e.g., 'btc')
- `toCurrency`: Destination currency ticker (e.g., 'eth')
- `fromAmount`: Amount to send
- `fromNetwork` (optional): Specific network for source
- `toNetwork` (optional): Specific network for destination
- `flow`: 'standard' or 'fixed-rate'

**Response:**
```json
{
  "success": true,
  "estimate": {
    "fromCurrency": "btc",
    "toCurrency": "eth",
    "fromAmount": 1.0,
    "toAmount": 14.85, // User receives this (Original - Markup)
    "originalToAmount": 15.0, // Actual rate from ChangeNOW
    "markupPercentage": 1,
    ...
  }
}
```

---

### 5. Create Exchange
**File**: `src/app/api/changenow/exchange/route.ts`
**Method**: `POST`

Creates a new transaction.
- Validates wallet addresses.
- Creates transaction in ChangeNOW.
- detailed records in Supabase `transactions` table.

**Request Body:**
```json
{
  "fromCurrency": "btc",
  "toCurrency": "eth",
  "fromAmount": 0.5,
  "address": "0x...", // User's receiving address
  "fromNetwork": "btc", 
  "toNetwork": "eth"
}
```

**Response:**
Returns deposit instructions including `payinAddress` where the user should send funds.

---

### 6. Get Minimum Amount
**File**: `src/app/api/changenow/min-amount/route.ts`
**Method**: `GET`

Determines the minimum allowed amount for a specific pair.

**Query Parameters:**
- `fromCurrency`
- `toCurrency`
- `fromNetwork` (optional)
- `toNetwork` (optional)

**Response:**
```json
{
  "success": true,
  "range": {
    "minAmount": 0.002,
    "maxAmount": null,
    ...
  }
}
```

---

### 7. Get Transaction Status
**File**: `src/app/api/changenow/transaction/[id]/route.ts`
**Method**: `GET`

Polls the status of a specific transaction ID.
- Fetches latest status from ChangeNOW.
- Syncs the status to Supabase `transactions` table.
- Maps statuses: `waiting` -> `AWAITING_DEPOSIT`, `finished` -> `COMPLETED`, etc.

**Response:**
```json
{
  "success": true,
  "status": "waiting", // Current ChangeNOW status
  "payinAddress": "...",
  "payinHash": "...", // Incoming tx hash (if detected)
  "payoutHash": "...", // Outgoing tx hash (if sent)
  ...
}
```

## External Dependencies
- **ChangeNOW API v2**: `https://api.changenow.io/v2`
- **Supabase**: Used for persistent transaction history.
- **Environment Variables**:
  - `CHANGENOW_API_KEY`: Required for all `changenow/*` routes.
