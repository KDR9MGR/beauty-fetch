
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          stores (
            name,
            slug,
            logo_url
          ),
          categories (
            name,
            slug
          ),
          product_images (
            image_url,
            alt_text,
            is_primary
          )
        `)
        .eq("status", "active")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          stores (
            name,
            slug,
            logo_url
          ),
          categories (
            name,
            slug
          ),
          product_images (
            image_url,
            alt_text,
            is_primary
          )
        `)
        .eq("status", "active")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });
};
