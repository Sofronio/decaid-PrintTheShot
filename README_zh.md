# Print The Shot for Decaid

[English](README.md) | 中文

一个 [Decaid](https://github.com/decentespresso/decaid) 插件:把做完的 shot 按 DE1
的 TCL 打印格式上传到本机的打印服务器 —— 也就是
[PrintTheShot](https://github.com/Sofronio/DecentEspressoPrintTheShot-next)
画成图表、再送去热敏打印机的那份格式。

用它**不需要等 Decaid 发版** —— 从本仓库的 release 安装即可。

设置项:服务器地址(`host:port`)、上传路径(默认 `upload`)、Web UI 地址、HTTP 或
HTTPS、作为 `machine_id` 发送的机器名、是否在 shot 完成时自动上传,以及一个最短
shot 时长(用来跳过冲水之类的短数据)。

## 安装

Decaid 支持四种安装来源,四种都在它的 Plugins 界面里。前两种是**被跟踪的** ——
Decaid 知道它从哪来,能帮你更新;后两种是**快照** —— 装进去一次,之后不再跟。

| 来源 | Decaid 会问什么 | 这个插件该填什么 |
| --- | --- | --- |
| **GitHub release** | Repository(`owner/repo`)、Asset name(可留空) | `Sofronio/decaid-PrintTheShot`,Asset name **留空** |
| **GitHub branch** | Repository、Branch | `Sofronio/decaid-PrintTheShot`,分支 `main` |
| **本地 ZIP** | 选一个 `.zip` 文件 | [`print-the-shot.reaplugin.zip`](https://github.com/Sofronio/decaid-PrintTheShot/releases/latest/download/print-the-shot.reaplugin.zip) —— 永远是最新那版 |
| **本地文件夹** | 选一个含 `manifest.json` 和 `plugin.js` 的目录 | 仓库里 checkout 出来的 `print-the-shot.reaplugin/` |

**用 GitHub release 这一种。** 平板就该这么装:以后新版本以新 release 的形式出现,
「检查更新」能找到它。Asset name 可以留空 —— 本仓库的每个 release 都只带一个
`.zip`。

**ZIP 那条路要下哪个文件**:直接下
[`print-the-shot.reaplugin.zip`](https://github.com/Sofronio/decaid-PrintTheShot/releases/latest/download/print-the-shot.reaplugin.zip)。
每个 release 都用这个**不带版本号**的固定名字挂上压缩包,所以这条链接一直有效,并且
永远指向最新那版。你拿到的是哪个版本,包里写着(`manifest.json`),release 页面上也
标着。(GitHub 的 *Source code* 按钮给的是整个仓库,不是打包好的插件。那个压缩包其实
也能装上,因为本仓库只有一个目录含 manifest,但真正测过的是 release 里那个 asset。)

**文件夹快照**就是字面意思:让 Decaid 指向运行它的那台机器上的一个目录。
`installFromFolder` 会把这个目录复制进去,之后不再看它 —— 适合试一下本地改动,不
适合一个你想持续更新的插件。ZIP 那条路同理。

以上四种就是全部安装方式。下面这两条命令是 Plugins 界面在背后调的东西 —— 你自己
执行它们,得到的是同一种安装;在终端里或写进脚本时更方便:

```bash
# GitHub release —— 平板上用的就是它
curl -X POST http://localhost:8080/api/v1/plugins/install/github-release \
  -H 'content-type: application/json' \
  -d '{"repo": "Sofronio/decaid-PrintTheShot"}'

# GitHub branch
curl -X POST http://localhost:8080/api/v1/plugins/install/github-branch \
  -H 'content-type: application/json' \
  -d '{"repo": "Sofronio/decaid-PrintTheShot", "branch": "main"}'
```

### Decaid 强制的打包规则

如果你要 fork 这个插件自己发,这几条最好先知道 —— 每一条不满足都会让安装直接失败:

- release 的 tag 是 `X.Y.Z` 或 `vX.Y.Z`,且必须等于 `manifest.json` 里的 `version`;
- 该 release 带且只带一个 `.zip` asset;
- 该压缩包里只有一个插件根 —— 一个目录里放着 `manifest.json` 和 `plugin.js`,或者
  这两个文件直接躺在顶层;
- manifest 能解析,它的 `id` 是单一且路径安全的组件,`apiVersion` 为 `1`。

`npm run package` 和发布工作流会逐条检查。

## 东西都在哪

**两台服务器、三个地址。** Decaid 在 `8080` 上提供它自己的 API 和插件页面;打印
服务器是另一个程序,在「Server address」设置的地址上,它的网页在 `8000`。

**插件的设置**,在 Decaid 里:

1. 从皮肤后退,回到 Decaid 自己的界面;
2. **Plugins** —— 插件列表;
3. 找到 **Print The Shot**,点它那一行的 **Settings**(或者 ⋮ 菜单 → Settings)。

那个对话框**就是**设置本身:server address、upload path、web UI address、HTTP 或
HTTPS、auto upload、machine name、minimum shot length。

**插件自己的页面** —— 翻页浏览 shot、日志、手动打印那页 —— 由 Decaid 自己提供:

```
http://<decaid-host>:8080/api/v1/plugins/print-the-shot.reaplugin/ui
```

`<decaid-host>` 在跑 Decaid 的那台机器上就是 `localhost`,从手机或电脑访问时填那
台机器的局域网地址。它和 **Web UI address** 设置项里存的是同一个字符串 —— 所以那
一栏预填的就是它。

**打印服务器的页面** —— 收到的每一条 shot、图表、日期筛选 —— 由打印服务器自己提
供,地址就是 shot 上传到的那个:

```
http://<打印服务器地址>:8000/
```

它和 Decaid 是两个程序,所以端口不一样:Decaid 决定**发什么**,打印服务器决定
**出什么纸**。

## 它做了什么

- `shotStored` 事件(在 `AutoUpload` 打开时)会被转成 TCL 打印格式,POST 到配置的
  服务器。shot 的品鉴笔记会作为豆子备注一起走;**方案描述留在 `profile.notes`**,在
  它该在的地方。
- 上传的请求体显式带 `Content-Length`。宿主的 Dart `HttpClient` 在没有它时会用
  chunked 发送,而简单的打印服务器(Python `http.server`、ESP32 之类的固件)是按
  `Content-Length` 读 body 的 —— 它们会收到**空请求**,两边都不报错,静默地存下
  一个空文件。
- 页面(`ui` 端点)用来浏览已存的 shot、按需打印其中一条,并显示上传结果。它是可
  选的:皮肤可以直接调同样的这些端点。

## 端点

| id | 类型 | 作用 |
| --- | --- | --- |
| `ui` | http | 提供插件的页面 |
| `upload` | http | `POST {url, shot}` —— 代理一次上传,让浏览器不必向局域网发起跨源请求 |
| `debug` | http | `GET` 插件版本与加载状态 |
| `events` | websocket | 每存下一条新 shot 就推送它的 id |

## 开发

```bash
npm ci
npm test          # 转换层测试(vitest)
npm run build     # src/plugin.ts -> print-the-shot.reaplugin/plugin.js
npm run package   # 构建 + scripts/package.sh -> dist/<id>-<version>.zip
npm run serve     # 页面的开发服务器
```

`plugin.js` 是构建产物。`package.sh` 之前必须先 `npm run build`;打包脚本会拒绝比
源码旧的产物 —— 拿旧包配新版本号发布,是最难发现的那种错。

版本号**只写一处** —— `print-the-shot.reaplugin/manifest.json` —— 构建时注入到
产物里。release 的 tag 必须等于它,所以 `v1.5.5` 和 `"version": "1.5.5"` 是成对的:

```bash
git tag v1.5.5 && git push origin v1.5.5   # CI 会构建、测试、打包、发布
```

## 在 Decaid 里跑测试

`test/plugins/` 里是 manifest / 契约测试。它 import 的是 Decaid 自己的插件测试框
架,所以要在 Decaid 的 checkout 里跑 —— 见 `test/README.md`。
