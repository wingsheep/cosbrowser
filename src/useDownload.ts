import COS from 'cos-nodejs-sdk-v5'
import { showToast, Toast, getSelectedFinderItems, getPreferenceValues, showHUD, showInFinder } from "@raycast/api";
import fs, { existsSync, mkdirSync } from "fs";
import path, { dirname, basename, join } from "path";
import { resolveOutputPath, mkdirIterSync, isDirectory} from "./lib/utils";
import { homedir } from "os";
import { getFileNameByPath, getLastFolderNameByPath, formatSize, isImage, openFolder } from './lib/utils'

import type { Preference } from "./types";
const preferences = getPreferenceValues<Preference>();
const token = {
  SecretId: preferences.secretId,  
  SecretKey: preferences.secretKey,
}

const bucketAndRegion = {
  Bucket: preferences.bucket, /* 填入您自己的存储桶，必须字段 */
  Region: preferences.region,  /* 存储桶所在地域，例如 ap-beijing，必须字段 */
}
const cos = new COS(token);

function getOutputPath(filePath: string){
  const localPath = '~/Downloads/cosbrowser'
  const destinationFolderPath = join(localPath, filePath);
  const outputPath = destinationFolderPath.replace(/^~($|\/|\\)/, `${homedir()}/`);
  let outputDir
  if (outputPath.includes('.')) {
    outputDir = dirname(outputPath);
  } else {
    outputDir = outputPath
  }
  mkdirIterSync(outputDir)
  return outputPath
}

 /* 单个文件下载 */
export const downloadFile = async (key: string, taskId: string) => {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Downloading...",
  });
  try {
    const filePath = getFileNameByPath(key)
    const outputPath = getOutputPath(filePath)
    const data = await downloadItem(key, outputPath, (data) => {
      if (data.percent === 1) {
        toast.style = Toast.Style.Success
        toast.title = `Download Complete 🎉 (Size: ${formatSize(Number(data.total))}) `
        toast.primaryAction = {
          title: "Show in Finder",
          onAction: (toast) => {
            showInFinder(outputPath)
            toast.hide();
          },
        }
      }
    })
    return data
  } catch (e) {
    toast.style = Toast.Style.Failure
    toast.title = e instanceof Error ? e.message : "Failed to download"
    return e
  } 
}

// 取消下载任务
export const killDownloadTask = (taskId: string) => {
  cos.emit('inner-kill-task', {TaskId: taskId})
}

// 下载单个文件
async function downloadItem(Key: string, downloadPath: string, callback?: (progressData: COS.ProgressInfo) => void) {
  try {
    const data = await cos.getObject({
      ...bucketAndRegion,
      Key: Key,
      Output: fs.createWriteStream(downloadPath),
      onProgress:  (progressData) => callback && callback(progressData)
    })
    return data
  } catch (e) {
    return e
  }
}



// 批量下载文件
export async function batchDownload(prefix: string, taskId: string) {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Downloading...",
  });
  try {
    const listResult = await cos.getBucket({
      ...bucketAndRegion,
      Prefix: prefix,
      MaxKeys: 1000,
    })
    const prefixList = prefix.split('/')
    const replacePrefix = prefixList.length - 2 > 0 ? prefixList.slice(0, prefixList.length - 2).join('/') + '/' : ''
    const localPath = '~/Downloads/cosbrowser';
    const outputPath = localPath.replace(/^~($|\/|\\)/, `${homedir()}/`);
    const downloadList: {key: string, downloadPath: string}[] = []
    // 下载到本目录下的download目录下
    listResult.Contents.forEach(function (item) {
      const downloadPath = path.resolve(outputPath, item.Key).replace(replacePrefix, '');
      const pathParse = path.parse(downloadPath);
      const dirname = pathParse.dir.replace(replacePrefix, '')
      const dirmap: any = {}
      if (dirname && !dirmap[dirmap]) {
        // 如果被下载的对象在多层目录下，就在本地创建对应的目录
        // 例如Key是a/b/1.png，就在本地创建a/b这样的目录结构
        dirmap[dirmap] = true
        mkdirIterSync(dirname);
        if (pathParse.ext) {
          downloadList.push({
            key: item.Key,
            downloadPath: downloadPath
          })
        }
      }  
    });
    let count = 0
    const results = await Promise.all(downloadList.map(item => downloadItem(item.key, item.downloadPath, (data) => {
      if (data.percent === 1) {
        count++
        toast.title = `Downloading... (Finished ${count} / ${downloadList.length})})`
      }
    }))) as  COS.GeneralResult[]
    // 统计下载完成的数量及其大小
    const totalSize = results.reduce((acc, cur) => acc + (cur.headers ? Number(cur.headers['content-length']) : 0), 0);
    toast.style = Toast.Style.Success
    toast.title = `Download finish! (Totally ${results.length}files, ${formatSize(Number(totalSize))}) 🎉 `
    toast.primaryAction = {
      title: "Show in Finder",
      onAction: (toast) => {
        showInFinder(outputPath)
        toast.hide();
      },
    }
    return results
  } catch (error) {
    toast.style = Toast.Style.Failure
    toast.title =  error instanceof Error ? error.message : "Failed to download"
    return error
  }
}
