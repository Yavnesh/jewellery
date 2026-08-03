import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export async function auth() {
  return await getServerSession(authOptions);
}
