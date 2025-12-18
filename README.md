# SparkExchange

A Next.js application for cryptocurrency exchange using the ChangeNow API, focused on Polygon (MATIC) network token swaps.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager
- ChangeNow API key (see [ChangeNow API Setup](#changenow-api-setup) below)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# ChangeNow API Configuration
CHANGENOW_API_KEY=your_changenow_api_key_here
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## ChangeNow API Setup

### Getting Your API Key

1. Visit [ChangeNow API](https://changenow.io/api)
2. Sign up for a partner account or contact **partners@changenow.io**
3. Once approved, you'll receive your API key
4. Add the API key to your `.env.local` file as shown above

### API Features

This integration supports:
- ✅ Polygon (MATIC) network tokens only
- ✅ Standard and fixed-rate exchange flows
- ✅ Exchange estimates and minimum amounts
- ✅ Transaction creation with deposit address generation
- ✅ Real-time transaction status tracking

---

## ChangeNow API Endpoints

All endpoints are available at `/api/changenow/...`

### 1. Get Available Currencies

Fetches available currencies on the Polygon network.

**Endpoint:** `GET /api/changenow/currencies`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `network` | string | `matic` | Filter by network |
| `active` | boolean | `true` | Only return active currencies |

**Example Request:**
```bash
curl "http://localhost:3000/api/changenow/currencies?network=matic"
```

**Example Response:**
```json
{
  "success": true,
  "network": "matic",
  "currencies": [
    {
      "ticker": "matic",
      "name": "Polygon",
      "network": "matic",
      "image": "https://...",
      "hasExternalId": false,
      "isFiat": false
    }
  ],
  "total": 25
}
```

---

### 2. Get Exchange Estimate

Get the estimated amount you'll receive for an exchange.

**Endpoint:** `GET /api/changenow/estimate`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `fromCurrency` | string | Yes | - | Source currency ticker |
| `toCurrency` | string | Yes | - | Target currency ticker |
| `fromAmount` | number | Yes | - | Amount to exchange |
| `fromNetwork` | string | No | `matic` | Source network |
| `toNetwork` | string | No | `matic` | Target network |
| `flow` | string | No | `standard` | `standard` or `fixed-rate` |

**Example Request:**
```bash
curl "http://localhost:3000/api/changenow/estimate?fromCurrency=matic&toCurrency=usdc&fromAmount=100"
```

**Example Response:**
```json
{
  "success": true,
  "estimate": {
    "fromCurrency": "matic",
    "toCurrency": "usdc",
    "fromAmount": 100,
    "toAmount": 45.5,
    "flow": "standard",
    "fromNetwork": "matic",
    "toNetwork": "matic",
    "rateId": null,
    "validUntil": null
  }
}
```

---

### 3. Get Minimum Exchange Amount

Get the minimum (and maximum for fixed-rate) exchange amount for a currency pair.

**Endpoint:** `GET /api/changenow/min-amount`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `fromCurrency` | string | Yes | - | Source currency ticker |
| `toCurrency` | string | Yes | - | Target currency ticker |
| `fromNetwork` | string | No | `matic` | Source network |
| `toNetwork` | string | No | `matic` | Target network |
| `flow` | string | No | `standard` | `standard` or `fixed-rate` |

**Example Request:**
```bash
curl "http://localhost:3000/api/changenow/min-amount?fromCurrency=matic&toCurrency=usdc"
```

**Example Response:**
```json
{
  "success": true,
  "range": {
    "fromCurrency": "matic",
    "toCurrency": "usdc",
    "minAmount": 1.5,
    "maxAmount": null,
    "fromNetwork": "matic",
    "toNetwork": "matic",
    "flow": "standard"
  }
}
```

---

### 4. Create Exchange Transaction

Create a new exchange transaction and get a deposit address.

**Endpoint:** `POST /api/changenow/exchange`

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `fromCurrency` | string | Yes | - | Source currency ticker |
| `toCurrency` | string | Yes | - | Target currency ticker |
| `fromAmount` | number | Yes | - | Amount to exchange |
| `address` | string | Yes | - | User's wallet address to receive tokens |
| `fromNetwork` | string | No | `matic` | Source network |
| `toNetwork` | string | No | `matic` | Target network |
| `refundAddress` | string | No | - | Address for refunds if transaction fails |
| `refundExtraId` | string | No | - | Extra ID for refund address |
| `extraId` | string | No | - | Extra ID for destination address (memo, tag) |
| `flow` | string | No | `standard` | `standard` or `fixed-rate` |
| `rateId` | string | No* | - | Required for fixed-rate exchanges |

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/changenow/exchange" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCurrency": "matic",
    "toCurrency": "usdc",
    "fromAmount": 100,
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "refundAddress": "0xabcdef1234567890abcdef1234567890abcdef12"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "exchange": {
    "id": "abc123def456",
    "payinAddress": "0x9876543210fedcba9876543210fedcba98765432",
    "payoutAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "fromCurrency": "matic",
    "toCurrency": "usdc",
    "fromAmount": "100",
    "toAmount": "45.5",
    "fromNetwork": "matic",
    "toNetwork": "matic",
    "flow": "standard",
    "payinExtraId": null,
    "status": "waiting",
    "createdAt": "2024-12-18T06:15:00.000Z"
  },
  "instructions": {
    "message": "Send 100 MATIC to the payinAddress below",
    "payinAddress": "0x9876543210fedcba9876543210fedcba98765432",
    "payinExtraId": null,
    "note": "Check transaction status using GET /api/changenow/transaction/[id]"
  }
}
```

---

### 5. Get Transaction Status

Check the status of an exchange transaction.

**Endpoint:** `GET /api/changenow/transaction/[id]`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Transaction ID from the exchange creation |

**Example Request:**
```bash
curl "http://localhost:3000/api/changenow/transaction/abc123def456"
```

**Example Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "abc123def456",
    "status": "finished",
    "fromCurrency": "matic",
    "toCurrency": "usdc",
    "fromAmount": "100",
    "toAmount": "45.5",
    "fromNetwork": "matic",
    "toNetwork": "matic",
    "payinAddress": "0x9876543210fedcba9876543210fedcba98765432",
    "payoutAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "payinHash": "0xabc123...",
    "payoutHash": "0xdef456...",
    "expectedAmountFrom": "100",
    "expectedAmountTo": "45.5",
    "amountFrom": "100",
    "amountTo": "45.48",
    "updatedAt": "2024-12-18T06:20:00.000Z"
  },
  "statusDescription": "Transaction completed successfully! Tokens have been sent to your wallet.",
  "isCompleted": true,
  "isFailed": false
}
```

**Transaction Status Values:**
| Status | Description |
|--------|-------------|
| `new` | Transaction created, waiting for deposit |
| `waiting` | Waiting for deposit to arrive |
| `confirming` | Deposit received, waiting for confirmations |
| `exchanging` | Exchange in progress |
| `sending` | Sending exchanged tokens to user |
| `finished` | ✅ Transaction completed successfully |
| `failed` | ❌ Transaction failed |
| `refunded` | Transaction was refunded |
| `expired` | Transaction expired (no deposit received) |

---

## Typical Exchange Flow

1. **Get available currencies**
   ```
   GET /api/changenow/currencies
   ```

2. **Check minimum amount**
   ```
   GET /api/changenow/min-amount?fromCurrency=matic&toCurrency=usdc
   ```

3. **Get exchange estimate**
   ```
   GET /api/changenow/estimate?fromCurrency=matic&toCurrency=usdc&fromAmount=100
   ```

4. **Create exchange transaction**
   ```
   POST /api/changenow/exchange
   {
     "fromCurrency": "matic",
     "toCurrency": "usdc",
     "fromAmount": 100,
     "address": "0x..."
   }
   ```

5. **User sends tokens to the `payinAddress`**

6. **Poll for transaction status**
   ```
   GET /api/changenow/transaction/{id}
   ```
   Keep polling until `isCompleted` is `true` or `isFailed` is `true`

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": { ... },
  "message": "Additional context"
}
```

**Common HTTP Status Codes:**
| Code | Description |
|------|-------------|
| `400` | Bad request (missing or invalid parameters) |
| `404` | Resource not found (e.g., transaction ID) |
| `500` | Server error (API key not configured, etc.) |

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [ChangeNow API Documentation](https://changenow.io/api)
- [Polygon Network](https://polygon.technology/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
