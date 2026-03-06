# Invoice Generator — Free & Private

Create professional invoices directly in your browser. No signup, no data uploaded, no tracking. Your files never leave your device.

**[→ Use it now](https://purpledoubled.github.io/invoice-generator/)**

## Features

- 📝 **Professional PDF Export** — Clean, print-ready invoices via jsPDF
- 🔒 **100% Private** — Everything runs in your browser. Zero data leaves your device.
- 💾 **Save Your Details** — Store sender & bank info in localStorage (stays on your machine)
- ➕ **Dynamic Line Items** — Add/remove rows, auto-calculated totals
- 💰 **Tax Calculation** — Configurable tax rate, net/gross/tax breakdown
- 🏦 **Bank Details** — IBAN, BIC, bank name on every invoice
- 📱 **Mobile Responsive** — Works on phone, tablet, and desktop
- 🇩🇪 **GoBD-Compliant** — All required fields for German tax law

## GoBD Required Fields

German invoices must include: sender name & address, recipient name & address, tax ID or VAT number, invoice date, sequential invoice number, item descriptions with quantities, delivery date, net amount, tax rate & amount, gross total.

This tool includes all of them.

## Why This Exists

Most "free" invoice tools are actually SaaS products that harvest your data or push you into subscriptions. With Fiverr Workspace (AND.CO) shutting down in March 2026, freelancers need a simple, private alternative.

This tool is different:
- **No account** — just open and start
- **No server** — your data never touches the internet
- **No subscription** — free forever
- **No tracking** — zero analytics, zero cookies

## Tech Stack

- Vanilla HTML/CSS/JS (no framework)
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation
- localStorage for saving your details
- Zero dependencies, zero build step

## License

MIT

- [QR Code Generator](https://purpledoubled.github.io/qr-code-generator/) — Generate QR codes privately in your browser
