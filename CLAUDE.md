# Invoice Generator — Client-Side Privacy-First

## Was ist das?
Ein kostenloser Rechnungsgenerator der 100% im Browser laeuft. Keine Daten werden hochgeladen.
Zielgruppe: Freelancer (global EN, optional DE).

## Tech Stack
- Vanilla HTML/CSS/JS (kein Framework)
- jsPDF fuer PDF-Generierung
- localStorage fuer gespeicherte Firmendaten
- Kein Server, kein Backend, kein Tracking

## MVP Features
1. **Absender-Daten** (Name, Adresse, Email, Steuernr/USt-IdNr) — speicherbar in localStorage
2. **Empfaenger-Daten** (Name, Adresse)
3. **Rechnungsdetails** (Rechnungsnr, Datum, Faelligkeitsdatum, Waehrung)
4. **Positionen** (Beschreibung, Menge, Einzelpreis, Gesamt) — dynamisch hinzufuegen/entfernen
5. **Steuer** (MwSt-Satz konfigurierbar, Netto/Brutto Berechnung)
6. **Bankverbindung** (IBAN, BIC, Bankname) — speicherbar
7. **PDF-Export** mit professionellem Layout
8. **Responsive Design** — Mobile + Desktop

## GoBD-Pflichtfelder (deutsche Rechnungen)
- Vollstaendiger Name + Anschrift Leistender
- Vollstaendiger Name + Anschrift Empfaenger  
- Steuernummer oder USt-IdNr
- Rechnungsdatum
- Fortlaufende Rechnungsnummer
- Menge und Art der Lieferung/Leistung
- Zeitpunkt der Lieferung/Leistung
- Nettobetrag
- Steuersatz + Steuerbetrag
- Bruttobetrag

## Design
- Clean, modern, professional
- Weiss/Grau mit einem Akzent (z.B. #2563eb blau)
- Print-optimiert (PDF soll gut aussehen)
- Mobile-first responsive

## Dateien
- index.html — Hauptseite mit Formular + Live-Vorschau
- style.css — Styling
- app.js — Logik, localStorage, PDF-Generierung
- jspdf.umd.min.js — jsPDF Library (CDN oder lokal)

## Wichtig
- KEIN Server-Code
- KEIN Tracking/Analytics
- KEIN Cookie-Banner noetig (nur localStorage fuer eigene Daten)
- Sprache: Englisch UI, mit Option fuer DE-Labels auf der Rechnung
- Privacy-Banner: "Your data never leaves your browser"
