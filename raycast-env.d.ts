/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Secret Id - Cosbrowser Secret Id. */
  "secretId": string,
  /** Secret Key - Cosbrowser Secret Key. */
  "secretKey": string,
  /** Bucket - Cosbrowser Bucket. */
  "bucket": string,
  /** Region - Cosbrowser Region. */
  "region": string,
  /** Server Domain - Cosbrowser custom server domain. */
  "serverDomain": string,
  /** Default Prefix - Cosbrowser default prefix. */
  "defaultPrefix": string,
  /** Custom Snippets - Cosbrowser custom snippets with $url & $fileName. */
  "customSnippets": string,
  /** API Key - TinyPNG API Key. */
  "apiKey": string,
  /** Destination Folder Path - Set Destination Folder path. Specify an absolute path or a relative path from the target file. */
  "destinationFolderPath": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `folder` command */
  export type Folder = ExtensionPreferences & {}
  /** Preferences accessible in the `uploadImages` command */
  export type UploadImages = ExtensionPreferences & {}
  /** Preferences accessible in the `uploadHistory` command */
  export type UploadHistory = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `folder` command */
  export type Folder = {
  /** Query */
  "queryAlias": string
}
  /** Arguments passed to the `uploadImages` command */
  export type UploadImages = {}
  /** Arguments passed to the `uploadHistory` command */
  export type UploadHistory = {}
}


