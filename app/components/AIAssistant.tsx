'use client';

import { useState } from 'react';
import { Card, Input, Button, Radio, Space, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';

export default function AIAssistant() {
    const [mode, setMode] = useState<'qa' | 'execute'>('qa');
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!prompt.trim()) {
            message.warning('请输入内容');
            return;
        }

        try {
            setLoading(true);
            console.log('发送请求:', { prompt, mode });
            
            const res = await fetch('/api/ai-assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    mode,
                }),
            });

            console.log('响应状态:', res.status);
            const data = await res.json();
            console.log('响应数据:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }

            setResponse(data.response);
            if (mode === 'execute') {
                message.success('执行成功');
            }
        } catch (error: any) {
            console.error('请求失败:', error);
            message.error(error.message || '请求失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="AI助手" className="max-w-2xl mx-auto mt-8">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Radio.Group 
                    value={mode} 
                    onChange={(e) => setMode(e.target.value)}
                    buttonStyle="solid"
                >
                    <Radio.Button value="qa">问答模式</Radio.Button>
                    <Radio.Button value="execute">执行模式</Radio.Button>
                </Radio.Group>

                <div className="flex gap-2">
                    <Input.TextArea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={mode === 'qa' ? "请输入你的问题..." : "请输入要执行的操作..."}
                        autoSize={{ minRows: 2, maxRows: 6 }}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        loading={loading}
                    >
                        发送
                    </Button>
                </div>

                {response && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
                    </div>
                )}
            </Space>
        </Card>
    );
} 