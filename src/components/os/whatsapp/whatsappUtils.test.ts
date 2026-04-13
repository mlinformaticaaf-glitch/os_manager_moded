import { describe, expect, it } from 'vitest';
import {
  formatWhatsAppMessage,
  formatWhatsAppPaymentReminder,
  formatWhatsAppStatusUpdate,
  formatWhatsAppStatusTemplateMessage,
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

  it('uses custom status template message when status label is configured', () => {
    const message = formatWhatsAppStatusTemplateMessage({
      order: createOrder({ status: 'custom_quote' }),
      statusLabel: '📋 EM ORÇAMENTO',
    });

    expect(message).toContain('📋 EM ORÇAMENTO');
    expect(message).toContain('OS #0001');
  });

  it('falls back to generic status message when template does not exist', () => {
    const message = formatWhatsAppStatusTemplateMessage({
      order: createOrder({ status: 'in_progress' }),
      statusLabel: 'EM REPARO',
    });

    expect(message).toContain('*Novo Status:* Em Andamento');
  });

  it('handles in_progress status template correctly', () => {
    const message = formatWhatsAppStatusTemplateMessage({
      order: createOrder({ status: 'in_progress' }),
      statusLabel: '🔧 EM ANDAMENTO',
    });

    expect(message).toContain('🔧 EM ANDAMENTO');
    expect(message).toContain('equipamento está sendo analisado e reparado');
  });

  it('handles waiting_parts status template correctly', () => {
    const message = formatWhatsAppStatusTemplateMessage({
      order: createOrder({ status: 'waiting_parts' }),
      statusLabel: '⏳ AGUARD. PEÇAS',
    });

    expect(message).toContain('⏳ AGUARDANDO PEÇAS');
    expect(message).toContain('aguardando a chegada das peças');
  });

  it('handles waiting_approval status template correctly', () => {
    const message = formatWhatsAppStatusTemplateMessage({
      order: createOrder({ status: 'waiting_approval' }),
      statusLabel: '⏸️ AGUARD. APROVAÇÃO',
    });

    expect(message).toContain('⏸️ AGUARDANDO APROVAÇÃO');
    expect(message).toContain('revise o diagnóstico e aprove');
  });

  it('handles completed status template correctly', () => {
    const message = formatWhatsAppStatusTemplateMessage({
      order: createOrder({ status: 'completed' }),
      statusLabel: '✅ CONCLUÍDA',
    });

    expect(message).toContain('✅ CONCLUÍDA');
    expect(message).toContain('agende a retirada');
  });

  it('handles delivered status template correctly', () => {
    const message = formatWhatsAppStatusTemplateMessage({
      order: createOrder({ status: 'delivered' }),
      statusLabel: '📦 FATURADO E ENTREGUE',
    });

    expect(message).toContain('📦 ENTREGUE');
    expect(message).toContain('entregue com sucesso');
  });

  it('handles cancelled status template correctly', () => {
    const message = formatWhatsAppStatusTemplateMessage({
      order: createOrder({ status: 'cancelled' }),
      statusLabel: '❌ CANCELADA',
    });

    expect(message).toContain('❌ CANCELADA');
    expect(message).toContain('foi cancelada');
  });
});