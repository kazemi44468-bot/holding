import {defineConfig} from "vite";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const root=fileURLToPath(new URL("..",import.meta.url));
export default defineConfig({
 root,
 base:"./",
 server:{host:"127.0.0.1",port:5174,strictPort:true},
 build:{
  outDir:resolve(root,"local-data/dist-control-center"),
  emptyOutDir:true,
  rollupOptions:{input:{controlCenter:resolve(root,"control-center.html")}}
 }
});
