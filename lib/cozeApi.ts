interface CozeResponse {
  score: number;
  comment: string;
}

export async function callCozeApi(imageUrl: string, score: number, correctAnswer: string): Promise<CozeResponse> {
  try {
    // 检查环境变量
    if (!process.env.COZE_API_KEY || !process.env.COZE_BOT_ID) {
      throw new Error('缺少必要的环境变量 COZE_API_KEY 或 COZE_BOT_ID');
    }

    const requestBody = {
      bot_id: process.env.COZE_BOT_ID,
      user: 'pika',
      stream: false,
      query: `
          url: ${imageUrl},
          fullScore: ${score},
          correctAnswer: ${correctAnswer}
        `
    };

    console.log('Coze API Request:', JSON.stringify(requestBody, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    const response = await fetch('https://api.coze.cn/open_api/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.COZE_API_KEY}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coze API Error:', errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Coze API Response:', JSON.stringify(data, null, 2));
    
    if (data.code !== 0) {
      throw new Error(`API 错误: ${data.msg}`);
    }

    // 查找类型为 "answer" 的消息
    const answerMessage = data.messages?.find(msg => msg.type === 'answer');
    if (!answerMessage?.content) {
      throw new Error('未找到 AI 答案');
    }

    try {
      // 解析答案消息内容为 JSON
      const result = JSON.parse(answerMessage.content);
      return {
        score: Number(result.score),
        comment: result.comment
      };
    } catch (error) {
      console.error('JSON Parse Error:', answerMessage.content);
      throw new Error('AI 响应解析失败');
    }
  } catch (error) {
    console.error('Coze API Error:', error);
    throw error;
  }
} 