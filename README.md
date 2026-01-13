# Sage Embedded Services Demo

A demonstration web application showcasing Sage Embedded Services API capabilities for prospective customers. This app simulates a small business owner's experience while demonstrating core API features.

## Features

- **Authentication**: Simple login gate for demo access
- **Tenant Management**: Create and manage business tenants
- **Bank Accounts**: Add bank accounts with opening balances
- **Financial Years**: Set up accounting periods
- **CSV Upload**: Import bank payments and receipts from CSV files
- **P&L Reports**: Generate Profit & Loss reports

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Demo Login

- **Password**: `sage2024`

## Configuration

### Admin Settings

Navigate to **Admin Settings** to configure your Sage API credentials:

1. **OAuth Credentials**
   - Client ID
   - Client Secret

2. **Subscription Credentials**
   - Subscription Client ID
   - Subscription Client Secret

3. **Subscription Settings** (from [subscriptions endpoint](https://developer.columbus.sage.com/docs/services/sage-ses-subscriptions-api/operations/Tenants_GetSubscriptionAsync))
   - Product Code (e.g., `SAGE_ONE`)
   - Platform (e.g., `UK`)
   - Business Type Code (e.g., `SOLE_TRADER`)

### Tenant Selection

After creating tenants, use the dropdown in the sidebar to select the active tenant for all operations.

## CSV Format for Transactions

Upload bank payments and receipts using a CSV file with the following format:

```csv
date,type,description,reference,amount,category
2024-01-15,receipt,Client Payment - ABC Corp,INV-001,5000.00,Sales
2024-01-18,payment,Office Supplies,PO-123,150.00,Office Expenses
2024-01-20,receipt,Consulting Fee,INV-002,2500.00,Sales
2024-01-22,payment,Software Subscription,SUB-001,99.00,Software
2024-01-25,payment,Travel Expenses,EXP-001,350.00,Travel
2024-01-28,receipt,Product Sale,INV-003,1200.00,Sales
```

### Column Definitions

| Column | Description | Example |
|--------|-------------|---------|
| `date` | Transaction date (YYYY-MM-DD) | `2024-01-15` |
| `type` | Either `payment` or `receipt` | `receipt` |
| `description` | Transaction description | `Client Payment - ABC Corp` |
| `reference` | Reference number | `INV-001` |
| `amount` | Transaction amount | `5000.00` |
| `category` | Expense/income category | `Sales` |

A sample CSV file can be downloaded from the Transactions page.

## API Endpoints Used

This demo simulates the following Sage Embedded Services API endpoints:

- `POST /oauth/token` - Authentication
- `POST /tenants` - Create tenant
- `GET /tenants` - List tenants
- `POST /bank_accounts` - Create bank account
- `POST /bank_opening_balances` - Set opening balance
- `POST /financial_settings` - Create financial year
- `POST /bank_payments` - Create bank payment
- `POST /bank_receipts` - Create bank receipt
- `GET /reports/profit_and_loss` - Generate P&L report

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Router
- TanStack Query

## Data Storage

This demo stores all data locally in the browser using localStorage. In a production environment, data would be stored securely on the server and synced with Sage's API.

## API Documentation

For full API documentation, visit:
- [Sage Embedded Services OpenAPI](https://developer.columbus.sage.com/docs/services/sage-ses-core-api)
- [Subscriptions API](https://developer.columbus.sage.com/docs/services/sage-ses-subscriptions-api)

## License

Demo application for demonstration purposes only.
