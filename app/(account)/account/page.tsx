import { requireUser } from "@/lib/auth/require-user";
import prisma from "@/utils/db";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function AccountDashboardPage() {
  const user = await requireUser();

  // Fetch recent orders count, address count, etc
  const [ordersCount, addressCount, profile] = await Promise.all([
    prisma.customer_order.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.customerProfile.findUnique({ where: { userId: user.id } })
  ]);

  const firstName = profile?.firstName || user.email?.split("@")[0] || "Customer";

  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-6">
        Welcome back, {firstName}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Personal Profile</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your personal information, name, and contact details.
            </p>
          </div>
          <Link 
            href="/account/profile" 
            className="mt-4 flex items-center text-sm font-medium text-tanishq-gold hover:text-amber-700"
          >
            Edit Profile
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Addresses Card */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Addresses ({addressCount})</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your shipping and billing addresses for a faster checkout.
            </p>
          </div>
          <Link 
            href="/account/addresses" 
            className="mt-4 flex items-center text-sm font-medium text-tanishq-gold hover:text-amber-700"
          >
            Manage Addresses
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Orders Card */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Orders ({ordersCount})</h3>
            <p className="mt-1 text-sm text-gray-500">
              View your order history, track shipments, and request returns.
            </p>
          </div>
          <Link 
            href="/account/orders" 
            className="mt-4 flex items-center text-sm font-medium text-tanishq-gold hover:text-amber-700"
          >
            View Order History
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
