export const CLIENT_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const CLIENT_PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const CLIENT_PHOTO_TYPES = new Set(CLIENT_PHOTO_ACCEPT.split(","));

export type ClientPhotoValidationError = "invalid-type" | "too-large";

export function validateClientPhoto(
  file: Pick<File, "size" | "type">,
): ClientPhotoValidationError | null {
  if (!CLIENT_PHOTO_TYPES.has(file.type)) return "invalid-type";
  if (file.size > CLIENT_PHOTO_MAX_SIZE_BYTES) return "too-large";
  return null;
}
