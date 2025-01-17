import axios from 'axios';

export class AIGradingService {
    private static readonly API_URL = 'https://api.302.ai/api/v1/grade';
    private static readonly API_KEY = process.env.API_KEY_302;

    static async imageToBase64(imagePath: string): Promise<string> {
        try {
            // 移除开头的斜杠
            const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
            const fs = require('fs');
            const path = require('path');
            const publicPath = path.join(process.cwd(), 'public', cleanPath);
            
            console.log('Reading image from:', publicPath);
            const imageBuffer = await fs.promises.readFile(publicPath);
            return imageBuffer.toString('base64');
        } catch (error) {
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
            console.log('Sending grading request to 302.ai API');
            console.log('Question type:', questionType);
            console.log('Image size:', base64Image.length);

            const response = await axios.post(
                this.API_URL,
                {
                    image: base64Image,
                    type: questionType === 'MULTIPLE_CHOICE' ? 'choice' : 'subjective',
                    answer: correctAnswer
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.API_KEY}`
                    }
                }
            );

            console.log('API Response:', response.data);
            
            if (!response.data) {
                throw new Error('Empty response from API');
            }

            return {
                score: response.data.score || 0,
                comment: response.data.comment || '无评语',
                confidence: response.data.confidence || 0
            };
        } catch (error) {
            console.error('Error in gradeAnswer:', error.response?.data || error.message);
            throw new Error(`Grading failed: ${error.response?.data?.message || error.message}`);
        }
    }
} 