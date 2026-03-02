// This file is disabled to allow direct Supabase authentication
export const lovable = {
  auth: {
    signInWithOAuth: async () => ({ error: new Error("Lovable Auth is disabled. Use direct Supabase Auth.") }),
  },
};
