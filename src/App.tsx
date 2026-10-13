import { useState, useEffect, useCallback } from 'react';
import { AppState, Product, Meal, Rating, User, Category } from './types';
import { loadState, saveState, calculateMealTotalPrice, getMealAverageRating, getMealFPRatio, generateSuggestedMenus, getCategoryLabel, getAllCategories } from './store';
import { v4 as uuidv4 } from 'uuid';

// Icons as simple SVG components
const StarIcon = ({ filled, size = 20 }: { filled: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke="#fbbf24" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

type Page = 'home' | 'products' | 'meals' | 'suggested' | 'fp-ranking';

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCreateMeal, setShowCreateMeal] = useState(false);
  const [showRateMeal, setShowRateMeal] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id),
      meals: prev.meals.map(m => ({
        ...m,
        products: m.products.filter(mp => mp.productId !== id),
      })),
    }));
  }, []);

  const createMeal = useCallback((meal: Omit<Meal, 'id' | 'createdAt' | 'totalPrice'>) => {
    const newMeal: Meal = {
      ...meal,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      totalPrice: 0,
    };
    newMeal.totalPrice = calculateMealTotalPrice(newMeal, state.products);
    setState(prev => ({ ...prev, meals: [...prev.meals, newMeal] }));
  }, [state.products]);

  const deleteMeal = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      meals: prev.meals.filter(m => m.id !== id),
      ratings: prev.ratings.filter(r => r.mealId !== id),
    }));
  }, []);

  const addRating = useCallback((rating: Omit<Rating, 'id' | 'createdAt'>) => {
    const newRating: Rating = {
      ...rating,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      ratings: [...prev.ratings.filter(r => !(r.mealId === rating.mealId && r.userId === rating.userId)), newRating],
    }));
  }, []);

  const switchUser = useCallback((user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  }, []);

  const filteredProducts = selectedCategory === 'all'
    ? state.products
    : state.products.filter(p => p.category === selectedCategory);

  const suggestedMenus = generateSuggestedMenus(state.products, state.meals, state.ratings);

  const fpRankedMeals = [...state.meals]
    .filter(m => !m.isSuggested)
    .sort((a, b) => getMealFPRatio(b, state.products, state.ratings) - getMealFPRatio(a, state.products, state.ratings));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              BestFood
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {[
              { id: 'home' as Page, label: 'Home', icon: '🏠' },
              { id: 'products' as Page, label: 'Products', icon: '📸' },
              { id: 'meals' as Page, label: 'Meals', icon: '🍱' },
              { id: 'suggested' as Page, label: 'Suggested', icon: '✨' },
              { id: 'fp-ranking' as Page, label: 'FP Ranking', icon: '🏆' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === item.id
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="hidden sm:inline">{item.icon} {item.label}</span>
                <span className="sm:hidden">{item.icon}</span>
              </button>
            ))}
          </div>
          {/* User Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={state.currentUser?.id || ''}
              onChange={(e) => {
                const user = state.users.find(u => u.id === e.target.value);
                if (user) switchUser(user);
              }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              {state.users.map(u => (
                <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'home' && (
          <HomePage
            state={state}
            fpRankedMeals={fpRankedMeals}
            suggestedMenus={suggestedMenus}
            onNavigate={setCurrentPage}
          />
        )}
        {currentPage === 'products' && (
          <ProductsPage
            products={filteredProducts}
            allProducts={state.products}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onAddProduct={addProduct}
            onDeleteProduct={deleteProduct}
            showAddProduct={showAddProduct}
            setShowAddProduct={setShowAddProduct}
            currentUser={state.currentUser!}
          />
        )}
        {currentPage === 'meals' && (
          <MealsPage
            meals={state.meals.filter(m => !m.isSuggested)}
            products={state.products}
            ratings={state.ratings}
            onCreateMeal={() => setShowCreateMeal(true)}
            onDeleteMeal={deleteMeal}
            onRateMeal={(id) => setShowRateMeal(id)}
            showCreateMeal={showCreateMeal}
            setShowCreateMeal={setShowCreateMeal}
            showRateMeal={showRateMeal}
            setShowRateMeal={setShowRateMeal}
            onCreateMealSubmit={createMeal}
            onAddRating={addRating}
            currentUser={state.currentUser!}
          />
        )}
        {currentPage === 'suggested' && (
          <SuggestedPage
            suggestedMenus={suggestedMenus}
            products={state.products}
            ratings={state.ratings}
            onRateMeal={(id) => setShowRateMeal(id)}
            showRateMeal={showRateMeal}
            setShowRateMeal={setShowRateMeal}
            onAddRating={addRating}
            currentUser={state.currentUser!}
          />
        )}
        {currentPage === 'fp-ranking' && (
          <FPRankingPage
            fpRankedMeals={fpRankedMeals}
            products={state.products}
            ratings={state.ratings}
            onRateMeal={(id) => setShowRateMeal(id)}
            showRateMeal={showRateMeal}
            setShowRateMeal={setShowRateMeal}
            onAddRating={addRating}
            currentUser={state.currentUser!}
          />
        )}
      </main>
    </div>
  );
}

// ============ HOME PAGE ============
function HomePage({ state, fpRankedMeals, suggestedMenus, onNavigate }: {
  state: AppState;
  fpRankedMeals: Meal[];
  suggestedMenus: Meal[];
  onNavigate: (page: Page) => void;
}) {
  const totalMeals = state.meals.filter(m => !m.isSuggested).length;
  const totalProducts = state.products.length;
  const totalRatings = state.ratings.length;
  const avgRating = totalRatings > 0
    ? (state.ratings.reduce((a, r) => a + r.score, 0) / totalRatings).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-12">
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
          Find Your Perfect FP Menu
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Add products, create meals, rate them together with friends, and discover the best Fiyat/Performans combinations!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Products', value: totalProducts, icon: '📸', color: 'from-blue-500/20 to-blue-600/20' },
          { label: 'Meals', value: totalMeals, icon: '🍱', color: 'from-green-500/20 to-green-600/20' },
          { label: 'Ratings', value: totalRatings, icon: '⭐', color: 'from-amber-500/20 to-amber-600/20' },
          { label: 'Avg Rating', value: avgRating, icon: '📊', color: 'from-purple-500/20 to-purple-600/20' },
        ].map(stat => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-white/5 rounded-2xl p-6 text-center`}>
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('products')}
          className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6 text-left hover:border-amber-500/30 transition-all hover:scale-[1.02]"
        >
          <div className="text-4xl mb-3">📸</div>
          <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">Add Products</h3>
          <p className="text-sm text-gray-400 mt-1">Take photos & add prices of food products</p>
        </button>
        <button
          onClick={() => onNavigate('meals')}
          className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6 text-left hover:border-green-500/30 transition-all hover:scale-[1.02]"
        >
          <div className="text-4xl mb-3">🍱</div>
          <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">Create Meals</h3>
          <p className="text-sm text-gray-400 mt-1">Build menus from your favorite products</p>
        </button>
        <button
          onClick={() => onNavigate('fp-ranking')}
          className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6 text-left hover:border-purple-500/30 transition-all hover:scale-[1.02]"
        >
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">FP Ranking</h3>
          <p className="text-sm text-gray-400 mt-1">See the best price/performance combos</p>
        </button>
      </div>

      {/* Top FP Meals Preview */}
      {fpRankedMeals.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-amber-400 mb-4">🏆 Top FP Meals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fpRankedMeals.slice(0, 3).map((meal, i) => (
              <div key={meal.id} className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <h4 className="font-semibold text-white">{meal.name}</h4>
                </div>
                <div className="text-sm text-gray-400">
                  <p>Price: ₺{meal.totalPrice.toFixed(2)}</p>
                  <p>Rating: {getMealAverageRating(meal.id, state.ratings).toFixed(1)} ⭐</p>
                  <p className="text-amber-400 font-semibold">FP: {getMealFPRatio(meal, state.products, state.ratings).toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PRODUCTS PAGE ============
function ProductsPage({ products, allProducts, selectedCategory, onCategoryChange, onAddProduct, onDeleteProduct, showAddProduct, setShowAddProduct, currentUser }: {
  products: Product[];
  allProducts: Product[];
  selectedCategory: Category | 'all';
  onCategoryChange: (cat: Category | 'all') => void;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  onDeleteProduct: (id: string) => void;
  showAddProduct: boolean;
  setShowAddProduct: (show: boolean) => void;
  currentUser: User;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">📸 Products</h2>
        <button
          onClick={() => setShowAddProduct(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <PlusIcon /> Add Product
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
          }`}
        >
          All ({allProducts.length})
        </button>
        {getAllCategories().map(cat => {
          const count = allProducts.filter(p => p.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {getCategoryLabel(cat)} ({count})
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-lg">No products yet. Add your first product!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/20 transition-all">
              <div className="aspect-square bg-gray-900 relative overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-800 to-gray-700">
                    🍽️
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => onDeleteProduct(product.id)}
                    className="bg-red-500/80 backdrop-blur-sm text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-amber-400">
                  {getCategoryLabel(product.category)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-lg">{product.name}</h3>
                {product.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{product.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xl font-bold text-amber-400">₺{product.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">by {product.addedBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onAdd={onAddProduct}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

// ============ ADD PRODUCT MODAL ============
function AddProductModal({ onClose, onAdd, currentUser }: {
  onClose: () => void;
  onAdd: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  currentUser: User;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category>('main-dishes');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    onAdd({
      name,
      price: parseFloat(price),
      category,
      description,
      image,
      addedBy: currentUser.name,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-6 text-white">📸 Add New Product</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">Photo</label>
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer relative overflow-hidden">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
              ) : (
                <div className="text-gray-500">
                  <CameraIcon />
                  <p className="mt-2 text-sm">Click to upload photo</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
              placeholder="e.g., Chicken Burger"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Price (₺) *</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            >
              {getAllCategories().map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 text-gray-300 px-4 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ MEALS PAGE ============
function MealsPage({ meals, products, ratings, onCreateMeal, onDeleteMeal, onRateMeal, showCreateMeal, setShowCreateMeal, showRateMeal, setShowRateMeal, onCreateMealSubmit, onAddRating, currentUser }: {
  meals: Meal[];
  products: Product[];
  ratings: Rating[];
  onCreateMeal: () => void;
  onDeleteMeal: (id: string) => void;
  onRateMeal: (id: string) => void;
  showCreateMeal: boolean;
  setShowCreateMeal: (show: boolean) => void;
  showRateMeal: string | null;
  setShowRateMeal: (id: string | null) => void;
  onCreateMealSubmit: (meal: Omit<Meal, 'id' | 'createdAt' | 'totalPrice'>) => void;
  onAddRating: (rating: Omit<Rating, 'id' | 'createdAt'>) => void;
  currentUser: User;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">🍱 My Meals</h2>
        <button
          onClick={onCreateMeal}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <PlusIcon /> Create Meal
        </button>
      </div>

      {meals.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-6xl mb-4">🍱</div>
          <p className="text-lg">No meals created yet. Build your first meal!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meals.map(meal => {
            const avgRating = getMealAverageRating(meal.id, ratings);
            const mealRatings = ratings.filter(r => r.mealId === meal.id);
            const userRating = mealRatings.find(r => r.userId === currentUser.id);
            const fp = getMealFPRatio(meal, products, ratings);

            return (
              <div key={meal.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6 hover:border-green-500/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{meal.name}</h3>
                    <p className="text-sm text-gray-400">by {meal.createdBy}</p>
                  </div>
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Products in meal */}
                <div className="space-y-2 mb-4">
                  {meal.products.map((mp, i) => {
                    const product = products.find(p => p.id === mp.productId);
                    if (!product) return null;
                    return (
                      <div key={i} className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-2">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-sm">🍽️</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{product.name}</p>
                          <p className="text-xs text-gray-400">₺{product.price.toFixed(2)} x{mp.quantity}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">Price</p>
                    <p className="text-sm font-bold text-white">₺{meal.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">Rating</p>
                    <p className="text-sm font-bold text-amber-400">{avgRating > 0 ? avgRating.toFixed(1) : '-'} ⭐</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">FP Score</p>
                    <p className="text-sm font-bold text-green-400">{fp > 0 ? fp.toFixed(1) : '-'}</p>
                  </div>
                </div>

                {/* Comments */}
                {mealRatings.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {mealRatings.slice(-2).map(r => (
                      <div key={r.id} className="bg-gray-900/30 rounded-lg p-2 text-sm">
                        <div className="flex items-center gap-1 mb-1">
                          <span>{'⭐'.repeat(r.score)}</span>
                          <span className="text-gray-500 text-xs">- {r.userId === currentUser.id ? 'You' : r.userId}</span>
                        </div>
                        {r.comment && <p className="text-gray-300 text-xs">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rate Button */}
                <button
                  onClick={() => onRateMeal(meal.id)}
                  className={`w-full py-2 rounded-xl font-medium text-sm transition-all ${
                    userRating
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  }`}
                >
                  {userRating ? '✏️ Update Rating' : '⭐ Rate This Meal'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Meal Modal */}
      {showCreateMeal && (
        <CreateMealModal
          products={products}
          onClose={() => setShowCreateMeal(false)}
          onSubmit={onCreateMealSubmit}
          currentUser={currentUser}
        />
      )}

      {/* Rate Meal Modal */}
      {showRateMeal && (
        <RateMealModal
          mealId={showRateMeal}
          currentUser={currentUser}
          existingRating={ratings.find(r => r.mealId === showRateMeal && r.userId === currentUser.id)}
          onClose={() => setShowRateMeal(null)}
          onSubmit={onAddRating}
        />
      )}
    </div>
  );
}

// ============ CREATE MEAL MODAL ============
function CreateMealModal({ products, onClose, onSubmit, currentUser }: {
  products: Product[];
  onClose: () => void;
  onSubmit: (meal: Omit<Meal, 'id' | 'createdAt' | 'totalPrice'>) => void;
  currentUser: User;
}) {
  const [name, setName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  const filteredProducts = categoryFilter === 'all' ? products : products.filter(p => p.category === categoryFilter);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId);
      if (existing) {
        return prev.filter(p => p.productId !== productId);
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    setSelectedProducts(prev => prev.map(p => p.productId === productId ? { ...p, quantity: Math.max(1, qty) } : p));
  };

  const totalPrice = selectedProducts.reduce((total, sp) => {
    const product = products.find(p => p.id === sp.productId);
    return total + (product ? product.price * sp.quantity : 0);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedProducts.length === 0) return;
    onSubmit({
      name,
      products: selectedProducts,
      createdBy: currentUser.name,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-6 text-white">🍱 Create New Meal</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Meal Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
              placeholder="e.g., Lunch Special"
              required
            />
          </div>

          {/* Category filter for products */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === 'all' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              All
            </button>
            {getAllCategories().map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === cat ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Product Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {filteredProducts.map(product => {
              const isSelected = selectedProducts.some(sp => sp.productId === product.id);
              const qty = selectedProducts.find(sp => sp.productId === product.id)?.quantity || 0;
              return (
                <div
                  key={product.id}
                  className={`relative rounded-xl border p-2 cursor-pointer transition-all ${
                    isSelected ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-20 object-cover rounded-lg mb-1" />
                  ) : (
                    <div className="w-full h-20 rounded-lg bg-gray-700 flex items-center justify-center mb-1 text-2xl">🍽️</div>
                  )}
                  <p className="text-xs font-medium text-white truncate">{product.name}</p>
                  <p className="text-xs text-amber-400">₺{product.price.toFixed(2)}</p>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      ✓
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={() => updateQuantity(product.id, qty - 1)} className="bg-gray-700 text-white w-5 h-5 rounded text-xs">-</button>
                      <span className="text-xs text-white">{qty}</span>
                      <button type="button" onClick={() => updateQuantity(product.id, qty + 1)} className="bg-gray-700 text-white w-5 h-5 rounded text-xs">+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Selected: {selectedProducts.length} items</span>
              <span className="text-xl font-bold text-amber-400">₺{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 text-gray-300 px-4 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || selectedProducts.length === 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Create Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ RATE MEAL MODAL ============
function RateMealModal({ mealId, currentUser, existingRating, onClose, onSubmit }: {
  mealId: string;
  currentUser: User;
  existingRating?: Rating;
  onClose: () => void;
  onSubmit: (rating: Omit<Rating, 'id' | 'createdAt'>) => void;
}) {
  const [score, setScore] = useState(existingRating?.score || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [hoverScore, setHoverScore] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) return;
    onSubmit({
      mealId,
      userId: currentUser.id,
      score,
      comment,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-6 text-white">⭐ Rate This Meal</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div className="flex items-center justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setScore(s)}
                onMouseEnter={() => setHoverScore(s)}
                onMouseLeave={() => setHoverScore(0)}
                className="transition-transform hover:scale-125"
              >
                <StarIcon filled={s <= (hoverScore || score)} size={36} />
              </button>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm">
            {score === 0 ? 'Select a rating' : score === 1 ? 'Poor' : score === 2 ? 'Fair' : score === 3 ? 'Good' : score === 4 ? 'Great' : 'Excellent!'}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none"
              rows={3}
              placeholder="What did you think about this meal?"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 text-gray-300 px-4 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={score === 0}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Submit Rating
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ SUGGESTED MENUS PAGE ============
function SuggestedPage({ suggestedMenus, products, ratings, onRateMeal, showRateMeal, setShowRateMeal, onAddRating, currentUser }: {
  suggestedMenus: Meal[];
  products: Product[];
  ratings: Rating[];
  onRateMeal: (id: string) => void;
  showRateMeal: string | null;
  setShowRateMeal: (id: string | null) => void;
  onAddRating: (rating: Omit<Rating, 'id' | 'createdAt'>) => void;
  currentUser: User;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">✨ Suggested Menus</h2>
        <p className="text-gray-400 mt-2">These menus are automatically generated based on ratings and FP analysis</p>
      </div>

      {suggestedMenus.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-lg">Add more products and create meals to get suggestions!</p>
          <p className="text-sm text-gray-600 mt-2">We need at least some products in different categories</p>
        </div>
      ) : (
        <div className="space-y-6">
          {suggestedMenus.map((menu, index) => {
            const avgRating = getMealAverageRating(menu.id, ratings);
            const fp = getMealFPRatio(menu, products, ratings);
            const badges = ['💰 Best Budget', '⭐ Top Rated', '🌈 Best Variety'];

            return (
              <div key={menu.id} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/5 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/5 p-6">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{index === 0 ? '💰' : index === 1 ? '⭐' : '🌈'}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{menu.name}</h3>
                      <p className="text-sm text-amber-400">{badges[index] || 'Suggested'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {menu.products.map((mp, i) => {
                      const product = products.find(p => p.id === mp.productId);
                      if (!product) return null;
                      return (
                        <div key={i} className="flex items-center gap-3 bg-gray-900/50 rounded-xl p-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-700 flex items-center justify-center text-xl">🍽️</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{product.name}</p>
                            <p className="text-sm text-gray-400">{getCategoryLabel(product.category)}</p>
                            <p className="text-sm text-amber-400 font-semibold">₺{product.price.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400">Total Price</p>
                      <p className="text-lg font-bold text-white">₺{menu.totalPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400">Rating</p>
                      <p className="text-lg font-bold text-amber-400">{avgRating > 0 ? avgRating.toFixed(1) : 'New'} ⭐</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400">FP Score</p>
                      <p className="text-lg font-bold text-green-400">{fp > 0 ? fp.toFixed(1) : 'New'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRateMeal(menu.id)}
                    className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all"
                  >
                    ⭐ Rate This Suggested Menu
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rate Modal */}
      {showRateMeal && (
        <RateMealModal
          mealId={showRateMeal}
          currentUser={currentUser}
          existingRating={ratings.find(r => r.mealId === showRateMeal && r.userId === currentUser.id)}
          onClose={() => setShowRateMeal(null)}
          onSubmit={onAddRating}
        />
      )}
    </div>
  );
}

// ============ FP RANKING PAGE ============
function FPRankingPage({ fpRankedMeals, products, ratings, onRateMeal, showRateMeal, setShowRateMeal, onAddRating, currentUser }: {
  fpRankedMeals: Meal[];
  products: Product[];
  ratings: Rating[];
  onRateMeal: (id: string) => void;
  showRateMeal: string | null;
  setShowRateMeal: (id: string | null) => void;
  onAddRating: (rating: Omit<Rating, 'id' | 'createdAt'>) => void;
  currentUser: User;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">🏆 FP Ranking</h2>
        <p className="text-gray-400 mt-2">Meals ranked by Fiyat/Performans (Price/Performance) ratio</p>
        <div className="mt-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
          <p className="text-sm text-gray-300">
            <span className="text-purple-400 font-semibold">FP Formula:</span> (Average Rating ÷ Total Price) × 100
            <br />
            <span className="text-gray-500">Higher score = Better value for money!</span>
          </p>
        </div>
      </div>

      {fpRankedMeals.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-lg">No meals to rank yet.</p>
          <p className="text-sm text-gray-600 mt-2">Create meals and rate them to see FP rankings!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fpRankedMeals.map((meal, index) => {
            const avgRating = getMealAverageRating(meal.id, ratings);
            const fp = getMealFPRatio(meal, products, ratings);
            const maxFP = getMealFPRatio(fpRankedMeals[0], products, ratings);
            const barWidth = maxFP > 0 ? (fp / maxFP) * 100 : 0;

            return (
              <div key={meal.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 transition-all">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="text-4xl w-12 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (
                      <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white truncate">{meal.name}</h3>
                      <span className="text-xs text-gray-500">by {meal.createdBy}</span>
                    </div>

                    {/* FP Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">₺{meal.totalPrice.toFixed(2)}</span>
                      <span className="text-amber-400">{avgRating.toFixed(1)} ⭐</span>
                      <span className="text-green-400 font-bold">FP: {fp.toFixed(1)}</span>
                      <span className="text-gray-500">{meal.products.length} items</span>
                    </div>
                  </div>

                  {/* Rate Button */}
                  <button
                    onClick={() => onRateMeal(meal.id)}
                    className="shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-all"
                  >
                    ⭐ Rate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rate Modal */}
      {showRateMeal && (
        <RateMealModal
          mealId={showRateMeal}
          currentUser={currentUser}
          existingRating={ratings.find(r => r.mealId === showRateMeal && r.userId === currentUser.id)}
          onClose={() => setShowRateMeal(null)}
          onSubmit={onAddRating}
        />
      )}
    </div>
  );
}

export default App;
