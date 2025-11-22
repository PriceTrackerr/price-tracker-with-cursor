import { ShoppingCart, Eye, Trash2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  id: string;
  title: string;
  platform: string;
  price: number;
  stock: number;
  image: string;
  matchingProducts: {
    platform: string;
    productName: string;
    price: number;
  }[];
}

export function ProductCard({ 
  id: _id, 
  title, 
  platform, 
  price, 
  stock, 
  image, 
  matchingProducts 
}: ProductCardProps) {
  const isInStock = stock > 0;
  
  const handleMatchingProductClick = (matchingProduct: { platform: string; productName: string; price: number }) => {
    // This would typically navigate to the matching product page
    console.log(`Navigate to ${matchingProduct.platform} for ${matchingProduct.productName}`);
  };
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-border bg-card h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Product Image */}
        <div className="relative overflow-hidden rounded-t-lg">
          <ImageWithFallback
            src={image}
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <Badge variant={isInStock ? "secondary" : "destructive"} className="text-xs">
              {isInStock ? `${stock} in stock` : "Out of stock"}
            </Badge>
          </div>
        </div>

        {/* Product Details - Flexible container */}
        <div className="p-4 flex flex-col flex-1">
          {/* Title and Platform */}
          <div className="space-y-1 mb-3">
            <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{platform}</p>
            <p className="text-lg font-semibold text-primary">${price.toFixed(2)}</p>
          </div>

          {/* Matching Products - Fixed height section */}
          <div className="flex-1 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Also found on</p>
            <div className="space-y-1 min-h-[4rem]">
              {matchingProducts.slice(0, 2).map((match, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 justify-start text-left w-full hover:bg-accent/50 border border-border/30 hover:border-border/60"
                  onClick={() => handleMatchingProductClick(match)}
                >
                  <div className="flex items-center justify-between w-full text-xs">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <span className="font-medium text-primary">{match.platform}</span>
                      <span className="text-muted-foreground truncate">
                        {match.productName}
                      </span>
                      <ExternalLink size={10} className="text-muted-foreground flex-shrink-0" />
                    </div>
                    <span className="text-primary font-medium ml-2 flex-shrink-0">${match.price.toFixed(2)}</span>
                  </div>
                </Button>
              ))}
              {matchingProducts.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 justify-start text-left w-full hover:bg-accent/50 border border-border/30 hover:border-border/60"
                >
                  <div className="flex items-center justify-between w-full text-xs">
                    <span className="text-muted-foreground">
                      +{matchingProducts.length - 2} more platforms
                    </span>
                    <ExternalLink size={10} className="text-muted-foreground" />
                  </div>
                </Button>
              )}
              {matchingProducts.length === 0 && (
                <div className="text-xs text-muted-foreground py-2">
                  No matching products found
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Always at bottom */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
            <Button 
              size="sm" 
              className="flex items-center gap-2"
            >
              <ShoppingCart size={14} />
              Buy Now
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="p-2 hover:bg-accent">
                <Eye size={14} />
              </Button>
              <Button variant="outline" size="sm" className="p-2 hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive">
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}