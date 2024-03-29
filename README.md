<!--
 * @Author: haifeng.lu haifeng.lu@ly.com
 * @Date: 2022-05-23 10:43:31
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-16 17:48:38
 * @Description: 
-->
<p  align="center"><img src="./src/public/images/scratch.svg" /></p>

<h1 align="center">efficient-tools</h1>

<p align="center">Provide some efficient tools to improve your efficiency.</p>

<p align="center">
  <img src="https://img.shields.io/badge/-v0.3.11-yellow">
  <img src="https://img.shields.io/badge/node-v14.17.0%2B-green">
  <img src="https://img.shields.io/badge/vitest-%5E0.21.1-green">
</p>

# Install

```
npm i -g efficient-tools
```

# Usage

<h2 align="center">ET-Config</h2>

<p align="center">A command which used to export and init the ET's configuration.</p>

After updating the ET package, the configurations that configured before always gone. But now, you can backup the configurations by `etc -e` command before updating the package, and then, according to the `etc -i` command to restore them after updating.🥳🥳

```
Usage: etc [options]

Options:
  -v, --version  output the version number
  -i, --init     init ET configuration
  -e, --export   export ET configuration
  -h, --help     display help for command
```

<h2 align="center">ET-Link</h2>

<p align="center">A tool to help you open a link quickly.</p>

```
Usage: etl [options]

Options:
  -v, --version              output the version number
  -o, --open <key>           open an address
  -a, --add <address> [key]  add an address
  -r, --remove <key...>      remove an address
  -l, --list                 show all addresses
  -c, --check <key>          show an address and its QRcode
  -e, --empty                delete all addresses
  -d, --derive               export all addresses to the target file
  -i, --init <filePath>      insert addresses to local
  -m, --modify               modify name or address
  -w, --where                show the path of the configuration file
  --directory                set custom filepath
  -h, --help                 display help for command
```

<h2 align="center">ET-Dictionary</h2>

<p align="center">A tool for translation.</p>

> TIP:
>
> This command has supported the [Youdai translation API](https://ai.youdao.com/#/) and the [Microsoft translation API](https://docs.microsoft.com/zh-cn/azure/cognitive-services/translator/quickstart-translator?tabs=csharp)🥳!!
>
> You can switch the translation service by `etd --service` command.

```
Usage: etd [options]

Options:
  -v, --version    output the version number
  -c, --config     setup your translation service's configurations
  -l, --language   list all supported languages
  -t, --translate  translate
  -s, --set        set translation rule(from A to B)
  --service        set or switch the type of translation service
  -r, --rule       print current translation rule
  -h, --help       display help for command
```

<h2 align="center">ET-Pictures</h2>

<p align="center">A tool for you to compress images by <a href="https://tinypng.com/">Tiny png API</a>.</p>

> Before using it, you need to browse to [https://tinypng.com/developers](https://tinypng.com/developers) to get your `API KEY` first!

You can choose any `WebP, JPEG(JPG) or PNG` image to compress it.

```
Usage: etp [options]

Options:
  -v, --version   output the version number
  -s, --set       set your API key
  -c, --compress  image compression
  -h, --help      display help for command
```
