import React from "react";
import { Action, ActionPanel, List, Icon, LocalStorage } from "@raycast/api";
import { getObjectUrl } from "./useQuery";
import { HISTORY_UPLOAD } from './lib/consts'
import type { DisplayResultItem } from "./types";


function UploadHistory() {
  const cancelRef = React.useRef<AbortController | null>(null);
  const [markdown, setMarkdown] = React.useState<string>('');
  const [displayResult, setDisplayResult] = React.useState<DisplayResultItem[]>([]);
  const [isShowingDetail, setIsShowingDetail] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  React.useEffect(() => {
    console.log('useEffect upload History')
    LocalStorage.getItem<string>(HISTORY_UPLOAD).then((historyUploadString) => {
      const data = JSON.parse(historyUploadString || '{}').data as DisplayResultItem[]
      const historyUpload = data || []
      setDisplayResult(historyUpload)
    })
    return () => {
      cancelRef.current?.abort();
    };
  }, []);
  const onSearchTextChange = async () => {
    cancelRef.current?.abort();
    cancelRef.current = new AbortController();
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

  // action面板
  function actionPanel(item: DisplayResultItem) {
    return (
      <ActionPanel>
      <ActionPanel.Section>
        { item.localPath && <Action.ShowInFinder path={item.localPath} />}
        <Action.CopyToClipboard title="Copy Path to Clipboard" content={item.path} />
        { item.snippets && <Action.CopyToClipboard title="Copy Snippets to Clipboard" content={item.snippets} /> }
        { item.url &&<Action.OpenInBrowser url={item.url} /> }
        { item.snippets && <Action.CreateSnippet snippet={{ text: item.snippets }} /> }
      </ActionPanel.Section>
    </ActionPanel>
    )
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
                title="Local "
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
      navigationTitle="Upload History"
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

export default function Command() {
  return (
    <UploadHistory />
  );
}
