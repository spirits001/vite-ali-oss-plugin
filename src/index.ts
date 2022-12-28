import path from "path";
import glob from "glob";
import OSS from "ali-oss";
import { ConfigEnv, normalizePath, UserConfig } from "vite";

interface Option {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  basePath?: string;
  enabled?: boolean;
  overwrite?: boolean;
  ignore?: string;
  headers?: any;
  test?: string | any;
}

interface PluginRes {
  name: string;
  enforce: "pre" | "post" | undefined;
  apply: "build" | "serve" | ((this: void, config: UserConfig, env: ConfigEnv) => boolean) | undefined;
  configResolved(config: any): void;
  closeBundle(): Promise<void>;
}

export default function viteAliOssPlugin<PluginRes>(options: Option) {
  let basePath = "/";
  let buildConfig: any = {};

  if (options.enabled !== void 0 && !options.enabled) {
    return;
  }

  return <PluginRes>{
    name: "vite-ali-oss-plugin",
    enforce: "post",
    apply: "build",
    configResolved(config: any) {
      basePath = config.base;
      buildConfig = config.build;
    },
    async closeBundle() {
      const outDirPath = normalizePath(path.resolve(normalizePath(buildConfig.outDir)));

      const createOssOption = Object.assign({}, options);
      delete createOssOption.overwrite;
      delete createOssOption.ignore;
      delete createOssOption.headers;
      delete createOssOption.test;
      delete createOssOption.enabled;

      const client = new OSS(createOssOption);

      const files = glob.sync(outDirPath + "/**/*", {
        strict: true,
        nodir: true,
        dot: true,
        ignore: options.ignore ? options.ignore : "",
      });
      console.log("");
      console.log("ali oss upload start");
      console.log("");

      const startTime = new Date().getTime();
      if (options.basePath) {
        basePath = options.basePath;
      }
      basePath = (basePath || "").replace(/\/$/, "");
      console.log(basePath);
      if (options.overwrite) {
        const fileList = await client.listV2(
          {
            "max-keys": "1000",
            prefix: basePath ? `${basePath}/` : "",
          },
          {}
        );
        let objs: string[] = [];
        fileList.objects.forEach((ele) => {
          objs.push(ele.name);
        });
        if (objs.length) {
          await client.deleteMulti(objs, { quiet: true });
          console.log("");
          console.log(`delete complete!`);
          console.log("");
        }
      }

      console.log(basePath);
      for (const fileFullPath of files) {
        const filePath = fileFullPath.split(outDirPath)[1];

        const ossFilePath = basePath + filePath;
        const completePath = `${options.region}: ${options.bucket}: ${ossFilePath}`;

        const output = `${buildConfig.outDir + filePath} => ${completePath}`;
        if (options.test) {
          console.log(`test upload path: ${output}`);
          continue;
        }

        if (options.overwrite) {
          await client.put(ossFilePath, fileFullPath, {
            headers: options.headers || {},
          });
          console.log(`upload complete: ${output}`);
        } else {
          try {
            await client.head(ossFilePath);
            console.log(`files exists: ${output}`);
          } catch (err: any) {
            if (err.code === "NoSuchKey") {
              await client.put(ossFilePath, fileFullPath, {
                headers: Object.assign(options.headers || {}, {
                  "x-oss-forbid-overwrite": true,
                }),
              });
              console.log(`upload complete: ${output}`);
            } else {
              throw new Error(err);
            }
          }
        }
      }
      const duration = (new Date().getTime() - startTime) / 1000;

      console.log("");
      console.log(`ali oss upload complete ^_^, cost ${duration.toFixed(2)}s`);
      console.log("");
    },
  };
}
