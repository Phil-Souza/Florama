import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiFetch, ApiError, setApiAccessToken } from "@/services/api";
import { categories as localCategories, products as localProducts } from "@/data/catalog";
import type { Category, Product, ProductId } from "@/data/catalog";

const TOKEN_KEY = "florama.access-token";
const emptyProfile: ProfileData = { name: "", email: "", phone: "", address: "" };

async function readAccessToken() {
  if (Platform.OS === "web") {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function saveAccessToken(token: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.sessionStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function removeAccessToken() {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export type ProfileData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type AuthUser = ProfileData & { id: string };
export type OrderItem = {
  productId: string | null;
  name: string;
  detail: string;
  unitPriceCents: number;
  quantity: number;
};
export type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
};

type AuthResponse = { accessToken: string; user: AuthUser };
type CartResponse = { items: { productId: ProductId; quantity: number }[] };
type FavoriteResponse = { productIds: ProductId[] };
type CategoryResponse = { slug: string; name: string; order: number };

type StoreContextValue = {
  favorites: ProductId[];
  cartItems: Record<ProductId, number>;
  cartCount: number;
  profile: ProfileData;
  user: AuthUser | null;
  authReady: boolean;
  authError: string;
  products: Product[];
  categories: Category[];
  catalogLoading: boolean;
  catalogError: string;
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string;
  toggleFavorite: (productId: ProductId) => void;
  addToCart: (productId: ProductId) => void;
  setCartQuantity: (productId: ProductId, quantity: number) => void;
  register: (data: ProfileData & { password: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  saveProfile: (profile: ProfileData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  loadOrders: () => Promise<void>;
  createOrder: () => Promise<Order>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function cartItemsFromResponse(response: CartResponse): Record<ProductId, number> {
  return Object.fromEntries(response.items.map((item) => [item.productId, item.quantity]));
}

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<ProductId[]>([]);
  const [cartItems, setCartItems] = useState<Record<ProductId, number>>({});
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [products, setProducts] = useState<Product[]>(localProducts);
  const [categories, setCategories] = useState<Category[]>(localCategories);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const loadAccountData = useCallback(async () => {
    try {
      const [favoriteResponse, cartResponse] = await Promise.all([
        apiFetch<FavoriteResponse>("/api/favorites"),
        apiFetch<CartResponse>("/api/cart"),
      ]);
      setFavorites(favoriteResponse.productIds);
      setCartItems(cartItemsFromResponse(cartResponse));
      setAuthError("");
    } catch (error) {
      setAuthError(messageFor(error));
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    try {
      const [remoteProducts, remoteCategories] = await Promise.all([
        apiFetch<Product[]>("/api/products"),
        apiFetch<CategoryResponse[]>("/api/categories"),
      ]);
      setProducts(remoteProducts);
      setCategories(["Tudo", ...remoteCategories.map((category) => category.name as Category)]);
      setCatalogError("");
    } catch (error) {
      setCatalogError(messageFor(error));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadCatalog);
  }, [loadCatalog]);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    await loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const storedToken = await readAccessToken();
        if (!storedToken) return;
        setApiAccessToken(storedToken);
        const currentUser = await apiFetch<AuthUser>("/api/profile");
        if (!active) return;
        setUser(currentUser);
        await loadAccountData();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await removeAccessToken();
          setApiAccessToken(null);
        } else if (active) {
          setAuthError(messageFor(error));
        }
      } finally {
        if (active) setAuthReady(true);
      }
    };
    void restoreSession();
    return () => { active = false; };
  }, [loadAccountData]);

  const acceptAuth = async (auth: AuthResponse) => {
    await saveAccessToken(auth.accessToken);
    setApiAccessToken(auth.accessToken);
    setUser(auth.user);
    setAuthError("");
    await loadAccountData();
  };

  const register = async (data: ProfileData & { password: string }) => {
    const auth = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: data.name.trim(), email: data.email.trim(), password: data.password,
        phone: data.phone.trim(), address: data.address.trim(),
      }),
    });
    await acceptAuth(auth);
  };

  const login = async (email: string, password: string) => {
    const auth = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    await acceptAuth(auth);
  };

  const saveProfile = async (nextProfile: ProfileData) => {
    const updated = await apiFetch<AuthUser>("/api/profile", {
      method: "PUT",
      body: JSON.stringify({ name: nextProfile.name, phone: nextProfile.phone, address: nextProfile.address }),
    });
    setUser(updated);
  };

  const signOut = async () => {
    await removeAccessToken();
    setApiAccessToken(null);
    setUser(null);
    setFavorites([]);
    setCartItems({});
    setOrders([]);
    setAuthError("");
  };

  const toggleFavorite = async (productId: ProductId) => {
    const wasFavorite = favorites.includes(productId);
    setFavorites((current) => wasFavorite ? current.filter((id) => id !== productId) : [...current, productId]);
    try {
      await apiFetch<void>(`/api/favorites/${productId}`, { method: wasFavorite ? "DELETE" : "PUT" });
    } catch (error) {
      setFavorites((current) => wasFavorite ? [...current, productId] : current.filter((id) => id !== productId));
      setAuthError(messageFor(error));
    }
  };

  const addToCart = async (productId: ProductId) => {
    const oldQuantity = cartItems[productId] ?? 0;
    const nextQuantity = oldQuantity + 1;
    setCartItems((current) => ({ ...current, [productId]: nextQuantity }));
    try {
      const response = await apiFetch<CartResponse>(`/api/cart/items/${productId}`, {
        method: "PUT", body: JSON.stringify({ quantity: nextQuantity }),
      });
      setCartItems(cartItemsFromResponse(response));
      setAuthError("");
    } catch (error) {
      setCartItems((current) => {
        const next = { ...current };
        if (oldQuantity === 0) delete next[productId];
        else next[productId] = oldQuantity;
        return next;
      });
      setAuthError(messageFor(error));
    }
  };

  const setCartQuantity = async (productId: ProductId, quantity: number) => {
    const oldQuantity = cartItems[productId] ?? 0;
    setCartItems((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
    try {
      const response = quantity <= 0
        ? await apiFetch<CartResponse>(`/api/cart/items/${productId}`, { method: "DELETE" })
        : await apiFetch<CartResponse>(`/api/cart/items/${productId}`, { method: "PUT", body: JSON.stringify({ quantity }) });
      setCartItems(cartItemsFromResponse(response));
      setAuthError("");
    } catch (error) {
      setCartItems((current) => ({ ...current, [productId]: oldQuantity }));
      setAuthError(messageFor(error));
    }
  };

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      setOrders(await apiFetch<Order[]>("/api/orders"));
    } catch (error) {
      setOrdersError(messageFor(error));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const createOrder = useCallback(async () => {
    const order = await apiFetch<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ forma_pagamento: null }),
    });
    setCartItems({});
    setOrders((current) => [order, ...current]);
    return order;
  }, []);

  const profile = user ? {
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
  } : { ...emptyProfile };
  const cartCount = Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);

  return (
    <StoreContext.Provider value={{
      favorites, cartItems, cartCount, profile, user, authReady, authError,
      products, categories, catalogLoading, catalogError, orders, ordersLoading, ordersError,
      toggleFavorite, addToCart, setCartQuantity, register, login, saveProfile, signOut,
      refreshCatalog, loadOrders, createOrder,
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
