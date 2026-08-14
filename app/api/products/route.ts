import { NextResponse } from "next/server";
import prisma from "@/utils/db";

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
      inStock,
    } = body;

    if (!title || !merchantId || !slug || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        merchantId,
        slug,
        title,
        mainImage,
        price: Number(price),
        rating: 5,
        description,
        manufacturer,
        categoryId,
        inStock: Number(inStock) || 1,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
