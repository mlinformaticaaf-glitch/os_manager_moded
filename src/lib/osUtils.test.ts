import { describe, it, expect } from 'vitest';
import { formatOSNumber } from './osUtils';

describe('osUtils', () => {
  describe('formatOSNumber', () => {
    it('should format order number with 4 digits and year', () => {
      const result = formatOSNumber(1, '2024-01-15T10:00:00Z');
      expect(result).toBe('0001/2024');
    });

    it('should pad single digit numbers correctly', () => {
      const result = formatOSNumber(5, '2024-06-20T15:30:00Z');
      expect(result).toBe('0005/2024');
    });

    it('should pad double digit numbers correctly', () => {
      const result = formatOSNumber(42, '2024-03-10T08:00:00Z');
      expect(result).toBe('0042/2024');
    });

    it('should pad triple digit numbers correctly', () => {
      const result = formatOSNumber(123, '2025-01-01T00:00:00Z');
      expect(result).toBe('0123/2025');
    });

    it('should handle 4 digit numbers without extra padding', () => {
      const result = formatOSNumber(1234, '2024-12-31T23:59:59Z');
      expect(result).toBe('1234/2024');
    });

    it('should handle numbers larger than 4 digits', () => {
      const result = formatOSNumber(12345, '2024-07-04T12:00:00Z');
      expect(result).toBe('12345/2024');
    });

    it('should extract year correctly from different date formats', () => {
      expect(formatOSNumber(1, '2023-12-31')).toBe('0001/2023');
      expect(formatOSNumber(1, '2025-01-01T00:00:00.000Z')).toBe('0001/2025');
      expect(formatOSNumber(1, '2026-06-15T14:30:00+03:00')).toBe('0001/2026');
    });

    it('should handle edge case of order number 0', () => {
      const result = formatOSNumber(0, '2024-01-01T00:00:00Z');
      expect(result).toBe('0000/2024');
    });
  });
});
