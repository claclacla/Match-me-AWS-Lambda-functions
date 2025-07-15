import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client(); // Update to your region

const BUCKET_NAME = "breakice";

export async function uploadUserImage({ ownerId, file, contentType }: { ownerId: string, file: Buffer<ArrayBuffer>, contentType: string }): Promise<string> {
    const extension = contentType === 'image/png' ? 'png' : 'jpg';
    const filePath = `users/avatars/${ownerId}.${extension}`;

    console.log("User file path: ", filePath);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filePath,
        Body: file,
        ContentType: contentType,
        //ACL: "public-read" // or use signed URLs if you want it private
    });

    await s3.send(command);

    return `https://${BUCKET_NAME}.s3.eu-west-1.amazonaws.com/${filePath}`;
}