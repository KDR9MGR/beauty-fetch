
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/useCategories";

export function CategoriesGrid() {
  const { data: categories, isLoading, error } = useCategories();

  if (error) {
    console.error("Error loading categories:", error);
    return null;
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="text-center">
                <Skeleton className="w-20 h-20 mx-auto rounded-full mb-4" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))
          ) : categories && categories.length > 0 ? (
            categories.map((category) => (
              <Link
                key={category.id}
                to={`/explore?category=${category.slug}`}
                className="group text-center hover:scale-105 transition-transform duration-300"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-beauty-gradient p-1">
                  <img
                    src={category.image_url || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"}
                    alt={category.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-beauty-purple">
                  {category.name}
                </h3>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-600">No categories available.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
