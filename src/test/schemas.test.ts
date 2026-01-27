import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test schemas that mirror the application schemas
const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  document: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(2).optional().or(z.literal('')),
  zip_code: z.string().max(10).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  cost_price: z.coerce.number().min(0, 'Preço de custo deve ser positivo'),
  sale_price: z.coerce.number().min(0, 'Preço de venda deve ser positivo'),
  stock_quantity: z.coerce.number().min(0, 'Quantidade deve ser positiva'),
  min_stock: z.coerce.number().min(0, 'Estoque mínimo deve ser positivo'),
  unit: z.string().default('un'),
  active: z.boolean().default(true),
});

const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  code: z.string().optional(),
  category: z.string().optional(),
  cost_price: z.coerce.number().min(0),
  sale_price: z.coerce.number().min(0),
  estimated_time: z.string().optional(),
  active: z.boolean().default(true),
});

describe('Form Validation Schemas', () => {
  describe('clientSchema', () => {
    it('should validate a valid client', () => {
      const validClient = {
        name: 'João Silva',
        phone: '11999999999',
        document: '123.456.789-00',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567',
        notes: 'Cliente VIP',
      };

      const result = clientSchema.safeParse(validClient);
      expect(result.success).toBe(true);
    });

    it('should require name with minimum 2 characters', () => {
      const invalidClient = { name: 'A' };
      const result = clientSchema.safeParse(invalidClient);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nome deve ter pelo menos 2 caracteres');
      }
    });

    it('should accept empty optional fields', () => {
      const minimalClient = { name: 'Maria Santos' };
      const result = clientSchema.safeParse(minimalClient);
      expect(result.success).toBe(true);
    });

    it('should reject name over 100 characters', () => {
      const longName = { name: 'A'.repeat(101) };
      const result = clientSchema.safeParse(longName);
      expect(result.success).toBe(false);
    });

    it('should reject state over 2 characters', () => {
      const invalidState = { name: 'Test', state: 'São Paulo' };
      const result = clientSchema.safeParse(invalidState);
      expect(result.success).toBe(false);
    });
  });

  describe('productSchema', () => {
    it('should validate a valid product', () => {
      const validProduct = {
        name: 'Teclado Mecânico',
        description: 'Teclado RGB',
        sku: 'TEC-001',
        category: 'Periféricos',
        cost_price: 150,
        sale_price: 250,
        stock_quantity: 10,
        min_stock: 2,
        unit: 'un',
        active: true,
      };

      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const invalidProduct = {
        cost_price: 100,
        sale_price: 150,
        stock_quantity: 5,
        min_stock: 1,
      };

      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject negative cost_price', () => {
      const invalidProduct = {
        name: 'Test Product',
        cost_price: -10,
        sale_price: 100,
        stock_quantity: 5,
        min_stock: 1,
      };

      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject negative stock_quantity', () => {
      const invalidProduct = {
        name: 'Test Product',
        cost_price: 10,
        sale_price: 100,
        stock_quantity: -5,
        min_stock: 1,
      };

      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should coerce string numbers to numbers', () => {
      const productWithStrings = {
        name: 'Test',
        cost_price: '100',
        sale_price: '150',
        stock_quantity: '10',
        min_stock: '2',
      };

      const result = productSchema.safeParse(productWithStrings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cost_price).toBe(100);
        expect(result.data.sale_price).toBe(150);
      }
    });

    it('should default unit to "un"', () => {
      const productWithoutUnit = {
        name: 'Test',
        cost_price: 100,
        sale_price: 150,
        stock_quantity: 10,
        min_stock: 2,
      };

      const result = productSchema.safeParse(productWithoutUnit);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unit).toBe('un');
      }
    });
  });

  describe('serviceSchema', () => {
    it('should validate a valid service', () => {
      const validService = {
        name: 'Manutenção Preventiva',
        description: 'Limpeza e verificação geral',
        code: 'SRV-001',
        category: 'Manutenção',
        cost_price: 50,
        sale_price: 120,
        estimated_time: '2 horas',
        active: true,
      };

      const result = serviceSchema.safeParse(validService);
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const invalidService = {
        cost_price: 50,
        sale_price: 100,
      };

      const result = serviceSchema.safeParse(invalidService);
      expect(result.success).toBe(false);
    });

    it('should accept minimal service with just name', () => {
      const minimalService = {
        name: 'Diagnóstico',
        cost_price: 0,
        sale_price: 0,
      };

      const result = serviceSchema.safeParse(minimalService);
      expect(result.success).toBe(true);
    });
  });
});
