# 用于自动上传到阿里云OSS的vite插件

## 安装

通过npm安装

```bash
npm install vite-ali-oss-plugin -D
```

## 配置

设置option

```javascript
const options = {
  region: '', // oss所在的地区，例如杭州是 oss-cn-hangzhou
  accessKeyId: '', // 阿里云key
  accessKeySecret: '', //阿里云密钥
  bucket: '', // oss的存储桶名称
  overwrite: true, // 是否删除里面的内容
  basePath: '', // 默认就是放根目录，如果要放在某个文件夹，写： html 注意，前后都不要加 /
  enabled: true, // 是否启用自动上传
  ignore: '', // 文件忽略规则。如果你使用空字符串 '' ，将不会忽略任何文件
  headers: {}, // 请求头设置，详细信息见 https://help.aliyun.com/document_detail/31955.html
};
```

## 用法

在 vite.config.js 中注册本插件

```javascript
import { defineConfig } from 'vite'
import viteAliOssPlugin from 'vite-ali-oss-plugin'

const options = {
    region: '<Your Region>'
    accessKeyId: '<Your Access Key ID>',
    accessKeySecret: '<Your Access Key Secret>',
    bucket: '<Your Bucket>',
    overwrite: true,
}

export default defineConfig({
    plugins: [viteAliOssPlugin(options)]
})
```

最后build的时候，将自动上传
