import { describe, it, expect } from 'vitest';
import { formatOSNumber } from './osUtils';

describe('osUtils', () => {
  describe('formatOSNumber', () => {
    it('should format order number with 4 padded zeros', () => {
      const orderNumber = 1;
      const createdAt = '2026-03-01T12:00:00Z';
      expect(formatOSNumber(orderNumber, createdAt)).toBe('0001');
    });

    it('should format order number with 4 padded zeros for larger numbers', () => {
      const orderNumber = 123;
      const createdAt = '2026-03-01T12:00:00Z';
      expect(formatOSNumber(orderNumber, createdAt)).toBe('0123');
    });

    it('should use exactly 4 digits for 4-digit numbers', () => {
      const orderNumber = 1696;
      const createdAt = '2026-03-01T12:00:00Z';
      expect(formatOSNumber(orderNumber, createdAt)).toBe('1696');
    });

    it('should expand to 5 digits when number exceeds 9999', () => {
      const orderNumber = 10000;
      const createdAt = '2025-12-31T23:59:59Z';
      expect(formatOSNumber(orderNumber, createdAt)).toBe('10000');
    });

    it('should handle large order numbers without padding limit', () => {
      const orderNumber = 12345;
      const createdAt = '2026-03-01T12:00:00Z';
      expect(formatOSNumber(orderNumber, createdAt)).toBe('12345');
    });
  });
});
