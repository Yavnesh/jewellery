import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { validateCategoryHierarchy } from "@/lib/validation/product.validation";

const ALLOWED_FILTER_TYPES = ['price', 'rating', 'category', 'inStock', 'outOfStock'];
const ALLOWED_OPERATORS = ['gte', 'lte', 'gt', 'lt', 'equals', 'contains'];
const ALLOWED_SORT_VALUES = ['defaultSort', 'titleAsc', 'titleDesc', 'lowPrice', 'highPrice'];

function validateFilterType(filterType: string) {
  return ALLOWED_FILTER_TYPES.includes(filterType);
}

function validateOperator(operator: string) {
  return ALLOWED_OPERATORS.includes(operator);
}

function validateSortValue(sortValue: string) {
  return ALLOWED_SORT_VALUES.includes(sortValue);
}

function validateAndSanitizeFilterValue(filterType: string, filterValue: string) {
  switch (filterType) {
    case 'price':
    case 'rating':
    case 'inStock':
    case 'outOfStock':
      const numValue = parseInt(filterValue);
      return isNaN(numValue) ? null : numValue;
    case 'category':
      return typeof filterValue === 'string' && filterValue.trim().length > 0 
        ? filterValue.trim() 
        : null;
    default:
      return null;
  }
}

function buildSafeFilterObject(filterArray: Array<{ filterType: string; filterOperator: string; filterValue: any }>) {
  const filterObj: Record<string, any> = {};
  
  for (const item of filterArray) {
    if (!validateFilterType(item.filterType)) continue;
    if (!validateOperator(item.filterOperator)) continue;
    
    const sanitizedValue = validateAndSanitizeFilterValue(item.filterType, item.filterValue);
    if (sanitizedValue === null) continue;
    
    filterObj[item.filterType] = {
      [item.filterOperator]: sanitizedValue,
    };
  }
  
  return filterObj;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "";
    
    if (mode === "admin") {
      const adminProducts = await prisma.product.findMany({});
      return NextResponse.json(adminProducts);
    }

    if (mode === "max-price") {
      const maxPriceObj = await prisma.product.aggregate({
        _max: {
          price: true
        }
      });
      return NextResponse.json({ maxPrice: maxPriceObj._max.price || 20000 });
    }

    const page = Number(searchParams.get("page"));
    const validatedPage = (page && page > 0) ? page : 1;

    let filterArray: Array<{ filterType: string; filterOperator: string; filterValue: any }> = [];
    let sortByValue = "defaultSort";

    // Parse search parameters
    searchParams.forEach((value, key) => {
      if (key.includes("filters")) {
        let filterType = "";
        if (key.includes("price")) filterType = "price";
        else if (key.includes("rating")) filterType = "rating";
        else if (key.includes("category")) filterType = "category";
        else if (key.includes("inStock")) filterType = "inStock";
        else if (key.includes("outOfStock")) filterType = "outOfStock";

        if (filterType) {
          const operatorStart = key.indexOf("$") + 1;
          const operatorEnd = key.indexOf("]") - 1;
          if (operatorStart > 0 && operatorEnd > operatorStart) {
            const filterOperator = key.substring(operatorStart, operatorEnd + 1);
            filterArray.push({
              filterType,
              filterOperator,
              filterValue: value
            });
          }
        }
      }

      if (key === "sort" && validateSortValue(value)) {
        sortByValue = value;
      }
    });

    const filterObj = buildSafeFilterObject(filterArray);
    let whereClause = { ...filterObj };

    if (filterObj.category && filterObj.category.equals) {
      delete whereClause.category;
    }

    let sortObj = {};
    switch (sortByValue) {
      case "titleAsc":
        sortObj = { title: "asc" };
        break;
      case "titleDesc":
        sortObj = { title: "desc" };
        break;
      case "lowPrice":
        sortObj = { price: "asc" };
        break;
      case "highPrice":
        sortObj = { price: "desc" };
        break;
    }

    let products;
    const skip = (validatedPage - 1) * 10;
    const take = 20; // Ensure 20 per page as per UX requirements

    if (filterObj.category && filterObj.category.equals) {
      products = await prisma.product.findMany({
        skip,
        take,
        include: {
          category: { select: { name: true } },
        },
        where: {
          ...whereClause,
          category: {
            name: { equals: filterObj.category.equals },
          },
        },
        orderBy: sortObj,
      });
    } else {
      products = await prisma.product.findMany({
        skip,
        take,
        include: {
          category: { select: { name: true } },
        },
        where: whereClause,
        orderBy: sortObj,
      });
    }

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      merchantId,
      slug,
      title,
      mainImage,
      price,
      description,
      manufacturer,
      categoryId,
      subcategoryId,
      inStock,
      options,
      variants,
    } = body;

    if (!title || !merchantId || !slug || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate Category-Subcategory hierarchy integrity
    if (subcategoryId && !(await validateCategoryHierarchy(categoryId, subcategoryId))) {
      return NextResponse.json({ error: "Invalid subcategory parent mapping" }, { status: 400 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          merchantId,
          slug,
          title,
          mainImage,
          price: Number(price),
          rating: 5,
          description,
          manufacturer,
          categoryId: subcategoryId || categoryId, // Lowest level category reference
          inStock: Number(inStock) || 1,
        },
      });

      if (options && Array.isArray(options) && options.length > 0) {
        for (const opt of options) {
          const createdOpt = await tx.productOption.create({
            data: {
              productId: p.id,
              name: opt.name,
            }
          });

          if (opt.values && Array.isArray(opt.values)) {
            const valMap: Record<string, string> = {};
            for (let vIdx = 0; vIdx < opt.values.length; vIdx++) {
              const val = opt.values[vIdx];
              const createdVal = await tx.productOptionValue.create({
                data: {
                  optionId: createdOpt.id,
                  value: val,
                  position: vIdx
                }
              });
              valMap[val] = createdVal.id;
            }

            if (variants && Array.isArray(variants)) {
              for (let vrIdx = 0; vrIdx < variants.length; vrIdx++) {
                const vr = variants[vrIdx];
                if (vr.optionValue && valMap[vr.optionValue]) {
                  const createdVariant = await tx.productVariant.create({
                    data: {
                      productId: p.id,
                      sku: vr.sku,
                      price: Number(vr.price),
                      stockQuantity: Number(vr.stockQuantity) || 0,
                      title: `${title} - ${vr.optionValue}`,
                      position: vrIdx
                    }
                  });

                  await tx.variantOptionValue.create({
                    data: {
                      variantId: createdVariant.id,
                      optionValueId: valMap[vr.optionValue]
                    }
                  });
                }
              }
            }
          }
        }
      } else {
        // Create default variant if no custom options
        await tx.productVariant.create({
          data: {
            productId: p.id,
            sku: body.sku || `${slug}-default`,
            price: Number(price),
            stockQuantity: Number(inStock) || 1,
            title: `${title} - Default`
          }
        });
      }

      return p;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
