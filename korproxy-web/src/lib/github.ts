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
    windows?: ReleaseAsset;
    linuxAppImage?: ReleaseAsset;
    linuxDeb?: ReleaseAsset;
  };
}

let cachedRelease: ReleaseInfo | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

    const data = await response.json();
    
    const assets: ReleaseInfo["assets"] = {};
    
    for (const asset of data.assets || []) {
      const name = asset.name as string;
      const assetInfo: ReleaseAsset = {
        name,
        browser_download_url: asset.browser_download_url,
      };
      
      if (name.includes("darwin-arm64") && name.endsWith(".dmg")) {
        assets.macArm64 = assetInfo;
      } else if (name.includes("darwin-x64") && name.endsWith(".dmg")) {
        assets.macX64 = assetInfo;
      } else if (name.includes("win32") && name.endsWith(".exe")) {
        assets.windows = assetInfo;
      } else if (name.includes("linux") && name.endsWith(".AppImage")) {
        assets.linuxAppImage = assetInfo;
      } else if (name.includes("linux") && name.endsWith(".deb")) {
        assets.linuxDeb = assetInfo;
      }
    }

    cachedRelease = {
      tag_name: data.tag_name,
      published_at: data.published_at,
      assets,
    };
    cacheTime = now;

    return cachedRelease;
  } catch (error) {
    console.error("Error fetching latest release:", error);
    return null;
  }
}
