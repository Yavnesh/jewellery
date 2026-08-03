
import { SectionTitle } from "@/components";
import { CartModule } from "@/components/modules/cart";
import { getActiveCart } from "@/app/actions/cart.actions";
import { CartHydrator } from "./CartHydrator";

const CartPage = async () => {
  const serverCart = await getActiveCart();
  
  return (
    <div className="bg-white">
      <SectionTitle title="Cart Page" path="Home | Cart" />
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Shopping Cart
          </h1>
          <CartHydrator serverCart={serverCart} />
          <CartModule />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
