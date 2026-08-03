"use client";
export default function AddressesPage() {
  return (
    <div>
      <h2 className="text-2xl font-medium text-gray-900 mb-6">Saved Addresses</h2>
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-12 text-center">
        <p className="text-sm text-gray-500 mb-4">No saved addresses</p>
        <p className="text-sm text-gray-500">Save an address to make checkout faster.</p>
      </div>
    </div>
  );
}
