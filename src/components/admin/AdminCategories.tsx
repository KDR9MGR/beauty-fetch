
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Package, Eye } from "lucide-react";
import React from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  subcategories?: Category[];
  products?: any[];
}

export const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategoryProducts, setViewingCategoryProducts] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    parent_id: "",
    is_active: true,
    sort_order: 0,
  });

  // Function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
  };

  // Auto-generate slug when name changes
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name) // Only auto-generate for new categories
    }));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    buildHierarchy();
  }, [categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")
        .order("name");

      if (error) {
        console.error('Categories fetch error:', error);
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive",
        });
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching categories:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = () => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Create a map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, subcategories: [] });
    });

    // Build the hierarchy
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.subcategories!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    setHierarchicalCategories(rootCategories);
  };

  const fetchCategoryProducts = async (categoryId: string) => {
    try {
      // Fetch products directly assigned to this category
      // Note: product_categories table might not exist yet, so we'll handle this gracefully
      let directProducts: any[] = [];
      try {
        const { data, error } = await (supabase as any)
          .from("product_categories")
          .select(`
            products (
              id,
              name,
              price,
              status,
              stores (name)
            )
          `)
          .eq("category_id", categoryId);

        if (!error && data) {
          directProducts = data.map((p: any) => p.products).filter(Boolean) || [];
        }
      } catch (error) {
        // Silently handle if product_categories table doesn't exist
        console.log('product_categories table not available:', error);
      }

      // Fetch products from legacy single-category assignment
      const { data: legacyProducts, error: legacyError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          price,
          status,
          stores (name)
        `)
        .eq("category_id", categoryId);

      if (legacyError) throw legacyError;

      // Combine and deduplicate products
      const allProducts = [
        ...directProducts,
        ...(legacyProducts || [])
      ];

      const uniqueProducts = allProducts.reduce((acc, product) => {
        if (product && !acc.find((p: any) => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, [] as any[]);

      setCategoryProducts(uniqueProducts);
    } catch (error) {
      console.error('Error fetching category products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch category products",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Category slug is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const categoryData = {
        ...formData,
        parent_id: formData.parent_id || null,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
      };

      const { error } = editingCategory
        ? await supabase
            .from("categories")
            .update(categoryData)
            .eq("id", editingCategory.id)
        : await supabase
            .from("categories")
            .insert([categoryData]);

      if (error) {
        console.error('Category save error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to save category",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Category ${editingCategory ? "updated" : "created"} successfully`,
        });
        setDialogOpen(false);
        resetForm();
        fetchCategories();
      }
    } catch (error) {
      console.error('Unexpected error saving category:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the category",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Check if category has subcategories
    const hasSubcategories = categories.some(cat => cat.parent_id === id);
    
    if (hasSubcategories) {
      toast({
        title: "Error",
        description: "Cannot delete category with subcategories. Please delete subcategories first.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Are you sure you want to delete this category?")) {
      try {
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", id);

        if (error) {
          console.error('Category delete error:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to delete category",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Category deleted successfully",
          });
          fetchCategories();
        }
      } catch (error) {
        console.error('Unexpected error deleting category:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while deleting the category",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      parent_id: "",
      is_active: true,
      sort_order: 0,
    });
    setEditingCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      parent_id: category.parent_id || "",
      is_active: category.is_active,
      sort_order: category.sort_order,
    });
    setDialogOpen(true);
  };

  const openProductDialog = async (category: Category) => {
    setViewingCategoryProducts(category);
    await fetchCategoryProducts(category.id);
    setProductDialogOpen(true);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <React.Fragment key={category.id}>
        <TableRow className={level > 0 ? "bg-gray-50" : ""}>
          <TableCell style={{ paddingLeft: `${level * 2 + 1}rem` }}>
            <div className="flex items-center space-x-2">
              {hasSubcategories ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategory(category.id)}
                  className="p-0 h-auto"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-4" />
              )}
              <span className="font-medium">{category.name}</span>
              {level > 0 && <Badge variant="outline" className="text-xs">Subcategory</Badge>}
            </div>
          </TableCell>
          <TableCell>{category.slug}</TableCell>
          <TableCell>{category.description || "—"}</TableCell>
          <TableCell>
            <Badge variant={category.is_active ? "default" : "secondary"}>
              {category.is_active ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell>{category.sort_order}</TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openProductDialog(category)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Products
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        
        {hasSubcategories && isExpanded && 
          category.subcategories!.map(subcategory => 
            renderCategoryRow(subcategory, level + 1)
          )
        }
      </React.Fragment>
    );
  };

  const getParentCategoryOptions = () => {
    const options: Category[] = [];
    
    const addOptions = (cats: Category[], level: number = 0) => {
      cats.forEach(cat => {
        options.push({ ...cat, name: '  '.repeat(level) + cat.name });
        if (cat.subcategories && cat.subcategories.length > 0) {
          addOptions(cat.subcategories, level + 1);
        }
      });
    };
    
    addOptions(hierarchicalCategories);
    return options;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Categories Management</h2>
          <p className="text-gray-600">Manage product categories and subcategories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                  placeholder="category-slug"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from name, but you can customize it
                </p>
              </div>
              
              <div>
                <Label htmlFor="parent">Parent Category</Label>
                <Select 
                  value={formData.parent_id} 
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Root Category)</SelectItem>
                    {getParentCategoryOptions()
                      .filter(cat => cat.id !== editingCategory?.id) // Prevent circular reference
                      .map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter category description"
                />
              </div>

              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingCategory ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingCategory ? "Update" : "Create"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Products in "{viewingCategoryProducts?.name}"</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {categoryProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.stores?.name || 'N/A'}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>
                        <Badge variant={product.status === "active" ? "default" : "secondary"}>
                          {product.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No products found in this category
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Categories ({categories.length})</CardTitle>
          <CardDescription>Hierarchical view of all categories and subcategories</CardDescription>
        </CardHeader>
        <CardContent>
          {hierarchicalCategories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hierarchicalCategories.map(category => renderCategoryRow(category))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No categories found. Create your first category to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
