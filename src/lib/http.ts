export interface ApiErrorDetail {
  location?: string;
  path?: Array<string | number>;
  message?: string;
}

export interface ApiErrorShape {
  status?: string;
  message: string;
  details?: ApiErrorDetail[];
}

export const extractApiError = (error: any): ApiErrorShape => {
  const data = error?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : undefined;

  return {
    status: data?.status,
    message:
      data?.message ||
      error?.message ||
      'Unexpected request error',
    details,
  };
};

export const getDetailMessages = (error: any): string[] => {
  const { details } = extractApiError(error);
  return (details ?? [])
    .map((detail) => detail?.message)
    .filter((message): message is string => Boolean(message));
};

export const mapErrorDetailsByField = (error: any) => {
  const { details } = extractApiError(error);
  return (details ?? []).reduce<Record<string, string>>((acc, detail) => {
    const field = detail?.path?.[detail.path.length - 1];
    if (typeof field === 'string' && detail.message) {
      acc[field] = detail.message;
    }
    return acc;
  }, {});
};

export const createClientError = (
  message: string,
  details?: ApiErrorDetail[],
  status = 400
) => {
  const error: any = new Error(message);
  error.response = {
    status,
    data: {
      status: 'fail',
      message,
      details,
    },
  };
  return error;
};
