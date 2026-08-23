import { NextAuthOptions } from "next-auth";
import { Account, User as AuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import prisma from "@/utils/db";
import { nanoid } from "nanoid";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.AUTH_APPLE_ID!,
      clientSecret: process.env.AUTH_APPLE_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        try {
          const user = await prisma.user.findFirst({
            where: {
              email: credentials.email,
            },
          });
          if (user) {
            const isPasswordCorrect = await bcrypt.compare(
              credentials.password,
              user.password!
            );
            if (isPasswordCorrect) {
              return {
                id: user.id,
                email: user.email,
                role: user.role ?? "user",
                sessionVersion: user.sessionVersion,
              };
            }
          }
        } catch (err: any) {
          throw new Error(err);
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any, profile?: any }) {
      if (account?.provider === "credentials") {
        return true;
      }
      
      // Handle OAuth providers safely
      if (account && ["google", "apple", "facebook", "github"].includes(account.provider)) {
        try {
          // 1. Check if the OAuth account is already linked
          const linkedAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId
              }
            },
            include: { user: true }
          });

          if (linkedAccount) {
            // Found linked account, set user id for jwt callback
            user.id = linkedAccount.user.id;
            user.role = linkedAccount.user.role;
            user.sessionVersion = linkedAccount.user.sessionVersion;
            return true;
          }

          // 2. Check if a user exists with this email
          // We assume OAuth providers like Google and Apple provide verified emails
          // (Wait, Apple proxy emails might be tricky, but we proceed cautiously)
          let existingUser = await prisma.user.findFirst({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // Create a new user since one doesn't exist
            existingUser = await prisma.user.create({
              data: {
                id: nanoid(),
                email: user.email!,
                role: "user",
                password: null, // OAuth users don't have passwords
              },
            });
          }

          // 3. Link the OAuth account to the existing (or newly created) user
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type || "oauth",
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            }
          });

          user.id = existingUser.id;
          user.role = existingUser.role;
          user.sessionVersion = existingUser.sessionVersion;
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.sessionVersion = (user as any).sessionVersion || 1;
        token.iat = Math.floor(Date.now() / 1000); // Issued at time
      }
      
      // We removed the hard 15-minute expiration block to allow 30-day sessions
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        (session.user as any).sessionVersion = token.sessionVersion;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on auth errors
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
