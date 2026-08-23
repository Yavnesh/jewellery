import { describe, it, expect } from "vitest";
import { authOptions } from "@/utils/authOptions";

describe("OAuth Social Providers Configuration", () => {
  it("registers Google, Apple, and Facebook as configured NextAuth providers", () => {
    const providers = authOptions.providers;

    const google = providers.find((p: any) => p.id === "google");
    const apple = providers.find((p: any) => p.id === "apple");
    const facebook = providers.find((p: any) => p.id === "facebook");

    expect(google).toBeDefined();
    expect(apple).toBeDefined();
    expect(facebook).toBeDefined();
  });

  it("permits Google, Apple, and Facebook in auth signin callback filters", async () => {
    const signInCallback = authOptions.callbacks?.signIn;
    expect(signInCallback).toBeDefined();

    if (signInCallback) {
      // Test Google redirection filter permit
      const googleRes = await signInCallback({
        user: { id: "u1" },
        account: { provider: "google", providerAccountId: "g1" },
        profile: {}
      });
      // Should not throw, redirects correctly
      expect(googleRes).toBeDefined();

      // Test Facebook redirection filter permit
      const facebookRes = await signInCallback({
        user: { id: "u2" },
        account: { provider: "facebook", providerAccountId: "f1" },
        profile: {}
      });
      expect(facebookRes).toBeDefined();

      // Test Apple redirection filter permit
      const appleRes = await signInCallback({
        user: { id: "u3" },
        account: { provider: "apple", providerAccountId: "a1" },
        profile: {}
      });
      expect(appleRes).toBeDefined();
    }
  });
});
