// 查看样卷界面
import React from 'react';
import { Modal, Button, Image, Space } from 'antd';
import { useRouter } from 'next/navigation';
import { FileImageOutlined, ScissorOutlined, UploadOutlined } from '@ant-design/icons';

interface Props {
    visible: boolean;
    paperUrl: string;
    examId: string;
    onClose: () => void;
    onReupload: (examId: string) => void;
}

export function ViewPaperModal({ visible, paperUrl, examId, onClose, onReupload }: Props) {
    const router = useRouter();

    return (
        <Modal
            title={
                <div className="flex items-center text-lg">
                    <FileImageOutlined className="mr-2 text-blue-500" />
                    查看样卷
                </div>
            }
            open={visible}
            width={1200}
            onCancel={onClose}
            footer={
                <Space size="middle">
                    <Button 
                        onClick={() => onReupload(examId)}
                        icon={<UploadOutlined />}
                        className="hover:text-blue-500"
                    >
                        重新上传样卷
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => router.push(`/dashboard/exams/${examId}/crop`)}
                        icon={<ScissorOutlined />}
                        style={{ backgroundColor: '#1677ff' }}
                    >
                        切割试卷
                    </Button>
                </Space>
            }
            className="paper-modal"
        >
            <div className="flex justify-center max-h-[70vh] overflow-auto">
                <Image
                    src={paperUrl}
                    alt="试卷"
                    style={{ maxWidth: '100%' }}
                    placeholder={
                        <div className="text-center py-8 text-gray-400">
                            <FileImageOutlined style={{ fontSize: '32px' }} />
                            <div className="mt-2">加载试卷中...</div>
                        </div>
                    }
                />
            </div>
        </Modal>
    );
} 