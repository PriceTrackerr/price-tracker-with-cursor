#!/usr/bin/env ts-node

import { conditionScoringService } from '../src/services/conditionScoringService';
import { couponStackingService } from '../src/services/couponStackingService';
import { globalArbitrageService } from '../src/services/globalArbitrageService';
import { communityService } from '../src/services/communityService';
import { Product } from '../src/config/storage';

/**
 * Comprehensive demonstration of all advanced price tracking features
 */
class AdvancedFeaturesDemo {
  
  public async runDemo(): Promise<void> {
    console.log('🚀 Advanced Price Tracker Features Demo');
    console.log('==========================================\n');

    // Create sample products for demonstration
    const newProduct = this.createSampleProduct('new');
    const usedProduct = this.createSampleProduct('used');
    const refurbProduct = this.createSampleProduct('refurbished');

    await this.demonstrateConditionScoring(newProduct, usedProduct, refurbProduct);
    await this.demonstrateCouponStacking(newProduct);
    await this.demonstrateGlobalArbitrage(newProduct);
    await this.demonstrateCommunityFeatures(newProduct);
    await this.demonstrateIntegratedWorkflow(newProduct);
    
    console.log('\n✅ Demo completed successfully!');
    console.log('🎯 All advanced features are working as expected.');
  }

  private async demonstrateConditionScoring(
    newProduct: Product, 
    usedProduct: Product, 
    refurbProduct: Product
  ): Promise<void> {
    console.log('📊 CONDITION SCORING & USED/REFURB ANALYSIS');
    console.log('═══════════════════════════════════════════\n');

    // Analyze different product conditions
    const products = [
      { product: newProduct, condition: 'New' },
      { product: usedProduct, condition: 'Used' },
      { product: refurbProduct, condition: 'Refurbished' }
    ];

    for (const { product, condition } of products) {
      console.log(`🔍 Analyzing ${condition} Product: ${product.title}`);
      
      const analysis = await conditionScoringService.analyzeCondition(product);
      
      console.log(`   📈 Condition Score: ${analysis.score}/100`);
      console.log(`   🎯 Confidence: ${analysis.confidence}%`);
      console.log(`   ⚡ Risk Level: ${analysis.riskLevel}`);
      console.log(`   🏷️  Recommendations: ${analysis.recommendations.join(', ') || 'None'}`);
      console.log('');
    }

    // Compare used vs new
    console.log('🆚 Used vs New Comparison:');
    const comparison = await conditionScoringService.compareWithNewCondition(
      usedProduct, 
      [newProduct]
    );
    
    console.log(`   💰 Best New Price: $${comparison.bestNewPrice}`);
    console.log(`   💸 Used Savings: $${comparison.usedSavings.toFixed(2)}`);
    console.log(`   📊 Value Score: ${comparison.valueScore.toFixed(1)}/100`);
    console.log(`   🎯 Recommendation: ${comparison.recommendation.replace('_', ' ')}`);
    console.log(`   📝 Reasoning: ${comparison.reasoning.join(', ')}`);
    console.log('');
  }

  private async demonstrateCouponStacking(product: Product): Promise<void> {
    console.log('🎟️  COUPON STACKING & PRICE OPTIMIZATION');
    console.log('═══════════════════════════════════════════\n');

    console.log(`🔎 Finding coupons for: ${product.title}`);
    console.log(`   💲 Original Price: $${product.price}`);
    
    const couponResult = await couponStackingService.findCoupons(product);
    
    console.log(`   🎫 Coupons Found: ${couponResult.coupons.length}`);
    console.log(`   💰 Total Savings: $${couponResult.totalSavings.toFixed(2)}`);
    console.log(`   🎯 Confidence: ${couponResult.confidence}%`);
    console.log('');

    // Show best coupon stack
    if (couponResult.bestStack.coupons.length > 0) {
      console.log('🏆 Best Coupon Stack:');
      couponResult.bestStack.coupons.forEach((coupon, index) => {
        console.log(`   ${index + 1}. ${coupon.code} - ${coupon.description}`);
        console.log(`      💸 Discount: ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '$' + coupon.discountValue}`);
        console.log(`      ✅ Success Rate: ${coupon.successRate}%`);
      });
      console.log(`   🏁 Final Price: $${couponResult.bestStack.finalPrice.toFixed(2)}`);
      console.log(`   💝 You Save: $${couponResult.bestStack.savings.toFixed(2)}`);
    }

    // Validate the stack
    console.log('\n🔍 Validating Coupon Stack...');
    const validation = await couponStackingService.validateStack(couponResult.bestStack, product);
    console.log(`   ✅ Valid: ${validation.isValid}`);
    console.log(`   💲 Final Price: $${validation.finalPrice.toFixed(2)}`);
    console.log(`   💸 Applied Discount: $${validation.appliedDiscount.toFixed(2)}`);
    console.log('');
  }

  private async demonstrateGlobalArbitrage(product: Product): Promise<void> {
    console.log('🌍 GLOBAL ARBITRAGE & MULTI-CURRENCY ANALYSIS');
    console.log('═══════════════════════════════════════════\n');

    console.log(`🔍 Finding global arbitrage opportunities for: ${product.title}`);
    
    const arbitrageResult = await globalArbitrageService.findArbitrageOpportunities(product, 'US');
    
    console.log(`   💰 Local Price (US): $${arbitrageResult.bestDeal.localPrice.toFixed(2)}`);
    console.log(`   🏆 Best International Deal:`);
    console.log(`      🌎 Country: ${arbitrageResult.bestDeal.bestMarket.countryCode}`);
    console.log(`      💲 Price: $${arbitrageResult.bestDeal.bestMarket.price.toFixed(2)}`);
    console.log(`      📦 Landed Cost: $${arbitrageResult.bestDeal.bestMarket.landedCost.toFixed(2)}`);
    console.log(`      💸 Savings: $${arbitrageResult.bestDeal.bestMarket.savings.toFixed(2)} (${arbitrageResult.bestDeal.bestMarket.savingsPercentage.toFixed(1)}%)`);
    console.log(`      🎯 Recommendation: ${arbitrageResult.bestDeal.recommendation.replace('_', ' ')}`);
    console.log(`      🚚 Shipping: ${arbitrageResult.bestDeal.shippingDetails.estimatedDays} days via ${arbitrageResult.bestDeal.shippingDetails.carrier}`);
    
    if (arbitrageResult.bestDeal.risks.length > 0) {
      console.log(`      ⚠️  Risks: ${arbitrageResult.bestDeal.risks.join(', ')}`);
    }
    
    console.log('');

    // Show all markets
    console.log('🗺️  All Markets Comparison:');
    Object.entries(arbitrageResult.markets).forEach(([country, market]) => {
      console.log(`   ${country}: $${market.landedCost.toFixed(2)} (${market.availability}) - ${market.estimatedDelivery}d delivery`);
    });

    console.log(`\n📊 Price Range: $${arbitrageResult.priceRange.min.toFixed(2)} - $${arbitrageResult.priceRange.max.toFixed(2)}`);
    console.log(`📈 Average: $${arbitrageResult.priceRange.average.toFixed(2)}`);
    console.log('');
  }

  private async demonstrateCommunityFeatures(product: Product): Promise<void> {
    console.log('👥 COMMUNITY & SOCIAL PROOF FEATURES');
    console.log('═══════════════════════════════════════════\n');

    // Calculate credibility score
    console.log(`🔍 Analyzing deal credibility for: ${product.title}`);
    const credibility = await communityService.calculateCredibilityScore(product);
    
    console.log(`   📊 Credibility Score: ${credibility.score.toFixed(1)}/100`);
    console.log(`   🎯 Recommendation: ${credibility.recommendation.replace('_', ' ')}`);
    
    console.log('   📈 Contributing Factors:');
    Object.entries(credibility.factors).forEach(([factor, score]) => {
      console.log(`      ${factor.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${score.toFixed(1)}/100`);
    });
    
    if (credibility.badges.length > 0) {
      console.log(`   🏷️  Badges: ${credibility.badges.join(', ')}`);
    }
    
    if (credibility.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${credibility.warnings.join(', ')}`);
    }

    // Get social proof
    console.log('\n👍 Social Proof Metrics:');
    const socialProof = await communityService.getSocialProof(product.id);
    console.log(`   ⭐ Community Rating: ${socialProof.communityRating.toFixed(1)}/5.0`);
    console.log(`   🗳️  Total Votes: ${socialProof.totalVotes}`);
    console.log(`   🎖️  Expert Endorsements: ${socialProof.expertEndorsements}`);
    console.log(`   💬 Comments: ${socialProof.commentCount}`);
    console.log(`   📊 Trust Score: ${socialProof.trustScore.toFixed(1)}/100`);

    // Simulate community interaction
    console.log('\n🤝 Simulating Community Interaction:');
    
    // Create expert curator
    const curator = await communityService.createExpertCurator({
      name: 'TechDeals Expert',
      bio: 'Specialist in electronics and gadget deals with 10 years experience',
      specialties: ['electronics', 'smartphones', 'laptops']
    });
    console.log(`   👨‍💼 Created Expert Curator: ${curator.name}`);
    
    // Vote on deal
    const vote = await communityService.voteDeal('demo-user-1', product.id, 'upvote', 'Great deal, bought one myself!');
    console.log(`   👍 Added community vote: ${vote.voteType}`);
    
    // Add comment
    const comment = await communityService.addDealComment(
      product.id, 
      'demo-user-1', 
      'This is an excellent deal! The condition scoring shows high quality and the price is unbeatable.'
    );
    console.log(`   💬 Added comment: "${comment.content.substring(0, 50)}..."`);
    
    console.log('');
  }

  private async demonstrateIntegratedWorkflow(product: Product): Promise<void> {
    console.log('🔄 INTEGRATED WORKFLOW DEMONSTRATION');
    console.log('═══════════════════════════════════════════\n');

    console.log('🎯 Full Advanced Analysis Pipeline:');
    console.log(`   📦 Product: ${product.title}`);
    console.log(`   💲 Starting Price: $${product.price}`);
    console.log('');

    // Step 1: Condition Analysis
    console.log('   1️⃣  Condition Analysis...');
    const condition = await conditionScoringService.analyzeCondition(product);
    product.conditionScore = condition.score;
    console.log(`      ✅ Condition Score: ${condition.score}/100`);

    // Step 2: Coupon Discovery
    console.log('   2️⃣  Coupon Discovery...');
    const coupons = await couponStackingService.findCoupons(product);
    product.finalPrice = coupons.bestStack.finalPrice;
    console.log(`      ✅ Best Price with Coupons: $${coupons.bestStack.finalPrice.toFixed(2)}`);

    // Step 3: Global Market Comparison
    console.log('   3️⃣  Global Market Analysis...');
    const arbitrage = await globalArbitrageService.findArbitrageOpportunities(product, 'US');
    console.log(`      ✅ Best Global Deal: $${arbitrage.bestDeal.bestMarket.landedCost.toFixed(2)} (${arbitrage.bestDeal.bestMarket.countryCode})`);

    // Step 4: Community Validation
    console.log('   4️⃣  Community Validation...');
    const credibility = await communityService.calculateCredibilityScore(product);
    console.log(`      ✅ Credibility Score: ${credibility.score.toFixed(1)}/100`);

    // Final Recommendation
    console.log('\n🏆 FINAL SMART RECOMMENDATION:');
    
    const bestLocalPrice = Math.min(product.finalPrice || product.price, product.price);
    const bestGlobalPrice = arbitrage.bestDeal.bestMarket.landedCost;
    const bestOverallPrice = Math.min(bestLocalPrice, bestGlobalPrice);
    const totalSavings = product.price - bestOverallPrice;
    const savingsPercentage = (totalSavings / product.price) * 100;

    console.log(`   💰 Best Available Price: $${bestOverallPrice.toFixed(2)}`);
    console.log(`   💸 Total Savings: $${totalSavings.toFixed(2)} (${savingsPercentage.toFixed(1)}%)`);
    
    if (bestGlobalPrice < bestLocalPrice) {
      console.log(`   🌍 Recommendation: Buy from ${arbitrage.bestDeal.bestMarket.countryCode}`);
      console.log(`   📦 Includes: Shipping, taxes, and duties`);
      console.log(`   🚚 Delivery: ${arbitrage.bestDeal.shippingDetails.estimatedDays} days`);
    } else {
      console.log(`   🏠 Recommendation: Buy locally with coupons`);
      console.log(`   🎫 Coupon Stack: ${coupons.bestStack.coupons.map(c => c.code).join(' + ')}`);
    }
    
    console.log(`   📊 Deal Quality: ${credibility.recommendation.replace('_', ' ')}`);
    console.log(`   ✅ Condition Quality: ${condition.riskLevel} risk`);
    
    if (credibility.score >= 80 && condition.score >= 70) {
      console.log(`   🎯 VERDICT: ⭐ HIGHLY RECOMMENDED DEAL ⭐`);
    } else if (credibility.score >= 60 && condition.score >= 50) {
      console.log(`   🎯 VERDICT: ✅ Good deal with some caution`);
    } else {
      console.log(`   🎯 VERDICT: ⚠️  Consider waiting for better options`);
    }
    
    console.log('');
  }

  private createSampleProduct(condition: 'new' | 'used' | 'refurbished'): Product {
    const baseProduct: Product = {
      id: `demo-${condition}-${Date.now()}`,
      url: `https://example.com/product-${condition}`,
      title: `iPhone 14 Pro 128GB - ${condition.charAt(0).toUpperCase() + condition.slice(1)} Condition`,
      price: condition === 'new' ? 999 : condition === 'refurbished' ? 749 : 599,
      currency: 'USD',
      platform: 'amazon',
      imageUrl: 'https://example.com/iphone14pro.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'demo-user',
      stockStatus: 'in_stock',
      condition: condition,
      sellerRating: condition === 'new' ? 4.8 : condition === 'refurbished' ? 4.5 : 4.2,
      sellerReviewCount: condition === 'new' ? 15000 : condition === 'refurbished' ? 2500 : 850,
      warrantyCoverage: condition === 'new' ? 'Full 1-year Apple warranty' : condition === 'refurbished' ? '90-day limited warranty' : 'No warranty',
      returnPolicy: condition === 'new' ? '30-day hassle-free returns' : '14-day return policy',
      conditionDetails: condition === 'new' ? 'Brand new, sealed box' : condition === 'refurbished' ? 'Professionally restored, minor cosmetic wear' : 'Good condition, shows normal wear'
    };

    return baseProduct;
  }
}

// Run the demo
if (require.main === module) {
  const demo = new AdvancedFeaturesDemo();
  demo.runDemo().catch(console.error);
}

export { AdvancedFeaturesDemo }; 