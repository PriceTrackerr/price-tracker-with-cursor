import { useState, useEffect } from "react";
import { Search, Filter, Package, Trash2, Eye, MoreHorizontal, ExternalLink, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useAuth } from "../AuthContext";

interface Product {
  id: string;
  title: string;
  platform: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  url: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  stockStatus?: string;
  matchedProducts?: string[];
  user?: {
    email: string;
    name?: string;
  };
}

export function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);

  // Fetch all products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Update local state
      setProducts(products.filter(product => product.id !== productId));
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDialog(true);
  };

  const handleVisitProduct = (product: Product) => {
    // Open product URL in new tab
    window.open(product.url, '_blank');
  };

  const handleAddProduct = () => {
    // Open web app in new tab for adding products
    window.open('http://localhost:3000/products', '_blank');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === "all" || product.platform === platformFilter;
    
    return matchesSearch && matchesPlatform;
  });

  // Calculate stats
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + product.price, 0);
  const productsWithDiscount = products.filter(p => p.originalPrice && p.price < p.originalPrice).length;
  const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  const platforms = [...new Set(products.map(p => p.platform))];

  const getPriceChangeColor = (current: number, original: number) => {
    if (current < original) return 'text-green-600';
    if (current > original) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getPriceChangeIcon = (current: number, original: number) => {
    const percentChange = ((current - original) / original) * 100;
    if (Math.abs(percentChange) < 1) return null;
    return percentChange < 0 ? '↓' : '↑';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Product Management</h2>
          <p className="text-muted-foreground">Monitor and manage tracked products</p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
          onClick={handleAddProduct}
        >
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-blue-600">${totalValue.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold text-purple-600">${avgPrice.toFixed(2)}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Sale</p>
                <p className="text-2xl font-bold text-green-600">{productsWithDiscount}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 placeholder:text-[#717182] border-[#E5E5E5]"
                style={{ backgroundColor: '#F3F3F5' }}
              />
            </div>
            
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-48" style={{ backgroundColor: '#F3F3F5' }}>
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent className="bg-white border-0 shadow-lg rounded-lg">
                <SelectItem value="all" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">All Platforms</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform} className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">{platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>


          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Tracked By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={product.imageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="min-w-0 max-w-48">
                          <p className="font-medium truncate">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Added {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{product.platform}</Badge>
                        <ExternalLink size={12} className="text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">${product.price.toFixed(2)}</p>
                        {product.originalPrice && product.price !== product.originalPrice && (
                          <p className={`text-sm ${getPriceChangeColor(product.price, product.originalPrice)}`}>
                            {getPriceChangeIcon(product.price, product.originalPrice)} 
                            ${product.originalPrice.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Eye size={14} className="text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {product.user?.name || product.user?.email || 'Unknown User'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.stockStatus === 'out_of_stock' ? 'destructive' : 'secondary'}
                      >
                        {product.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-0 shadow-lg rounded-lg">
                          <DropdownMenuItem 
                            onClick={() => handleViewDetails(product)}
                            className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]"
                          >
                            <Eye size={14} className="mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleVisitProduct(product)}
                            className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]"
                          >
                            <ExternalLink size={14} className="mr-2" />
                            Visit Product Page
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="font-medium text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search or filter criteria." : "No products match your current filters."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Details Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Product Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6 text-gray-900">
              {/* Product Image and Basic Info */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <ImageWithFallback
                    src={selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'}
                    alt={selectedProduct.title}
                    className="w-40 h-40 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-3">{selectedProduct.title}</h3>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 px-3 py-1">{selectedProduct.platform}</Badge>
                      <Badge 
                        variant={selectedProduct.stockStatus === 'out_of_stock' ? 'destructive' : 'secondary'}
                        className={selectedProduct.stockStatus === 'out_of_stock' ? 'bg-red-100 text-red-700 border-red-300 px-3 py-1' : 'bg-green-100 text-green-700 border-green-300 px-3 py-1'}
                      >
                        {selectedProduct.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Current Price:</span>
                        <span className="font-bold text-xl text-gray-900">${selectedProduct.price.toFixed(2)}</span>
                      </div>
                      {selectedProduct.originalPrice && selectedProduct.price !== selectedProduct.originalPrice && (
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-600 font-medium">Original Price:</span>
                          <span className={`${getPriceChangeColor(selectedProduct.price, selectedProduct.originalPrice)} font-medium`}>
                            ${selectedProduct.originalPrice.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product URL */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Product URL</h4>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <ExternalLink size={18} className="text-gray-500 flex-shrink-0" />
                  <a 
                    href={selectedProduct.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium break-all"
                  >
                    {selectedProduct.url}
                  </a>
                </div>
              </div>

              {/* Tracking Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900">Tracked By</h4>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Eye size={18} className="text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{selectedProduct.user?.name || selectedProduct.user?.email || 'Unknown User'}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900">Added Date</h4>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 font-medium">
                    {new Date(selectedProduct.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Matched Products */}
              {selectedProduct.matchedProducts && selectedProduct.matchedProducts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900">Matched Products</h4>
                  <div className="space-y-3">
                    {selectedProduct.matchedProducts.map((match, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                        {match}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button 
                  onClick={() => handleVisitProduct(selectedProduct)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Visit Product Page
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleDeleteProduct(selectedProduct.id);
                    setShowProductDialog(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Product
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}