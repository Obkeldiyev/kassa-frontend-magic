type PermitPayment = {
  id?: string;
  receiptNumber?: string;
  amount?: string | number;
  currency?: string;
  payerFullName?: string;
  payerPhone?: string;
  payerAddress?: string;
  paidAt?: string;
  createdAt?: string;
  cashier?: { first_name?: string; last_name?: string; middle_name?: string };
  cashierFullName?: string;
};

const esc = (value?: string | number) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtMoney = (amount?: string | number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount) || 0);

const fullName = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(" ").trim();

const responsibleName = (payment: PermitPayment) =>
  payment.cashierFullName ||
  fullName(payment.cashier?.last_name, payment.cashier?.first_name, payment.cashier?.middle_name);

const paymentDate = (payment: PermitPayment) => {
  const value = payment.paidAt || payment.createdAt;
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const fmtDate = (date: Date) =>
  date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

const fmtTime = (date: Date) =>
  date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

const receiptNumber = (payment: PermitPayment) =>
  payment.receiptNumber || payment.id || "00423/20";

export const buildPermitDocumentHtml = async (payment: PermitPayment) => {
  const date = paymentDate(payment);
  const amount = fmtMoney(payment.amount);
  const cashier = responsibleName(payment) || "-";
  const payer = payment.payerFullName || "-";
  const clientAddress = payment.payerAddress || "1/47 04.09.2025 YILDAGI SHARTNOMA YOTOQXONA UCHUN";
  const rrn = payment.id || "0285503833383 / 33106378";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Xabarnoma ${esc(receiptNumber(payment))}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
      font-size: 10.5pt;
      font-weight: 700;
    }
    .sheet {
      width: 186mm;
      min-height: 273mm;
      position: relative;
    }
    .receipt {
      position: absolute;
      left: 28mm;
      top: 78mm;
      width: 130mm;
      border: 1.5pt solid #000;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .receipt td {
      border: 1.2pt solid #000;
      padding: 2.2mm 2mm;
      vertical-align: middle;
      line-height: 1.08;
    }
    .left {
      width: 40mm;
      text-align: center;
    }
    .right {
      width: 90mm;
    }
    .center { text-align: center; }
    .small { font-size: 9.5pt; }
    .tiny { font-size: 8.5pt; }
    .amount { font-size: 13pt; font-weight: 800; }
    .muted-line { height: 7mm; }
    .row-tight td { padding-top: 1.5mm; padding-bottom: 1.5mm; }
    .purpose-label {
      width: 26mm;
      text-align: center;
    }
    .purpose-text {
      height: 20mm;
      text-align: center;
      font-size: 9.5pt;
    }
    .signature {
      height: 9mm;
      white-space: nowrap;
    }
    .signature-line {
      display: inline-block;
      width: 28mm;
      border-bottom: 1.2pt solid #000;
      transform: translateY(-1mm);
    }
    .stamp {
      position: absolute;
      left: 90mm;
      top: 50mm;
      width: 28mm;
      height: 28mm;
      border: 5pt solid rgba(0,0,0,.45);
      border-radius: 50%;
      opacity: .55;
    }
    .stamp:before {
      content: "";
      position: absolute;
      left: -7mm;
      top: 9mm;
      width: 42mm;
      border-top: 6pt solid rgba(0,0,0,.45);
      transform: rotate(16deg);
    }
    .brand {
      font-size: 28pt;
      font-style: italic;
      font-weight: 800;
      letter-spacing: -1px;
      color: rgba(0,0,0,.62);
      line-height: .8;
    }
    .brand-small {
      display: block;
      margin-top: 2mm;
      font-size: 18pt;
      font-style: italic;
      font-weight: 800;
      color: rgba(0,0,0,.62);
    }
  </style>
</head>
<body>
  <div class="sheet">
    <table class="receipt">
      <tr>
        <td class="left" rowspan="8">
          <div>ХАБАРНОМА</div>
          <div style="margin-top: 3mm;">"ИПОТЕКА-БАНК" АТИБ</div>
          <div>Тўлов тури: НАҚДСИЗ</div>
          <div style="margin-top: 3mm;">${esc(receiptNumber(payment))} -Chakana kassa(bank)</div>
          <div style="margin-top: 2.5mm;">сана: ${esc(fmtDate(date))} вақти: ${esc(fmtTime(date))}</div>
          <div style="margin-top: 6mm;">РРН:${esc(rrn)}</div>
          <div class="amount">${esc(amount)}</div>
          <div style="margin-top: 2mm;">42300233817963/1350/135 РЕЕСТР</div>
          <div>Кассир: ${esc(cashier)}</div>
        </td>
        <td class="right">НОУ "TOSHKENT SHAHRIDAGI TURIN POLITEXNIKA UNIVERSITETI" KONTRAKT TO'LOVI UCHUN</td>
      </tr>
      <tr><td class="right">ТОШКЕНТ Ш., ИПОТЕКА-БАНК АТИБ МЕХНАТ ФИЛИАЛИ</td></tr>
      <tr><td class="right">х/р: 20208000504790690008 МФО: 00423 ИНН: 301249598</td></tr>
      <tr><td class="right muted-line"></td></tr>
      <tr><td class="right">Тўловчи ФИШ: ${esc(payer)}</td></tr>
      <tr><td class="right">Мижоз манзили: ${esc(clientAddress)}</td></tr>
      <tr class="row-tight">
        <td class="right">
          <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
            <tr>
              <td style="border:0; width:24mm;">Сана:</td>
              <td style="border:0;">${esc(fmtDate(date))}й.</td>
              <td style="border:0; width:25mm;">Суммаси:</td>
              <td style="border:0; text-align:right;">${esc(amount)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="right purpose-text">
          <span class="brand">ipotekabank</span>
          <span class="brand-small">otp group</span>
          НОУ "TOSHKENT SHAHRIDAGI TURIN POLITEXNIKA UNIVERSITETI"<br />
          KONTRAKT TO'LOVI UCHUN* Оплата услуг 100%
        </td>
      </tr>
      <tr>
        <td class="left signature">Кассир имзоси: <span class="signature-line"></span></td>
        <td class="right">
          <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
            <tr>
              <td style="border:0; width:30mm;">Мижоз имзоси:</td>
              <td style="border:0;"></td>
              <td style="border:0; width:28mm;">Жами сумма:</td>
              <td style="border:0; text-align:right; font-size:13pt;">${esc(amount)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div class="stamp"></div>
  </div>
</body>
</html>`;
};

export const downloadPermitDocument = async (payment: PermitPayment) => {
  const receipt = receiptNumber(payment);
  const html = await buildPermitDocumentHtml(payment);
  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `xabarnoma-${receipt}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
