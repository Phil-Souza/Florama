import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type ProfileData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const emptyProfile: ProfileData = { name: "", email: "", phone: "", address: "" };

type StoreContextValue = {
  favorites: string[];
  cartItems: Record<string, number>;
  cartCount: number;
  profile: ProfileData;
  toggleFavorite: (productName: string) => void;
  addToCart: (productName: string) => void;
  setCartQuantity: (productName: string, quantity: number) => void;
  saveProfile: (profile: ProfileData) => void;
  signOut: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);

  const toggleFavorite = (productName: string) => {
    setFavorites((current) => current.includes(productName)
      ? current.filter((name) => name !== productName)
      : [...current, productName]);
  };

  const addToCart = (productName: string) => {
    setCartItems((current) => ({
      ...current,
      [productName]: (current[productName] ?? 0) + 1,
    }));
  };

  const setCartQuantity = (productName: string, quantity: number) => {
    setCartItems((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productName];
      else next[productName] = quantity;
      return next;
    });
  };

  const signOut = () => {
    setProfile(emptyProfile);
    setFavorites([]);
    setCartItems({});
  };

  const cartCount = Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);

  return (
    <StoreContext.Provider value={{
      favorites,
      cartItems,
      cartCount,
      profile,
      toggleFavorite,
      addToCart,
      setCartQuantity,
      saveProfile: setProfile,
      signOut,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore precisa estar dentro de StoreProvider.");
  return context;
}