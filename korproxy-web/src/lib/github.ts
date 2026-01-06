"use server";

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface ReleaseInfo {
  tag_name: string;
  published_at: string;
  assets: {
    macArm64?: ReleaseAsset;
    macX64?: ReleaseAsset;
    windowsInstaller?: ReleaseAsset;
    windowsPortableZip?: ReleaseAsset;
    linuxTarGz?: ReleaseAsset;
    linuxAppImage?: ReleaseAsset;
    linuxDeb?: ReleaseAsset;
  };
}

let cachedRelease: ReleaseInfo | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseReleaseAsset(raw: unknown): ReleaseAsset | null {
  if (!isRecord(raw)) {
    return null;
  }

  const name = raw["name"];
  const url = raw["browser_download_url"];
  if (typeof name !== "string" || typeof url !== "string") {
    return null;
  }

  return {
    name,
    browser_download_url: url,
  };
}

function isMacArm64Dmg(name: string): boolean {
  if (!name.endsWith(".dmg")) return false;
  return name.includes("mac-arm64") || name.includes("osx-arm64") || name.endsWith("-arm64.dmg");
}

function isMacX64Dmg(name: string): boolean {
  if (!name.endsWith(".dmg")) return false;
  return (
    name.includes("mac-x64") ||
    name.includes("osx-x64") ||
    name.endsWith("-x64.dmg") ||
    name.includes("x86_64")
  );
}

function isWindowsInstaller(name: string): boolean {
  return name.endsWith("-setup.exe");
}

function isWindowsPortableZip(name: string): boolean {
  if (!name.endsWith(".zip")) return false;
  if (name.endsWith(".zip.blockmap")) return false;
  return name.includes("win-x64") && !name.includes("-mac-");
}

function isLinuxTarGz(name: string): boolean {
  if (!name.endsWith(".tar.gz")) return false;
  return name.includes("linux");
}

export async function getLatestRelease(): Promise<ReleaseInfo | null> {
  const now = Date.now();
  
  if (cachedRelease && now - cacheTime < CACHE_DURATION) {
    return cachedRelease;
  }

  try {
    const response = await fetch(
      "https://api.github.com/repos/korallis/korproxy/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch latest release:", response.status);
      return null;
    }

    const data: unknown = await response.json();
    if (!isRecord(data)) {
      console.error("GitHub release response was not an object");
      return null;
    }
    
    const assets: ReleaseInfo["assets"] = {};
    
    const rawAssets = data["assets"];
    const assetList: unknown[] = Array.isArray(rawAssets) ? rawAssets : [];

    for (const rawAsset of assetList) {
      const assetInfo = parseReleaseAsset(rawAsset);
      if (!assetInfo) continue;

      const name = assetInfo.name;

      if (!assets.macArm64 && isMacArm64Dmg(name)) {
        assets.macArm64 = assetInfo;
        continue;
      }
      if (!assets.macX64 && isMacX64Dmg(name)) {
        assets.macX64 = assetInfo;
        continue;
      }
      if (!assets.windowsInstaller && isWindowsInstaller(name)) {
        assets.windowsInstaller = assetInfo;
        continue;
      }
      if (!assets.windowsPortableZip && isWindowsPortableZip(name)) {
        assets.windowsPortableZip = assetInfo;
        continue;
      }
      if (!assets.linuxTarGz && isLinuxTarGz(name)) {
        assets.linuxTarGz = assetInfo;
        continue;
      }
      if (!assets.linuxAppImage && name.endsWith(".AppImage")) {
        assets.linuxAppImage = assetInfo;
        continue;
      }
      if (!assets.linuxDeb && name.endsWith(".deb")) {
        assets.linuxDeb = assetInfo;
        continue;
      }
    }

    const tagName = data["tag_name"];
    const publishedAt = data["published_at"];
    if (typeof tagName !== "string" || typeof publishedAt !== "string") {
      console.error("GitHub release response missing tag_name/published_at");
      return null;
    }

    cachedRelease = {
      tag_name: tagName,
      published_at: publishedAt,
      assets,
    };
    cacheTime = now;

    return cachedRelease;
  } catch (error) {
    console.error("Error fetching latest release:", error);
    return null;
  }
}
