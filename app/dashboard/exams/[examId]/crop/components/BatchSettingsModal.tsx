import { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Select, Button, Space, message, Progress, Alert } from 'antd';

interface BatchSettingsModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (settings: QuestionSettings[]) => void;
  questionCount: number;
}

interface QuestionSettings {
  startNum: number;
  endNum: number;
  score: number;
  type: string;
}

const QUESTION_TYPES = [
  { label: '单选题', value: 'SINGLE_CHOICE' },
  { label: '多选题', value: 'MULTIPLE_CHOICE' },
  { label: '填空题', value: 'FILL_BLANK' },
  { label: '判断题', value: 'TRUE_FALSE' },
  { label: '简答题', value: 'SHORT_ANSWER' },
];

export default function BatchSettingsModal({
  visible,
  onCancel,
  onConfirm,
  questionCount,
}: BatchSettingsModalProps) {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<QuestionSettings[]>([]);
  const [availableRange, setAvailableRange] = useState<number[]>([]);

  // 更新可用范围
  const updateAvailableRange = () => {
    const setQuestions = new Set<number>();
    settings.forEach(({ startNum, endNum }) => {
      for (let i = startNum; i <= endNum; i++) {
        setQuestions.add(i);
      }
    });

    const available: number[] = [];
    for (let i = 1; i <= questionCount; i++) {
      if (!setQuestions.has(i)) {
        available.push(i);
      }
    }
    setAvailableRange(available);

    // 如果有可用题号，自动设置第一个可用题号
    if (available.length > 0) {
      const firstAvailable = available[0];
      form.setFieldsValue({
        startNum: firstAvailable,
        endNum: firstAvailable
      });
    }
  };

  // 监听设置变化和弹窗显示状态
  useEffect(() => {
    if (visible) {
      updateAvailableRange();
    } else {
      setSettings([]);
      form.resetFields();
    }
  }, [visible, questionCount]);

  // 监听设置变化更新可用范围
  useEffect(() => {
    updateAvailableRange();
  }, [settings]);

  const handleAdd = () => {
    form.validateFields().then(values => {
      if (values.startNum > values.endNum) {
        message.error('起始题号不能大于结束题号');
        return;
      }

      // 验证范围是否可用
      for (let i = values.startNum; i <= values.endNum; i++) {
        if (!availableRange.includes(i)) {
          message.error(`第 ${i} 题已被设置，请选择未设置的题号范围`);
          return;
        }
      }

      setSettings([...settings, values]);
      form.resetFields(['score', 'type']); // 只重置分数和类型
    });
  };

  const handleConfirm = () => {
    // 检查是否覆盖了所有题目
    const coveredQuestions = new Set<number>();
    settings.forEach(({ startNum, endNum }) => {
      for (let i = startNum; i <= endNum; i++) {
        coveredQuestions.add(i);
      }
    });

    if (coveredQuestions.size !== questionCount) {
      message.error('请确保设置了所有题目的分数和类型');
      return;
    }

    onConfirm(settings);
  };

  // 计算已设置的题目数量和进度
  const getProgress = () => {
    const coveredQuestions = new Set<number>();
    settings.forEach(({ startNum, endNum }) => {
      for (let i = startNum; i <= endNum; i++) {
        coveredQuestions.add(i);
      }
    });
    return {
      count: coveredQuestions.size,
      percentage: Math.round((coveredQuestions.size / questionCount) * 100)
    };
  };

  const { count, percentage } = getProgress();

  // 添加表单联动逻辑
  const handleStartNumChange = (value: number) => {
    const endNum = form.getFieldValue('endNum');
    if (endNum && value > endNum) {
      form.setFieldsValue({ endNum: value });
    }
  };

  const handleEndNumChange = (value: number) => {
    const startNum = form.getFieldValue('startNum');
    if (startNum && value < startNum) {
      form.setFieldsValue({ startNum: value });
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">批量设置题目分数和类型</span>
          <span className="text-sm text-gray-500">
            共 {questionCount} 题
          </span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button 
          key="confirm" 
          onClick={handleConfirm}
          disabled={settings.length === 0 || percentage !== 100}
        >
          确认设置
        </Button>
      ]}
      width={700}
      className="batch-settings-modal"
    >
      {/* 进度显示 */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="font-medium">设置进度</span>
          <span className="text-blue-600">
            {count} / {questionCount} 题
          </span>
        </div>
        <Progress 
          percent={percentage} 
          status={percentage === 100 ? "success" : "active"}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
      </div>

      {/* 批量设置表单 */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <Form 
          form={form} 
          layout="horizontal"
          className="grid grid-cols-2 gap-4"
        >
          <Form.Item
            name="startNum"
            label="起始题号"
            rules={[{ required: true }]}
          >
            <InputNumber 
              min={Math.min(...availableRange, questionCount)}
              max={Math.max(...availableRange, 1)}
              className="w-full"
              placeholder={`1-${questionCount}`}
              disabled={availableRange.length === 0}
            />
          </Form.Item>
          <Form.Item
            name="endNum"
            label="结束题号"
            rules={[{ required: true }]}
          >
            <InputNumber 
              min={Math.min(...availableRange, questionCount)}
              max={Math.max(...availableRange, 1)}
              className="w-full"
              placeholder={`1-${questionCount}`}
              disabled={availableRange.length === 0}
            />
          </Form.Item>
          <Form.Item
            name="score"
            label="每题分数"
            rules={[{ required: true }]}
          >
            <InputNumber 
              min={0.5} 
              step={0.5}
              className="w-full"
              placeholder="请输入分数"
            />
          </Form.Item>
          <Form.Item
            name="type"
            label="题目类型"
            rules={[{ required: true }]}
          >
            <Select
              options={QUESTION_TYPES}
              placeholder="请选择题型"
              className="w-full"
            />
          </Form.Item>
        </Form>
        <Button 
          type="primary" 
          onClick={handleAdd}
          className="w-full mt-2"
          disabled={availableRange.length === 0}
        >
          添加设置
        </Button>
      </div>

      {/* 已设置列表 */}
      {settings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200 font-medium">
            已设置范围
          </div>
          <div className="max-h-48 overflow-y-auto">
            {settings.map((setting, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50"
              >
                <span>
                  第 {setting.startNum}-{setting.endNum} 题：
                  <span className="text-blue-600 mx-1">{setting.score}</span>分/题，
                  <span className="text-green-600">
                    {QUESTION_TYPES.find(t => t.value === setting.type)?.label}
                  </span>
                </span>
                <Button 
                  type="text" 
                  danger 
                  size="small"
                  onClick={() => setSettings(settings.filter((_, i) => i !== index))}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
            <span className="font-medium">总分：</span>
            <span className="text-lg text-blue-600">
              {settings.reduce((sum, { startNum, endNum, score }) => 
                sum + (endNum - startNum + 1) * score, 0
              )} 分
            </span>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {percentage !== 100 && (
        <Alert
          className="mt-4"
          type="warning"
          showIcon
          message={`还有 ${questionCount - count} 题未设置，请确保所有题目都已设置分数和类型`}
        />
      )}
    </Modal>
  );
} 