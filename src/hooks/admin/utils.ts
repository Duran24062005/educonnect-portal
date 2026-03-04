export const unwrapPayload = <T = any>(responseData: any): T => {
  return (responseData?.data ?? responseData) as T;
};

export const asArray = <T = any>(source: any, keys: string[] = []): T[] => {
  if (!source) return [];

  for (const key of keys) {
    const value = source?.[key];
    if (Array.isArray(value)) return value as T[];
  }

  if (Array.isArray(source?.items)) return source.items as T[];
  if (Array.isArray(source)) return source as T[];
  return [];
};
