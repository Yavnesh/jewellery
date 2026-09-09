"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaMagnifyingGlass,
  FaBagShopping,
  FaBoxOpen,
  FaUsers,
  FaTicket,
  FaXmark,
  FaArrowRight,
} from "react-icons/fa6";

interface SearchResults {
  orders: Array<{ id: string; title: string; subtitle: string; url: string }>;
  products: Array<{ id: string; title: string; subtitle: string; image?: string; url: string }>;
  customers: Array<{ id: string; title: string; subtitle: string; url: string }>;
  coupons: Array<{ id: string; title: string; subtitle: string; url: string }>;
}

export const GlobalSearchModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    orders: [],
    products: [],
    customers: [],
    coupons: [],
  });
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via parent
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ orders: [], products: [], customers: [], coupons: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  const hasResults =
    results.orders.length > 0 ||
    results.products.length > 0 ||
    results.customers.length > 0 ||
    results.coupons.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-luxury-border overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-luxury-border gap-3 bg-vamika-ivory/50">
          <FaMagnifyingGlass className="text-luxury-gold text-lg" />
          <input
            type="text"
            placeholder="Search orders (#10291), products, customers, coupons... (Cmd+K)"
            className="flex-1 bg-transparent text-vamika-charcoal placeholder:text-luxury-text-secondary/70 text-base focus:outline-none border-none focus:ring-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-luxury-text-secondary hover:text-vamika-charcoal p-1"
            >
              <FaXmark />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-luxury-text-secondary bg-white border border-luxury-border rounded font-mono shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && (
            <div className="py-12 text-center text-luxury-text-secondary flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-xs uppercase tracking-widest">Searching Catalog & Store Records...</p>
            </div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="py-12 text-center text-luxury-text-secondary">
              <p className="font-serif text-lg text-vamika-charcoal mb-1">No matches found</p>
              <p className="text-xs">No orders, products, customers or coupons found matching "{query}"</p>
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="py-8 text-center text-luxury-text-secondary text-xs uppercase tracking-wider">
              Type at least 2 characters to search across orders, products, and customers
            </div>
          )}

          {/* Orders Group */}
          {results.orders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-luxury-gold mb-2 px-2">
                <FaBagShopping /> Orders ({results.orders.length})
              </div>
              <div className="space-y-1">
                {results.orders.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-vamika-ivory transition-colors text-left group"
                  >
                    <div>
                      <div className="font-medium text-sm text-vamika-charcoal group-hover:text-luxury-gold transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-luxury-text-secondary">{item.subtitle}</div>
                    </div>
                    <FaArrowRight className="text-xs text-luxury-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Group */}
          {results.products.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-luxury-gold mb-2 px-2">
                <FaBoxOpen /> Products ({results.products.length})
              </div>
              <div className="space-y-1">
                {results.products.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-vamika-ivory transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-8 h-8 rounded object-cover border border-luxury-border"
                        />
                      )}
                      <div>
                        <div className="font-medium text-sm text-vamika-charcoal group-hover:text-luxury-gold transition-colors">
                          {item.title}
                        </div>
                        <div className="text-xs text-luxury-text-secondary">{item.subtitle}</div>
                      </div>
                    </div>
                    <FaArrowRight className="text-xs text-luxury-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers Group */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-luxury-gold mb-2 px-2">
                <FaUsers /> Customers ({results.customers.length})
              </div>
              <div className="space-y-1">
                {results.customers.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-vamika-ivory transition-colors text-left group"
                  >
                    <div>
                      <div className="font-medium text-sm text-vamika-charcoal group-hover:text-luxury-gold transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-luxury-text-secondary">{item.subtitle}</div>
                    </div>
                    <FaArrowRight className="text-xs text-luxury-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coupons Group */}
          {results.coupons.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-luxury-gold mb-2 px-2">
                <FaTicket /> Coupons ({results.coupons.length})
              </div>
              <div className="space-y-1">
                {results.coupons.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-vamika-ivory transition-colors text-left group"
                  >
                    <div>
                      <div className="font-mono font-bold text-sm text-vamika-charcoal group-hover:text-luxury-gold transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-luxury-text-secondary">{item.subtitle}</div>
                    </div>
                    <FaArrowRight className="text-xs text-luxury-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-vamika-ivory border-t border-luxury-border text-xs text-luxury-text-secondary flex justify-between items-center">
          <span>Navigate with <b>↑</b> <b>↓</b> and press <b>Enter</b></span>
          <span className="text-luxury-gold font-medium">Vamika Ops Live</span>
        </div>
      </div>
    </div>
  );
};
