"use client"

import React, { useTransition } from "react";
import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import Image from "next/image"
import Link from "next/link";
import { FaCircleQuestion, FaXmark } from "react-icons/fa6";
import QuantityInputCart from "@/components/QuantityInputCart";
import { sanitize } from "@/lib/sanitize";
import { getImagePath } from "@/lib/utils";

export const CartModule = () => {

  const { products, calculateTotals, total } = useProductStore();
  const [isPending, startTransition] = React.useTransition();

  const handleRemoveItem = (id: string) => {
    startTransition(async () => {
      const { removeFromCart } = await import("@/app/actions/cart.actions");
      const result = await removeFromCart(id);
      if (result.success) {
        toast.success("Product removed from the cart");
      } else {
        toast.error("Failed to remove product");
      }
    });
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-serif text-luxury-text-primary mb-4">Your bag is currently empty.</h2>
        <p className="text-sm font-sans text-luxury-text-secondary mb-8">Discover our exquisite collections to find the perfect piece.</p>
        <Link href="/shop" className="bg-luxury-text-primary text-white px-8 py-3 uppercase tracking-widest text-xs font-semibold hover:bg-luxury-gold transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
      <section aria-labelledby="cart-heading" className="lg:col-span-7">
        <h2 id="cart-heading" className="sr-only">
          Items in your shopping cart
        </h2>

        <ul
          role="list"
          className="divide-y divide-luxury-border/40 border-b border-t border-luxury-border/40"
        >
          {products.map((product) => (
            <li key={product.id} className="flex py-8">
              <div className="flex-shrink-0 bg-white border border-luxury-border/20 p-2 rounded">
                <Image
                  width={192}
                  height={192}
                  src={getImagePath(product?.image)}
                  alt={sanitize(product.title)}
                  className="h-28 w-28 object-contain sm:h-36 sm:w-36"
                />
              </div>

              <div className="ml-6 flex flex-1 flex-col justify-between">
                <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                  <div>
                    <div className="flex justify-between">
                      <h3 className="text-base font-serif tracking-wide text-luxury-text-primary">
                        <Link href={`#`} className="hover:text-luxury-gold transition-colors">
                          {sanitize(product.title)}
                        </Link>
                      </h3>
                    </div>
                    <p className="mt-2 text-sm font-sans font-medium text-luxury-gold tracking-wider">
                      ₹ {product.price.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="mt-4 sm:mt-0 sm:pr-9 flex flex-col justify-between">
                    <QuantityInputCart product={product} />
                    <div className="absolute right-0 top-0">
                      <button
                        onClick={() => handleRemoveItem(product.id)}
                        type="button"
                        className="-m-2 inline-flex p-2 text-luxury-text-secondary hover:text-red-500 transition-colors"
                      >
                        <span className="sr-only">Remove</span>
                        <FaXmark className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <p className={`mt-4 flex space-x-2 text-xs font-sans font-medium ${product.stock < product.amount ? 'text-red-500' : 'text-green-600'}`}>
                  {product.stock <= 0 
                    ? <span>Out of stock</span> 
                    : product.stock < product.amount 
                      ? <span>Only {product.stock} available</span> 
                      : <span>In stock & ready to ship</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Order summary */}
      <section
        aria-labelledby="summary-heading"
        className="mt-16 rounded-sm bg-luxury-ivory border border-luxury-border/60 px-4 py-8 sm:p-8 lg:col-span-5 lg:mt-0"
      >
        <h2
          id="summary-heading"
          className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-4"
        >
          Order Summary
        </h2>

        <dl className="mt-6 space-y-4 font-sans text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-luxury-text-secondary">Subtotal</dt>
            <dd className="font-medium text-luxury-text-primary">
              ₹ {total.toLocaleString('en-IN')}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-4">
            <dt className="flex items-center text-luxury-text-secondary">
              <span>Shipping</span>
            </dt>
            <dd className="font-medium text-luxury-text-primary">Free</dd>
          </div>
          <div className="flex items-center justify-between border-t border-luxury-border/40 pt-4">
            <dt className="text-base font-serif font-bold text-luxury-text-primary">
              Total
            </dt>
            <dd className="text-xl font-serif font-bold text-luxury-gold">
              ₹ {total.toLocaleString('en-IN')}
            </dd>
          </div>
        </dl>
        
        <p className="text-[11px] text-luxury-text-secondary mt-3 text-center">
          Price inclusive of all taxes.
        </p>

        {products.length > 0 && (
          <div className="mt-8">
            <Link
              href={products.some(p => p.stock < p.amount) ? "#" : "/checkout"}
              onClick={(e) => {
                if (products.some(p => p.stock < p.amount)) {
                  e.preventDefault();
                  toast.error("Please remove or reduce out of stock items");
                }
              }}
              className={`flex justify-center items-center w-full uppercase tracking-widest px-4 py-3.5 text-[13px] font-bold text-white shadow-sm transition duration-200 ${
                products.some(p => p.stock < p.amount) ? 'bg-gray-400 cursor-not-allowed' : 'bg-luxury-gold hover:bg-luxury-gold/90'
              }`}
            >
              <span>Secure Checkout</span>
            </Link>
          </div>
        )}
      </section>
    </form>
  );
};
