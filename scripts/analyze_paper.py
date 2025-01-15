from paddleocr import PaddleOCR
import sys
import json

def analyze_paper(image_path):
    ocr = PaddleOCR(use_angle_cls=True, lang="ch")
    result = ocr.ocr(image_path, cls=True)
    
    # 分析版面结构，识别题目区域
    questions = []
    for idx, line in enumerate(result):
        box = line[0]
        text = line[1][0]
        if text.startswith(('1.', '2.', '3.')):  # 识别题号
            questions.append({
                'orderNum': idx + 1,
                'coordinates': {
                    'x1': box[0][0],
                    'y1': box[0][1],
                    'x2': box[2][0],
                    'y2': box[2][1]
                }
            })
    
    print(json.dumps(questions))

if __name__ == "__main__":
    image_path = sys.argv[1]
    analyze_paper(image_path) 