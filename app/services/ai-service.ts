import axios from "axios";
import path from "path";
import fs from "fs/promises";

export class AIGradingService {
  private static readonly API_URL = "https://api.302.ai/v1/chat/completions";
  private static readonly API_KEY = process.env.API_KEY_302;
  private static readonly TIMEOUT = 60000;

  static async imageToBase64(imagePath: string): Promise<string> {
    try {
      // 移除开头的斜杠并构建完整路径
      const cleanPath = imagePath.startsWith("/")
        ? imagePath.slice(1)
        : imagePath;
      const publicPath = path.join(process.cwd(), "public", cleanPath);

      console.log("Reading image from:", publicPath);

      // 检查文件是否存在
      try {
        await fs.access(publicPath);
      } catch (error) {
        console.error("Image file does not exist:", publicPath);
        throw new Error(`Image file not found: ${publicPath}`);
      }

      // 读取图片文件
      const imageBuffer = await fs.readFile(publicPath);
      const base64Image = imageBuffer.toString("base64");
      console.log(
        "Successfully converted image to base64, length:",
        base64Image.length
      );

      return base64Image;
    } catch (error: any) {
      console.error("Error converting image to base64:", error);
      throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
  }

  static async gradeAnswer(
    base64Image: string,
    questionType: string,
    correctAnswer: string
  ): Promise<{
    score: number;
    comment: string;
    confidence: number;
  }> {
    try {
      if (!this.API_KEY) {
        throw new Error("API key not found in environment variables");
      }

      console.log("Sending grading request to 302.ai API");
      console.log("Question type:", questionType);
      console.log("Base64 image length:", base64Image.length);

      const prompt = `请帮我批改这道主观题。
        正确答案是: ${correctAnswer}
        请分析图片中学生的答案，并严格按照以下 JSON 格式返回结果（不要返回其他任何内容）：
        {
            "score": <0-100的整数>,
            "comment": "<评语>",
            "confidence": <0-1的小数>
        }`;

      console.log("Sending request with prompt:", prompt);

      // 增加超时时间到 60 秒
      const timeout = 60000;

      // 调用模型API
      const response = await axios.post(
        this.API_URL,
        // {
        //     "model": "gpt-4o",
        //     "stream": false,
        //     "messages": [
        //       {
        //         "role": "user",
        //         "content": [
        //           {
        //             "type": "text",
        //             "text": "这张图片有什么"
        //           },
        //           {
        //             "type": "image_url",
        //             "image_url": {
        //               "url": 'https://cn.bing.com/images/search?view=detailV2&ccid=VzhOTC3S&id=E9DB385D5FEDB9095FC5FCAB1BED3E3EBD7E2FBB&thid=OIP.VzhOTC3SVqdVV48AhF5grwHaFS&mediaurl=https%3a%2f%2fts1.cn.mm.bing.net%2fth%2fid%2fR-C.57384e4c2dd256a755578f00845e60af%3frik%3duy9%252bvT4%252b7Rur%252fA%26riu%3dhttp%253a%252f%252fimg06file.tooopen.com%252fimages%252f20171224%252ftooopen_sy_231021357463.jpg%26ehk%3dwhpCWn%252byPBvtGi1%252boY1sEBq%252frEUaP6w2N5bnBQsLWdo%253d%26risl%3d%26pid%3dImgRaw%26r%3d0&exph=732&expw=1024&q=%e5%9b%be%e7%89%87&simid=608052299326114867&FORM=IRPRST&ck=89C5C3561E8CC288E7F093201B6D62C5&selectedIndex=0&itb=0'
        //             }
        //           }
        //         ]
        //       }
        //     ]
        //   },
        {
          model: "gpt-4-plus",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image,
                  },
                },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 500,
          top_p: 0.1,
          n: 1,
          stream: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.API_KEY}`,
            Accept: "application/json",
          },
          timeout: timeout,
        }
      );

      console.log("API Response:", response.data);

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error("Empty response from API");
      }

      // 添加响应验证
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error("AI 响应内容为空");
      }

      try {
        // 尝试解析 JSON
        const result = JSON.parse(content);

        // 验证返回的数据格式
        if (!this.isValidGradingResult(result)) {
          throw new Error("AI 返回的数据格式不正确");
        }

        return result;
      } catch (parseError: any) {
        console.error("AI 响应解析失败:", content);
        throw new Error(`JSON 解析错误: ${parseError.message}`);
      }
    } catch (error: any) {
      console.error("Error in gradeAnswer:", error);

      // 改进错误处理
      if (error.code === "ECONNABORTED") {
        throw new Error(
          `请求超时（60秒），请稍后重试。如果问题持续存在，请联系管理员。`
        );
      }

      if (error.response) {
        // 服务器返回了错误状态码
        switch (error.response.status) {
          case 401:
            throw new Error("API认证失败，请检查API密钥");
          case 400:
            throw new Error(
              "请求格式错误：" + (error.response.data?.message || "未知错误")
            );
          case 429:
            throw new Error("请求过于频繁，请稍后重试");
          case 500:
          case 502:
          case 503:
          case 504:
            throw new Error("AI服务暂时不可用，请稍后重试");
          default:
            throw new Error(
              `服务器错误 (${error.response.status}): ${
                error.response.data?.message || "未知错误"
              }`
            );
        }
      }

      if (error.request) {
        // 请求已发出，但没有收到响应
        throw new Error("无法连接到AI服务，请检查网络连接");
      }

      // 其他错误
      throw new Error(`批改失败: ${error.message}`);
    }
  }

  // 添加验证函数
  private static isValidGradingResult(result: any): result is {
    score: number;
    comment: string;
    confidence: number;
  } {
    return (
      typeof result === "object" &&
      typeof result.score === "number" &&
      typeof result.comment === "string" &&
      typeof result.confidence === "number" &&
      result.score >= 0 &&
      result.score <= 100 &&
      result.confidence >= 0 &&
      result.confidence <= 1
    );
  }
}
