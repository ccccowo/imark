import React from 'react';
import { Modal, Button, Image } from 'antd';
import { useRouter } from 'next/navigation';

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
            title="查看样卷"
            open={visible}
            width={1200}
            onCancel={onClose}
            footer={[
                <Button 
                    key="reupload" 
                    onClick={() => onReupload(examId)}
                >
                    重新上传样卷
                </Button>,
                <Button
                    key="crop"
                    onClick={() => router.push(`/dashboard/exams/${examId}/crop`)}
                >
                    切割试卷
                </Button>
            ]}
        >
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                <Image
                    src={paperUrl}
                    alt="试卷"
                    style={{ maxWidth: '100%' }}
                />
            </div>
        </Modal>
    );
} 