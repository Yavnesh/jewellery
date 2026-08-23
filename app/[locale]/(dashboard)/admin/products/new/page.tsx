"use client";
import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { convertCategoryNameToURLFriendly as convertSlugToURLFriendly } from "@/utils/categoryFormating";
import { sanitizeFormData } from "@/lib/form-sanitize";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const AddNewProduct = () => {
  const [product, setProduct] = useState<{
    merchantId?: string;
    title: string;
    price: number;
    manufacturer: string;
    inStock: number;
    mainImage: string;
    description: string;
    slug: string;
    categoryId: string;
    subcategoryId: string;
  }>({
    merchantId: "",
    title: "",
    price: 0,
    manufacturer: "",
    inStock: 1,
    mainImage: "",
    description: "",
    slug: "",
    categoryId: "",
    subcategoryId: "",
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);

  // Variation States for Rings
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [variantDetails, setVariantDetails] = useState<Record<string, { sku: string; price: number; stockQuantity: number }>>({});

  const parentCategories = categories.filter((c) => c.parentId === null);
  const subcategories = categories.filter((c) => c.parentId === product.categoryId);

  const selectedParent = categories.find((c) => c.id === product.categoryId);
  const isRings = selectedParent?.slug === "rings" || selectedParent?.name.toLowerCase() === "rings";

  const addProduct = async () => {
    if (
      !product.merchantId ||
      product.title === "" ||
      product.manufacturer === "" ||
      product.description == "" ||
      product.slug === ""
    ) {
      toast.error("Please enter values in input fields");
      return;
    }

    try {
      const payload: any = {
        ...product,
        price: Number(product.price),
        inStock: Number(product.inStock),
      };

      if (isRings && selectedSizes.length > 0) {
        payload.options = [
          {
            name: "Ring Size",
            values: selectedSizes,
          },
        ];
        payload.variants = selectedSizes.map((size) => {
          const detail = variantDetails[size] || {
            sku: `${product.slug}-size-${size}`,
            price: Number(product.price),
            stockQuantity: Number(product.inStock),
          };
          return {
            optionValue: size,
            sku: detail.sku,
            price: Number(detail.price),
            stockQuantity: Number(detail.stockQuantity),
          };
        });
      }

      console.log("Sending product data:", payload);

      const response = await apiClient.post(`/api/products`, payload);

      if (response.status === 201) {
        const data = await response.json();
        console.log("Product created successfully:", data);
        toast.success("Product added successfully");
        setProduct({
          merchantId: product.merchantId || "",
          title: "",
          price: 0,
          manufacturer: "",
          inStock: 1,
          mainImage: "",
          description: "",
          slug: "",
          categoryId: categories[0]?.id || "",
          subcategoryId: "",
        });
        setSelectedSizes([]);
        setVariantDetails({});
      } else {
        const errorData = await response.json();
        console.error("Failed to create product:", errorData);
        toast.error(`Error: ${errorData.error || "Failed to add product"}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const fetchMerchants = async () => {
    try {
      const res = await apiClient.get("/api/merchants");
      const data = await res.json();
      setMerchants(data || []);
      setProduct((prev) => ({
        ...prev,
        merchantId: prev.merchantId || data?.[0]?.id || "",
      }));
    } catch (e) {
      toast.error("Failed to load merchants");
    }
  };

  const uploadFile = async (file: any) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);

    try {
      const response = await apiClient.post("/api/main-image", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
      } else {
        console.error("File upload unsuccessfull");
      }
    } catch (error) {
      console.error("Error happend while sending request:", error);
    }
  };

  const fetchCategories = async () => {
    apiClient
      .get(`/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        const firstParent = data.find((c: any) => c.parentId === null);
        setProduct({
          merchantId: product.merchantId || "",
          title: "",
          price: 0,
          manufacturer: "",
          inStock: 1,
          mainImage: "",
          description: "",
          slug: "",
          categoryId: firstParent?.id || "",
          subcategoryId: "",
        });
      });
  };

  useEffect(() => {
    fetchCategories();
    fetchMerchants();
  }, []);

  const handleSizeCheckboxChange = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
      if (!variantDetails[size]) {
        setVariantDetails((prev) => ({
          ...prev,
          [size]: {
            sku: `${product.slug}-size-${size}`,
            price: product.price,
            stockQuantity: product.inStock,
          },
        }));
      }
    }
  };

  const handleVariantDetailChange = (size: string, field: string, val: any) => {
    setVariantDetails((prev) => ({
      ...prev,
      [size]: {
        ...prev[size],
        [field]: val,
      },
    }));
  };

  return (
    <div className="bg-white flex justify-start max-w-screen-2xl mx-auto xl:h-full max-xl:flex-col max-xl:gap-y-5">
      <DashboardSidebar />
      <div className="flex flex-col gap-y-7 xl:ml-5 max-xl:px-5 w-full">
        <h1 className="text-3xl font-semibold">Add new product</h1>
        
        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Merchant Info:</span>
            </div>
            <select
              className="select select-bordered"
              value={product?.merchantId}
              onChange={(e) =>
                setProduct({ ...product, merchantId: e.target.value })
              }
            >
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
            {merchants.length === 0 && (
              <span className="text-xs text-red-500 mt-1">
                Please create a merchant first.
              </span>
            )}
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Product name:</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full max-w-xs"
              value={product?.title}
              onChange={(e) =>
                setProduct({ ...product, title: e.target.value })
              }
            />
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Product slug:</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full max-w-xs"
              value={convertSlugToURLFriendly(product?.slug)}
              onChange={(e) =>
                setProduct({
                  ...product,
                  slug: convertSlugToURLFriendly(e.target.value),
                })
              }
            />
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Category:</span>
            </div>
            <select
              className="select select-bordered"
              value={product?.categoryId}
              onChange={(e) =>
                setProduct({ ...product, categoryId: e.target.value, subcategoryId: "" })
              }
            >
              {parentCategories.map((category: any) => (
                <option key={category?.id} value={category?.id}>
                  {category?.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {subcategories.length > 0 && (
          <div>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Subcategory:</span>
              </div>
              <select
                className="select select-bordered"
                value={product?.subcategoryId}
                onChange={(e) =>
                  setProduct({ ...product, subcategoryId: e.target.value })
                }
              >
                <option value="">Select Subcategory</option>
                {subcategories.map((category: any) => (
                  <option key={category?.id} value={category?.id}>
                    {category?.name.split("-").pop() /* render short subcategory name */}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Base Price:</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full max-w-xs"
              value={product?.price}
              onChange={(e) =>
                setProduct({ ...product, price: Number(e.target.value) })
              }
            />
          </label>
        </div>

        {isRings && (
          <div className="border p-4 rounded max-w-xl">
            <h3 className="font-semibold text-lg mb-2">Ring Sizes Configurations</h3>
            <div className="flex gap-x-4 mb-4">
              {["5", "6", "7", "8", "9", "10"].map((size) => (
                <label key={size} className="flex items-center gap-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(size)}
                    onChange={() => handleSizeCheckboxChange(size)}
                  />
                  <span>Size {size}</span>
                </label>
              ))}
            </div>

            {selectedSizes.map((size) => {
              const detail = variantDetails[size] || { sku: "", price: 0, stockQuantity: 0 };
              return (
                <div key={size} className="bg-gray-50 p-2 rounded mb-2 border">
                  <span className="font-semibold block mb-1">Size {size} Details:</span>
                  <div className="grid grid-cols-3 gap-x-2">
                    <input
                      type="text"
                      placeholder="SKU"
                      className="input input-xs input-bordered w-full"
                      value={detail.sku}
                      onChange={(e) => handleVariantDetailChange(size, "sku", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      className="input input-xs input-bordered w-full"
                      value={detail.price}
                      onChange={(e) => handleVariantDetailChange(size, "price", Number(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      className="input input-xs input-bordered w-full"
                      value={detail.stockQuantity}
                      onChange={(e) => handleVariantDetailChange(size, "stockQuantity", Number(e.target.value))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Manufacturer:</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full max-w-xs"
              value={product?.manufacturer}
              onChange={(e) =>
                setProduct({ ...product, manufacturer: e.target.value })
              }
            />
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Is product in stock?</span>
            </div>
            <select
              className="select select-bordered"
              value={product?.inStock}
              onChange={(e) =>
                setProduct({ ...product, inStock: Number(e.target.value) })
              }
            >
              <option value={1}>Yes</option>
              <option value={0}>No</option>
            </select>
          </label>
        </div>

        <div>
          <input
            type="file"
            className="file-input file-input-bordered file-input-lg w-full max-w-sm"
            onChange={(e: any) => {
              uploadFile(e.target.files[0]);
              setProduct({ ...product, mainImage: e.target.files[0].name });
            }}
          />
          {product?.mainImage && (
            <Image
              src={`/` + product?.mainImage}
              alt={product?.title}
              className="w-auto h-auto"
              width={100}
              height={100}
            />
          )}
        </div>

        <div>
          <label className="form-control">
            <div className="label">
              <span className="label-text">Product description:</span>
            </div>
            <textarea
              className="textarea textarea-bordered h-24"
              value={product?.description}
              onChange={(e) =>
                setProduct({ ...product, description: e.target.value })
              }
            ></textarea>
          </label>
        </div>

        <div className="flex gap-x-2">
          <button
            onClick={addProduct}
            type="button"
            className="uppercase bg-blue-500 px-10 py-5 text-lg border border-black border-gray-300 font-bold text-white shadow-sm hover:bg-blue-600 hover:text-white"
          >
            Add product
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewProduct;
