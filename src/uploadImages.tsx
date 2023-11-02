
import React  from "react";
import { showToast, Icon, Grid, Action, ActionPanel, Toast, useNavigation, getSelectedFinderItems, getPreferenceValues, showHUD } from "@raycast/api";
import path from "path";
import { resolveOutputPath, formatSize, getFileSize, getDiffFileSizePercent } from "./lib/utils";
import { compressImages } from "./useCompress";
import Folder from './folder'
import { v4 as uuidv4 } from 'uuid';
import { Preference, CompressImagesItem, CompressImagesResultItem } from "./types";
const preferences = getPreferenceValues<Preference>();

function CompressImage() {
  const cancelRef = React.useRef<AbortController | null>(null);
  const { push, pop } = useNavigation();
  const [searchText, setSearchText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [totalPercent, setTotalPercent] = React.useState("");
  const [selectTotalOriginalSize, setSelectTotalOriginalSize] = React.useState(0);
  const [totalCompressedSize, setTotalCompressedSize] = React.useState(0);
  const [totalOriginalSize, setTotalOriginalSize] = React.useState(0);
  const [fileList, setFileList] = React.useState<CompressImagesItem[]>([]);
  const [compressedResult, setCompressedResult] = React.useState<CompressImagesResultItem[]>([]);
  React.useEffect(() => {
    console.log('initData')
    initData()
    return () => {
      cancelRef.current?.abort();
    };
  }, [])
  React.useEffect(() => {
    console.log('getLocalCompressedImages')
    getLocalCompressedImages()
    return () => {
      cancelRef.current?.abort();
    };
  }, [fileList])
  // 初始化
  async function initData(){
    cancelRef.current?.abort();
    cancelRef.current = new AbortController();
    try {
      const selectedFinderItems = await getSelectedFinderItems();
      const selectedFileList: CompressImagesItem[] = []
      selectedFinderItems.forEach((f) => {
        selectedFileList.push({
          id: uuidv4(),
          path: f.path,
          size: getFileSize(f.path, false) as number,
          formatSize: getFileSize(f.path, true) as string,
          ...(path.parse(f.path)),
        })
      });
      const selectTotalOriginalSize = selectedFileList.reduce((acc, cur) => acc + cur.size, 0);
      setSelectTotalOriginalSize(selectTotalOriginalSize)
      setFileList(selectedFileList)
    } catch (e) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: e instanceof Error ? e.message : "Could not get the selected Finder items",
      });
      return;
    }
  }
  // 获取本地压缩结果
  function getLocalCompressedImages() {
    console.log('getLocalCompressedImages')
    const localResult = fileList.map(item => {
      const outputDir = resolveOutputPath(item.path, preferences.destinationFolderPath);
      const outputPath = path.resolve(outputDir, item.base)
      const compressedSize = getFileSize(outputPath, false) as number
      const originalSize = item.size as number
      return {
        id: uuidv4(),
        outputPath,
        originalSize,
        compressedSize,            
        percent: `-${getDiffFileSizePercent(Number(originalSize), Number(compressedSize))}%`,
        ...(path.parse(outputPath)),
      }
    }).filter(item => item.compressedSize)
    const totalOriginalSize = localResult.reduce((acc, cur) => acc + cur.originalSize, 0);
    const totalCompressedSize = localResult.reduce((acc, cur) => acc + cur.compressedSize, 0);
    const totalPercent =  `-${getDiffFileSizePercent(totalOriginalSize, totalCompressedSize)}%`
    setTotalPercent(totalPercent)
    setTotalCompressedSize(totalCompressedSize)
    setTotalOriginalSize(totalOriginalSize)
    setCompressedResult(localResult || [])
  }
  // compress selected
  async function compressSelected(item: CompressImagesItem) {
    if (loading) return;
    setLoading(true);
    await compressImages([item.path])
    getLocalCompressedImages()
    setLoading(false);
  }
  // compress all
  async function compressAll() {
    if (loading) return;
    setLoading(true);
    const filePaths = fileList.map(item => item.path);
    await compressImages(filePaths);
    getLocalCompressedImages();
    setLoading(false);
  }
  // compress unCompress
  async function compressUnCompressItem() {
    if (loading) return;
    setLoading(true);
    // 从fileList中筛选出compressedResult中没有的项
    const unCompressedResult = fileList.filter(item => !compressedResult.find(f => f.base === item.base))
    const filePaths = unCompressedResult.map(item => item.path);
    await compressImages(filePaths);
    getLocalCompressedImages();
    setLoading(false);
  }
  // upload
  const upload = async (item: CompressImagesResultItem) => {
    push(<Folder filePaths={[item.outputPath]}  />)
  }
  // upload all
  const uploadAll = async () => {
    const filePaths = compressedResult.map(item => item.outputPath);
    push(<Folder filePaths={filePaths}  />)
  }
  return (
    <Grid
      isLoading={loading}
      columns={6}
      inset={Grid.Inset.Large}
      filtering={true}
      navigationTitle="Compress Images"
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search"
    >
      <Grid.Section title="Pending Compression Images" subtitle={`Total: ${formatSize(selectTotalOriginalSize)}(Support WEBP, JPEG and PNG files)`} inset={Grid.Inset.Small}>
        {fileList.map((item) => (
           <Grid.Item
            key={item.path}
            content={item.path}
            title={item.base}
            subtitle={item.formatSize}
            actions={
              <ActionPanel>
                <Action title="Compress Selected" icon={Icon.CircleProgress100} onAction={() => compressSelected(item)}  />
                <Action title="Compress Uncompressed" icon={Icon.CircleEllipsis} onAction={() => compressUnCompressItem()} />
                <Action title="Compress All" shortcut={{ modifiers: ["cmd", "shift"], key: "a" }} icon={Icon.CircleFilled}  onAction={() => compressAll()} />
                { compressedResult && compressedResult.length && <Action title="Upload All Compressed" shortcut={{ modifiers: ["cmd", "shift"], key: "u" }} icon={Icon.Upload} onAction={() => uploadAll()} /> }
                { item.path && <Action.ShowInFinder path={item.path} />}
              </ActionPanel>
            }
          />
        ))}
      </Grid.Section>
      <Grid.Section title="Compressed Result" subtitle={`Total: ${formatSize(totalCompressedSize)}(${totalPercent})`} inset={Grid.Inset.Small}>
        {compressedResult.map((item) => (
           <Grid.Item
              key={item.outputPath}
              content={item.outputPath}
              title={item.base}
              subtitle={`${formatSize(item.compressedSize)}(${item.percent})`}
              actions={
                <ActionPanel>
                  { <Action title="Upload Selected" shortcut={{ modifiers: ["cmd", "shift"], key: "u" }} icon={Icon.Upload} onAction={() => upload(item)} /> }
                  { compressedResult && compressedResult.length && <Action title="Upload All Compressed" shortcut={{ modifiers: ["cmd", "shift"], key: "u" }} icon={Icon.Upload} onAction={() => uploadAll()} /> }
                  { item.outputPath && <Action.ShowInFinder path={item.outputPath} />}
                </ActionPanel>
              }
            />
        ))}
      </Grid.Section>
    </Grid>
  );
}


export default function Command() {
  return (
    <CompressImage />
  );
}
