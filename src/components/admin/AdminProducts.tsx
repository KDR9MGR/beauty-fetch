import { useState, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, Search, Store, Package } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StoreProductPricing {
  store_id: string;
  store_name: string;
  price: number;
  cost_price: number;
  inventory_quantity: number;
  is_available: boolean;
}

interface EnhancedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number; // Base price
  compare_price?: number;
  sku?: string;
  status: string;
  featured: boolean;
  stores: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  store_pricing: StoreProductPricing[];
  images?: string[]; // Array of image URLs
  created_at: string;
}

export const AdminProducts = () => {
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<EnhancedProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Import/Export state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
    total: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    short_description: "",
    cost_per_item: "",
    margin_percentage: "",
    retail_price: "",
    compare_price: "",
    sku: "",
    status: "active" as "active" | "inactive" | "out_of_stock",
    featured: false,
    selected_categories: [] as string[],
    selected_stores: [] as string[],
    images: [] as string[], // Array of image URLs
  });

  // Calculate profit and retail price based on cost and margin
  const calculatePricing = (cost: number, margin: number) => {
    const retailPrice = cost * (1 + margin / 100);
    const profit = retailPrice - cost;
    return { profit, retailPrice };
  };

  // Update retail price when cost or margin changes
  const updateRetailPrice = (cost: string, margin: string) => {
    const costValue = parseFloat(cost) || 0;
    const marginValue = parseFloat(margin) || 0;
    const { retailPrice } = calculatePricing(costValue, marginValue);
    
    setFormData(prev => ({
      ...prev,
      retail_price: retailPrice.toFixed(2)
    }));
  };

  // Handle cost per item change
  const handleCostChange = (value: string) => {
    setFormData(prev => ({ ...prev, cost_per_item: value }));
    updateRetailPrice(value, formData.margin_percentage);
  };

  // Handle margin change
  const handleMarginChange = (value: string) => {
    setFormData(prev => ({ ...prev, margin_percentage: value }));
    updateRetailPrice(formData.cost_per_item, value);
  };

  const [storePricing, setStorePricing] = useState<Record<string, {
    price: number;
    cost_price: number;
    inventory_quantity: number;
    is_available: boolean;
  }>>({});

  useEffect(() => {
    fetchProducts();
    fetchStores();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      // Use any type to bypass TypeScript issues temporarily
      const supabaseAny = supabase as any;
      
      // Fetch products with their store associations and categories
      const { data: productsData, error: productsError } = await supabaseAny
      .from("products")
      .select(`
        *,
          stores (id, name),
          categories (id, name)
        `)
        .order("name", { ascending: sortOrder === "asc" });

      if (productsError) throw productsError;

      // Fetch store-specific pricing for each product
      const productsWithPricing = await Promise.all(
        (productsData || []).map(async (product) => {
          const { data: storeProducts } = await supabaseAny
            .from("store_products")
            .select(`
              store_id,
              price,
              cost_price,
              inventory_quantity,
              is_available,
              stores (name)
            `)
            .eq("product_id", product.id);

          // Fetch additional categories from product_categories table
          const { data: additionalCategories } = await supabaseAny
            .from("product_categories")
            .select(`
              categories (id, name)
            `)
            .eq("product_id", product.id);

          const allCategories = [
            ...(product.categories ? [product.categories] : []),
            ...(additionalCategories?.map((pc: any) => pc.categories).filter(Boolean) || [])
          ];

          // Remove duplicates
          const uniqueCategories = allCategories.reduce((acc, cat) => {
            if (!acc.find(c => c.id === cat.id)) {
              acc.push(cat);
            }
            return acc;
          }, [] as any[]);

          return {
            ...product,
            categories: uniqueCategories,
            stores: product.stores ? [product.stores] : [],
            store_pricing: storeProducts?.map((sp: any) => ({
              store_id: sp.store_id,
              store_name: sp.stores?.name || '',
              price: sp.price,
              cost_price: sp.cost_price || 0,
              inventory_quantity: sp.inventory_quantity || 0,
              is_available: sp.is_available
            })) || []
          };
        })
      );

      setProducts(productsWithPricing);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
    setLoading(false);
    }
  };

  const fetchStores = async () => {
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from("stores")
      .select("id, name")
      .eq("status", "active")
      .order("name");

    if (!error) {
      setStores(data || []);
    }
  };

  const fetchCategories = async () => {
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (!error) {
      setCategories(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description,
        price: parseFloat(formData.retail_price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        sku: formData.sku,
        status: formData.status,
        featured: formData.featured,
        // Use the first selected category as the primary category for backward compatibility
        category_id: formData.selected_categories[0] || null,
        // Use the first selected store as the primary store for backward compatibility
        store_id: formData.selected_stores[0] || null,
        cost_per_item: parseFloat(formData.cost_per_item),
        margin_percentage: parseFloat(formData.margin_percentage),
        images: formData.images
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      if (productId) {
        // Handle multiple categories
        if (formData.selected_categories.length > 1) {
          // Delete existing category associations
          await (supabase as any)
            .from("product_categories")
            .delete()
            .eq("product_id", productId);

          // Add new category associations (skip the first one as it's already in the main table)
          const categoryInserts = formData.selected_categories.slice(1).map(categoryId => ({
            product_id: productId,
            category_id: categoryId,
            is_primary: false
          }));

          if (categoryInserts.length > 0) {
            const { error: categoryError } = await (supabase as any)
              .from("product_categories")
              .insert(categoryInserts);
            
            if (categoryError) throw categoryError;
          }
        }

        // Handle store-specific pricing
        if (formData.selected_stores.length > 0) {
          // Delete existing store pricing
          await (supabase as any)
            .from("store_products")
            .delete()
            .eq("product_id", productId);

          // Add new store pricing
          const storeInserts = formData.selected_stores.map(storeId => {
            const pricing = storePricing[storeId] || {
              price: parseFloat(formData.retail_price),
              cost_price: parseFloat(formData.cost_per_item),
              inventory_quantity: 0,
              is_available: true
            };

            return {
              product_id: productId,
              store_id: storeId,
              ...pricing
            };
          });

          const { error: storePricingError } = await (supabase as any)
            .from("store_products")
            .insert(storeInserts);
          
          if (storePricingError) throw storePricingError;
        }
      }

      toast({
        title: "Success",
        description: `Product ${editingProduct ? "updated" : "created"} successfully`
      });
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        fetchProducts();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      short_description: "",
      cost_per_item: "",
      margin_percentage: "",
      retail_price: "",
      compare_price: "",
      sku: "",
      status: "active",
      featured: false,
      selected_categories: [],
      selected_stores: [],
      images: [],
    });
    setStorePricing({});
    setEditingProduct(null);
  };

  const openEditDialog = (product: EnhancedProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      short_description: product.short_description || "",
      cost_per_item: product.price.toString(), // Assuming product.price is the cost_price
      margin_percentage: "0", // Placeholder, will be calculated
      retail_price: product.price.toString(), // Assuming product.price is the retail_price
      compare_price: product.compare_price?.toString() || "",
      sku: product.sku || "",
      status: product.status as any,
      featured: product.featured,
      selected_categories: product.categories.map(c => c.id),
      selected_stores: product.stores.map(s => s.id),
      images: product.images || [], // Set images from product
    });

    // Set store pricing data
    const pricingData: Record<string, any> = {};
    product.store_pricing.forEach(sp => {
      pricingData[sp.store_id] = {
        price: sp.price,
        cost_price: sp.cost_price,
        inventory_quantity: sp.inventory_quantity,
        is_available: sp.is_available
      };
    });
    setStorePricing(pricingData);
    setDialogOpen(true);
  };

  // CSV Import/Export Functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      // Detect CSV format (Shopify vs Simple)
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const isShopifyFormat = headers.includes('Handle') && headers.includes('Title') && headers.includes('Vendor');
      
      console.log('CSV Format detected:', isShopifyFormat ? 'Shopify' : 'Simple');
      console.log('Headers:', headers);
      
      let processedProducts: any[] = [];
      
      if (isShopifyFormat) {
        processedProducts = await processShopifyCSV(lines);
    } else {
        processedProducts = await processSimpleCSV(lines);
      }

      console.log('Processed products:', processedProducts.length);

      // Check if we have stores and categories available
      const supabaseAny = supabase as any;
      
      const { data: availableStores, error: storesError } = await supabaseAny
        .from('stores')
        .select('id, name')
        .limit(1);
      
      if (storesError || !availableStores || availableStores.length === 0) {
        throw new Error('No stores available. Please create at least one store first.');
      }

      const { data: availableCategories, error: categoriesError } = await supabaseAny
        .from('categories')
        .select('id, name')
        .limit(1);
      
      if (categoriesError || !availableCategories || availableCategories.length === 0) {
        throw new Error('No categories available. Please create at least one category first.');
      }

      console.log('Available stores:', availableStores.length);
      console.log('Available categories:', availableCategories.length);

      // Import products in batches
      const results = { success: 0, errors: [] as string[], total: processedProducts.length };
      
      for (let i = 0; i < processedProducts.length; i++) {
        try {
          console.log(`Importing product ${i + 1}/${processedProducts.length}:`, processedProducts[i].name);
          await importSingleProduct(processedProducts[i]);
          results.success++;
        } catch (error: any) {
          const errorMessage = `Row ${i + 2}: ${error.message}`;
          console.error(errorMessage);
          results.errors.push(errorMessage);
        }
        
        setImportProgress(((i + 1) / processedProducts.length) * 100);
        
        // Add small delay to prevent overwhelming the database
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setImportResults(results);
      
      if (results.success > 0) {
        fetchProducts(); // Refresh the products list
      toast({
          title: "Import Completed",
          description: `Successfully imported ${results.success} products. ${results.errors.length} errors occurred.`,
          variant: results.errors.length > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Import Failed",
          description: `No products were imported. ${results.errors.length} errors occurred.`,
        variant: "destructive",
      });
    }
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processShopifyCSV = async (lines: string[]): Promise<any[]> => {
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const products: any[] = [];
    const productMap = new Map();

    // Process each line
      for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
        
      const values = parseCSVLine(lines[i]);
      const rowData: any = {};
        
        headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });

      // Skip empty rows or variants without main product data
      if (!rowData.Handle || (!rowData.Title && !productMap.has(rowData.Handle))) continue;

      if (!productMap.has(rowData.Handle)) {
        // This is a main product row
        const product = {
          name: rowData.Title,
          slug: rowData.Handle,
          description: rowData['Body (HTML)'] || '',
          short_description: '',
          price: parseFloat(rowData['Variant Price']) || 0,
          compare_price: parseFloat(rowData['Variant Compare At Price']) || null,
          sku: rowData['Variant SKU'] || '',
          status: rowData.Status === 'active' ? 'active' : 'inactive',
          featured: false,
          vendor: rowData.Vendor || '',
          product_category: rowData['Product Category'] || '',
          type: rowData.Type || '',
          tags: rowData.Tags ? rowData.Tags.split(',').map((t: string) => t.trim()) : [],
          variants: [],
          images: []
        };

        if (rowData['Image Src']) {
          product.images.push({
            url: rowData['Image Src'],
            position: parseInt(rowData['Image Position']) || 1,
            alt: rowData['Image Alt Text'] || ''
          });
        }

        productMap.set(rowData.Handle, product);
        products.push(product);
      } else {
        // This is a variant or additional image row
        const product = productMap.get(rowData.Handle);
        
        if (rowData['Option1 Value'] && !product.variants.some((v: any) => v.option1 === rowData['Option1 Value'])) {
          product.variants.push({
            option1_name: rowData['Option1 Name'] || 'Title',
            option1_value: rowData['Option1 Value'],
            option2_name: rowData['Option2 Name'] || null,
            option2_value: rowData['Option2 Value'] || null,
            price: parseFloat(rowData['Variant Price']) || product.price,
            compare_price: parseFloat(rowData['Variant Compare At Price']) || null,
            sku: rowData['Variant SKU'] || '',
            inventory: parseInt(rowData['Variant Grams']) || 0
          });
        }

        if (rowData['Image Src'] && !product.images.some((img: any) => img.url === rowData['Image Src'])) {
          product.images.push({
            url: rowData['Image Src'],
            position: parseInt(rowData['Image Position']) || product.images.length + 1,
            alt: rowData['Image Alt Text'] || ''
          });
        }
      }
    }

    return products;
  };

  const processSimpleCSV = async (lines: string[]): Promise<any[]> => {
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const products: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = parseCSVLine(lines[i]);
      const product: any = {};
      
      headers.forEach((header, index) => {
        product[header] = values[index] || '';
      });

      if (product.name) {
        products.push({
          name: product.name,
          slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: product.description || '',
          short_description: product.short_description || '',
          price: parseFloat(product.price) || 0,
          compare_price: parseFloat(product.compare_price) || null,
          sku: product.sku || '',
          status: product.status || 'active',
          featured: product.featured === 'true' || product.featured === '1'
        });
      }
    }

    return products;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const importSingleProduct = async (productData: any) => {
    try {
      console.log('Importing product:', productData.name);
      
      // Use any type to bypass TypeScript issues temporarily
      const supabaseAny = supabase as any;
      
      // First, check if required tables exist by testing a simple query
      const { data: storesTest, error: storesError } = await supabaseAny
        .from('stores')
        .select('id, name')
        .limit(1);
      
      if (storesError) {
        console.error('Stores table error:', storesError);
        throw new Error(`Database setup issue: ${storesError.message}. Please ensure stores table exists.`);
      }

      const { data: categoriesTest, error: categoriesError } = await supabaseAny
        .from('categories')
        .select('id, name')
        .limit(1);
      
      if (categoriesError) {
        console.error('Categories table error:', categoriesError);
        throw new Error(`Database setup issue: ${categoriesError.message}. Please ensure categories table exists.`);
      }

      // Find or create category
      let categoryId = null;
      if (productData.product_category) {
        const { data: existingCategory, error: categoryQueryError } = await supabaseAny
          .from('categories')
          .select('id')
          .eq('name', productData.product_category)
          .single();
        
        if (categoryQueryError && categoryQueryError.code !== 'PGRST116') {
          console.error('Category query error:', categoryQueryError);
          throw new Error(`Category query failed: ${categoryQueryError.message}`);
        }
        
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Try to create new category
          const { data: newCategory, error: categoryInsertError } = await supabaseAny
            .from('categories')
            .insert({
              name: productData.product_category,
              slug: productData.product_category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              is_active: true
            })
            .select('id')
            .single();
          
          if (categoryInsertError) {
            console.error('Category insert error:', categoryInsertError);
            if (categoryInsertError.code === '42501') {
              throw new Error(`Permission denied: Cannot create category "${productData.product_category}". This is likely due to Row Level Security (RLS) policies. Please contact your administrator.`);
            }
            throw new Error(`Failed to create category: ${categoryInsertError.message}`);
          }
          
          if (newCategory) categoryId = newCategory.id;
        }
      }

      // Use first available store if no category found
      if (!categoryId && storesTest && storesTest.length > 0) {
        categoryId = storesTest[0].id;
      }

      // Use first available store
      const storeId = storesTest && storesTest.length > 0 ? storesTest[0].id : null;
      if (!storeId) {
        throw new Error('No stores available for product import. Please create at least one store first.');
      }

      // Check if product already exists
      const { data: existingProduct, error: productCheckError } = await supabaseAny
        .from('products')
        .select('id')
        .eq('slug', productData.slug)
        .single();

      if (productCheckError && productCheckError.code !== 'PGRST116') {
        console.error('Product check error:', productCheckError);
        throw new Error(`Product check failed: ${productCheckError.message}`);
      }

      if (existingProduct) {
        console.log('Product already exists, skipping:', productData.name);
        return existingProduct;
      }

      // Insert product
      const { data: newProduct, error: productError } = await supabaseAny
        .from('products')
        .insert({
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          short_description: productData.short_description,
          price: parseFloat(productData.price), // Store the retail price
          compare_price: productData.compare_price,
          sku: productData.sku,
          status: productData.status,
          featured: productData.featured,
          category_id: categoryId,
          store_id: storeId
        })
        .select('id')
        .single();

      if (productError) {
        console.error('Product insert error:', productError);
        if (productError.code === '42501') {
          throw new Error(`Permission denied: Cannot create product "${productData.name}". This is likely due to Row Level Security (RLS) policies. Please ensure you are logged in as an administrator or contact your system administrator to configure RLS policies.`);
        }
        throw new Error(`Failed to insert product: ${productError.message}`);
      }

      console.log('Successfully imported product:', productData.name, 'ID:', newProduct.id);
      return newProduct;
      
    } catch (error: any) {
      console.error('Import error for product:', productData.name, error);
      throw error;
    }
  };

  const exportProducts = async (format: 'simple' | 'shopify' = 'simple') => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          stores(name)
        `);

      if (error) throw error;

      let csvContent = '';
      
      if (format === 'shopify') {
        csvContent = generateShopifyCSV(productsData);
      } else {
        csvContent = generateSimpleCSV(productsData);
      }

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products_${format}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    toast({
        title: "Export Successful",
        description: `${productsData?.length || 0} products exported to CSV`,
      });
      
    } catch (error: any) {
      toast({
        title: "Export Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateSimpleCSV = (products: any[]) => {
    const headers = ['name', 'slug', 'description', 'short_description', 'price', 'compare_price', 'sku', 'status', 'featured'];
    const rows = products.map(product => [
      `"${product.name || ''}"`,
      `"${product.slug || ''}"`,
      `"${(product.description || '').replace(/"/g, '""')}"`,
      `"${(product.short_description || '').replace(/"/g, '""')}"`,
      product.price || 0,
      product.compare_price || '',
      `"${product.sku || ''}"`,
      product.status || 'active',
      product.featured ? 'true' : 'false'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const generateShopifyCSV = (products: any[]) => {
    const headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker',
      'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
      'Variant Requires Shipping', 'Variant Taxable', 'Image Src', 'Image Position', 'Status'
    ];

    const rows = products.map(product => [
      `"${product.slug || ''}"`,
      `"${product.name || ''}"`,
      `"${(product.description || '').replace(/"/g, '""')}"`,
      `"${product.stores?.[0]?.name || 'My Store'}"`,
      `"${product.categories?.[0]?.name || 'Uncategorized'}"`,
      `"${product.categories?.[0]?.name || ''}"`,
      '""',
      'TRUE',
      'Title',
      'Default Title',
      `"${product.sku || ''}"`,
      '0.0',
      'shopify',
      'continue',
      'manual',
      product.price || 0,
      product.compare_price || '',
      'TRUE',
      'FALSE',
      '""',
      '1',
      product.status || 'active'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const openPricingDialog = (product: EnhancedProduct) => {
    setSelectedProduct(product);
    setPricingDialogOpen(true);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.stores.some(store => store.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products Management</h2>
          <p className="text-gray-600">Manage products with multi-store pricing and categories</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Products</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Choose export format:</p>
                <div className="flex gap-2">
                  <Button onClick={() => { exportProducts('simple'); setExportDialogOpen(false); }}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Simple CSV
                  </Button>
                  <Button onClick={() => { exportProducts('shopify'); setExportDialogOpen(false); }}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Shopify CSV
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Import Products</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Upload a CSV file to import products. Supports both simple CSV and Shopify export formats.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isImporting}
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose CSV File
                  </Button>
                      </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing...</span>
                      <span>{Math.round(importProgress)}%</span>
                  </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                </div>
                  </div>
                )}

                {importResults && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Import completed</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>✅ {importResults.success} products imported successfully</div>
                      {importResults.errors.length > 0 && (
                        <div>❌ {importResults.errors.length} errors occurred</div>
                      )}
                        </div>
                    {importResults.errors.length > 0 && (
                      <div className="max-h-32 overflow-y-auto bg-red-50 p-2 rounded text-xs">
                        {importResults.errors.map((error, index) => (
                          <div key={index} className="text-red-700">{error}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="stores">Stores & Pricing</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit}>
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                      
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                </div>

                  <div>
                        <Label htmlFor="cost_per_item">Cost per Item</Label>
                        <Input
                          id="cost_per_item"
                          type="number"
                          step="0.01"
                          value={formData.cost_per_item}
                          onChange={e => handleCostChange(e.target.value)}
                          required
                        />
                </div>
                
                <div>
                        <Label htmlFor="margin_percentage">Margin (%)</Label>
                        <Input
                          id="margin_percentage"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={formData.margin_percentage}
                          onChange={e => handleMarginChange(e.target.value)}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter percentage from 0 to 100
                        </p>
                </div>

                <div>
                        <Label htmlFor="retail_price">Retail Price</Label>
                        <Input
                          id="retail_price"
                          type="number"
                          step="0.01"
                          value={formData.retail_price}
                          onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
                          required
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-calculated from cost + margin
                        </p>
                </div>

                  <div>
                        <Label htmlFor="profit_display">Profit</Label>
                        <div className="flex items-center space-x-2">
                    <Input
                            id="profit_display"
                      type="number"
                      step="0.01"
                            value={(() => {
                              const cost = parseFloat(formData.cost_per_item) || 0;
                              const margin = parseFloat(formData.margin_percentage) || 0;
                              const retailPrice = cost * (1 + margin / 100);
                              return (retailPrice - cost).toFixed(2);
                            })()}
                            readOnly
                            className="bg-gray-50"
                          />
                          <span className="text-sm text-gray-500">USD</span>
                  </div>
                      </div>

                  <div>
                        <Label htmlFor="compare_price">Compare Price (Optional)</Label>
                    <Input
                      id="compare_price"
                      type="number"
                      step="0.01"
                      value={formData.compare_price}
                      onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                          placeholder="Original price for comparison"
                    />
                        <p className="text-xs text-gray-500 mt-1">
                          Shows as "was $X" to customers
                        </p>
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                
                <div>
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    rows={2}
                  />
                </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                      id="featured"
                      checked={formData.featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, featured: !!checked })}
                    />
                    <Label htmlFor="featured">Featured Product</Label>
                  </div>

                    {/* Image Management Section */}
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-lg font-semibold mb-4">Product Images</h4>
                      
                      <div className="space-y-4">
                        {/* Add Image URL */}
                        <div>
                          <Label htmlFor="imageUrl">Add Image URL</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="imageUrl"
                              placeholder="https://example.com/image.jpg"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  const url = input.value.trim();
                                  if (url && !formData.images.includes(url)) {
                                    setFormData(prev => ({
                                      ...prev,
                                      images: [...prev.images, url]
                                    }));
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('imageUrl') as HTMLInputElement;
                                const url = input.value.trim();
                                if (url && !formData.images.includes(url)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    images: [...prev.images, url]
                                  }));
                                  input.value = '';
                                }
                              }}
                            >
                              Add Image
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Enter image URL and press Enter or click Add Image
                          </p>
                </div>

                        {/* Image Preview Grid */}
                        {formData.images.length > 0 && (
                          <div>
                            <Label>Image Preview ({formData.images.length})</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                              {formData.images.map((imageUrl, index) => (
                                <div key={index} className="relative group">
                                  <div className="aspect-square rounded-lg overflow-hidden border bg-gray-50">
                                    <img
                                      src={imageUrl}
                                      alt={`Product image ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder.svg';
                                      }}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        images: prev.images.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    {index === 0 ? 'Main' : index + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              The first image will be used as the main product image. Drag to reorder (coming soon).
                            </p>
                          </div>
                        )}

                        {/* File Upload Option */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Upload Images</h3>
                          <p className="text-xs text-gray-500 mb-4">
                            Drag and drop images here, or click to select files
                          </p>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            id="imageUpload"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              // For now, just show alert. In real implementation, upload to cloud storage
                              if (files.length > 0) {
                                toast({
                                  title: "Feature Coming Soon",
                                  description: "Image upload to cloud storage will be available soon. Please use image URLs for now.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('imageUpload')?.click()}
                          >
                            Choose Files
                          </Button>
                          <p className="text-xs text-gray-400 mt-2">
                            PNG, JPG, GIF up to 10MB each
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="categories" className="space-y-4">
                <div>
                      <Label>Select Categories</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded p-2">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={formData.selected_categories.includes(category.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    selected_categories: [...formData.selected_categories, category.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    selected_categories: formData.selected_categories.filter(id => id !== category.id)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`category-${category.id}`} className="text-sm">
                              {category.name}
                            </Label>
                </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="stores" className="space-y-4">
                  <div>
                      <Label>Select Stores & Set Pricing</Label>
                      <div className="space-y-4 mt-2">
                        {stores.map((store) => {
                          const isSelected = formData.selected_stores.includes(store.id);
                          const pricing = storePricing[store.id] || {
                            price: parseFloat(formData.retail_price) || 0,
                            cost_price: 0,
                            inventory_quantity: 0,
                            is_available: true
                          };

                          return (
                            <div key={store.id} className="border rounded p-4">
                              <div className="flex items-center space-x-2 mb-3">
                                <Checkbox
                                  id={`store-${store.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData({
                                        ...formData,
                                        selected_stores: [...formData.selected_stores, store.id]
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        selected_stores: formData.selected_stores.filter(id => id !== store.id)
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor={`store-${store.id}`} className="font-medium">
                                  {store.name}
                                </Label>
                  </div>
                              
                              {isSelected && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                                      value={pricing.price}
                                      onChange={(e) => setStorePricing({
                                        ...storePricing,
                                        [store.id]: {
                                          ...pricing,
                                          price: parseFloat(e.target.value) || 0
                                        }
                                      })}
                    />
                  </div>
                  <div>
                                    <Label className="text-xs">Cost</Label>
                    <Input
                                      type="number"
                                      step="0.01"
                                      value={pricing.cost_price}
                                      onChange={(e) => setStorePricing({
                                        ...storePricing,
                                        [store.id]: {
                                          ...pricing,
                                          cost_price: parseFloat(e.target.value) || 0
                                        }
                                      })}
                    />
                  </div>
                  <div>
                                    <Label className="text-xs">Inventory</Label>
                    <Input
                      type="number"
                                      value={pricing.inventory_quantity}
                                      onChange={(e) => setStorePricing({
                                        ...storePricing,
                                        [store.id]: {
                                          ...pricing,
                                          inventory_quantity: parseInt(e.target.value) || 0
                                        }
                                      })}
                    />
                  </div>
                                  <div className="flex items-center space-x-2 pt-5">
                                    <Checkbox
                                      id={`available-${store.id}`}
                                      checked={pricing.is_available}
                                      onCheckedChange={(checked) => setStorePricing({
                                        ...storePricing,
                                        [store.id]: {
                                          ...pricing,
                                          is_available: !!checked
                                        }
                                      })}
                                    />
                                    <Label htmlFor={`available-${store.id}`} className="text-xs">
                                      Available
                                    </Label>
                  </div>
                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  <div className="flex justify-end space-x-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProduct ? "Update" : "Create"} Product
                  </Button>
                </div>
              </form>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Store Pricing Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span>Store Pricing - {selectedProduct?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {selectedProduct?.store_pricing.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProduct.store_pricing.map((pricing) => (
                    <TableRow key={pricing.store_id}>
                      <TableCell className="font-medium">{pricing.store_name}</TableCell>
                      <TableCell>${pricing.price.toFixed(2)}</TableCell>
                      <TableCell>${pricing.cost_price.toFixed(2)}</TableCell>
                      <TableCell>{pricing.inventory_quantity}</TableCell>
                      <TableCell>
                        <Badge variant={pricing.is_available ? "default" : "secondary"}>
                          {pricing.is_available ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No store-specific pricing configured for this product
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products by name, description, or store..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">A-Z (Alphabetical)</SelectItem>
                <SelectItem value="desc">Z-A (Reverse)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Products ({sortedProducts.length})</CardTitle>
          <CardDescription>Manage all products with multi-store support</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Stores</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {product.categories.map((category) => (
                        <Badge key={category.id} variant="outline" className="mr-1">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {product.store_pricing.length} store{product.store_pricing.length !== 1 ? 's' : ''}
                      </span>
                      {product.store_pricing.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPricingDialog(product)}
                        >
                          View Pricing
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === "active" ? "default" : "secondary"}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.featured && <Star className="h-4 w-4 text-yellow-500" />}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
