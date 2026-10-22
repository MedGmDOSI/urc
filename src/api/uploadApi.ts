import {apiFetch} from "./http";

export const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
export const ACCEPTED_IMAGES = "image/png,image/jpeg,image/gif,image/webp";

async function upload(file: Blob): Promise<string> {
    const {url} = await apiFetch<{ url: string }>("/api/upload", {
        method: "POST",
        headers: {"Content-Type": file.type},
        body: file,
    });
    return url;
}

export async function uploadImage(file: File): Promise<string> {
    return upload(file);
}

/** Voice message recorded by MediaRecorder (audio/webm, audio/mp4 on Safari...) */
export async function uploadAudio(recording: Blob): Promise<string> {
    return upload(recording);
}
