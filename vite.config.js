import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// 빌드 결과를 단일 HTML 파일(dist/index.html)로 만든다.
// 폰트(woff2)까지 base64로 인라인되므로 file:// 로 열어도 완전 오프라인 동작.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100000000,
  },
});
