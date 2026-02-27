import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OSStatus, STATUS_CONFIG } from '@/types/serviceOrder';
import { useMemo } from 'react';

export interface StatusSetting {
  id: string;
  user_id: string;
  status_key: OSStatus;
  custom_label: string;
  custom_short_label: string;
  position: number;
}

const DEFAULT_POSITIONS: Record<OSStatus, number> = {
  pending: 0,
  in_progress: 1,
  waiting_parts: 2,
  waiting_approval: 3,
  completed: 4,
  delivered: 5,
  cancelled: 6,
};

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

  // Merged config: user overrides on top of defaults
  const statusConfig = useMemo(() => {
    const merged: Record<OSStatus, { label: string; shortLabel: string; color: string; bgColor: string; position: number }> = {} as any;

    for (const [key, def] of Object.entries(STATUS_CONFIG)) {
      const s = key as OSStatus;
      const userSetting = settings.find(st => st.status_key === s);
      merged[s] = {
        ...def,
        label: userSetting?.custom_label || def.label,
        shortLabel: userSetting?.custom_short_label || def.shortLabel,
        position: userSetting?.position ?? DEFAULT_POSITIONS[s],
      };
    }
    return merged;
  }, [settings]);

  // Ordered status keys for kanban columns etc.
  const orderedStatuses = useMemo(() => {
    const all = Object.keys(statusConfig) as OSStatus[];
    return all.sort((a, b) => statusConfig[a].position - statusConfig[b].position);
  }, [statusConfig]);

  const saveSettings = useMutation({
    mutationFn: async (items: { status_key: OSStatus; custom_label: string; custom_short_label: string; position: number }[]) => {
      if (!user) throw new Error('Not authenticated');

      // Upsert all at once
      const rows = items.map(item => ({
        user_id: user.id,
        status_key: item.status_key,
        custom_label: item.custom_label,
        custom_short_label: item.custom_short_label,
        position: item.position,
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

  return { statusConfig, orderedStatuses, settings, isLoading, saveSettings };
}
