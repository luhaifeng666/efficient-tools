<p  align="center"><img src="./src/public/images/scratch.svg" /></p>

<h1 align="center">efficient-tools</h1>

<p align="center">Provide some efficient tools to improve your efficiency.</p>

<p align="center">
  <img src="https://img.shields.io/badge/-v0.2.4-yellow">
  <img src="https://img.shields.io/badge/node-v14.17.0%2B-green">
</p>

# Install

```
npm i -g efficient-tools
```

# Usage

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
  -c, --check <key>          show an address
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

```
Usage: etd [options]

Options:
  -v, --version    output the version number
  -c, --config     add your appId and secret
  -l, --language   list all supported languages
  -t, --translate  translate
  -s, --set        from A to B
  -h, --help       display help for command
```
