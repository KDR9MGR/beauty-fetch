
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/useCategories";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<'categories'>;

export function CategorySection() {
  const { data: categoriesData, isLoading, error } = useCategories();

  if (error) {
    console.error("Error loading categories:", error);
    return null;
  }

  // Type cast and filter only parent categories (root categories) for the main display
  const categories = categoriesData as Category[] | undefined;
  const parentCategories = categories?.filter(category => !category.parent_id) || [];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Shop by Category</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                <Skeleton className="h-full w-full" />
              </div>
            ))
          ) : (
            parentCategories.slice(0, 6).map((category) => (
              <Link 
                to={`/explore?category=${category.slug}`} 
                key={category.id} 
                className="category-card group"
              >
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 transition-transform duration-300 group-hover:scale-105">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity group-hover:bg-black/30 z-10">
                    <h3 className="text-lg font-medium text-white text-center px-2">
                      {category.name}
                    </h3>
                  </div>
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name} 
                      className="h-full w-full object-cover transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-beauty-purple/20 to-beauty-pink/20 flex items-center justify-center">
                      <span className="text-4xl opacity-30">📦</span>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
