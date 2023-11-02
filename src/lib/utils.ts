import path, { join, isAbsolute } from "path";
import os, { homedir } from "os";
import fs, { existsSync, mkdirSync } from "fs";
import { spawn } from 'child_process'
import { showToast, Toast, showHUD } from "@raycast/api";

export const resolveOutputPath = (filePath: string, destinationFolderPath: string) => {
  const expandedDestinationFolderPath = destinationFolderPath.replace(/^~($|\/|\\)/, `${homedir()}/`);

  if (isAbsolute(expandedDestinationFolderPath)) {
    return expandedDestinationFolderPath;
  } else {
    return join(path.dirname(filePath), expandedDestinationFolderPath);
  }
};

// 递归创建目录举例
export function mkdirIterSync(dirname: string) {
  if(existsSync(dirname)) {
    return true;
  }else{
    if(mkdirIterSync(path.dirname(dirname))) {
      mkdirSync(dirname);
      return true;
    }
  }
}

// 判断是否是文件夹
export function isDirectory(path: string) {
  try {
    const stats = fs.statSync(path);
    return stats.isDirectory();
  } catch (error) {
    // 处理异常情况
    console.error('Error:', error);
    return false;
  }
}


// 获取文件名
export const getFileNameByPath = (filePath: string) => {
  const fileName = path.basename(filePath);
  return fileName
}
// 获取最后一个文件夹名
export const getLastFolderNameByPath = (filePath: string) => {
  const parts = filePath.split('/');
  const lastFolderName = parts[parts.length - 2];
  return lastFolderName
}


// 转换B 为 KB
export const formatSize = (size: number) => {
  if (size < 1024) {
    return size + 'B';
  } else if (size >= 1024 && size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + 'KB';
  } else if (size >= 1024 * 1024 && size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + 'MB';
  }
}

// 判断是否是图片
export const isImage = (fileName: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  const extension = path.extname(fileName).toLowerCase();
  return imageExtensions.includes(extension);
}




// 打开文件夹
export function openFolder(path: string) {
  const platform = os.platform();
  let command;

  if (platform === 'win32') {
    command = 'explorer';
  } else if (platform === 'darwin') {
    command = 'open';
  } else if (platform === 'linux') {
    command = 'xdg-open';
  } else {
    console.error('Unsupported platform:', platform);
    showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: "Unsupported platform: " + platform,
    });
    return;
  }

  const childProcess = spawn(command, [path], { detached: true, stdio: 'ignore' });
  childProcess.unref();
}

// 获取文件大小
export function getFileSize(filePath: string, format = true) {
  try {
    const stats = fs.statSync(filePath);
    return format ? formatSize(stats.size) : stats.size
  } catch (err) {
    // console.error('Error occurred while reading file stats:', err);
    return 0
  }
}


// 计算压缩比
export function getDiffFileSizePercent(originalSize: number, compressedSize: number) {
  return (100 - (compressedSize/ originalSize) * 100).toFixed(1)
}
