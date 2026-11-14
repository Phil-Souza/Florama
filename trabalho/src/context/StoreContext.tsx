import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiFetch, ApiError, setApiAccessToken } from "@/services/api";
import { categories as localCategories, products as localProducts } from "@/data/catalog";
import type { Category, Product, ProductId } from "@/data/catalog";
import { phoneDigits, validateRegistration } from "@/utils/registrationValidation";

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

export type AuthUser = ProfileData & { id: string; role: "cliente" | "admin" };
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
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
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
  addToCart: (productId: ProductId) => Promise<boolean>;
  setCartQuantity: (productId: ProductId, quantity: number) => void;
  register: (data: ProfileData & { password: string; confirmPassword: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  saveProfile: (profile: ProfileData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  loadOrders: () => Promise<void>;
  getOrder: (orderId: string) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<Order>;
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
  const favoritesRef = useRef<ProductId[]>([]);
  const cartItemsRef = useRef<Record<ProductId, number>>({});
  const favoriteMutationQueue = useRef<Promise<void>>(Promise.resolve());
  const cartMutationQueue = useRef<Promise<void>>(Promise.resolve());
  const favoriteMutationSequence = useRef(0);
  const cartMutationSequence = useRef(0);
  const favoriteNeedsSync = useRef(false);
  const accountSessionSequence = useRef(0);
  const cartCheckoutInProgress = useRef(false);
  const ordersRequestSequence = useRef(0);
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

  const applyFavorites = useCallback((nextFavorites: ProductId[]) => {
    favoritesRef.current = nextFavorites;
    setFavorites(nextFavorites);
  }, []);

  const applyCartItems = useCallback((nextCartItems: Record<ProductId, number>) => {
    cartItemsRef.current = nextCartItems;
    setCartItems(nextCartItems);
  }, []);

  const loadAccountData = useCallback(async () => {
    const session = accountSessionSequence.current;
    try {
      const [favoriteResponse, cartResponse] = await Promise.all([
        apiFetch<FavoriteResponse>("/api/favorites"),
        apiFetch<CartResponse>("/api/cart"),
      ]);
      if (session === accountSessionSequence.current) {
        applyFavorites(favoriteResponse.productIds);
        applyCartItems(cartItemsFromResponse(cartResponse));
        setAuthError("");
      }
    } catch (error) {
      if (session === accountSessionSequence.current) setAuthError(messageFor(error));
    }
  }, [applyCartItems, applyFavorites]);

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
    accountSessionSequence.current += 1;
    favoriteMutationSequence.current += 1;
    cartMutationSequence.current += 1;
    favoriteNeedsSync.current = false;
    cartCheckoutInProgress.current = false;
    ordersRequestSequence.current += 1;
    setOrders([]);
    setOrdersLoading(false);
    setOrdersError("");
    setApiAccessToken(auth.accessToken);
    setUser(auth.user);
    setAuthError("");
    let tokenSaved = true;
    try {
      await saveAccessToken(auth.accessToken);
    } catch {
      tokenSaved = false;
    }
    await loadAccountData();
    if (!tokenSaved) {
      setAuthError("Conta criada e sessão iniciada, mas não foi possível salvar o acesso neste dispositivo.");
    }
  };

  const register = async (data: ProfileData & { password: string; confirmPassword: string }) => {
    const validationError = validateRegistration(data);
    if (validationError) throw new Error(validationError);

    try {
      const auth = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          confirm_password: data.confirmPassword,
          phone: phoneDigits(data.phone),
          address: data.address.trim(),
        }),
      });
      await acceptAuth(auth);
    } catch (registrationError) {
      if (!(registrationError instanceof ApiError) || registrationError.status !== 0) {
        throw registrationError;
      }

      try {
        const auth = await apiFetch<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: data.email.trim().toLowerCase(), password: data.password }),
        });
        await acceptAuth(auth);
      } catch {
        throw new ApiError(
          "A conexão foi interrompida durante o cadastro. Confira sua conexão; se sua conta já tiver sido criada, entre com seu e-mail e senha.",
          0,
        );
      }
    }
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
    accountSessionSequence.current += 1;
    favoriteMutationSequence.current += 1;
    cartMutationSequence.current += 1;
    favoriteNeedsSync.current = false;
    cartCheckoutInProgress.current = false;
    ordersRequestSequence.current += 1;
    await removeAccessToken();
    setApiAccessToken(null);
    setUser(null);
    applyFavorites([]);
    applyCartItems({});
    setOrders([]);
    setOrdersLoading(false);
    setOrdersError("");
    setAuthError("");
  };

  const toggleFavorite = (productId: ProductId) => {
    const wasFavorite = favoritesRef.current.includes(productId);
    const nextFavorites = wasFavorite
      ? favoritesRef.current.filter((id) => id !== productId)
      : [...favoritesRef.current, productId];
    applyFavorites(nextFavorites);

    const session = accountSessionSequence.current;
    const sequence = ++favoriteMutationSequence.current;
    const mutation = favoriteMutationQueue.current.catch(() => undefined).then(async () => {
      if (session !== accountSessionSequence.current) return;
      try {
        await apiFetch<void>(`/api/favorites/${productId}`, { method: wasFavorite ? "DELETE" : "PUT" });
      } catch (error) {
        if (session !== accountSessionSequence.current) return;
        favoriteNeedsSync.current = true;
        setAuthError(messageFor(error));
      }

      if (session === accountSessionSequence.current && sequence === favoriteMutationSequence.current) {
        if (!favoriteNeedsSync.current) {
          setAuthError("");
          return;
        }
        try {
          const response = await apiFetch<FavoriteResponse>("/api/favorites");
          if (session === accountSessionSequence.current && sequence === favoriteMutationSequence.current) {
            applyFavorites(response.productIds);
            favoriteNeedsSync.current = false;
          }
        } catch {
          if (session === accountSessionSequence.current && sequence === favoriteMutationSequence.current) {
            setAuthError("Não foi possível atualizar os favoritos. Tente novamente.");
          }
        }
      }
    });
    favoriteMutationQueue.current = mutation.then(() => undefined, () => undefined);
  };

  const persistCartQuantity = (productId: ProductId, quantity: number): Promise<boolean> => {
    const session = accountSessionSequence.current;
    const sequence = ++cartMutationSequence.current;
    const mutation = cartMutationQueue.current.catch(() => undefined).then(async () => {
      if (session !== accountSessionSequence.current) return false;
      try {
        const response = quantity <= 0
          ? await apiFetch<CartResponse>(`/api/cart/items/${productId}`, { method: "DELETE" })
          : await apiFetch<CartResponse>(`/api/cart/items/${productId}`, {
            method: "PUT",
            body: JSON.stringify({ quantity }),
          });
        if (session === accountSessionSequence.current && sequence === cartMutationSequence.current) {
          applyCartItems(cartItemsFromResponse(response));
          setAuthError("");
        }
        return true;
      } catch (error) {
        if (session !== accountSessionSequence.current) return false;
        setAuthError(messageFor(error));
        if (sequence !== cartMutationSequence.current) return false;
        try {
          const response = await apiFetch<CartResponse>("/api/cart");
          if (session === accountSessionSequence.current && sequence === cartMutationSequence.current) {
            applyCartItems(cartItemsFromResponse(response));
          }
        } catch {
          if (session === accountSessionSequence.current && sequence === cartMutationSequence.current) {
            setAuthError(`${messageFor(error)} Não foi possível sincronizar a sacola.`);
          }
        }
        return false;
      }
    });
    cartMutationQueue.current = mutation.then(() => undefined, () => undefined);
    return mutation;
  };

  const addToCart = async (productId: ProductId) => {
    if (cartCheckoutInProgress.current) {
      setAuthError("Aguarde a finalização do pedido antes de alterar a sacola.");
      return false;
    }
    const oldQuantity = cartItemsRef.current[productId] ?? 0;
    if (oldQuantity >= 99) {
      setAuthError("Cada produto pode ter no máximo 99 unidades na sacola.");
      return false;
    }
    const nextQuantity = oldQuantity + 1;
    applyCartItems({ ...cartItemsRef.current, [productId]: nextQuantity });
    return persistCartQuantity(productId, nextQuantity);
  };

  const setCartQuantity = (productId: ProductId, quantity: number) => {
    if (cartCheckoutInProgress.current) {
      setAuthError("Aguarde a finalização do pedido antes de alterar a sacola.");
      return;
    }
    const nextQuantity = Math.min(99, Math.max(0, quantity));
    if (nextQuantity === (cartItemsRef.current[productId] ?? 0)) return;
    const nextCartItems = { ...cartItemsRef.current };
    if (nextQuantity === 0) delete nextCartItems[productId];
    else nextCartItems[productId] = nextQuantity;
    applyCartItems(nextCartItems);
    persistCartQuantity(productId, nextQuantity);
  };

  const loadOrders = useCallback(async () => {
    const sequence = ++ordersRequestSequence.current;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const result = await apiFetch<Order[]>("/api/orders");
      if (sequence === ordersRequestSequence.current) setOrders(result);
    } catch (error) {
      if (sequence === ordersRequestSequence.current) setOrdersError(messageFor(error));
    } finally {
      if (sequence === ordersRequestSequence.current) setOrdersLoading(false);
    }
  }, []);

  const getOrder = useCallback(async (orderId: string) => (
    apiFetch<Order>(`/api/orders/${encodeURIComponent(orderId)}`)
  ), []);

  const cancelOrder = useCallback(async (orderId: string) => {
    const order = await apiFetch<Order>(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
    });
    setOrders((current) => current.map((item) => item.id === order.id ? order : item));
    return order;
  }, []);

  const createOrder = useCallback(async () => {
    if (cartCheckoutInProgress.current) throw new Error("A finalização deste pedido já está em andamento.");
    const session = accountSessionSequence.current;
    cartCheckoutInProgress.current = true;
    try {
      await cartMutationQueue.current;
      if (session !== accountSessionSequence.current) throw new Error("A sessão mudou antes de finalizar o pedido.");
      const order = await apiFetch<Order>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ forma_pagamento: null }),
      });
      if (session !== accountSessionSequence.current) throw new Error("A sessão mudou durante a finalização do pedido.");
      applyCartItems({});
      ordersRequestSequence.current += 1;
      setOrdersLoading(false);
      setOrders((current) => [order, ...current]);
      return order;
    } finally {
      if (session === accountSessionSequence.current) cartCheckoutInProgress.current = false;
    }
  }, [applyCartItems]);

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
      refreshCatalog, loadOrders, getOrder, cancelOrder, createOrder,
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
