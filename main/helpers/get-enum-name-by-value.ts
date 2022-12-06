export default function (value: any, enumerable: any): string {
  const indexOfName = Object.values(enumerable).indexOf(value);
  const key = Object.keys(enumerable)[indexOfName];

  return key;
}
