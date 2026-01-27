import { describe, it, expect } from 'vitest';

// Stock management utilities
function deductStock(currentStock: number, quantity: number): number {
  return Math.max(0, currentStock - quantity);
}

function addStock(currentStock: number, quantity: number): number {
  return currentStock + quantity;
}

function isLowStock(currentStock: number, minStock: number): boolean {
  return currentStock <= minStock;
}

function calculateStockValue(stock: Array<{ quantity: number; cost_price: number }>): number {
  return stock.reduce((total, item) => total + item.quantity * item.cost_price, 0);
}

interface StockMovement {
  type: 'in' | 'out';
  quantity: number;
  reason: string;
}

function applyStockMovements(initialStock: number, movements: StockMovement[]): number {
  return movements.reduce((stock, movement) => {
    if (movement.type === 'in') {
      return addStock(stock, movement.quantity);
    } else {
      return deductStock(stock, movement.quantity);
    }
  }, initialStock);
}

describe('Stock Management', () => {
  describe('deductStock', () => {
    it('should deduct stock correctly', () => {
      expect(deductStock(10, 3)).toBe(7);
      expect(deductStock(5, 2)).toBe(3);
    });

    it('should not go below zero', () => {
      expect(deductStock(5, 10)).toBe(0);
      expect(deductStock(0, 5)).toBe(0);
    });

    it('should handle zero deduction', () => {
      expect(deductStock(10, 0)).toBe(10);
    });

    it('should handle decimal quantities', () => {
      expect(deductStock(10.5, 3.2)).toBeCloseTo(7.3);
    });
  });

  describe('addStock', () => {
    it('should add stock correctly', () => {
      expect(addStock(10, 5)).toBe(15);
      expect(addStock(0, 10)).toBe(10);
    });

    it('should handle zero addition', () => {
      expect(addStock(10, 0)).toBe(10);
    });

    it('should handle decimal quantities', () => {
      expect(addStock(10.5, 2.3)).toBeCloseTo(12.8);
    });
  });

  describe('isLowStock', () => {
    it('should return true when stock is below minimum', () => {
      expect(isLowStock(2, 5)).toBe(true);
    });

    it('should return true when stock equals minimum', () => {
      expect(isLowStock(5, 5)).toBe(true);
    });

    it('should return false when stock is above minimum', () => {
      expect(isLowStock(10, 5)).toBe(false);
    });

    it('should handle zero minimum', () => {
      expect(isLowStock(0, 0)).toBe(true);
      expect(isLowStock(1, 0)).toBe(false);
    });
  });

  describe('calculateStockValue', () => {
    it('should calculate total stock value', () => {
      const stock = [
        { quantity: 10, cost_price: 100 },
        { quantity: 5, cost_price: 50 },
      ];
      expect(calculateStockValue(stock)).toBe(1250);
    });

    it('should return 0 for empty stock', () => {
      expect(calculateStockValue([])).toBe(0);
    });

    it('should handle zero quantities', () => {
      const stock = [
        { quantity: 0, cost_price: 100 },
        { quantity: 5, cost_price: 50 },
      ];
      expect(calculateStockValue(stock)).toBe(250);
    });
  });

  describe('applyStockMovements', () => {
    it('should apply incoming stock movements', () => {
      const movements: StockMovement[] = [
        { type: 'in', quantity: 10, reason: 'Purchase' },
        { type: 'in', quantity: 5, reason: 'Return' },
      ];
      expect(applyStockMovements(0, movements)).toBe(15);
    });

    it('should apply outgoing stock movements', () => {
      const movements: StockMovement[] = [
        { type: 'out', quantity: 3, reason: 'Sale' },
        { type: 'out', quantity: 2, reason: 'Damage' },
      ];
      expect(applyStockMovements(10, movements)).toBe(5);
    });

    it('should apply mixed movements correctly', () => {
      const movements: StockMovement[] = [
        { type: 'in', quantity: 20, reason: 'Purchase' },
        { type: 'out', quantity: 8, reason: 'Sale' },
        { type: 'out', quantity: 2, reason: 'OS' },
        { type: 'in', quantity: 5, reason: 'Return' },
      ];
      expect(applyStockMovements(10, movements)).toBe(25);
    });

    it('should not go below zero with movements', () => {
      const movements: StockMovement[] = [
        { type: 'out', quantity: 20, reason: 'Sale' },
      ];
      expect(applyStockMovements(10, movements)).toBe(0);
    });

    it('should handle empty movements array', () => {
      expect(applyStockMovements(10, [])).toBe(10);
    });
  });
});
