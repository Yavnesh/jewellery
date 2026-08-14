import { requireUser } from "@/lib/auth/require-user";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Heart, 
  ShieldCheck 
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/account', icon: User },
  { name: 'Profile', href: '/account/profile', icon: User },
  { name: 'Addresses', href: '/account/addresses', icon: MapPin },
  { name: 'Orders', href: '/account/orders', icon: ShoppingBag },
  { name: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { name: 'Security', href: '/account/security', icon: ShieldCheck },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-medium tracking-tight text-gray-900 mb-8">My Account</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <nav className="space-y-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <item.icon
                    className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-100">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
