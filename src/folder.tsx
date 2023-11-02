import React from "react";
import { Action, Detail, ActionPanel, List, Icon, Clipboard, LocalStorage, showToast, Toast, LaunchProps, useNavigation, getPreferenceValues } from "@raycast/api";
import { getListFolder, getObjectUrl } from "./useQuery";
import { downloadFile, batchDownload, killDownloadTask } from "./useDownload";
import { uploadFile } from "./useUpload";

import type { CosObject} from 'cos-nodejs-sdk-v5'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid';
import { getFileNameByPath, getLastFolderNameByPath, formatSize, isImage } from './lib/utils'
import UploadHistory from './uploadHistory'
import type { Preference, DisplayResultItem } from "./types";

const preferences = getPreferenceValues<Preference>();
const customSnippets = preferences.customSnippets || '<img src="$url" alt="$fileName">'

function Folder(props: {prefix: string, filePaths?: string[]}) {
  const cancelRef = React.useRef<AbortController | null>(null);
  const [displayResult, setDisplayResult] = React.useState<DisplayResultItem[]>([]);
  const [prefix, setPrefix] = React.useState<string>(() => props.prefix);
  const [prefixList, setPrefixList] = React.useState<string[]>(() => props.prefix.split('/'));
  const [markdown, setMarkdown] = React.useState<string>('');
  const [isShowingDetail, setIsShowingDetail] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const { push, pop } = useNavigation();
  React.useEffect(() => {
    onSearchTextChange('',  prefix)
    return () => {
      cancelRef.current?.abort();
    };
  }, []);
  const onSearchTextChange = async (text: string, prefix: string) => {
    cancelRef.current?.abort();
    const searchContent = text.trim();
    cancelRef.current = new AbortController();
    try {
      setLoading(true);
      const result = await getListFolder(prefix);
      const displayResult: DisplayResultItem[] = []
      const { commonPrefixes, contents } = result as {
        contents: CosObject[],
        commonPrefixes: { Prefix: string; }[],
      }
      commonPrefixes.forEach(item => {
        displayResult.push({
          id: uuidv4(),
          title: getLastFolderNameByPath(item.Prefix),
          key: item.Prefix,
          path: preferences.serverDomain ? new URL(item.Prefix, preferences.serverDomain).href : item.Prefix,
          isFolder: true,
        })
      })
      contents.forEach(item => {
        if (Number(item.Size)) {
          const title = getFileNameByPath(item.Key)
          // 替换snippets的 $url 和 $fileName
          const snippets = customSnippets?.replace('$url', item.Key)?.replace('$fileName', title);
          displayResult.push({
            id: uuidv4(),
            title,
            key: item.Key,
            path: preferences.serverDomain ?  new URL(item.Key, preferences.serverDomain).href : item.Key,
            isFolder: false,
            isImage: isImage(item.Key),
            size: formatSize(Number(item.Size)),
            date: dayjs(item.LastModified).format('YYYY-MM-DD HH:mm:ss'),
            snippets,
          })
        }
      })
      setDisplayResult(displayResult)
      setLoading(false);
    } catch (error: unknown) {
      if (!String(error).startsWith("AbortError")) {
        showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: String(error) || (error as Error)?.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const onSelectionChange = async (id: string | null) => {
    const selectItem = displayResult.find(item => item.id === id);
    if (selectItem?.isImage) {
      setIsShowingDetail(true)
      setLoadingDetail(true)
      const url = selectItem.url || await getObjectUrl(selectItem.key) as string
      selectItem.url = url as string    
      const md = `![${selectItem.key}](${url})`
      setMarkdown(md)
      setLoadingDetail(false)
    } else {
      setIsShowingDetail(false)
    }
  }
  // 返回上一级 
  const goBack = () => {
    if (!prefix) return
    let newPrefix = ''
    let newPrefixList = prefixList.filter(item => item !== '')
    newPrefixList = newPrefixList.slice(0, newPrefixList.length - 1)
    if (newPrefixList.length) {
      newPrefixList.push('')
      newPrefix = newPrefixList.join('/')
    } else {
      newPrefix = ''
    }
    setPrefixList(newPrefixList)
    setPrefix(newPrefix)
    pop()
    push(<Folder prefix={newPrefix} />)
  }
  const download = async (item: DisplayResultItem) => {
    const { key, isFolder } = item
    const taskId = uuidv4()
    if (isFolder) {
      await batchDownload(key, taskId)
    } else {
      await downloadFile(key, taskId)
    }
  }
  const upload = async (item: DisplayResultItem) => {
    const { key } = item
    const flag = await uploadFile(key, props.filePaths)
    if (flag) {
      push(<UploadHistory />)
    }
  }
  const refresh = () => {
    onSearchTextChange('',  prefix)
  }
  // action面板
  function actionPanel(item: DisplayResultItem) {
    // on select item to upload
    if (props.filePaths && props.filePaths.length) {
      return (
        <ActionPanel>
          { item.isFolder &&
            <Action title="Open Folder" icon={Icon.Finder} onAction={() => push(<Folder prefix={item.key} />)} />
          }
          { props.prefix &&<Action title="Upload" shortcut={{ modifiers: ["cmd", "shift"], key: "u" }} icon={Icon.Upload} onAction={() => upload(item)} /> }
        </ActionPanel>
      )
    } else {
      return (
        <ActionPanel>
          <ActionPanel.Section title="View & Copy">
            { item.isFolder &&
              <Action title="Open Folder" icon={Icon.Finder} onAction={() => push(<Folder prefix={item.key} />)} />
            }
            <Action.CopyToClipboard title="Copy Path to Clipboard" content={item.path} />
            { item.snippets && <Action.CopyToClipboard title="Copy Snippets to Clipboard" content={item.snippets} /> }
            { item.url &&<Action.OpenInBrowser url={item.url} /> }
          </ActionPanel.Section>
          <ActionPanel.Section title="Action">
            { props.prefix &&<Action title="Upload" shortcut={{ modifiers: ["cmd", "shift"], key: "u" }} icon={Icon.Upload} onAction={() => upload(item)} /> }
            { props.prefix &&<Action title="Download" shortcut={{ modifiers: ["cmd", "shift"], key: "d" }} icon={Icon.Download} onAction={() => download(item)} /> }
            { props.prefix &&<Action title="Refresh" shortcut={{ modifiers: ["cmd", "shift"], key: "r" }} icon={Icon.Repeat} onAction={() => refresh() } /> }
            { props.prefix &&<Action title="Back up" shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }} icon={Icon.ArrowLeft} onAction={() => goBack()} /> }
          </ActionPanel.Section>
      </ActionPanel>
      )
    }
  }
  // detail面板
  function detailPane(item: DisplayResultItem) {
    return (
      <List.Item.Detail
        isLoading={loadingDetail}
        markdown={markdown}
        metadata={
          <List.Item.Detail.Metadata>
            <List.Item.Detail.Metadata.Label title="Last Modified" icon={Icon.Calendar} text={item.date} />
            <List.Item.Detail.Metadata.Separator />
            <List.Item.Detail.Metadata.Label title="Size" text={item.size} />
            <List.Item.Detail.Metadata.Separator />
            {
              item.path &&
              <List.Item.Detail.Metadata.Link
                title="Path"
                target={item.path}
                text={item.path}
              />
            }
            <List.Item.Detail.Metadata.Separator />
            {
              item.url &&
              <List.Item.Detail.Metadata.Link
                title="Object location"
                text={item.url}
                target={item.url}
              />
            }
            <List.Item.Detail.Metadata.Separator />
            <List.Item.Detail.Metadata.Label title="Snippets" text={item.snippets} />
            <List.Item.Detail.Metadata.Separator />
          </List.Item.Detail.Metadata>
        }
      />
    )
  }
  // list item
  function listItemPane(item: DisplayResultItem) {
    return (
      <List.Item
        key={item.id}
        id={item.id}
        title={item.title}
        icon={item.isFolder ? Icon.Folder : item.isImage ? Icon.Image : Icon.Document}
        subtitle={ isShowingDetail ? '' : item.size}
        accessories={[{ text: isShowingDetail ? '' : item.date }]}
        detail={detailPane(item)}
        actions={actionPanel(item)}
      />
    )
  }
  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Please enter keyword to filter..."
      navigationTitle={`Bucket List(${props.prefix || '/'})`}
      throttle
      isShowingDetail={isShowingDetail}
      onSelectionChange={onSelectionChange}
    >
      {displayResult.map((item) => (
        listItemPane(item)
      ))}
    </List>
  )
} 

export default function Command(props: { filePaths?: string[]}) {
  return (
    <Folder filePaths={props.filePaths} prefix={preferences.defaultPrefix} />
  );
}
