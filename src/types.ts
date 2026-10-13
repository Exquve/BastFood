export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string; // base64 data URL
  description: string;
  addedBy: string;
  createdAt: string;
}

export type Category = 
  | 'main-dishes'
  | 'drinks'
  | 'desserts'
  | 'appetizers'
  | 'snacks'
  | 'salads'
  | 'soups'
  | 'burgers'
  | 'pizza'
  | 'breakfast';

export interface MealProduct {
  productId: string;
  quantity: number;
}

export interface Meal {
  id: string;
  name: string;
  products: MealProduct[];
  totalPrice: number;
  createdBy: string;
  createdAt: string;
  isSuggested?: boolean;
}

export interface Rating {
  id: string;
  mealId: string;
  userId: string;
  score: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface AppState {
  products: Product[];
  meals: Meal[];
  ratings: Rating[];
  users: User[];
  currentUser: User | null;
}
