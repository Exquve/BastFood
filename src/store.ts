import { AppState, Product, Meal, Rating, User, Category } from './types';

const STORAGE_KEY = 'bestfood_app_data';

const defaultUsers: User[] = [
  { id: 'user-1', name: 'Chef', avatar: '👨‍🍳' },
  { id: 'user-2', name: 'Foodie', avatar: '🍽️' },
  { id: 'user-3', name: 'Gourmet', avatar: '🧑‍🍳' },
  { id: 'user-4', name: 'Taster', avatar: '😋' },
];

const categoryLabels: Record<Category, string> = {
  'main-dishes': '🍖 Main Dishes',
  'drinks': '🥤 Drinks',
  'desserts': '🍰 Desserts',
  'appetizers': '🥗 Appetizers',
  'snacks': '🍿 Snacks',
  'salads': '🥬 Salads',
  'soups': '🍲 Soups',
  'burgers': '🍔 Burgers',
  'pizza': '🍕 Pizza',
  'breakfast': '🥞 Breakfast',
};

export const getCategoryLabel = (cat: Category): string => categoryLabels[cat] || cat;

export const getAllCategories = (): Category[] => Object.keys(categoryLabels) as Category[];

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        products: parsed.products || [],
        meals: parsed.meals || [],
        ratings: parsed.ratings || [],
        users: parsed.users || defaultUsers,
        currentUser: parsed.currentUser || defaultUsers[0],
      };
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return {
    products: [],
    meals: [],
    ratings: [],
    users: defaultUsers,
    currentUser: defaultUsers[0],
  };
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

export function calculateMealTotalPrice(meal: Meal, products: Product[]): number {
  return meal.products.reduce((total, mp) => {
    const product = products.find(p => p.id === mp.productId);
    if (product) {
      return total + (product.price * mp.quantity);
    }
    return total;
  }, 0);
}

export function getMealAverageRating(mealId: string, ratings: Rating[]): number {
  const mealRatings = ratings.filter(r => r.mealId === mealId);
  if (mealRatings.length === 0) return 0;
  const sum = mealRatings.reduce((acc, r) => acc + r.score, 0);
  return sum / mealRatings.length;
}

export function getMealFPRatio(meal: Meal, products: Product[], ratings: Rating[]): number {
  const avgRating = getMealAverageRating(meal.id, ratings);
  const totalPrice = calculateMealTotalPrice(meal, products);
  if (totalPrice === 0 || avgRating === 0) return 0;
  return (avgRating / totalPrice) * 100;
}

export function generateSuggestedMenus(products: Product[], meals: Meal[], ratings: Rating[]): Meal[] {
  // Generate 3 suggested menus based on best FP ratios and ratings
  const categories = getAllCategories();
  const suggested: Meal[] = [];

  // Strategy 1: Best FP balanced menu (one from each major category)
  const mainProducts = products.filter(p => p.category === 'main-dishes' || p.category === 'burgers' || p.category === 'pizza');
  const drinkProducts = products.filter(p => p.category === 'drinks');
  const dessertProducts = products.filter(p => p.category === 'desserts');
  const appetizerProducts = products.filter(p => p.category === 'appetizers' || p.category === 'salads');

  if (mainProducts.length > 0 && drinkProducts.length > 0) {
    const bestMain = mainProducts.sort((a, b) => a.price - b.price)[0];
    const bestDrink = drinkProducts.sort((a, b) => a.price - b.price)[0];
    const products_in_menu = [
      { productId: bestMain.id, quantity: 1 },
      { productId: bestDrink.id, quantity: 1 },
    ];
    if (dessertProducts.length > 0) {
      const bestDessert = dessertProducts.sort((a, b) => a.price - b.price)[0];
      products_in_menu.push({ productId: bestDessert.id, quantity: 1 });
    }
    suggested.push({
      id: 'suggested-budget',
      name: '💰 Budget King Menu',
      products: products_in_menu,
      totalPrice: products_in_menu.reduce((t, p) => {
        const prod = products.find(pr => pr.id === p.productId);
        return t + (prod ? prod.price * p.quantity : 0);
      }, 0),
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      isSuggested: true,
    });
  }

  // Strategy 2: Best Rated Menu (highest rated products)
  const ratedProductIds = ratings
    .filter(r => r.score >= 4)
    .map(r => r.mealId);
  
  // Get products that appear in highly rated meals
  const topRatedProductIds = new Set<string>();
  meals
    .filter(m => ratedProductIds.includes(m.id))
    .forEach(m => m.products.forEach(mp => topRatedProductIds.add(mp.productId)));

  if (topRatedProductIds.size >= 2) {
    const topProducts = Array.from(topRatedProductIds).slice(0, 4).map(id => ({
      productId: id,
      quantity: 1,
    }));
    suggested.push({
      id: 'suggested-top-rated',
      name: '⭐ Top Rated Menu',
      products: topProducts,
      totalPrice: topProducts.reduce((t, p) => {
        const prod = products.find(pr => pr.id === p.productId);
        return t + (prod ? prod.price * p.quantity : 0);
      }, 0),
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      isSuggested: true,
    });
  }

  // Strategy 3: Variety Menu (different categories)
  if (products.length >= 3) {
    const selectedCategories = categories.filter(c => products.some(p => p.category === c));
    const varietyProducts: { productId: string; quantity: number }[] = [];
    const usedCategories = new Set<Category>();
    
    for (const cat of selectedCategories) {
      if (usedCategories.size >= 4) break;
      if (!usedCategories.has(cat)) {
        const catProducts = products.filter(p => p.category === cat);
        if (catProducts.length > 0) {
          const randomProduct = catProducts[Math.floor(Math.random() * catProducts.length)];
          varietyProducts.push({ productId: randomProduct.id, quantity: 1 });
          usedCategories.add(cat);
        }
      }
    }

    if (varietyProducts.length >= 2) {
      suggested.push({
        id: 'suggested-variety',
        name: '🌈 Variety Explorer Menu',
        products: varietyProducts,
        totalPrice: varietyProducts.reduce((t, p) => {
          const prod = products.find(pr => pr.id === p.productId);
          return t + (prod ? prod.price * p.quantity : 0);
        }, 0),
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        isSuggested: true,
      });
    }
  }

  return suggested;
}
