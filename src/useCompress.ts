import { showToast, Toast, useNavigation, getSelectedFinderItems, getPreferenceValues, showHUD } from "@raycast/api";
import { existsSync, mkdirSync, statSync, createReadStream, createWriteStream } from "fs";
import fetch from "node-fetch";
import { Preference, CompressImagesResultItem } from "./types";
import { compressImageResponseScheme } from "./zodSchema";
import { resolveOutputPath, getDiffFileSizePercent } from "./lib/utils";
import path, { dirname, basename, join } from "path";

export async function compressImages(filePaths: string[]) {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Compressing images...",
  });


  try {
    const results = await Promise.all(filePaths.map((filePath) => _compressImage(filePath)));
    const totalOriginalSize = results.reduce((acc, cur) => acc + cur.originalSize, 0);
    const totalCompressedSize = results.reduce((acc, cur) => acc + cur.compressedSize, 0);

    toast.style = Toast.Style.Success
    toast.title = `Compression successful 🎉" (-${getDiffFileSizePercent(totalOriginalSize, totalCompressedSize)}%)`;
    return results
  } catch (e) {
    toast.style = Toast.Style.Failure;
    toast.title = "Error";
    toast.message = e instanceof Error ? e.message : "failed to compress images";
  }
}

const _compressImage = async (
  filePath: string
): Promise<
  CompressImagesResultItem
> => {
  const { size } = statSync(filePath);
  const preferences = getPreferenceValues<Preference>();

  const readStream = createReadStream(filePath);

  // Upload original image
  const resPost = await fetch("https://api.tinify.com/shrink", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${preferences.apiKey}`).toString("base64")}`,
      contentLength: size.toString(),
    },
    body: readStream,
  });

  const resJson = compressImageResponseScheme.parse(await resPost.json());

  // Validate
  if ("error" in resJson) {
    throw new Error(resJson.message);
  }

  // Download compressed image
  const downloadUrl = resJson.output.url;
  const resGet = await fetch(downloadUrl);

  // Save compressed image
  let outputDir = dirname(filePath);
  if (!preferences.overwrite) {
    outputDir = resolveOutputPath(filePath, preferences.destinationFolderPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir);
    }
  }

  const outputPath = join(outputDir, basename(filePath));
  const outputFileStream = createWriteStream(outputPath);

  await new Promise((resolve, reject) => {
    resGet.body?.pipe(outputFileStream);
    resGet.body?.on("error", reject);
    outputFileStream.on("finish", resolve);
  });

  return {
    originalSize: size,
    compressedSize: resJson.output.size,
    outputPath,
    percent: `-${getDiffFileSizePercent(size, resJson.output.size)}%`,
    ...(path.parse(outputPath)),
  }
};
