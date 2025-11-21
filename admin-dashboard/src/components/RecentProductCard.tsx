import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface RecentProductCardProps {
  title: string;
  platform: string;
  price: number;
  image: string;
  onClick?: () => void;
}

export function RecentProductCard({ 
  title, 
  platform, 
  price, 
  image, 
  onClick 
}: RecentProductCardProps) {
  // Mock price change for demonstration
  const priceChange = (Math.random() - 0.5) * 50;
  const isPositive = priceChange > 0;
  
  return (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-border/50"
      onClick={onClick}
    >
      {/* Product Image */}
      <div className="relative overflow-hidden rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-14 h-14 object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 rounded-lg"></div>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {title}
        </h4>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{platform}</p>
          {Math.abs(priceChange) > 10 && (
            <div className={`flex items-center gap-1 text-xs ${
              isPositive ? 'text-red-500' : 'text-green-500'
            }`}>
              {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span className="font-medium">
                {isPositive ? '+' : ''}${priceChange.toFixed(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-primary">${price.toFixed(2)}</p>
          <ExternalLink size={12} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}