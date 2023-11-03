import COS from 'cos-nodejs-sdk-v5'
import { showToast, Icon, Toast, Alert, confirmAlert, getSelectedFinderItems, getPreferenceValues, LocalStorage } from "@raycast/api";
import path from "path";
import dayjs from 'dayjs'
import { formatSize, getFileSize, isImage, getFileNameByPath } from './lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { HISTORY_UPLOAD, HISTORY_UPLOAD_VERSION } from './lib/consts'
import type { Preference } from "./types";

const preferences = getPreferenceValues<Preference>();
const customSnippets = preferences.customSnippets || '<img src="$url" alt="$fileName">'

const token = {
  SecretId: preferences.secretId,  
  SecretKey: preferences.secretKey,
}

const bucketAndRegion = {
  Bucket: preferences.bucket, /* 填入您自己的存储桶，必须字段 */
  Region: preferences.region,  /* 存储桶所在地域，例如 ap-beijing，必须字段 */
}
const cos = new COS(token);
// 批量上传
export async function uploadFile(key: string, selectedFilePaths?: string[], callback?: (data: any) => void) {
  let filePaths: string[];
  try {
    filePaths = selectedFilePaths && selectedFilePaths.length ? selectedFilePaths : (await getSelectedFinderItems()).map((f) => f.path).filter(f => path.parse(f).ext)
    if (!filePaths.length) {
      throw new Error('No files selected and folder selection is not supported')
    }
    const parseKey = path.parse(key)
    if (parseKey.ext) key = parseKey.dir
    const options: Alert.Options = {
      title: "Confirm uploading the following files?",
      message: `Selected files will be uploaded to this path: ${key}`,
      icon: Icon.Warning,
    };
    await confirmAlert(options);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Uploading...",
    });
    const historyUploadString = await LocalStorage.getItem<string>(HISTORY_UPLOAD) || '{}'
    const historyUpload = JSON.parse(historyUploadString).data || []
    const stashMap:any = {}
    const files = filePaths.map((filePath) => {
      const Key = path.resolve(key, path.basename(filePath))
      const stashItem = {
        size: getFileSize(filePath),
        filePath: filePath,
      }
      stashMap[Key] = stashItem
      return {
        ...bucketAndRegion,
        Key,  /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
        FilePath: filePath,
        onTaskReady: (taskId: string) => {
          /* taskId 可通过队列操作来取消上传 cos.cancelTask(taskId)、停止上传 cos.pauseTask(taskId)、重新开始上传 cos.restartTask(taskId) */
          console.log(taskId);
        },
      }
    })
    let uploadTotalSize = ''
    await cos.uploadFiles({
      files: files,
      SliceSize: 1024 * 1024 * 10,    /* 设置大于10MB采用分块上传 */
      onProgress: (info) => {
        const percent = (info.percent * 10000) / 100;
        const speed = (info.speed / 1024 / 1024 * 100) / 100;
        uploadTotalSize = formatSize(info.total) || '0'
        toast.title = `Uploading...(Percent: ${percent}% Speed: ${speed}Mb/s)`
      },
      onFileFinish: (err, data) => {
        if (err) {
          toast.style = Toast.Style.Failure
          toast.title = `Upload failed (${err})`
        } else {
          toast.style = Toast.Style.Success
          toast.title = `Upload finish! (Totally ${files.length}files, ${uploadTotalSize})) 🎉 `
          const findKey = Object.keys(stashMap).find((key) => data?.Location.includes(key))
          const title = findKey && getFileNameByPath(findKey) || 'unknown'
          const historyUploadItem = {
            id: uuidv4(),
            title,
            key: findKey,
            size: findKey && stashMap[findKey].size || 0,
            path: data?.Location,
            localPath: findKey && stashMap[findKey].filePath,
            isImage: findKey && isImage(findKey),
            isFolder: false,
            date: dayjs(data?.headers.date || new Date()).format('YYYY-MM-DD HH:mm:ss') ,
            snippets: findKey && customSnippets?.replace('$url',findKey)?.replace('$fileName', title)
          } 
          historyUpload.unshift(historyUploadItem)
          LocalStorage.setItem(HISTORY_UPLOAD, JSON.stringify({
            version: HISTORY_UPLOAD_VERSION,
            date: new Date().getTime(),
            data: historyUpload
          }));
          callback && callback(data)
        }
      },
    })
    return true
  } catch (e) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: e instanceof Error ? e.message : "Could not get the selected Finder items",
    });
    return false
  }
  return false
}
