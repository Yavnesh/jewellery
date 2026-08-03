"use server";

import { requireUser } from "@/lib/auth/require-user";
import prisma from "@/utils/db";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  phone: z.string().trim().max(30).optional(),
});

export async function updateProfile(formData: FormData) {
  try {
    const user = await requireUser();
    
    const validatedData = profileSchema.parse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone"),
    });

    await prisma.customerProfile.upsert({
      where: { userId: user.id },
      update: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
      },
      create: {
        userId: user.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
      }
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to update profile" };
  }
}
