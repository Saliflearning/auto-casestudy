import { existsSync } from "node:fs";
import { chromium } from "playwright-core";
import { PortfolioReference, PortfolioReferenceScreenshot } from "@/lib/portfolio-reference-types";
import { StorageConfigurationError, storeReferenceScreenshot } from "@/lib/server/storage";

const DESKTOP_VIEWPORT = { width: 1440, height: 1000 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

class ScreenshotWorkerConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScreenshotWorkerConfigurationError";
  }
}

function browserCandidates() {
  return [
    process.env.AUTOCASESTUDY_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean) as string[];
}

function findBrowserExecutable() {
  const executable = browserCandidates().find((candidate) => existsSync(candidate));
  if (!executable) {
    throw new ScreenshotWorkerConfigurationError(
      "Screenshot browser is not configured. Set AUTOCASESTUDY_CHROMIUM_EXECUTABLE_PATH or install Chrome/Edge on the worker."
    );
  }
  return executable;
}

async function capturePageScreenshot(options: {
  reference: PortfolioReference;
  screenshotId: string;
  label: string;
  viewport: typeof DESKTOP_VIEWPORT;
  viewportName: "desktop" | "mobile";
  fullPage: boolean;
  executablePath: string;
}): Promise<PortfolioReferenceScreenshot> {
  const browser = await chromium.launch({
    executablePath: options.executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const page = await browser.newPage({
      viewport: options.viewport,
      deviceScaleFactor: 1,
      colorScheme: "light"
    });
    await page.goto(options.reference.normalizedUrl, {
      waitUntil: "networkidle",
      timeout: 30_000
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const buffer = await page.screenshot({
      fullPage: options.fullPage,
      type: "png",
      animations: "disabled"
    });
    const stored = await storeReferenceScreenshot(buffer, {
      referenceId: options.reference.id,
      screenshotId: options.screenshotId
    });

    return {
      id: options.screenshotId,
      label: options.label,
      pageUrl: options.reference.normalizedUrl,
      storageKey: stored.storageKey,
      storageUrl: stored.storageUrl,
      capturedAt: new Date().toISOString(),
      viewport: options.viewportName,
      captureKind: options.fullPage ? "full-page" : "viewport",
      width: options.viewport.width,
      height: options.viewport.height,
      status: "Captured"
    };
  } finally {
    await browser.close();
  }
}

export async function captureReferenceScreenshots(reference: PortfolioReference) {
  try {
    const executablePath = findBrowserExecutable();
    const desktopViewport = await capturePageScreenshot({
      reference,
      screenshotId: "homepage-desktop-viewport",
      label: "Homepage desktop viewport",
      viewport: DESKTOP_VIEWPORT,
      viewportName: "desktop",
      fullPage: false,
      executablePath
    });
    const desktopFullPage = await capturePageScreenshot({
      reference,
      screenshotId: "homepage-desktop-full-page",
      label: "Homepage desktop full page",
      viewport: DESKTOP_VIEWPORT,
      viewportName: "desktop",
      fullPage: true,
      executablePath
    });
    const mobileViewport = await capturePageScreenshot({
      reference,
      screenshotId: "homepage-mobile-viewport",
      label: "Homepage mobile viewport",
      viewport: MOBILE_VIEWPORT,
      viewportName: "mobile",
      fullPage: false,
      executablePath
    });

    return {
      ...reference,
      captureStatus: "Captured" as const,
      screenshots: [desktopViewport, desktopFullPage, mobileViewport],
      metadata: {
        ...reference.metadata,
        visualHierarchyNotes: [
          "Desktop viewport, desktop full-page, and mobile viewport screenshots captured for future visual analysis.",
          ...reference.metadata.visualHierarchyNotes
        ].slice(0, 8)
      },
      adminNotes: "Screenshots captured. Human review and visual analysis are still required before this reference guides generation."
    };
  } catch (error) {
    if (error instanceof ScreenshotWorkerConfigurationError || error instanceof StorageConfigurationError) {
      throw error;
    }

    throw new Error(error instanceof Error ? error.message : "Reference screenshot capture failed.");
  }
}
