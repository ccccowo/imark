import COS from 'cos-nodejs-sdk-v5';

// 创建 COS 实例
const cos = new COS({
    SecretId: process.env.TENCENT_COS_SECRET_ID!,
    SecretKey: process.env.TENCENT_COS_SECRET_KEY!,
});

const Bucket = process.env.TENCENT_COS_BUCKET!;
const Region = process.env.TENCENT_COS_REGION!;

export async function uploadToCOS(file: Buffer, fileName: string): Promise<string> {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeType = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    }[ext || 'jpg'] || 'image/jpeg';

    return new Promise((resolve, reject) => {
        cos.putObject({
            Bucket,
            Region,
            Key: `imark/${fileName}`,
            Body: file,
            ContentType: mimeType,
            ACL: 'public-read',
            ContentDisposition: 'inline',
        }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            const url = `https://${Bucket}.cos.${Region}.myqcloud.com/imark/${fileName}`;
            console.log("@@@@@@cosUrl", url);
            resolve(url);
        });
    });
}
// 生成唯一的文件名
export function generateUniqueFileName(originalName: string): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    const ext = originalName.split('.').pop();
    return `${timestamp}_${random}.${ext}`;
} 