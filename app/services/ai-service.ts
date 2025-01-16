import axiosInstance from '@/lib/axios';

export class AIGradingService {
    private readonly API_KEY = process.env.API_KEY_302;
    private readonly BASE_URL = 'https://api.302.ai/v1';

    // 将图片转为 base64
    async imageToBase64(imageUrl: string): Promise<string> {
        try {
            const response = await axiosInstance.get(imageUrl, {
                responseType: 'arraybuffer'
            });
            const buffer = Buffer.from(response.data, 'binary');
            return buffer.toString('base64');
        } catch (error) {
            console.error('Image to base64 error:', error);
            throw error;
        }
    }

    // 调用 AI API
    private async callAI(messages: any[]) {
        try {
            const response = await axiosInstance.post(`${this.BASE_URL}/chat/completions`, {
                model: 'gpt-4-vision-preview',
                messages,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }

    // 批改选择题
    async gradeMultipleChoice(imageBase64: string, correctAnswer: string) {
        const messages = [
            {
                role: 'system',
                content: '你是一个专业的试卷批改助手。请分析学生的选择题答案。'
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        url: `data:image/jpeg;base64,${imageBase64}`
                    },
                    {
                        type: 'text',
                        text: `这是一道选择题的答案区域。
                        1. 请识别学生选择了哪个选项（A/B/C/D）
                        2. 正确答案是：${correctAnswer}
                        3. 请给出判断结果和置信度（0-1）`
                    }
                ]
            }
        ];

        const result = await this.callAI(messages);
        return this.parseChoiceResult(result);
    }

    // 批改主观题
    async gradeSubjectiveAnswer(imageBase64: string, questionType: string, fullScore: number) {
        const messages = [
            {
                role: 'system',
                content: '你是一个专业的试卷批改助手。请分析学生的答案并给出评分建议。'
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        url: `data:image/jpeg;base64,${imageBase64}`
                    },
                    {
                        type: 'text',
                        text: `这是一道${questionType}题的答案，满分${fullScore}分。
                        请：
                        1. 识别学生的答案内容
                        2. 评估答案的完整性和准确性
                        3. 给出建议分数
                        4. 提供评语建议
                        5. 给出置信度（0-1）`
                    }
                ]
            }
        ];

        const result = await this.callAI(messages);
        return this.parseSubjectiveResult(result);
    }

    // 解析选择题结果
    private parseChoiceResult(result: any) {
        const content = result.choices[0].message.content;
        
        // 解析 AI 返回的内容
        const studentAnswerMatch = content.match(/选择了.*?([A-D])/i);
        const confidenceMatch = content.match(/置信度.*?(0\.\d+)/);
        const isCorrectMatch = content.match(/判断结果.*?(正确|错误)/);

        return {
            studentAnswer: studentAnswerMatch ? studentAnswerMatch[1] : null,
            isCorrect: isCorrectMatch ? isCorrectMatch[1] === '正确' : null,
            confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5
        };
    }

    // 解析主观题结果
    private parseSubjectiveResult(result: any) {
        const content = result.choices[0].message.content;
        
        // 解析 AI 返回的内容
        const scoreMatch = content.match(/建议分数.*?(\d+)/);
        const confidenceMatch = content.match(/置信度.*?(0\.\d+)/);
        const commentMatch = content.match(/评语建议：([\s\S]*?)(?=\n|$)/);

        return {
            recognizedAnswer: content.split('\n')[0], // 第一行通常是识别的答案
            suggestedScore: scoreMatch ? parseInt(scoreMatch[1]) : 0,
            comment: commentMatch ? commentMatch[1].trim() : '',
            confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5
        };
    }
} 