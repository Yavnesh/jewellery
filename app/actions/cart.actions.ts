"use server";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { 
  getCartBySessionId, 
  getCartByUserId, 
  createCart, 
  addToCart as serviceAddToCart,
  updateCartItemQuantity as serviceUpdateQuantity,
  removeCartItem as serviceRemoveItem,
  mergeCarts
} from "@/lib/cart/cart.service";
import { revalidatePath } from "next/cache";

const CART_SESSION_COOKIE = "cart_session_id";

// Helper to get or create a cart session ID for guests
async function getCartSessionId(createIfMissing: boolean = false) {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
  
  if (!sessionId && createIfMissing) {
    sessionId = crypto.randomUUID();
    try {
      cookieStore.set(CART_SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    } catch {
      // Ignored if called during Server Component render where cookies are read-only
    }
  }
  
  return sessionId;
}

// Helper to get the active cart
export async function getActiveCart() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    // Authenticated user
    let cart = await getCartByUserId(session.user.id);
    if (!cart) {
      cart = await createCart(null, session.user.id);
    }
    return cart;
  } else {
    // Guest user
    const sessionId = await getCartSessionId(false);
    if (!sessionId) {
      return null;
    }
    let cart = await getCartBySessionId(sessionId);
    return cart;
  }
}

// Helper to get or create the active cart during Server Actions (write operations)
export async function getOrCreateActiveCart() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    let cart = await getCartByUserId(session.user.id);
    if (!cart) {
      cart = await createCart(null, session.user.id);
    }
    return cart;
  } else {
    const sessionId = await getCartSessionId(true);
    let cart = sessionId ? await getCartBySessionId(sessionId) : null;
    if (!cart && sessionId) {
      cart = await createCart(sessionId, null);
    }
    return cart;
  }
}

export async function addToCart(variantId: string, quantity: number = 1) {
  try {
    const cart = await getOrCreateActiveCart();
    if (!cart) throw new Error("Cart not found");
    await serviceAddToCart(cart.id, variantId, quantity);
    revalidatePath("/cart");
    const updatedCart = await getActiveCart();
    return { success: true, cart: updatedCart };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add to cart" };
  }
}

export async function updateQuantity(variantId: string, quantity: number) {
  try {
    const cart = await getActiveCart();
    if (!cart) throw new Error("Cart not found");
    await serviceUpdateQuantity(cart.id, variantId, quantity);
    revalidatePath("/cart");
    const updatedCart = await getActiveCart();
    return { success: true, cart: updatedCart };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update quantity" };
  }
}

export async function removeFromCart(variantId: string) {
  try {
    const cart = await getActiveCart();
    if (!cart) throw new Error("Cart not found");
    await serviceRemoveItem(cart.id, variantId);
    revalidatePath("/cart");
    const updatedCart = await getActiveCart();
    return { success: true, cart: updatedCart };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove item" };
  }
}

export async function syncUserCart() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
  
  if (sessionId) {
    await mergeCarts(sessionId, session.user.id);
    // Optional: Clear session cookie after merge
    cookieStore.delete(CART_SESSION_COOKIE);
  }
}
