/* === Invoice Generator — app.js === */
(function () {
  'use strict';

  /* --- Currency helpers --- */
  const CURRENCY_SYMBOLS = { EUR: '\u20ac', USD: '$', GBP: '\u00a3', CHF: 'Fr.' };

  function currencySymbol() {
    return CURRENCY_SYMBOLS[document.getElementById('currency').value] || '';
  }

  function fmt(n) {
    return n.toFixed(2);
  }

  /* --- DOM refs --- */
  const itemsBody = document.getElementById('items-body');
  const taxRateInput = document.getElementById('tax-rate');
  const taxRateDisplay = document.getElementById('tax-rate-display');
  const subtotalEl = document.getElementById('subtotal');
  const taxAmountEl = document.getElementById('tax-amount');
  const grandTotalEl = document.getElementById('grand-total');

  /* --- Privacy banner --- */
  (function () {
    const banner = document.getElementById('privacy-banner');
    const dismiss = document.getElementById('dismiss-banner');
    if (localStorage.getItem('banner-dismissed') === '1') {
      banner.classList.add('hidden');
    }
    dismiss.addEventListener('click', function () {
      banner.classList.add('hidden');
      localStorage.setItem('banner-dismissed', '1');
    });
  })();

  /* --- Set default dates --- */
  (function () {
    var today = new Date().toISOString().slice(0, 10);
    document.getElementById('invoice-date').value = today;
    document.getElementById('delivery-date').value = today;
    var due = new Date();
    due.setDate(due.getDate() + 14);
    document.getElementById('due-date').value = due.toISOString().slice(0, 10);
  })();

  /* --- Line items --- */
  var itemCounter = 0;

  function addItemRow(desc, qty, price) {
    itemCounter++;
    var tr = document.createElement('tr');
    tr.dataset.id = itemCounter;
    tr.innerHTML =
      '<td><input type="text" class="item-desc" placeholder="Description" value="' + escAttr(desc || '') + '"></td>' +
      '<td><input type="number" class="item-qty" min="0" step="1" value="' + (qty || 1) + '"></td>' +
      '<td><input type="number" class="item-price" min="0" step="0.01" value="' + (price || '0.00') + '"></td>' +
      '<td class="item-total-display">' + fmt((qty || 1) * (price || 0)) + '</td>' +
      '<td><button type="button" class="btn-remove" title="Remove">&times;</button></td>';
    itemsBody.appendChild(tr);
    recalc();

    /* attach events */
    var inputs = tr.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('input', function () { recalcRow(tr); });
    }
    tr.querySelector('.btn-remove').addEventListener('click', function () {
      tr.remove();
      recalc();
    });
  }

  function escAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function recalcRow(tr) {
    var qty = parseFloat(tr.querySelector('.item-qty').value) || 0;
    var price = parseFloat(tr.querySelector('.item-price').value) || 0;
    tr.querySelector('.item-total-display').textContent = fmt(qty * price);
    recalc();
  }

  function recalc() {
    var rows = itemsBody.querySelectorAll('tr');
    var subtotal = 0;
    for (var i = 0; i < rows.length; i++) {
      var qty = parseFloat(rows[i].querySelector('.item-qty').value) || 0;
      var price = parseFloat(rows[i].querySelector('.item-price').value) || 0;
      subtotal += qty * price;
    }
    var taxRate = parseFloat(taxRateInput.value) || 0;
    var taxAmt = subtotal * taxRate / 100;
    var grand = subtotal + taxAmt;

    subtotalEl.textContent = fmt(subtotal);
    taxAmountEl.textContent = fmt(taxAmt);
    grandTotalEl.textContent = fmt(grand);
    taxRateDisplay.textContent = taxRate;
  }

  document.getElementById('add-item').addEventListener('click', function () {
    addItemRow('', 1, 0);
  });

  taxRateInput.addEventListener('input', recalc);

  /* start with one row */
  addItemRow('', 1, 0);

  /* --- localStorage: Sender --- */
  var SENDER_FIELDS = ['sender-name', 'sender-email', 'sender-address', 'sender-tax-id', 'sender-phone'];

  document.getElementById('save-sender').addEventListener('click', function () {
    var data = {};
    SENDER_FIELDS.forEach(function (id) { data[id] = document.getElementById(id).value; });
    localStorage.setItem('invoice-sender', JSON.stringify(data));
    flash(this, 'Saved!');
  });

  document.getElementById('load-sender').addEventListener('click', function () {
    var raw = localStorage.getItem('invoice-sender');
    if (!raw) { flash(this, 'No saved data'); return; }
    var data = JSON.parse(raw);
    SENDER_FIELDS.forEach(function (id) {
      if (data[id] !== undefined) document.getElementById(id).value = data[id];
    });
    flash(this, 'Loaded!');
  });

  /* --- localStorage: Bank --- */
  var BANK_FIELDS = ['bank-name', 'bank-iban', 'bank-bic'];

  document.getElementById('save-bank').addEventListener('click', function () {
    var data = {};
    BANK_FIELDS.forEach(function (id) { data[id] = document.getElementById(id).value; });
    localStorage.setItem('invoice-bank', JSON.stringify(data));
    flash(this, 'Saved!');
  });

  document.getElementById('load-bank').addEventListener('click', function () {
    var raw = localStorage.getItem('invoice-bank');
    if (!raw) { flash(this, 'No saved data'); return; }
    var data = JSON.parse(raw);
    BANK_FIELDS.forEach(function (id) {
      if (data[id] !== undefined) document.getElementById(id).value = data[id];
    });
    flash(this, 'Loaded!');
  });

  /* auto-load saved data on page load */
  (function () {
    var sender = localStorage.getItem('invoice-sender');
    if (sender) {
      var data = JSON.parse(sender);
      SENDER_FIELDS.forEach(function (id) {
        if (data[id]) document.getElementById(id).value = data[id];
      });
    }
    var bank = localStorage.getItem('invoice-bank');
    if (bank) {
      var data2 = JSON.parse(bank);
      BANK_FIELDS.forEach(function (id) {
        if (data2[id]) document.getElementById(id).value = data2[id];
      });
    }
  })();

  function flash(btn, msg) {
    var orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = orig; }, 1200);
  }

  /* ===========================
     PDF GENERATION (jsPDF)
     =========================== */
  document.getElementById('generate-pdf').addEventListener('click', generatePDF);

  function generatePDF() {
    /* Validate required fields */
    var form = document.getElementById('invoice-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4' });

    var pageW = 210;
    var marginL = 20;
    var marginR = 20;
    var contentW = pageW - marginL - marginR;
    var y = 20;

    var accentR = 37, accentG = 99, accentB = 235; // #2563eb
    var darkR = 31, darkG = 41, darkB = 55;         // #1f2937
    var lightR = 107, lightG = 114, lightB = 128;   // #6b7280

    /* --- Helper --- */
    function setFont(style, size) {
      doc.setFontSize(size);
      if (style === 'bold') {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
    }

    function checkPage(needed) {
      if (y + needed > 280) {
        doc.addPage();
        y = 20;
      }
    }

    function val(id) { return document.getElementById(id).value.trim(); }

    /* --- Collect form data --- */
    var senderName = val('sender-name');
    var senderAddress = val('sender-address');
    var senderEmail = val('sender-email');
    var senderPhone = val('sender-phone');
    var senderTaxId = val('sender-tax-id');

    var recipientName = val('recipient-name');
    var recipientAddress = val('recipient-address');

    var invoiceNumber = val('invoice-number');
    var invoiceDate = val('invoice-date');
    var dueDate = val('due-date');
    var deliveryDate = val('delivery-date');
    var currency = val('currency');
    var sym = CURRENCY_SYMBOLS[currency] || currency;
    var taxRate = parseFloat(taxRateInput.value) || 0;

    var bankName = val('bank-name');
    var bankIban = val('bank-iban');
    var bankBic = val('bank-bic');
    var notes = val('notes');

    /* --- HEADER: "INVOICE" title --- */
    doc.setTextColor(accentR, accentG, accentB);
    setFont('bold', 26);
    doc.text('INVOICE', marginL, y);

    /* Invoice number right-aligned */
    setFont('normal', 10);
    doc.setTextColor(lightR, lightG, lightB);
    doc.text('#' + invoiceNumber, pageW - marginR, y, { align: 'right' });
    y += 12;

    /* --- Sender & Recipient side by side --- */
    var colW = contentW / 2;

    /* Sender (left) */
    doc.setTextColor(lightR, lightG, lightB);
    setFont('bold', 8);
    doc.text('FROM', marginL, y);
    y += 5;

    doc.setTextColor(darkR, darkG, darkB);
    setFont('bold', 10);
    doc.text(senderName, marginL, y);

    /* Recipient (right) */
    var recY = y - 5;
    doc.setTextColor(lightR, lightG, lightB);
    setFont('bold', 8);
    doc.text('TO', marginL + colW + 10, recY);
    recY += 5;

    doc.setTextColor(darkR, darkG, darkB);
    setFont('bold', 10);
    doc.text(recipientName, marginL + colW + 10, recY);

    y += 5;
    recY += 5;

    setFont('normal', 9);
    doc.setTextColor(darkR, darkG, darkB);

    /* Sender details */
    var senderLines = doc.splitTextToSize(senderAddress, colW - 5);
    doc.text(senderLines, marginL, y);
    var sY = y + senderLines.length * 4;
    if (senderEmail) { doc.text(senderEmail, marginL, sY); sY += 4; }
    if (senderPhone) { doc.text(senderPhone, marginL, sY); sY += 4; }
    if (senderTaxId) {
      doc.setTextColor(lightR, lightG, lightB);
      setFont('normal', 8);
      doc.text('Tax ID: ' + senderTaxId, marginL, sY);
      sY += 4;
    }

    /* Recipient details */
    setFont('normal', 9);
    doc.setTextColor(darkR, darkG, darkB);
    var recLines = doc.splitTextToSize(recipientAddress, colW - 5);
    doc.text(recLines, marginL + colW + 10, recY);

    y = Math.max(sY, recY + recLines.length * 4) + 8;

    /* --- Invoice meta (dates, etc.) --- */
    checkPage(30);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 7;

    setFont('normal', 8);
    doc.setTextColor(lightR, lightG, lightB);

    var metaLeftX = marginL;
    var metaSpacing = contentW / 4;

    doc.text('Invoice Date', metaLeftX, y);
    doc.text('Due Date', metaLeftX + metaSpacing, y);
    doc.text('Delivery Date', metaLeftX + metaSpacing * 2, y);
    doc.text('Currency', metaLeftX + metaSpacing * 3, y);
    y += 4.5;

    setFont('bold', 9);
    doc.setTextColor(darkR, darkG, darkB);
    doc.text(formatDate(invoiceDate), metaLeftX, y);
    doc.text(formatDate(dueDate), metaLeftX + metaSpacing, y);
    doc.text(formatDate(deliveryDate), metaLeftX + metaSpacing * 2, y);
    doc.text(currency, metaLeftX + metaSpacing * 3, y);
    y += 10;

    /* --- Line items table --- */
    checkPage(30);

    /* table header */
    doc.setFillColor(248, 250, 252);
    doc.rect(marginL, y - 4, contentW, 8, 'F');

    setFont('bold', 8);
    doc.setTextColor(lightR, lightG, lightB);

    var colDesc = marginL;
    var colQty = marginL + contentW * 0.5;
    var colPrice = marginL + contentW * 0.65;
    var colTotal = marginL + contentW * 0.82;

    doc.text('DESCRIPTION', colDesc, y);
    doc.text('QTY', colQty, y);
    doc.text('UNIT PRICE', colPrice, y);
    doc.text('TOTAL', colTotal, y);
    y += 7;

    /* table rows */
    var rows = itemsBody.querySelectorAll('tr');
    var subtotal = 0;

    setFont('normal', 9);
    doc.setTextColor(darkR, darkG, darkB);

    for (var i = 0; i < rows.length; i++) {
      checkPage(8);
      var desc = rows[i].querySelector('.item-desc').value || '';
      var qty = parseFloat(rows[i].querySelector('.item-qty').value) || 0;
      var price = parseFloat(rows[i].querySelector('.item-price').value) || 0;
      var lineTotal = qty * price;
      subtotal += lineTotal;

      /* wrap long descriptions */
      var descLines = doc.splitTextToSize(desc, contentW * 0.47);
      doc.text(descLines, colDesc, y);
      doc.text(String(qty), colQty, y);
      doc.text(sym + ' ' + fmt(price), colPrice, y);
      doc.text(sym + ' ' + fmt(lineTotal), colTotal, y);

      var rowH = Math.max(descLines.length * 4, 5);
      y += rowH + 3;

      /* light separator */
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.2);
      doc.line(marginL, y - 1.5, pageW - marginR, y - 1.5);
    }

    y += 4;

    /* --- Totals --- */
    checkPage(30);
    var taxAmt = subtotal * taxRate / 100;
    var grandTotal = subtotal + taxAmt;

    var totX = marginL + contentW * 0.58;
    var totValX = pageW - marginR;

    setFont('normal', 9);
    doc.setTextColor(lightR, lightG, lightB);
    doc.text('Subtotal (Net)', totX, y);
    doc.setTextColor(darkR, darkG, darkB);
    doc.text(sym + ' ' + fmt(subtotal), totValX, y, { align: 'right' });
    y += 6;

    doc.setTextColor(lightR, lightG, lightB);
    doc.text('Tax (' + taxRate + '%)', totX, y);
    doc.setTextColor(darkR, darkG, darkB);
    doc.text(sym + ' ' + fmt(taxAmt), totValX, y, { align: 'right' });
    y += 7;

    /* Grand total with accent background */
    doc.setFillColor(accentR, accentG, accentB);
    doc.roundedRect(totX - 3, y - 4.5, pageW - marginR - totX + 6, 10, 2, 2, 'F');
    setFont('bold', 11);
    doc.setTextColor(255, 255, 255);
    doc.text('Total (Gross)', totX, y + 1);
    doc.text(sym + ' ' + fmt(grandTotal), totValX, y + 1, { align: 'right' });

    doc.setTextColor(darkR, darkG, darkB);
    y += 18;

    /* --- Bank details --- */
    if (bankIban || bankName) {
      checkPage(25);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(marginL, y, pageW - marginR, y);
      y += 7;

      setFont('bold', 9);
      doc.setTextColor(accentR, accentG, accentB);
      doc.text('Bank Details', marginL, y);
      y += 5;

      setFont('normal', 9);
      doc.setTextColor(darkR, darkG, darkB);
      if (bankName) { doc.text('Bank: ' + bankName, marginL, y); y += 4.5; }
      if (bankIban) { doc.text('IBAN: ' + bankIban, marginL, y); y += 4.5; }
      if (bankBic) { doc.text('BIC: ' + bankBic, marginL, y); y += 4.5; }
      y += 6;
    }

    /* --- Notes --- */
    if (notes) {
      checkPage(20);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(marginL, y, pageW - marginR, y);
      y += 7;

      setFont('bold', 9);
      doc.setTextColor(accentR, accentG, accentB);
      doc.text('Notes', marginL, y);
      y += 5;

      setFont('normal', 9);
      doc.setTextColor(darkR, darkG, darkB);
      var noteLines = doc.splitTextToSize(notes, contentW);
      checkPage(noteLines.length * 4 + 5);
      doc.text(noteLines, marginL, y);
      y += noteLines.length * 4 + 6;
    }

    /* --- Footer --- */
    doc.setTextColor(180, 180, 180);
    setFont('normal', 7);
    doc.text('Generated with Invoice Generator — data never left the browser.', pageW / 2, 290, { align: 'center' });

    /* --- Save --- */
    var filename = 'invoice-' + invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '') + '.pdf';
    doc.save(filename);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return parts[2] + '.' + parts[1] + '.' + parts[0]; // DD.MM.YYYY
  }

})();
