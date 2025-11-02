import { supabase } from "@/integrations/supabase/client";

export interface Chapter {
  id: string;
  name: string;
  leader_id: string;
  created_at: string;
  updated_at: string;
}

export const chapterService = {
  async getChapters() {
    const { data, error } = await supabase.from("chapters").select("*");

    return { data, error };
  },

  async getChapterById(id: string) {
    const { data, error } = await supabase
      .from("chapters")
      .select("")
      .eq("id", id)
      .single();

    return { data, error };
  },
};
