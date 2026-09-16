import { getActiveCart } from "@/app/actions/cart.actions";
import { CartHydrator } from "../cart/CartHydrator";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const serverCart = await getActiveCart();

  return (
    <>
      <CartHydrator serverCart={serverCart} />
      <CheckoutClient />
    </>
  );
}
