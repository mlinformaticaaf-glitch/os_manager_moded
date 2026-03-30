import { describe, expect, it } from 'vitest';
import {
  formatWhatsAppMessage,
  formatWhatsAppPaymentReminder,
  formatWhatsAppStatusUpdate,
} from './whatsappUtils';
import { ServiceOrder, ServiceOrderItem } from '@/types/serviceOrder';

function createOrder(overrides: Partial<ServiceOrder> = {}): ServiceOrder {
  return {
    id: 'order-1',
    user_id: 'user-1',
    client_id: 'client-1',
    equipment_id: 'equipment-1',
    order_number: 1,
    status: 'pending',
    priority: 'normal',
    equipment: 'Notebook Dell',
    brand: 'Dell',
    model: 'Inspiron 15',
    serial_number: 'ABC123',
    accessories: 'Carregador',
    device_password: null,
    reported_issue: 'Não liga',
    diagnosis: null,
    solution: null,
    internal_notes: null,
    warranty_until: null,
    estimated_completion: null,
    completed_at: null,
    delivered_at: null,
    total_services: 0,
    total_products: 0,
    discount: 0,
    total: 150,
    payment_method: 'pix',
    payment_status: 'pending',
    stock_deducted: false,
    created_at: '2026-03-29T12:00:00.000Z',
    updated_at: '2026-03-29T12:00:00.000Z',
    client: {
      id: 'client-1',
      name: 'Cliente Teste',
      phone: '11999999999',
      email: null,
    },
    equipment_ref: {
      id: 'equipment-1',
      code: 10,
      description: 'Equipamento cadastrado',
    },
    items: [],
    ...overrides,
  };
}

describe('whatsappUtils', () => {
  it('prioritizes typed equipment fields in the full OS message', () => {
    const message = formatWhatsAppMessage({
      order: createOrder(),
      items: [] as ServiceOrderItem[],
    });

    expect(message).toContain('*Equipamento:*');
    expect(message).toContain('Notebook Dell - Dell Inspiron 15');
    expect(message).toContain('S/N: ABC123');
    expect(message).toContain('Acessórios: Carregador');
    expect(message).not.toContain('Equipamento cadastrado - Dell Inspiron 15');
  });

  it('falls back to equipment_ref when free-text equipment is absent', () => {
    const message = formatWhatsAppMessage({
      order: createOrder({ equipment: null }),
      items: [] as ServiceOrderItem[],
    });

    expect(message).toContain('Equipamento cadastrado - Dell Inspiron 15');
  });

  it('includes equipment summary in status update messages', () => {
    const message = formatWhatsAppStatusUpdate({
      order: createOrder({ status: 'in_progress' }),
    });

    expect(message).toContain('*Equipamento:*');
    expect(message).toContain('Notebook Dell - Dell Inspiron 15');
  });

  it('includes equipment summary in payment reminder messages', () => {
    const message = formatWhatsAppPaymentReminder({
      order: createOrder(),
    });

    expect(message).toContain('*Equipamento:*');
    expect(message).toContain('Notebook Dell - Dell Inspiron 15');
  });
});