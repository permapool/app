export const withCommas = (
  value: number,
  decimals = 2
): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const withCommasInt = (value: number): string => {
  return new Intl.NumberFormat("en-US").format(value);
};
