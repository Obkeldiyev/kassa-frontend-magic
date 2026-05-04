type PermitPayment = {
  id?: string | number;
  receiptNumber?: string;
  operationNumber?: string;
  amount?: string | number;
  currency?: string;
  payerFullName?: string;
  payerJshshir?: string;
  payerPhone?: string;
  payerAddress?: string;
  paymentType?: string;
  description?: string;
  paymentCategory?: { name?: string };
  contractNumber?: string;
  contractDate?: string;
  paidAt?: string;
  createdAt?: string;
  receiverName?: string;
  bankName?: string;
  receiver?: { name?: string; account?: string; inn?: string; MFO?: string; mfo?: string };
  receiverAccount?: string;
  receiverInn?: string;
  receiverMfo?: string;
  cashier?: { first_name?: string; last_name?: string; middle_name?: string };
  cashierFullName?: string;
  rawReceiptData?: {
    jshshir?: string;
    paymentType?: string;
    description?: string;
    contractNumber?: string;
    contractDate?: string;
    operationNumber?: string;
    receiverMfo?: string;
  };
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

const safeDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const fmtDate = (date: Date) =>
  date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

const fmtTime = (date: Date) =>
  date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

const receiptNumber = (payment: PermitPayment) =>
  payment.operationNumber || payment.receiptNumber || payment.rawReceiptData?.operationNumber || String(payment.id || "00423/20");

const receiptTable = (payment: PermitPayment) => {
  const date = safeDate(payment.paidAt || payment.createdAt);
  const contractDate = safeDate(payment.contractDate || payment.rawReceiptData?.contractDate);
  const amount = fmtMoney(payment.amount);
  const cashier = responsibleName(payment) || "-";
  const payer = payment.payerFullName || "-";
  const jshshir = payment.payerJshshir || payment.rawReceiptData?.jshshir || "-";
  const paymentType = payment.paymentCategory?.name || payment.paymentType || payment.rawReceiptData?.paymentType || "-";
  const payerPhone = payment.payerPhone || "-";
  const description = payment.description || payment.rawReceiptData?.description || "-";
  const contractNumber = payment.contractNumber || payment.rawReceiptData?.contractNumber || "-";
  const bankName = payment.receiver?.name || payment.receiverName || payment.bankName || 'NOY "TOSHKENT SHAHRIDAGI TURIN POLITEXNIKA UNIVERSITETI"';
  const receiverAccount = payment.receiverAccount || payment.receiver?.account || "20208000504790690008";
  const receiverInn = payment.receiverInn || payment.receiver?.inn || "301249598";
  const receiverMfo = payment.receiverMfo || payment.receiver?.MFO || payment.receiver?.mfo || payment.rawReceiptData?.receiverMfo || "00423";

  return `<table class="receipt">
    <tr>
      <td class="left" rowspan="7">
        <div class="title">ХАБАРНОМА</div>
        <div style="margin-top: 1.2mm;">${esc(bankName)}</div>
        <div>Тўлов тури: ${esc(paymentType)}</div>
        <div style="margin-top: 1.6mm;">${esc(receiptNumber(payment))} - Chakana kassa (bank)</div>
        <div style="margin-top: 1.2mm;">сана: ${esc(fmtDate(date))}</div>
        <div>вақти: ${esc(fmtTime(date))}</div>
        <div style="margin-top: 2mm;">РРН: ${esc(receiptNumber(payment))}</div>
        <div class="amount">${esc(amount)}</div>
        <div style="margin-top: 1.2mm;">${esc(receiverAccount)}/1350/135</div>
        <div>РЕЕСТР</div>
        <div style="margin-top: .8mm;">Кассир: ${esc(cashier)}</div>
      </td>
      <td class="right">${esc(bankName)} ${esc(paymentType)} UCHUN</td>
    </tr>
    <tr><td class="right">ТОШКЕНТ Ш., ${esc(bankName)}</td></tr>
    <tr><td class="right">ҳ/р: ${esc(receiverAccount)}&nbsp;&nbsp; МФО: ${esc(receiverMfo)}&nbsp;&nbsp; ИНН: ${esc(receiverInn)}</td></tr>
    <tr><td class="right muted-line"></td></tr>
    <tr><td class="right">Тўловчи ФИШ: ${esc(payer)} &nbsp;&nbsp; Тел: ${esc(payerPhone)}</td></tr>
    <tr><td class="right">ЖШШИР: ${esc(jshshir)} &nbsp;&nbsp; Шартнома: ${esc(contractNumber)} / ${esc(fmtDate(contractDate))}</td></tr>
    <tr class="row-tight">
      <td class="right">
        <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
          <tr>
            <td style="border:0; padding:0; width:24mm;">Изоҳ:</td>
            <td style="border:0; padding:0;">${esc(description)}</td>
            <td style="border:0; padding:0; width:34mm;">Суммаси:</td>
            <td style="border:0; padding:0; text-align:right;">${esc(amount)}</td>
          </tr>
          <tr>
            <td style="border:0; padding:0; width:24mm;">Сана:</td>
            <td style="border:0; padding:0;">${esc(fmtDate(date))}й.</td>
            <td style="border:0; padding:0; width:34mm;">Суммаси:</td>
            <td style="border:0; padding:0; text-align:right;">${esc(amount)}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="left signature">Кассир имзоси: <span class="signature-line"></span></td>
      <td class="right signature">
        <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
          <tr>
            <td style="border:0; padding:0; width:38mm;">Мижоз имзоси:</td>
            <td style="border:0; padding:0;"></td>
            <td style="border:0; padding:0; width:34mm;">Жами сумма:</td>
            <td style="border:0; padding:0; text-align:right; font-size:9.4pt; font-weight:700;">${esc(amount)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
};

export const buildPermitDocumentHtml = async (payment: PermitPayment) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Xabarnoma ${esc(receiptNumber(payment))}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    html, body {
      margin: 0;
      background: #ffffff !important;
      color: #000000 !important;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 7.8pt;
      font-weight: 600;
    }
    .sheet {
      width: 186mm;
      min-height: 273mm;
      background: #ffffff !important;
      color: #000000 !important;
    }
    .copy {
      width: 170mm;
      margin-left: auto;
      margin-right: 2mm;
      margin-bottom: 10mm;
    }
    .receipt {
      display: table;
      width: 170mm;
      border: 1pt solid #000000;
      border-collapse: collapse;
      table-layout: fixed;
      background: #ffffff !important;
      color: #000000 !important;
    }
    .receipt td {
      border: 1pt solid #000000;
      padding: .75mm 1.8mm;
      vertical-align: middle;
      line-height: 1.03;
      background: #ffffff !important;
      color: #000000 !important;
    }
    .left {
      width: 48mm;
      text-align: center;
      font-size: 7.4pt;
    }
    .right {
      width: 122mm;
    }
    .title {
      font-size: 8.4pt;
      font-weight: 700;
    }
    .amount {
      margin-top: .4mm;
      font-size: 9.4pt;
      font-weight: 700;
    }
    .muted-line {
      height: 2.4mm;
    }
    .row-tight td {
      padding-top: .45mm;
      padding-bottom: .45mm;
    }
    .signature {
      height: 5.6mm;
      white-space: nowrap;
    }
    .signature-line {
      display: inline-block;
      width: 38mm;
      border-bottom: 1pt solid #000000;
      transform: translateY(-1mm);
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="copy">${receiptTable(payment)}</div>
    <div class="copy">${receiptTable(payment)}</div>
  </div>
</body>
</html>`;

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
