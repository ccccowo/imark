import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';

export class AIGradingService {
    private static readonly API_URL = 'https://api.302.ai/v1/chat/completions';
    private static readonly API_KEY = process.env.API_KEY_302;

    static async imageToBase64(imagePath: string): Promise<string> {
        try {
            // 移除开头的斜杠并构建完整路径
            const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
            const publicPath = path.join(process.cwd(), 'public', cleanPath);

            console.log('Reading image from:', publicPath);

            // 检查文件是否存在
            try {
                await fs.access(publicPath);
            } catch (error) {
                console.error('Image file does not exist:', publicPath);
                throw new Error(`Image file not found: ${publicPath}`);
            }

            // 读取图片文件
            const imageBuffer = await fs.readFile(publicPath);
            const base64Image = imageBuffer.toString('base64');
            console.log('Successfully converted image to base64, length:', base64Image.length);

            return base64Image;
        } catch (error: any) {
            console.error('Error converting image to base64:', error);
            throw new Error(`Failed to convert image to base64: ${error.message}`);
        }
    }

    static async gradeAnswer(base64Image: string, questionType: string, correctAnswer: string): Promise<{
        score: number;
        comment: string;
        confidence: number;
    }> {
        try {
            if (!this.API_KEY) {
                throw new Error('API key not found in environment variables');
            }

            console.log('Sending grading request to 302.ai API');
            console.log('Question type:', questionType);
            console.log('Base64 image length:', base64Image.length);

            const prompt = `请帮我批改这道${questionType === 'MULTIPLE_CHOICE' ? '选择题' : '主观题'}。
正确答案是: ${correctAnswer}
请分析图片中学生的答案，并给出以下格式的回复：
{
    "score": 分数(0-100的整数),
    "comment": "评语",
    "confidence": 置信度(0-1的小数)
}`;

            console.log('Sending request with prompt:', prompt);

            const response = await axios.post(
                this.API_URL,
                {
                    model: "gpt-4-plus",
                    messages: [
                        {
                            role: "user",
                            content: `data:image/jpeg;base64,${base64Image}\n${prompt}`
                        }
                    ],
                    temperature: 0.2,
                    max_tokens: 500,
                    top_p: 0.1,
                    n: 1,
                    stream: false
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.API_KEY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                }
            );

            console.log('API Response:', response.data);

            if (!response.data?.choices?.[0]?.message?.content) {
                throw new Error('Empty response from API');
            }

            // 解析API返回的JSON字符串
            const result = JSON.parse(response.data.choices[0].message.content);
            console.log('Parsed result:', result);

            return {
                score: result.score || 0,
                comment: result.comment || '无评语',
                confidence: result.confidence || 0
            };
        } catch (error: any) {
            console.error('Error in gradeAnswer:', error.response?.data || error.message);
            if (error.response?.status === 401) {
                throw new Error('API认证失败，请检查API密钥');
            } else if (error.response?.status === 400) {
                throw new Error('请求格式错误：' + (error.response.data?.message || '未知错误'));
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('请求超时，请稍后重试');
            }
            throw new Error(`批改失败: ${error.response?.data?.message || error.message}`);
        }
    }
} 