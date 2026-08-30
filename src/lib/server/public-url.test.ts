import { describe, expect, it } from "vitest";

import { assertPublicHttpUrl, isPublicIpAddress } from "@/lib/server/public-url";

describe("isPublicIpAddress", () => {
  it("allows globally routable addresses", () => {
    expect(isPublicIpAddress("8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("2606:4700:4700::1111")).toBe(true);
  });

  it("blocks private, loopback, link-local, reserved, and mapped addresses", () => {
    for (const address of ["127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1", "::1", "fc00::1", "::ffff:127.0.0.1", "192.0.2.1"]) {
      expect(isPublicIpAddress(address), address).toBe(false);
    }
  });

  it("rejects credentials and private literal destinations at the network boundary", async () => {
    await expect(assertPublicHttpUrl("https://user:password@8.8.8.8/")).rejects.toThrow("credentials");
    await expect(assertPublicHttpUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow("Private, reserved, and local");
    await expect(assertPublicHttpUrl("https://8.8.8.8/")).resolves.toBeInstanceOf(URL);
  });
});
