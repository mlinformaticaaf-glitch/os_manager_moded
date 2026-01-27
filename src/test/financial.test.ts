import { describe, it, expect } from 'vitest';

// Financial calculation utilities
function calculateProfitMargin(costPrice: number, salePrice: number): number {
  if (costPrice <= 0) return 0;
  return ((salePrice - costPrice) / costPrice) * 100;
}

function calculateProfit(costPrice: number, salePrice: number): number {
  return salePrice - costPrice;
}

function calculateOrderTotal(
  items: Array<{ quantity: number; unit_price: number }>,
  discount: number = 0
): number {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  return Math.max(0, subtotal - discount);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

describe('Financial Calculations', () => {
  describe('calculateProfitMargin', () => {
    it('should calculate correct profit margin', () => {
      expect(calculateProfitMargin(100, 150)).toBe(50);
      expect(calculateProfitMargin(100, 200)).toBe(100);
      expect(calculateProfitMargin(50, 75)).toBe(50);
    });

    it('should handle zero cost price', () => {
      expect(calculateProfitMargin(0, 100)).toBe(0);
    });

    it('should handle negative profit margin', () => {
      expect(calculateProfitMargin(100, 80)).toBe(-20);
    });

    it('should handle equal cost and sale price', () => {
      expect(calculateProfitMargin(100, 100)).toBe(0);
    });
  });

  describe('calculateProfit', () => {
    it('should calculate correct profit', () => {
      expect(calculateProfit(100, 150)).toBe(50);
      expect(calculateProfit(50, 75)).toBe(25);
    });

    it('should handle negative profit (loss)', () => {
      expect(calculateProfit(100, 80)).toBe(-20);
    });

    it('should handle zero profit', () => {
      expect(calculateProfit(100, 100)).toBe(0);
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate total without discount', () => {
      const items = [
        { quantity: 2, unit_price: 100 },
        { quantity: 1, unit_price: 50 },
      ];
      expect(calculateOrderTotal(items)).toBe(250);
    });

    it('should calculate total with discount', () => {
      const items = [
        { quantity: 2, unit_price: 100 },
        { quantity: 1, unit_price: 50 },
      ];
      expect(calculateOrderTotal(items, 50)).toBe(200);
    });

    it('should not return negative total', () => {
      const items = [{ quantity: 1, unit_price: 50 }];
      expect(calculateOrderTotal(items, 100)).toBe(0);
    });

    it('should handle empty items array', () => {
      expect(calculateOrderTotal([])).toBe(0);
    });

    it('should handle decimal quantities and prices', () => {
      const items = [
        { quantity: 1.5, unit_price: 10 },
        { quantity: 2, unit_price: 5.5 },
      ];
      expect(calculateOrderTotal(items)).toBe(26);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive values correctly', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1.234');
      expect(result).toContain('56');
    });

    it('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
      expect(result).toContain('00');
    });

    it('should format negative values correctly', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('100');
      expect(result).toContain('-');
    });

    it('should format large values correctly', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('1.000.000');
    });

    it('should round to 2 decimal places', () => {
      const result1 = formatCurrency(10.999);
      expect(result1).toContain('11');
      
      const result2 = formatCurrency(10.994);
      expect(result2).toContain('10');
      expect(result2).toContain('99');
    });
  });
});
