import { CompressImages } from '../raycast-env';
export type Preference = {
  apiKey: string;
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  serverDomain: string;
  defaultPrefix: string;
  customSnippets: string;
  overwrite: boolean;
  destinationFolderPath: string;
};



export interface Result {
  value: string;
  type: string;
  query?: string;
  queryType?: string
}


export interface DisplayResultItem {
  id: string;
  title: string;
  key: string;
  isFolder: boolean;
  isImage?: boolean;
  size?: string;
  url?: string;
  path: string;
  localPath?: string;
  date?: string;
  markdown?: string;
  snippets?: string;
}


export interface CompressImagesResultItem {
  originalSize: number;
  compressedSize: number;
  outputPath: string;
  base: string;
  dir: string;
  name: string;
  ext: string;
  percent: string
  root: string
}


export interface CompressImagesItem {
  id: string;
  path: string;
  size: number;
  formatSize: string;
  base: string;
  dir: string;
  name: string;
  ext: string;
  root: string
}

