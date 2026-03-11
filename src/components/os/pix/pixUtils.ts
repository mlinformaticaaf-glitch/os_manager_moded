/**
 * Generates a PIX EMV payload for QR Code generation
 * Based on the official PIX specification from BACEN (Brazilian Central Bank)
 */

interface PixPayload {
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  beneficiaryName: string;
  beneficiaryCity: string;
  amount: number;
  transactionId?: string;
  description?: string;
}

// Calculate CRC16-CCITT checksum
function crc16ccitt(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
    }
    crc &= 0xFFFF;
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Format a TLV (Tag-Length-Value) field
function formatTLV(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

// Remove accents and special characters for PIX compatibility
function sanitizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .substring(0, 25);
}

// Format phone number for PIX
function formatPhoneForPix(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  return `+55${cleaned}`;
}

// Format CPF/CNPJ for PIX
function formatDocumentForPix(doc: string): string {
  return doc.replace(/\D/g, '');
}

export function generatePixPayload({
  pixKey,
  pixKeyType,
  beneficiaryName,
  beneficiaryCity,
  amount,
  transactionId,
  description,
}: PixPayload): string {
  // Format the PIX key based on type
  let formattedKey = pixKey;
  switch (pixKeyType) {
    case 'phone':
      formattedKey = formatPhoneForPix(pixKey);
      break;
    case 'cpf':
    case 'cnpj':
      formattedKey = formatDocumentForPix(pixKey);
      break;
    case 'email':
      formattedKey = pixKey.toLowerCase();
      break;
    case 'random':
      formattedKey = pixKey;
      break;
  }

  // Merchant Account Information (ID 26)
  const gui = formatTLV('00', 'br.gov.bcb.pix');
  const key = formatTLV('01', formattedKey);
  let merchantInfo = gui + key;

  if (description) {
    merchantInfo += formatTLV('02', sanitizeText(description).substring(0, 25));
  }

  const merchantAccountInfo = formatTLV('26', merchantInfo);

  // Transaction Amount (ID 54) - only if amount > 0
  const amountField = amount > 0 ? formatTLV('54', amount.toFixed(2)) : '';

  // Additional Data Field Template (ID 62)
  const txId = transactionId || `OS${Date.now().toString().slice(-10)}`;
  const additionalDataField = formatTLV('62', formatTLV('05', txId.substring(0, 25)));

  // Build the payload
  const payload =
    formatTLV('00', '01') +                        // Payload Format Indicator
    formatTLV('01', '12') +                        // Point of Initiation Method (12 = dynamic)
    merchantAccountInfo +                           // Merchant Account Information
    formatTLV('52', '0000') +                      // Merchant Category Code
    formatTLV('53', '986') +                       // Transaction Currency (986 = BRL)
    amountField +                                   // Transaction Amount
    formatTLV('58', 'BR') +                        // Country Code
    formatTLV('59', sanitizeText(beneficiaryName)) + // Merchant Name
    formatTLV('60', sanitizeText(beneficiaryCity)) + // Merchant City
    additionalDataField;                            // Additional Data Field

  // Add CRC16 placeholder and calculate checksum
  const payloadWithCrcPlaceholder = payload + '6304';
  const crc = crc16ccitt(payloadWithCrcPlaceholder);

  return payloadWithCrcPlaceholder + crc;
}

export function formatPixKey(key: string, type: string): string {
  switch (type) {
    case 'cpf':
      return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    case 'cnpj':
      return key.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    case 'phone': {
      const cleaned = key.replace(/\D/g, '');
      if (cleaned.length === 11) {
        return key.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
      return key;
    }
    default:
      return key;
  }
}

export const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave Aleatória' },
];
