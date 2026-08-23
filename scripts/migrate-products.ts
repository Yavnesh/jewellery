import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting product taxonomy migration...");

  // Load all categories for referencing mapping
  const categories = await prisma.category.findMany();
  const catMapBySlug = new Map(categories.map((c) => [c.slug, c]));

  // Get all products pointing to the legacy category
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to evaluate.`);

  const exceptions: Array<any> = [];
  let migratedCount = 0;

  // Let's run updates inside transactional chunks or one by one with rolling commits
  for (const product of products) {
    const title = product.title.toLowerCase();
    let suggestedCatSlug: string | null = null;
    let suggestedSubcatSlug: string | null = null;
    let confidence = 0; // 0 to 100
    let reason = "";

    // Classification Pipeline
    if (title.includes("salt & pepper") || title.includes("salt and pepper")) {
      suggestedCatSlug = "salt-and-pepper";
      confidence = 90;
      reason = "Title contains 'salt & pepper'";
      
      const shapes = ["round", "marqueue", "oval", "kite", "shield", "emerald", "hexagon"];
      for (const shape of shapes) {
        if (title.includes(shape) || title.includes(shape.replace("marqueue", "marquee"))) {
          suggestedSubcatSlug = `salt-and-pepper-${shape}`;
          confidence = 100;
          reason = `Title contains 'salt & pepper' and shape '${shape}'`;
          break;
        }
      }
    } else if (title.includes("white loose diamond")) {
      suggestedCatSlug = "white-loose-diamond";
      confidence = 90;
      reason = "Title contains 'white loose diamond'";

      const shapes = ["round", "marqueue", "oval", "kite", "shield", "emerald", "hexagon"];
      for (const shape of shapes) {
        if (title.includes(shape) || title.includes(shape.replace("marqueue", "marquee"))) {
          suggestedSubcatSlug = `white-loose-diamond-${shape}`;
          confidence = 100;
          reason = `Title contains 'white loose diamond' and shape '${shape}'`;
          break;
        }
      }
    } else if (title.includes("ring")) {
      suggestedCatSlug = "rings";
      confidence = 80;
      reason = "Title contains 'ring'";

      if (title.includes("engagement") || title.includes("wedding")) {
        suggestedSubcatSlug = "engagement";
        confidence = 95;
        reason = "Title contains 'ring' and 'engagement'/'wedding'";
      } else if (title.includes("men") || title.includes("mens")) {
        suggestedSubcatSlug = "diamond-mens";
        confidence = 95;
        reason = "Title contains 'ring' and 'men'/'mens'";
      } else {
        // Default to women rings if ring but not specified men
        suggestedSubcatSlug = "diamond-womens";
        confidence = 90;
        reason = "Title contains 'ring' without gender spec, mapping to women ring";
      }
    } else if (title.includes("earring")) {
      suggestedCatSlug = "earrings";
      confidence = 85;
      reason = "Title contains 'earring'";

      if (title.includes("dangle") || title.includes("hanging") || title.includes("drop")) {
        suggestedSubcatSlug = "hanging";
        confidence = 95;
        reason = "Title contains 'earring' and hanging characteristics";
      } else {
        suggestedSubcatSlug = "tops";
        confidence = 90;
        reason = "Title contains 'earring', mapping to tops as fallback";
      }
    } else if (title.includes("pendant")) {
      suggestedCatSlug = "pendants";
      confidence = 85;
      reason = "Title contains 'pendant'";

      if (title.includes("set") || title.includes("earring")) {
        suggestedSubcatSlug = "sets";
        confidence = 95;
        reason = "Title contains 'pendant' and mentions set/earring matching";
      } else {
        suggestedSubcatSlug = "single";
        confidence = 90;
        reason = "Title contains 'pendant', mapping to single as fallback";
      }
    } else if (title.includes("bangle")) {
      suggestedCatSlug = "bangles";
      confidence = 95;
      reason = "Title contains 'bangle'";
    } else if (title.includes("bracelet")) {
      suggestedCatSlug = "bracelets";
      confidence = 95;
      reason = "Title contains 'bracelet'";
    } else if (title.includes("necklace")) {
      suggestedCatSlug = "necklace";
      confidence = 95;
      reason = "Title contains 'necklace'";
    } else if (title.includes("broch") || title.includes("brooch") || title.includes("broches")) {
      suggestedCatSlug = "broches";
      confidence = 95;
      reason = "Title contains 'brooch'/'broches'";
    } else if (title.includes("charm")) {
      suggestedCatSlug = "charms";
      confidence = 95;
      reason = "Title contains 'charm'";
    }

    // Determine target category
    const targetSlug = suggestedSubcatSlug || suggestedCatSlug;
    const targetCat = targetSlug ? catMapBySlug.get(targetSlug) : null;

    if (targetCat && confidence >= 80) {
      // Migrate product relationship inside an atomic transaction commit
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: product.id },
          data: { categoryId: targetCat.id }
        });
      });
      migratedCount++;
    } else {
      // Record exception for manual audit reviews
      exceptions.push({
        product_slug: product.slug,
        product_title: product.title,
        suggested_category: suggestedCatSlug || "unknown",
        suggested_subcategory: suggestedSubcatSlug || "none",
        confidence,
        reason: reason || "No matching keywords detected in title"
      });
    }
  }

  // Save exception files to scratch directory
  const scratchDir = path.join(__dirname, "../scratch");
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const exceptionFilePath = path.join(scratchDir, "classification_exceptions.json");
  fs.writeFileSync(exceptionFilePath, JSON.stringify(exceptions, null, 2));

  console.log("=== Product Taxonomy Migration Report ===");
  console.log(`Successfully migrated products: ${migratedCount}`);
  console.log(`Unclassified Exceptions written to: ${exceptionFilePath} (${exceptions.length} items)`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
