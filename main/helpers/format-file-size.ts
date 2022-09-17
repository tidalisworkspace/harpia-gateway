export default function formatFileSize(filesize: number) {
    if (!filesize) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(filesize) / Math.log(k));

    return parseFloat((filesize / Math.pow(k, i)).toFixed(0)) + " " + sizes[i];
}