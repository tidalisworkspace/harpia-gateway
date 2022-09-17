export const isDev = process.env.NODE_ENV === "development";
export const isProd = process.env.NODE_ENV === "production";
export const envname = process.env.NODE_ENV || "development";
export const isLinux = process.platform === "linux";
export const isWindows = process.platform === "win32"
export const port = process.argv[2];
export const windowIndex = isProd
  ? "app://./home.html"
  : `http://localhost:${port}/home`;
