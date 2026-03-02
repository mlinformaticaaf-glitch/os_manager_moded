import { describe, it, expect } from 'vitest';
import { formatOSNumber } from './osUtils';

describe('osUtils', () => {
  describe('formatOSNumber', () => {
    it('should format order number with 4 padded zeros and year', () => {
      const orderNumber = 1;
      const createdAt = '2026-03-01T12:00:00Z';
      expect(formatOSNumber(orderNumber, createdAt)).toBe('0001/2026');
    });

    it('should format order number with 4 padded zeros for larger numbers', () => {
      const orderNumber = 123;
      const createdAt = '2026-03-01T12:00:00Z';
      expect(formatOSNumber(orderNumber, createdAt)).toBe('0123/2026');
    });

    it('should not pad if number is 4 digits or more', () => {
      const orderNumber = 12345;
      const createdAt = '2026-03-01T12:00:00Z';
      expect(formatOSNumber(orderNumber, createdAt)).toBe('12345/2026');
    });

    it('should extract the correct year from the date string', () => {
      const orderNumber = 10;
      const createdAt = '2025-12-31T23:59:59Z';
      expect(formatOSNumber(orderNumber, createdAt)).toBe('0010/2025');
    });
  });
});
