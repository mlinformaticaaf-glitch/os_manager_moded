import { describe, it, expect } from 'vitest';

// Mock Date filtering logic
function filterByDateRange<T extends { created_at: string }>(
  items: T[],
  startDate?: Date,
  endDate?: Date
): T[] {
  return items.filter((item) => {
    const itemDate = new Date(item.created_at);
    const matchesStartDate = !startDate || itemDate >= startDate;
    const matchesEndDate = !endDate || itemDate <= new Date(endDate.getTime() + 86400000 - 1);
    return matchesStartDate && matchesEndDate;
  });
}

// Mock status filtering
function filterByStatus<T extends { status: string }>(
  items: T[],
  status: string | 'all'
): T[] {
  if (status === 'all') return items;
  return items.filter((item) => item.status === status);
}

// Mock text search
function filterBySearch<T extends Record<string, any>>(
  items: T[],
  search: string,
  fields: (keyof T)[]
): T[] {
  if (!search.trim()) return items;
  const searchLower = search.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchLower);
    })
  );
}

describe('Filter Functions', () => {
  const mockOrders = [
    { id: '1', status: 'pending', created_at: '2024-01-15T10:00:00Z', client_name: 'João' },
    { id: '2', status: 'in_progress', created_at: '2024-02-20T14:00:00Z', client_name: 'Maria' },
    { id: '3', status: 'completed', created_at: '2024-03-10T09:00:00Z', client_name: 'Pedro' },
    { id: '4', status: 'pending', created_at: '2024-03-25T16:00:00Z', client_name: 'Ana' },
  ];

  describe('filterByDateRange', () => {
    it('should return all items when no dates specified', () => {
      const result = filterByDateRange(mockOrders);
      expect(result).toHaveLength(4);
    });

    it('should filter by start date', () => {
      const startDate = new Date('2024-02-01');
      const result = filterByDateRange(mockOrders, startDate);
      expect(result).toHaveLength(3);
      expect(result.map((o) => o.id)).toEqual(['2', '3', '4']);
    });

    it('should filter by end date', () => {
      const endDate = new Date('2024-02-28');
      const result = filterByDateRange(mockOrders, undefined, endDate);
      expect(result).toHaveLength(2);
      expect(result.map((o) => o.id)).toEqual(['1', '2']);
    });

    it('should filter by date range', () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-03-15');
      const result = filterByDateRange(mockOrders, startDate, endDate);
      expect(result).toHaveLength(2);
      expect(result.map((o) => o.id)).toEqual(['2', '3']);
    });

    it('should include items on boundary dates', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-15');
      const result = filterByDateRange(mockOrders, startDate, endDate);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('filterByStatus', () => {
    it('should return all items when status is "all"', () => {
      const result = filterByStatus(mockOrders, 'all');
      expect(result).toHaveLength(4);
    });

    it('should filter by specific status', () => {
      const result = filterByStatus(mockOrders, 'pending');
      expect(result).toHaveLength(2);
      expect(result.every((o) => o.status === 'pending')).toBe(true);
    });

    it('should return empty array for non-matching status', () => {
      const result = filterByStatus(mockOrders, 'cancelled');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterBySearch', () => {
    it('should return all items when search is empty', () => {
      const result = filterBySearch(mockOrders, '', ['client_name']);
      expect(result).toHaveLength(4);
    });

    it('should filter by matching text', () => {
      const result = filterBySearch(mockOrders, 'João', ['client_name']);
      expect(result).toHaveLength(1);
      expect(result[0].client_name).toBe('João');
    });

    it('should be case insensitive', () => {
      const result = filterBySearch(mockOrders, 'MARIA', ['client_name']);
      expect(result).toHaveLength(1);
      expect(result[0].client_name).toBe('Maria');
    });

    it('should search partial matches', () => {
      const result = filterBySearch(mockOrders, 'ar', ['client_name']);
      expect(result).toHaveLength(1);
      expect(result[0].client_name).toBe('Maria');
    });

    it('should search multiple fields', () => {
      const result = filterBySearch(mockOrders, '1', ['id', 'client_name']);
      expect(result).toHaveLength(1);
    });

    it('should return empty for non-matching search', () => {
      const result = filterBySearch(mockOrders, 'xyz123', ['client_name']);
      expect(result).toHaveLength(0);
    });
  });

  describe('Combined filters', () => {
    it('should apply multiple filters correctly', () => {
      let result = mockOrders;
      
      // Filter by status
      result = filterByStatus(result, 'pending');
      expect(result).toHaveLength(2);
      
      // Filter by date range
      result = filterByDateRange(result, new Date('2024-03-01'));
      expect(result).toHaveLength(1);
      
      // Filter by search
      result = filterBySearch(result, 'Ana', ['client_name']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });
  });
});
