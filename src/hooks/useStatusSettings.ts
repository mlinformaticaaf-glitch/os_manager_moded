import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OSStatus, OSDefaultStatus, STATUS_CONFIG, DEFAULT_STATUSES } from '@/types/serviceOrder';
import { useMemo } from 'react';

export interface StatusSetting {
  id: string;
  user_id: string;
  status_key: string;
  custom_label: string;
  custom_short_label: string;
  position: number;
  is_custom: boolean;
  color: string;
  bg_color: string;
}

export interface StatusConfigEntry {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  position: number;
  isCustom: boolean;
}

const DEFAULT_POSITIONS: Record<OSDefaultStatus, number> = {
  pending: 0,
  in_progress: 1,
  waiting_parts: 2,
  waiting_approval: 3,
  completed: 4,
  delivered: 5,
  cancelled: 6,
};

const MAX_TOTAL_STATUSES = 12;

export function useStatusSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['status-settings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('status_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('position');
      if (error) throw error;
      return data as StatusSetting[];
    },
    enabled: !!user,
  });

  // Merged config: user overrides on top of defaults + custom statuses
  const statusConfig = useMemo(() => {
    const merged: Record<string, StatusConfigEntry> = {};

    // Add defaults
    for (const [key, def] of Object.entries(STATUS_CONFIG)) {
      const s = key as OSDefaultStatus;
      const userSetting = settings.find(st => st.status_key === s);
      merged[s] = {
        ...def,
        label: userSetting?.custom_label || def.label,
        shortLabel: userSetting?.custom_short_label || def.shortLabel,
        position: userSetting?.position ?? DEFAULT_POSITIONS[s],
        isCustom: false,
      };
    }

    // Add custom statuses from settings
    for (const setting of settings) {
      if (setting.is_custom && !merged[setting.status_key]) {
        merged[setting.status_key] = {
          label: setting.custom_label,
          shortLabel: setting.custom_short_label,
          color: setting.color,
          bgColor: setting.bg_color,
          position: setting.position,
          isCustom: true,
        };
      }
    }

    return merged;
  }, [settings]);

  // Ordered status keys for kanban columns etc.
  const orderedStatuses = useMemo(() => {
    const all = Object.keys(statusConfig) as OSStatus[];
    return all.sort((a, b) => statusConfig[a].position - statusConfig[b].position);
  }, [statusConfig]);

  // How many custom statuses exist
  const customStatusCount = useMemo(() => {
    return settings.filter(s => s.is_custom).length;
  }, [settings]);

  const canAddMore = customStatusCount < (MAX_TOTAL_STATUSES - DEFAULT_STATUSES.length);

  const saveSettings = useMutation({
    mutationFn: async (items: { status_key: string; custom_label: string; custom_short_label: string; position: number; is_custom?: boolean; color?: string; bg_color?: string }[]) => {
      if (!user) throw new Error('Not authenticated');

      const rows = items.map(item => ({
        user_id: user.id,
        status_key: item.status_key,
        custom_label: item.custom_label,
        custom_short_label: item.custom_short_label,
        position: item.position,
        is_custom: item.is_custom ?? false,
        color: item.color ?? 'text-gray-700',
        bg_color: item.bg_color ?? 'bg-gray-100',
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('status_settings')
        .upsert(rows, { onConflict: 'user_id,status_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-settings'] });
    },
  });

  const deleteCustomStatus = useMutation({
    mutationFn: async (statusKey: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('status_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('status_key', statusKey)
        .eq('is_custom', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-settings'] });
    },
  });

  // Safe getter that returns a fallback for unknown statuses
  const getStatusConfig = (status: string): StatusConfigEntry => {
    return statusConfig[status] || {
      label: status,
      shortLabel: status,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      position: 99,
      isCustom: false,
    };
  };

  return { statusConfig, orderedStatuses, settings, isLoading, saveSettings, deleteCustomStatus, canAddMore, customStatusCount, getStatusConfig };
}
