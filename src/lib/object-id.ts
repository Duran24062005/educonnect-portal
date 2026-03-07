import { createClientError } from './http';

export const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export const isValidObjectId = (value?: string | null) =>
  Boolean(value && OBJECT_ID_REGEX.test(value));

export const assertObjectId = (value: string, field: string) => {
  if (!isValidObjectId(value)) {
    throw createClientError('Invalid request input', [
      {
        location: 'params',
        path: [field],
        message: `${field} must be a valid ObjectId`,
      },
    ]);
  }

  return value;
};
