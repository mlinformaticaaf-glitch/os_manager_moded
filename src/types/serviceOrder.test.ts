import { describe, it, expect } from 'vitest';
import { 
  STATUS_CONFIG, 
  PRIORITY_CONFIG,
  OSStatus,
  OSPriority 
} from './serviceOrder';

describe('serviceOrder types', () => {
  describe('STATUS_CONFIG', () => {
    it('should have all required statuses', () => {
      const expectedStatuses: OSStatus[] = [
        'pending',
        'in_progress',
        'waiting_parts',
        'waiting_approval',
        'completed',
        'delivered',
        'cancelled',
      ];

      expectedStatuses.forEach((status) => {
        expect(STATUS_CONFIG).toHaveProperty(status);
      });
    });

    it('should have label, color, and bgColor for each status', () => {
      Object.values(STATUS_CONFIG).forEach((config) => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('bgColor');
        expect(typeof config.label).toBe('string');
        expect(config.color).toMatch(/^text-/);
        expect(config.bgColor).toMatch(/^bg-/);
      });
    });

    it('should have correct Portuguese labels', () => {
      expect(STATUS_CONFIG.pending.label).toBe('Pendente');
      expect(STATUS_CONFIG.in_progress.label).toBe('Em Andamento');
      expect(STATUS_CONFIG.waiting_parts.label).toBe('Aguard. Peças');
      expect(STATUS_CONFIG.waiting_approval.label).toBe('Aguard. Aprovação');
      expect(STATUS_CONFIG.completed.label).toBe('Concluída');
      expect(STATUS_CONFIG.delivered.label).toBe('Entregue');
      expect(STATUS_CONFIG.cancelled.label).toBe('Cancelada');
    });
  });

  describe('PRIORITY_CONFIG', () => {
    it('should have all required priorities', () => {
      const expectedPriorities: OSPriority[] = ['low', 'normal', 'high', 'urgent'];

      expectedPriorities.forEach((priority) => {
        expect(PRIORITY_CONFIG).toHaveProperty(priority);
      });
    });

    it('should have label and color for each priority', () => {
      Object.values(PRIORITY_CONFIG).forEach((config) => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
        expect(typeof config.label).toBe('string');
        expect(config.color).toMatch(/^text-/);
      });
    });

    it('should have correct Portuguese labels', () => {
      expect(PRIORITY_CONFIG.low.label).toBe('Baixa');
      expect(PRIORITY_CONFIG.normal.label).toBe('Normal');
      expect(PRIORITY_CONFIG.high.label).toBe('Alta');
      expect(PRIORITY_CONFIG.urgent.label).toBe('Urgente');
    });
  });
});
