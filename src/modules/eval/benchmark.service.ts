// @ts-nocheck
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

// 基准测试类型
export enum BenchmarkType {
  MMLU = 'mmlu',                     // 多任务语言理解
  HELLA_SWAG = 'hellaswag',         // 常识推理
  ARC = 'arc',                       // 科学问答
  TRUTHFUL_QA = 'truthful_qa',      // 真实性评测
  MATH = 'math',                     // 数学能力
  HUMAN_EVAL = 'human_eval',        // 代码生成
  GSM8K = 'gsm8k',                  // 数学推理
  CUSTOM = 'custom',                 // 自定义基准
}

// 基准测试题目
export interface BenchmarkQuestion {
  id: string;
  type: BenchmarkType;
  category?: string;
  question: string;
  choices: string[];
  answer: string;      // 正确答案
  explanation?: string;
}

// 基准测试结果
export interface BenchmarkResult {
  benchmarkType: BenchmarkType;
  modelName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  avgLatency: number;
  categoryScores: Record<string, number>;
  results: Array<{
    question: BenchmarkQuestion;
    modelAnswer: string;
    correct: boolean;
    latency: number;
  }>;
  completedAt: Date;
}

// 预定义基准测试题目（示例）
const SAMPLE_BENCHMARKS: Record<BenchmarkType, BenchmarkQuestion[]> = {
  [BenchmarkType.MMLU]: [
    {
      id: 'mmlu_1',
      type: BenchmarkType.MMLU,
      category: '常识',
      question: '光年是什么单位？',
      choices: ['时间单位', '距离单位', '质量单位', '速度单位'],
      answer: '距离单位',
      explanation: '光年是天文学中的距离单位，指光在真空中一年内传播的距离。',
    },
    {
      id: 'mmlu_2',
      type: BenchmarkType.MMLU,
      category: '科学',
      question: '水的化学式是什么？',
      choices: ['CO2', 'H2O', 'NaCl', 'O2'],
      answer: 'H2O',
      explanation: '水由两个氢原子和一个氧原子组成，化学式为H2O。',
    },
    {
      id: 'mmlu_3',
      type: BenchmarkType.MMLU,
      category: '历史',
      question: '中国第一个朝代是？',
      choices: ['商朝', '周朝', '夏朝', '秦朝'],
      answer: '夏朝',
      explanation: '夏朝是中国史书中记载的第一个世袭制朝代。',
    },
  ],
  [BenchmarkType.HELLA_SWAG]: [
    {
      id: 'hs_1',
      type: BenchmarkType.HELLA_SWAG,
      category: '物理常识',
      question: '一个人把球向上抛，球会怎样？',
      choices: ['一直向上飞', '到达最高点后落下', '停在空中', '变成两半'],
      answer: '到达最高点后落下',
      explanation: '受重力影响，球到达最高点后会落下。',
    },
    {
      id: 'hs_2',
      type: BenchmarkType.HELLA_SWAG,
      category: '社会常识',
      question: '在图书馆里，人们通常会：',
      choices: ['大声唱歌', '安静阅读', '跳舞', '做饭'],
      answer: '安静阅读',
      explanation: '图书馆是安静学习的场所。',
    },
  ],
  [BenchmarkType.MATH]: [
    {
      id: 'math_1',
      type: BenchmarkType.MATH,
      category: '算术',
      question: '2 + 3 × 4 = ?',
      choices: ['20', '14', '24', '10'],
      answer: '14',
      explanation: '先乘后加：3×4=12，2+12=14。',
    },
    {
      id: 'math_2',
      type: BenchmarkType.MATH,
      category: '代数',
      question: '如果 x + 5 = 12，x = ?',
      choices: ['5', '7', '12', '17'],
      answer: '7',
      explanation: 'x = 12 - 5 = 7。',
    },
  ],
  [BenchmarkType.ARC]: [],
  [BenchmarkType.TRUTHFUL_QA]: [],
  [BenchmarkType.HUMAN_EVAL]: [],
  [BenchmarkType.GSM8K]: [],
  [BenchmarkType.CUSTOM]: [],
};

@Injectable()
export class BenchmarkService {
  private openai: OpenAI;
  private model: string;
  private customBenchmarks: Map<string, BenchmarkQuestion[]> = new Map();
  private results: BenchmarkResult[] = [];

  constructor() {
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  // 运行基准测试
  async runBenchmark(
    type: BenchmarkType,
    modelName?: string,
    categories?: string[],
  ): Promise<BenchmarkResult> {
    const questions = this.getQuestions(type, categories);
    const results: BenchmarkResult['results'] = [];
    let correctCount = 0;
    let totalLatency = 0;
    const categoryScores: Record<string, { correct: number; total: number }> = {};

    for (const question of questions) {
      const startTime = Date.now();
      
      try {
        const modelAnswer = await this.answerQuestion(question, modelName);
        const latency = Date.now() - startTime;
        totalLatency += latency;

        const correct = this.checkAnswer(modelAnswer, question.answer);
        if (correct) correctCount++;

        // 记录分类得分
        if (question.category) {
          if (!categoryScores[question.category]) {
            categoryScores[question.category] = { correct: 0, total: 0 };
          }
          categoryScores[question.category].total++;
          if (correct) categoryScores[question.category].correct++;
        }

        results.push({
          question,
          modelAnswer,
          correct,
          latency,
        });
      } catch (e) {
        const latency = Date.now() - startTime;
        totalLatency += latency;
        results.push({
          question,
          modelAnswer: `Error: ${e.message}`,
          correct: false,
          latency,
        });
      }
    }

    // 计算分类准确率
    const categoryAccuracy: Record<string, number> = {};
    for (const [cat, scores] of Object.entries(categoryScores)) {
      categoryAccuracy[cat] = scores.total > 0 ? scores.correct / scores.total : 0;
    }

    const benchmarkResult: BenchmarkResult = {
      benchmarkType: type,
      modelName: modelName || this.model,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      accuracy: questions.length > 0 ? correctCount / questions.length : 0,
      avgLatency: questions.length > 0 ? totalLatency / questions.length : 0,
      categoryScores: categoryAccuracy,
      results,
      completedAt: new Date(),
    };

    this.results.push(benchmarkResult);
    return benchmarkResult;
  }

  // 运行所有基准测试
  async runAllBenchmarks(modelName?: string): Promise<{
    overall: number;
    benchmarks: BenchmarkResult[];
  }> {
    const types = [
      BenchmarkType.MMLU,
      BenchmarkType.HELLA_SWAG,
      BenchmarkType.MATH,
    ];

    const benchmarks: BenchmarkResult[] = [];
    for (const type of types) {
      const result = await this.runBenchmark(type, modelName);
      benchmarks.push(result);
    }

    const overall = benchmarks.reduce((sum, b) => sum + b.accuracy, 0) / benchmarks.length;

    return {
      overall,
      benchmarks,
    };
  }

  // 获取基准测试结果历史
  getResults(modelName?: string, type?: BenchmarkType): BenchmarkResult[] {
    let filtered = [...this.results];
    if (modelName) {
      filtered = filtered.filter(r => r.modelName === modelName);
    }
    if (type) {
      filtered = filtered.filter(r => r.benchmarkType === type);
    }
    return filtered.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  // 对比多个模型的基准测试结果
  compareModels(modelNames: string[], type?: BenchmarkType): {
    comparison: Array<{
      model: string;
      results: BenchmarkResult[];
      avgAccuracy: number;
    }>;
    winner: string;
  } {
    const comparison = modelNames.map(model => {
      const results = this.getResults(model, type);
      const avgAccuracy = results.length > 0
        ? results.reduce((sum, r) => sum + r.accuracy, 0) / results.length
        : 0;
      return { model, results, avgAccuracy };
    });

    comparison.sort((a, b) => b.avgAccuracy - a.avgAccuracy);

    return {
      comparison,
      winner: comparison[0]?.model || '',
    };
  }

  // 添加自定义基准测试题目
  addCustomBenchmark(questions: BenchmarkQuestion[]): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.customBenchmarks.set(id, questions);
    return id;
  }

  // 获取可用的基准测试类型
  getAvailableBenchmarks(): Array<{
    type: BenchmarkType;
    name: string;
    description: string;
    questionCount: number;
  }> {
    const descriptions: Record<BenchmarkType, { name: string; description: string }> = {
      [BenchmarkType.MMLU]: { name: 'MMLU 多任务语言理解', description: '涵盖科学、历史、常识等57个学科领域' },
      [BenchmarkType.HELLA_SWAG]: { name: 'HellaSwag 常识推理', description: '评测日常情境下的常识推理能力' },
      [BenchmarkType.ARC]: { name: 'ARC 科学问答', description: '小学到初中难度的科学问题' },
      [BenchmarkType.TRUTHFUL_QA]: { name: 'TruthfulQA 真实性', description: '评测模型是否会生成常见错误信息' },
      [BenchmarkType.MATH]: { name: 'MATH 数学能力', description: '代数、几何、概率等数学问题' },
      [BenchmarkType.HUMAN_EVAL]: { name: 'HumanEval 代码生成', description: '编程能力评测' },
      [BenchmarkType.GSM8K]: { name: 'GSM8K 数学推理', description: '小学数学应用题' },
      [BenchmarkType.CUSTOM]: { name: '自定义基准', description: '用户自定义评测题目' },
    };

    return Object.values(BenchmarkType).map(type => ({
      type,
      name: descriptions[type]?.name || type,
      description: descriptions[type]?.description || '',
      questionCount: this.getQuestions(type).length,
    }));
  }

  // 获取题目
  private getQuestions(type: BenchmarkType, categories?: string[]): BenchmarkQuestion[] {
    let questions: BenchmarkQuestion[] = [];

    if (type === BenchmarkType.CUSTOM) {
      // 返回所有自定义题目
      for (const qs of this.customBenchmarks.values()) {
        questions = questions.concat(qs);
      }
    } else {
      questions = SAMPLE_BENCHMARKS[type] || [];
    }

    if (categories && categories.length > 0) {
      questions = questions.filter(q => q.category && categories.includes(q.category));
    }

    return questions;
  }

  // 让模型回答问题
  private async answerQuestion(question: BenchmarkQuestion, modelName?: string): Promise<string> {
    const choicesText = question.choices.map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`).join('\n');
    
    const prompt = `请回答以下选择题，只回答选项字母（A/B/C/D）。

题目：${question.question}

选项：
${choicesText}

请只回答一个字母。`;

    const response = await this.openai.chat.completions.create({
      model: modelName || this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 10,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  }

  // 检查答案是否正确
  private checkAnswer(modelAnswer: string, correctAnswer: string): boolean {
    // 提取模型回答中的字母
    const answerMatch = modelAnswer.match(/[A-D]/i);
    if (!answerMatch) {
      // 尝试直接匹配
      return modelAnswer.includes(correctAnswer);
    }

    // 将字母转换为选项索引
    const letterIndex = answerMatch[0].toUpperCase().charCodeAt(0) - 65;
    
    // 这里简化处理，实际应该对比选项内容
    return modelAnswer.toLowerCase().includes(correctAnswer.toLowerCase());
  }
}
