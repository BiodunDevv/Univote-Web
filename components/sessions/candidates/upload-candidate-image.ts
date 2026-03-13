import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function uploadCandidateImage(file: File) {
  return uploadImageToCloudinary(file, "univote/candidates");
}
