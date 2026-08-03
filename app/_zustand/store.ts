import { create } from "zustand";

export type ProductInCart = {
  id: string; // Maps to variantId
  title: string;
  price: number;
  image: string;
  amount: number;
};

export type State = {
  products: ProductInCart[];
  allQuantity: number;
  total: number;
};

export type Actions = {
  syncCart: (serverCart: any) => void;
  addToCart: (newProduct: ProductInCart) => void;
  removeFromCart: (id: string) => void;
  updateCartAmount: (id: string, quantity: number) => void;
  calculateTotals: () => void;
  clearCart: () => void;
};

export const useProductStore = create<State & Actions>()((set, get) => ({
  products: [],
  allQuantity: 0,
  total: 0,
  syncCart: (serverCart) => {
    if (!serverCart || !serverCart.items) {
      set({ products: [], allQuantity: 0, total: 0 });
      return;
    }
    
    // Convert DB Cart to Client Zustand shape
    const syncedProducts: ProductInCart[] = serverCart.items.map((item: any) => {
      const productTitle = item.variant.product.title;
      const optionsString = item.variant.optionValues
        .map((ov: any) => ov.optionValue.value)
        .join(" / ");
      
      const fullTitle = optionsString ? `${productTitle} (${optionsString})` : productTitle;
      
      return {
        id: item.variantId,
        title: fullTitle,
        price: item.variant.price,
        image: item.variant.product.mainImage,
        amount: item.quantity
      };
    });

    set({ products: syncedProducts });
    get().calculateTotals();
  },
  addToCart: (newProduct) => {
    set((state) => {
      const cartItem = state.products.find(
        (item) => item.id === newProduct.id
      );
      if (!cartItem) {
        return { products: [...state.products, newProduct] };
      } else {
        const newProducts = state.products.map((product) => {
          if (product.id === cartItem.id) {
            return { ...product, amount: product.amount + newProduct.amount };
          }
          return product;
        });
        return { products: newProducts };
      }
    });
  },
  clearCart: () => {
    set({
      products: [],
      allQuantity: 0,
      total: 0,
    });
  },
  removeFromCart: (id) => {
    set((state) => ({
      products: state.products.filter(
        (product: ProductInCart) => product.id !== id
      )
    }));
  },
  calculateTotals: () => {
    set((state) => {
      let amount = 0;
      let total = 0;
      state.products.forEach((item) => {
        amount += item.amount;
        total += item.amount * item.price;
      });

      return {
        products: state.products,
        allQuantity: amount,
        total: total,
      };
    });
  },
  updateCartAmount: (id, amount) => {
    set((state) => {
      const newProducts = state.products.map((product) => {
        if (product.id === id) {
          return { ...product, amount: amount };
        }
        return product;
      });
      return { products: newProducts };
    });
  },
}));
