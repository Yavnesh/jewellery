import prisma from '@/utils/db';
import { getVariantAvailability } from '../catalog/variant.service';

export async function getCartBySessionId(sessionId: string) {
  return prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
              optionValues: {
                include: {
                  optionValue: {
                    include: { option: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function getCartByUserId(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
              optionValues: {
                include: {
                  optionValue: {
                    include: { option: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function createCart(sessionId: string | null, userId: string | null) {
  return prisma.cart.create({
    data: {
      sessionId,
      userId,
    }
  });
}

export async function addToCart(cartId: string, variantId: string, quantity: number) {
  // Verify variant exists and is available
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId }
  });

  if (!variant) throw new Error("Variant not found");
  
  const availableStock = variant.stockQuantity - variant.reservedQuantity;
  if (availableStock < quantity) {
    throw new Error(`Insufficient stock. Only ${availableStock} available.`);
  }

  // Upsert cart item
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId,
        variantId
      }
    }
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (availableStock < newQuantity) {
      throw new Error(`Insufficient stock for combined quantity. Only ${availableStock} available.`);
    }
    
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity }
    });
  } else {
    return prisma.cartItem.create({
      data: {
        cartId,
        variantId,
        quantity
      }
    });
  }
}

export async function updateCartItemQuantity(cartId: string, variantId: string, quantity: number) {
  if (quantity <= 0) {
    return prisma.cartItem.delete({
      where: {
        cartId_variantId: { cartId, variantId }
      }
    });
  }

  // Verify stock
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId }
  });

  if (!variant) throw new Error("Variant not found");
  
  const availableStock = variant.stockQuantity - variant.reservedQuantity;
  if (availableStock < quantity) {
    throw new Error(`Insufficient stock. Only ${availableStock} available.`);
  }

  return prisma.cartItem.update({
    where: {
      cartId_variantId: { cartId, variantId }
    },
    data: { quantity }
  });
}

export async function removeCartItem(cartId: string, variantId: string) {
  return prisma.cartItem.delete({
    where: {
      cartId_variantId: { cartId, variantId }
    }
  });
}

export async function mergeCarts(sessionId: string, userId: string) {
  const sessionCart = await getCartBySessionId(sessionId);
  const userCart = await getCartByUserId(userId);

  if (!sessionCart) return userCart; // Nothing to merge

  if (!userCart) {
    // Just assign the session cart to the user
    return prisma.cart.update({
      where: { id: sessionCart.id },
      data: { 
        userId,
        sessionId: null // Clear session id to prevent reuse
      }
    });
  }

  // Merge items from session cart into user cart
  for (const item of sessionCart.items) {
    const existingUserItem = userCart.items.find(i => i.variantId === item.variantId);
    
    if (existingUserItem) {
      await prisma.cartItem.update({
        where: { id: existingUserItem.id },
        data: { quantity: existingUserItem.quantity + item.quantity }
      });
    } else {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { cartId: userCart.id }
      });
    }
  }

  // Delete the old session cart
  await prisma.cart.delete({
    where: { id: sessionCart.id }
  });

  return getCartByUserId(userId);
}
