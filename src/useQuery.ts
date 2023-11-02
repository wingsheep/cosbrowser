import COS from 'cos-nodejs-sdk-v5'
import { showToast, Toast, getSelectedFinderItems, getPreferenceValues, showHUD } from "@raycast/api";
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

/* 列出文件夹下的文件 */
export const getListFolder = async (prefix?: string) => {
  const _listFolder = async function (params: COS.GetBucketParams) {
    const Contents: COS.CosObject[] = [];
    const CommonPrefixes: { Prefix: string; }[] = [];
    let marker: string | undefined;
    const next = async function () {
      params.Marker = marker;
      try {
        const data = await cos.getBucket(params)
        data &&
        data.CommonPrefixes &&
        data.CommonPrefixes.forEach(function (item) {
          CommonPrefixes.push(item);
          });
        data &&
          data.Contents &&
          data.Contents.forEach(function (item) {
            Contents.push(item);
          });
        if (data.IsTruncated === 'true') {
          marker = data.NextMarker;
          next();
        } else {
          return {
            commonPrefixes: CommonPrefixes,
            contents: Contents,
          }
        }
      } catch (err) {
        console.log(err)
        return err
      }
    };
   return await next();
  };
  return await _listFolder(
    {
      ...bucketAndRegion,
      Delimiter: '/', // 如果按目录列出文件传入该分隔符，如果要深度列出文件不传改参数
      Prefix:  prefix, // 要列出的目录前缀
    },
  );
}
// 获取对象访问 URL
export const getObjectUrl = async (key: string) => {
  return new Promise((resolve, reject) => {
    cos.getObjectUrl(
      {
        ...bucketAndRegion,
        Key: key,
        Sign: true
      },
      function (err, data) {
        if (err) {
          reject(err)
        } else {
          resolve(data && data.Url)
        }
      }
    );
  })
}  
