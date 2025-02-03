'use client';
import { useState, useEffect, useCallback } from 'react';
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
import { Bubble, Sender, Suggestion, Welcome, Prompts } from '@ant-design/x';
import type { GetProp } from 'antd';
import axiosInstance from '@/lib/axios';

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

type PromptItem = {
    key: string;
    icon: React.ReactNode;
    description: string;
    disabled: boolean;
};

export default function AIAssistant() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'qa' | 'execute'>('qa');
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [messages, setMessages] = useState<Array<{
        id: string;
        message: string;
        status: 'loading' | 'success' | 'error' | 'local';
    }>>([]);

    // 使用useCallback处理请求
    const handleRequest = useCallback(async (message: string) => {
        // 在try块外声明loadingMessageId
        const loadingMessageId = (Date.now() + 1).toString();
        
        try {
            setLoading(true);
            // 添加用户消息
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                message,
                status: 'local'
            }]);

            // 添加一个loading状态的消息
            setMessages(prev => [...prev, {
                id: loadingMessageId,
                message: '正在处理...',
                status: 'loading'
            }]);

            // 发送请求
            const res = await axiosInstance.post('/api/ai-assistant', {
                prompt: message,
                mode,
            });

            // 更新消息列表，移除loading消息并添加响应消息
            setMessages(prev => {
                const filteredMessages = prev.filter(msg => msg.id !== loadingMessageId);
                return [...filteredMessages, {
                    id: Date.now().toString(),
                    message: res.data.error || res.data.response || '操作成功',
                    status: res.data.error ? 'error' : 'success'
                }];
            });
        } catch (error: any) {
            console.error('请求失败:', error);
            setMessages(prev => {
                const filteredMessages = prev.filter(msg => msg.id !== loadingMessageId);
                return [...filteredMessages, {
                    id: Date.now().toString(),
                    message: error.message || '请求失败',
                    status: 'error'
                }];
            });
        } finally {
            setLoading(false);
        }
    }, [mode]);

    // 当模式改变时，清空消息历史
    const handleModeChange = (value: 'qa' | 'execute') => {
        setMode(value);
        setMessages([]); // 清空消息
    };

    const handleSend = useCallback((value: string) => {
        handleRequest(value);
        setContent('');
    }, [handleRequest]);

    const handlePromptSelect = useCallback((item: PromptItem | string) => {
        if (typeof item === 'string') {
            const items = getPromptItems(mode);
            const selectedItem = items.find(i => i.key === item);
            if (selectedItem) {
                setContent(selectedItem.description);
                // 自动聚焦输入框
                const senderInput = document.querySelector('.x-sender-input') as HTMLTextAreaElement;
                if (senderInput) {
                    senderInput.focus();
                }
            }
        } else {
            setContent(item.description);
            // 自动聚焦输入框
            const senderInput = document.querySelector('.x-sender-input') as HTMLTextAreaElement;
            if (senderInput) {
                senderInput.focus();
            }
        }
    }, [mode]);

    return (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 1000 }}>
            <FloatButton
                icon={<RobotOutlined />}
                type="primary"
                style={{ right: 24, bottom: 24, zIndex: 1001 }}
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
                style={{ position: 'absolute' }}
                mask={false}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                        {messages.length === 0 && (
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
                        )}
                        
                        <div style={{ 
                            padding: '16px', 
                            background: '#f9f9f9', 
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ marginBottom: 8 }}>
                                {mode === 'qa' ? "🤔 你可能想问：" : "💡 快捷操作："}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {getPromptItems(mode).map(item => (
                                    <div
                                        key={item.key}
                                        onClick={() => {
                                            setContent(item.description);
                                            const senderInput = document.querySelector('.x-sender-input') as HTMLTextAreaElement;
                                            if (senderInput) {
                                                senderInput.focus();
                                            }
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '8px 12px',
                                            background: '#fff',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f0f0f0';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#fff';
                                        }}
                                    >
                                        {item.icon}
                                        <span>{item.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {messages.length > 0 && (
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
                                    onChange={value => handleModeChange(value as 'qa' | 'execute')}
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
                                loading={loading}
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
        </div>
    );
}