export default function range(size, startAt = 0) {
  return Array.from(Array(size).keys()).map((i) => i + startAt);
}
