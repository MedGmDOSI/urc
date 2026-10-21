import {apiFetch} from "./http";

export const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
export const ACCEPTED_IMAGES = "image/png,image/jpeg,image/gif,image/webp";

export async function uploadImage(file: File): Promise<string> {
    const {url} = await apiFetch<{ url: string }>("/api/upload", {
        method: "POST",
        headers: {"Content-Type": file.type},
        body: file,
    });
    return url;
}
