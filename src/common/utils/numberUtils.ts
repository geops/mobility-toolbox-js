export const asFloat = (
  value: number | string | undefined,
): number | undefined => {
  let floatValue: number | undefined;
  if (typeof value === "string") {
    floatValue = parseFloat(value);
  }
  if (typeof value === "number") {
    floatValue = value;
  }

  if (Number.isFinite(floatValue)) {
    return floatValue;
  }
  return undefined;
};

export const asInteger = (
  value: number | string | undefined,
): number | undefined => {
  let intValue: number | undefined;
  if (typeof value === "string") {
    intValue = parseInt(value, 10);
  }
  if (typeof value === "number") {
    intValue = value;
  }

  if (Number.isInteger(intValue)) {
    return intValue;
  }
  return undefined;
};

export const asFloatArray = (
  value?: string,
  separator = ",",
): (number | undefined)[] | undefined => {
  return (
    value?.split(separator).map((n: string) => {
      return asFloat(n);
    }) ?? undefined
  );
};

export const asIntegerArray = (
  value?: string,
  separator = ",",
): (number | undefined)[] | undefined => {
  return (
    value?.split(separator).map((n: string) => {
      return asInteger(n);
    }) ?? undefined
  );
};
