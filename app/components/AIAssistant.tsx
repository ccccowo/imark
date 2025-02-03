'use client';
import { useState } from 'react';
import { FloatButton, Drawer, Segmented } from 'antd';
import { 
    RobotOutlined, 
    UserOutlined, 
    QuestionCircleOutlined, 
    CodeOutlined,
    BookOutlined,
    DeleteOutlined,
    EditOutlined
} from '@ant-design/icons';
import { Bubble, Sender, Suggestion, useXChat, useXAgent, Welcome, Prompts } from '@ant-design/x';
import type { GetProp } from 'antd';
import type { PromptsProps } from '@ant-design/x';

// 预设的对话示例
const SUGGESTIONS = {
    qa: [
        {
            label: '如何创建一个班级？',
            value: '如何创建一个班级？'
        },
        {
            label: '如何删除班级？',
            value: '如何删除班级？'
        },
        {
            label: '如何修改班级信息？',
            value: '如何修改班级信息？'
        }
    ],
    execute: [
        {
            label: '请帮我创建一个班级，名称叫做2203班，科目为软件体系结构',
            value: '请帮我创建一个班级，名称叫做2203班，科目为软件体系结构'
        },
        {
            label: '创建一个名为3班的数学班级',
            value: '创建一个名为3班的数学班级'
        },
        {
            label: '帮我开设一个新的英语班',
            value: '帮我开设一个新的英语班'
        },
        {
            label: '删除班级',
            value: '删除班级'
        },
        {
            label: '移除1班',
            value: '移除1班'
        },
        {
            label: '帮我删除2班',
            value: '帮我删除2班'
        }
    ]
};

const roles: GetProp<typeof Bubble.List, 'roles'> = {
    assistant: {
        placement: 'start',
        avatar: { icon: <RobotOutlined />, style: { background: '#fde3cf' } },
        typing: { step: 5, interval: 20 },
        style: {
            maxWidth: 600,
        },
    },
    user: {
        placement: 'end',
        avatar: { icon: <UserOutlined />, style: { background: '#87d068' } },
    },
};

const modeConfig = {
    qa: {
        color: '#1677ff',
        icon: <QuestionCircleOutlined />,
        text: '问答模式',
        placeholder: '请输入你的问题...'
    },
    execute: {
        color: '#52c41a',
        icon: <CodeOutlined />,
        text: '执行模式',
        placeholder: '请输入要执行的操作...'
    }
};

const getPromptItems = (mode: 'qa' | 'execute') => {
    const items: Array<{
        key: string;
        icon: React.ReactNode;
        description: string;
        disabled: boolean;
    }> = mode === 'qa' ? [
        {
            key: 'create',
            icon: <BookOutlined style={{ color: '#1677ff' }} />,
            description: '如何创建一个班级？',
            disabled: false
        },
        {
            key: 'delete',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            description: '如何删除班级？',
            disabled: false
        },
        {
            key: 'edit',
            icon: <EditOutlined style={{ color: '#52c41a' }} />,
            description: '如何修改班级信息？',
            disabled: false
        },
    ] : [
        {
            key: 'create-2203',
            icon: <BookOutlined style={{ color: '#1677ff' }} />,
            description: '创建2203班，科目为软件体系结构',
            disabled: false
        },
        {
            key: 'create-math',
            icon: <BookOutlined style={{ color: '#1677ff' }} />,
            description: '创建一个名为3班的数学班级',
            disabled: false
        },
        {
            key: 'delete-1',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            description: '删除1班',
            disabled: false
        },
    ];
    return items;
};

export default function AIAssistant() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'qa' | 'execute'>('qa');
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');

    const [agent] = useXAgent({
        request: async ({ message }, { onSuccess, onError }) => {
            try {
                setLoading(true);
                const res = await fetch('/api/ai-assistant', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: message,
                        mode,
                    }),
                });

                const data = await res.json();
                if (data.error) {
                    onError(new Error(data.error));
                    return;
                }

                onSuccess(data.response);
            } catch (error: any) {
                console.error('请求失败:', error);
                onError(error);
            } finally {
                setLoading(false);
            }
        },
    });

    const { messages, onRequest } = useXChat({
        agent,
        requestPlaceholder: '正在思考中...',
        requestFallback: '抱歉，请求失败了，请稍后重试',
    });

    const handleSend = (value: string) => {
        onRequest(value);
        setContent('');
    };

    const handlePromptSelect = (key: string) => {
        const items = getPromptItems(mode);
        const selectedItem = items.find(item => item.key === key);
        if (selectedItem) {
            setContent(selectedItem.description);
        }
    };

    return (
        <>
            <FloatButton
                icon={<RobotOutlined />}
                type="primary"
                style={{ right: 24, bottom: 24 }}
                onClick={() => setOpen(true)}
            />
            
            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                placement="right"
                width={420}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>AI助手</span>
                        <span style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: modeConfig[mode].color,
                            color: '#fff'
                        }}>
                            {modeConfig[mode].text}
                        </span>
                    </div>
                }
                bodyStyle={{ padding: 0 }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                        {messages.length === 0 ? (
                            <>
                                <div style={{ padding: '20px 0' }}>
                                    <Welcome
                                        icon={<RobotOutlined style={{ fontSize: 28, color: '#1677ff' }} />}
                                        title="你好，我是AI助手"
                                        description={
                                            <div style={{ color: '#666' }}>
                                                <p>我可以帮你：</p>
                                                <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                                                    <li>回答关于API的问题（问答模式）</li>
                                                    <li>执行班级管理操作（执行模式）</li>
                                                </ul>
                                                <p>请选择合适的模式开始对话吧！</p>
                                            </div>
                                        }
                                        variant="filled"
                                        styles={{
                                            icon: { background: '#f0f5ff', padding: 16, borderRadius: '50%' },
                                            title: { fontSize: 20, marginTop: 16 },
                                            description: { marginTop: 8 }
                                        }}
                                    />
                                </div>
                                <div style={{ padding: '0 20px' }}>
                                    <Prompts
                                        title={mode === 'qa' ? "🤔 你可能想问：" : "💡 快捷操作："}
                                        items={getPromptItems(mode)}
                                        vertical
                                        onSelect={(event: React.MouseEvent<HTMLDivElement>) => {
                                            const key = (event.currentTarget as HTMLDivElement).getAttribute('data-key');
                                            if (key) {
                                                handlePromptSelect(key);
                                            }
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <Bubble.List
                                roles={roles}
                                items={messages.map(({ id, message, status }) => ({
                                    key: id,
                                    loading: status === 'loading',
                                    role: status === 'local' ? 'user' : 'assistant',
                                    content: message,
                                }))}
                            />
                        )}
                    </div>
                    
                    <div style={{ 
                        borderTop: '1px solid #f0f0f0', 
                        background: '#fff',
                        padding: '16px 16px 24px'
                    }}>
                        <div style={{ marginBottom: 16 }}>
                            <Suggestion
                                items={SUGGESTIONS[mode]}
                                onSelect={handleSend}
                            />
                        </div>
                        <div style={{
                            background: '#f5f5f5',
                            borderRadius: '8px',
                            padding: '8px'
                        }}>
                            <div style={{
                                marginBottom: 8,
                                textAlign: 'center'
                            }}>
                                <Segmented
                                    value={mode}
                                    onChange={value => setMode(value as 'qa' | 'execute')}
                                    options={[
                                        {
                                            label: (
                                                <div style={{ 
                                                    padding: '4px 8px',
                                                    color: mode === 'qa' ? modeConfig.qa.color : undefined
                                                }}>
                                                    {modeConfig.qa.icon}
                                                    <span style={{ marginLeft: 4 }}>{modeConfig.qa.text}</span>
                                                </div>
                                            ),
                                            value: 'qa'
                                        },
                                        {
                                            label: (
                                                <div style={{ 
                                                    padding: '4px 8px',
                                                    color: mode === 'execute' ? modeConfig.execute.color : undefined
                                                }}>
                                                    {modeConfig.execute.icon}
                                                    <span style={{ marginLeft: 4 }}>{modeConfig.execute.text}</span>
                                                </div>
                                            ),
                                            value: 'execute'
                                        }
                                    ]}
                                    style={{
                                        background: '#fff',
                                    }}
                                />
                            </div>
                            <Sender
                                loading={agent.isRequesting()}
                                value={content}
                                onChange={setContent}
                                onSubmit={handleSend}
                                placeholder={modeConfig[mode].placeholder}
                                style={{
                                    '--x-sender-bg': '#fff',
                                    '--x-sender-border': 'none',
                                    '--x-sender-shadow': 'none',
                                    '--x-sender-send-btn-bg': modeConfig[mode].color,
                                    '--x-sender-send-btn-hover-bg': modeConfig[mode].color,
                                } as any}
                            />
                        </div>
                    </div>
                </div>
            </Drawer>
        </>
    );
}