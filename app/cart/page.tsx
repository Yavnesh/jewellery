import { CartModule } from "@/components/modules/cart";
import { getActiveCart } from "@/app/actions/cart.actions";
import { CartHydrator } from "./CartHydrator";

const CartPage = async () => {
  const serverCart = await getActiveCart();
  
  return (
    <div className="bg-luxury-bg min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif text-luxury-text-primary mb-10 text-center tracking-wide">
          Your Shopping Bag
        </h1>
        <CartHydrator serverCart={serverCart} />
        <CartModule />
      </div>
    </div>
  );
};

export default CartPage;
