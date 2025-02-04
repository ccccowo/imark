import { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Select, Button, Space, message, Progress, Alert, Input, Radio, Checkbox } from 'antd';

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
  correctAnswer?: string;
}

const QUESTION_TYPES = [
  { label: '单选题', value: 'SINGLE_CHOICE', needAnswer: true },
  { label: '多选题', value: 'MULTIPLE_CHOICE', needAnswer: true },
  { label: '填空题', value: 'FILL_BLANK', needAnswer: false },
  { label: '判断题', value: 'TRUE_FALSE', needAnswer: true },
  { label: '简答题', value: 'SHORT_ANSWER', needAnswer: false },
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
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [questionGroups, setQuestionGroups] = useState<{
    type: string;
    questions: { orderNum: number; score: number }[];
  }[]>([]);
  const [answerForm] = Form.useForm();

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
    if (!showAnswerInput) {
      // 第一步完成，整理题目分组
      const groups = QUESTION_TYPES.filter(t => t.needAnswer).map(type => ({
        type: type.value,
        questions: settings.reduce((acc, setting) => {
          if (setting.type === type.value) {
            for (let i = setting.startNum; i <= setting.endNum; i++) {
              acc.push({ orderNum: i, score: setting.score });
            }
          }
          return acc;
        }, [] as { orderNum: number; score: number }[])
      })).filter(group => group.questions.length > 0);

      setQuestionGroups(groups);
      setShowAnswerInput(true);
    } else {
      // 第二步完成，提交所有设置
      onConfirm(settings);
    }
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

  const handleAnswerSubmit = () => {
    answerForm.validateFields().then(values => {
      // 处理每种题型的答案
      for (const group of questionGroups) {
        const answers = values[group.type];
        let answerArray: string[] = [];
        
        if (group.type === 'SINGLE_CHOICE') {
          // 修改：先转大写，去除空格，然后再拆分成数组
          answerArray = answers.toUpperCase().trim().split(/\s+/);
          // 验证单选题答案格式
          if (!answerArray.every(ans => /^[A-D]$/.test(ans.trim()))) {
            message.error('单选题答案必须是A-D');
            return;
          }
          // 打印日志检查答案数组
          console.log('Single choice answers:', answerArray);
        } else if (group.type === 'MULTIPLE_CHOICE') {
          // 多选题答案处理和验证
          answerArray = answers.trim().split(/\s+/);
          
          // 验证每个多选题答案的格式
          for (let i = 0; i < answerArray.length; i++) {
            const choices = answerArray[i].toUpperCase().split('');
            
            // 检查是否为空
            if (choices.length === 0) {
              message.error(`第 ${i + 1} 个多选题答案不能为空`);
              return;
            }
            
            // 检查每个选项是否合法
            if (!choices.every(choice => /^[A-D]$/.test(choice))) {
              message.error(`第 ${i + 1} 个多选题答案包含非法字符，只能是A-D`);
              return;
            }
            
            // 检查是否有重复选项
            if (new Set(choices).size !== choices.length) {
              message.error(`第 ${i + 1} 个多选题答案包含重复选项`);
              return;
            }
            
            // 检查选项是否按顺序
            const sortedChoices = [...choices].sort();
            if (choices.join('') !== sortedChoices.join('')) {
              message.error(`第 ${i + 1} 个多选题答案选项必须按顺序排列，如：ABC而不是CAB`);
              return;
            }
            
            // 更新为排序后的答案
            answerArray[i] = sortedChoices.join('');
          }
        } else if (group.type === 'TRUE_FALSE') {
          answerArray = answers.toUpperCase().split('');
          if (!answerArray.every(ans => /^[TF]$/.test(ans))) {
            message.error('判断题答案必须是T或F');
            return;
          }
        }

        // 验证答案数量
        if (answerArray.length !== group.questions.length) {
          message.error(`${QUESTION_TYPES.find(t => t.value === group.type)?.label}答案数量不匹配，需要 ${group.questions.length} 个答案`);
          return;
        }

        // 更新当前组的答案数组，供后续使用
        values[group.type] = answerArray;
      }

      // 如果所有验证都通过，更新设置
      const newSettings = [...settings];
      
      // 创建题号到答案的映射
      const answerMap = new Map();
      
      questionGroups.forEach(group => {
        const answers = values[group.type];
        console.log(`Processing ${group.type} answers:`, answers);
        
        // 先建立题号和答案的映射关系
        group.questions.forEach((q, index) => {
          answerMap.set(q.orderNum, answers[index]);
          console.log(`Mapping question ${q.orderNum} to answer ${answers[index]}`);
        });
      });
      
      // 然后更新每个设置的答案
      newSettings.forEach((setting, settingIndex) => {
        // 获取这个设置范围内的所有答案
        const answers = [];
        for (let i = 0; i < setting.endNum - setting.startNum + 1; i++) {
          const questionNum = setting.startNum + i;
          const answer = answerMap.get(questionNum);
          answers.push(answer);
        }
        
        // 将答案数组合并为一个字符串，用空格分隔
        setting.correctAnswer = answers.join(' ');
        console.log(`Setting answers for range ${setting.startNum}-${setting.endNum}: ${setting.correctAnswer}`);
      });

      console.log('Final settings:', newSettings);
      setSettings(newSettings);
      onConfirm(newSettings);
    });
  };

  const AnswerInputStep = () => (
    <div className="mt-4">
      {/* 添加题目分布概览 */}
      <div className="mb-4 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">题目分布：</h3>
        {questionGroups.map(group => {
          const type = QUESTION_TYPES.find(t => t.value === group.type);
          const questions = group.questions
            .sort((a, b) => a.orderNum - b.orderNum)
            .map(q => q.orderNum);
          
          // 将连续的题号合并显示
          const ranges = questions.reduce((acc: string[], curr, i, arr) => {
            if (i === 0 || curr !== arr[i-1] + 1) {
              acc.push(String(curr));
            } else if (i === arr.length - 1 || arr[i+1] !== curr + 1) {
              acc[acc.length - 1] += `-${curr}`;
            }
            return acc;
          }, []);

          return (
            <div key={group.type} className="mb-2">
              <span className="text-blue-600">{type?.label}</span>：
              第 {ranges.join('、')} 题，
              共 <span className="font-medium">{group.questions.length}</span> 道题
            </div>
          );
        })}
      </div>

      <Form form={answerForm}>
        {questionGroups.map(group => (
          <Form.Item
            key={group.type}
            name={group.type}
            label={`${QUESTION_TYPES.find(t => t.value === group.type)?.label}答案`}
            rules={[{ required: true }]}
            extra={
              group.type === 'SINGLE_CHOICE' ? 
                `请输入${group.questions.length}个选项(A-D)，用空格分隔` :
              group.type === 'MULTIPLE_CHOICE' ? 
                `请输入${group.questions.length}组选项，用空格分隔` :
              group.type === 'TRUE_FALSE' ? 
                `请输入${group.questions.length}个T或F` : ''
            }
          >
            <Input.TextArea 
              placeholder={
                group.type === 'SINGLE_CHOICE' ? 'C A B D' :
                group.type === 'MULTIPLE_CHOICE' ? 'AB ABC CD' :
                group.type === 'TRUE_FALSE' ? 'T F T F' : ''
              }
            />
          </Form.Item>
        ))}
      </Form>
    </div>
  );

  return (
    <Modal
      title={!showAnswerInput ? "设置题目分数和类型" : "批量设置答案"}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button 
          key="confirm" 
          type="primary"
          onClick={!showAnswerInput ? handleConfirm : handleAnswerSubmit}
          disabled={!showAnswerInput && (settings.length === 0 || percentage !== 100)}
        >
          {!showAnswerInput ? "下一步" : "完成"}
        </Button>
      ]}
      width={700}
      className="batch-settings-modal"
    >
      {!showAnswerInput ? (
        <>
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
                  <div key={index} className="flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50">
                    <div>
                      <div>
                        第 {setting.startNum}-{setting.endNum} 题：
                        <span className="text-blue-600 mx-1">{setting.score}</span>分/题，
                        <span className="text-green-600">
                          {QUESTION_TYPES.find(t => t.value === setting.type)?.label}
                        </span>
                      </div>
                      {setting.correctAnswer && setting.type !== 'SHORT_ANSWER' && (
                        <div className="text-gray-500 text-sm mt-1">
                          正确答案：
                          {setting.type === 'MULTIPLE_CHOICE' 
                            ? setting.correctAnswer.split(',').join('、')
                            : setting.type === 'TRUE_FALSE'
                              ? setting.correctAnswer === 'T' ? '正确' : '错误'
                              : setting.correctAnswer
                          }
                        </div>
                      )}
                    </div>
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
        </>
      ) : (
        <AnswerInputStep />
      )}
    </Modal>
  );
} 
