<p align="center">
  <img src="./assets/icon.png" width="128">
  <h1 align="center">Cosbrowser</h1>
</p>

A Raycast extension that manage cosbrowser. Powered by [Tencent cosbrowser nodejs sdk](https://cloud.tencent.com/document/product/436/8629).


## Motivation

In daily work, it is often necessary to compress images, upload them to a CDN, and then copy the paths for code development. To simplify this process, this plugin has been developed.

## Features

- Upload & download files
- Preview images
- Copy path & snippets
- Upload history
- Compress images

## Installation

Currently, you need to clone this repo and install it locally in developer mode.

You will need to have [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io/) installed.

1. Clone this repo `git clone https://github.com/wingsheep/cosbrowser`
2. Go to the folder `cd raycast-multi-translate`
3. Install dependencies `pnpm install`
4. Go to Raycast, run `Import Extension` and select the folder

There is **no plan** to publish to the bloated [raycast/extensions](https://github.com/raycast/extensions) until they make a decentralized publishing system.

## Setup

Settings your Cosbrowser Secret Id & Secret Key & TinyPng key.

| name            | description | required | default |
| ----------------- | ----------------- | ----------------- | ----------------- |
| `Secret Id` | Cosbrowser  Secret Id. | true |
| `Secret Key` | Cosbrowser  Secret Key. | true |
| `Bucket` | Cosbrowser Bucket. | true |
| `Region` | Cosbrowser Region. | true | ap-shanghai
| `Default Prefix` | Configure the addresses of commonly used folders. | false |
| `Server Domain` | Configure the domain for generating links. | false | 
| `Custom Snippets` | Configure custom snippets with $url & $fileName. | false | `<img :src=`${filePath}$url` alt='$fileName'>`
| `API Key` | Configure tinyPng api key for compress images. | true |
| `Destination Folder Path` | Configure folder path for save compressed images. | true |


## Commands

| name              | description                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `View Cosbrowser` | View cosbrowser and then you can upload or download files, preview images and copy custom snippets.                                                                                                                |
| `Compress & Upload Image` | Compress selected images with TinyPNG. and then upload images. See [here](https://tinypng.com/developers/reference#resizing-images) for more details about the argument. |
| `Upload History` |  View upload local history data |

## Screenshot
![](https://cdn.jsdelivr.net/gh/wingsheep/FigureBed@master/img/view-cosbrowser.png)

![](https://cdn.jsdelivr.net/gh/wingsheep/FigureBed@master/img/cosbrowser_actions.png)

![](https://cdn.jsdelivr.net/gh/wingsheep/FigureBed@master/img/compress_panel.png)

![](https://cdn.jsdelivr.net/gh/wingsheep/FigureBed@master/img/cosbrowser_upload_history.png)
