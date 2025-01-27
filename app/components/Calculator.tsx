'use client';

import { useState } from 'react';
import { Button, Input, Card, message } from 'antd';

export default function Calculator() {
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!num1 || !num2) {
      message.error('请输入两个数字');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ num1, num2 }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.result);
      message.success('计算成功！');
    } catch (error: any) {
      message.error(error.message || '计算失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Python计算器" className="max-w-md mx-auto mt-8">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">第一个数字</label>
          <Input
            type="number"
            value={num1}
            onChange={(e) => setNum1(e.target.value)}
            placeholder="请输入第一个数字"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">第二个数字</label>
          <Input
            type="number"
            value={num2}
            onChange={(e) => setNum2(e.target.value)}
            placeholder="请输入第二个数字"
          />
        </div>

        <Button
          type="primary"
          onClick={handleCalculate}
          loading={loading}
          block
        >
          计算
        </Button>

        {result !== null && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-center text-lg">
              结果: <span className="font-bold text-blue-600">{result}</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
} 