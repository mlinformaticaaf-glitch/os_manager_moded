import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CompanySettings, CompanySettingsUpdate } from '@/types/companySettings';

function getStorageErrorMessage(error: { message?: string }): string {
  const message = error?.message ?? 'Erro inesperado no upload de arquivo.';

  if (/bucket not found/i.test(message)) {
    return 'Bucket de logos nao encontrado no Supabase. Execute as migrations para criar o bucket company-logos.';
  }

  return message;
}

export function useCompanySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['company-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no settings exist, create default
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('company_settings')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings as CompanySettings;
      }

      return data as CompanySettings;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: CompanySettingsUpdate) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('company_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações da empresa foram atualizadas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      // Delete old logo if exists
      await supabase.storage
        .from('company-logos')
        .remove([`${user.id}/logo.png`, `${user.id}/logo.jpg`, `${user.id}/logo.jpeg`, `${user.id}/logo.webp`]);

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      // Update settings with logo URL
      const { data, error: updateError } = await supabase
        .from('company_settings')
        .update({ logo_url: publicUrl })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return data as CompanySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: 'Logo atualizado',
        description: 'O logo da empresa foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar logo',
        description: getStorageErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const removeLogo = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Remove from storage
      await supabase.storage
        .from('company-logos')
        .remove([`${user.id}/logo.png`, `${user.id}/logo.jpg`, `${user.id}/logo.jpeg`, `${user.id}/logo.webp`]);

      // Update settings
      const { data, error } = await supabase
        .from('company_settings')
        .update({ logo_url: null })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: 'Logo removido',
        description: 'O logo da empresa foi removido.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover logo',
        description: getStorageErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings,
    uploadLogo,
    removeLogo,
  };
}
