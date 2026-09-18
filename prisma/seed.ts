// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充 Mock 数据...');

  // 清空现有数据
  await prisma.alertConfig.deleteMany();
  await prisma.pipelineInstance.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.fixRecord.deleteMany();
  await prisma.annotation.deleteMany();
  await prisma.evalResult.deleteMany();
  await prisma.evalRun.deleteMany();
  await prisma.generationRecord.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.datasetSnapshot.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.skillVersion.deleteMany();
  await prisma.agentEndpoint.deleteMany();
  await prisma.skill.deleteMany();

  // ============================================
  // 1. 技能 + 接入点
  // ============================================
  const skill1 = await prisma.skill.create({
    data: {
      name: '客服问答技能',
      description: '基于 RAG 的智能客服问答系统，支持多轮对话和上下文理解',
      version: '2.1.0',
      category: 'rag',
      tags: 'customer-service,rag,nlp',
    },
  });

  const skill2 = await prisma.skill.create({
    data: {
      name: '文档摘要技能',
      description: '自动提取长文档的核心内容，支持多种格式输入',
      version: '1.5.2',
      category: 'summarization',
      tags: 'summarization,document',
    },
  });

  const skill3 = await prisma.skill.create({
    data: {
      name: '意图识别技能',
      description: '精准识别用户意图，支持多分类和置信度输出',
      version: '3.0.1',
      category: 'classification',
      tags: 'classification,intent',
    },
  });

  const skill4 = await prisma.skill.create({
    data: {
      name: '代码生成助手',
      description: '根据自然语言描述生成代码片段，支持多种编程语言',
      version: '1.2.0',
      category: 'function_call',
      tags: 'code-generation,assistant',
    },
  });

  const skill5 = await prisma.skill.create({
    data: {
      name: '对话管理 Agent',
      description: '多轮对话状态管理，支持槽位填充和任务型对话',
      version: '2.0.0',
      category: 'agent',
      tags: 'agent,dialogue,slot-filling',
    },
  });

  // 接入点
  const endpoint1 = await prisma.agentEndpoint.create({
    data: {
      skillId: skill1.id,
      name: '客服问答接口',
      url: 'https://api.example.com/v1/chat',
      authType: 'api_key',
      sseFormat: 'openai',
    },
  });

  const endpoint2 = await prisma.agentEndpoint.create({
    data: {
      skillId: skill2.id,
      name: '摘要生成接口',
      url: 'https://api.example.com/v1/summarize',
      authType: 'token',
      sseFormat: 'content',
    },
  });

  const endpoint3 = await prisma.agentEndpoint.create({
    data: {
      skillId: skill3.id,
      name: '意图识别接口',
      url: 'https://api.example.com/v1/intent',
      authType: 'none',
      sseFormat: 'auto',
    },
  });

  await prisma.agentEndpoint.create({
    data: {
      skillId: skill4.id,
      name: '代码生成接口',
      url: 'https://api.example.com/v1/codegen',
      authType: 'api_key',
      sseFormat: 'delta',
    },
  });

  await prisma.agentEndpoint.create({
    data: {
      skillId: skill5.id,
      name: '对话管理接口',
      url: 'https://api.example.com/v1/dialogue',
      authType: 'token',
      sseFormat: 'openai',
    },
  });

  // 技能版本
  await prisma.skillVersion.createMany({
    data: [
      { skillId: skill1.id, version: '1.0.0', snapshot: '{"changes":"初始版本"}' },
      { skillId: skill1.id, version: '2.0.0', snapshot: '{"changes":"引入 RAG"}' },
      { skillId: skill1.id, version: '2.1.0', snapshot: '{"changes":"优化多轮对话"}' },
      { skillId: skill3.id, version: '2.0.0', snapshot: '{"changes":"旧版本"}' },
      { skillId: skill3.id, version: '3.0.0', snapshot: '{"changes":"重构分类模型"}' },
      { skillId: skill3.id, version: '3.0.1', snapshot: '{"changes":"修复边界情况"}' },
    ],
  });

  // ============================================
  // 2. 数据集 + 测试用例
  // ============================================
  const dataset1 = await prisma.dataset.create({
    data: {
      name: '客服问答测试集',
      description: '包含 500 条客服场景问答对，覆盖退款、物流、产品咨询等场景',
      category: 'customer-service',
    },
  });

  const dataset2 = await prisma.dataset.create({
    data: {
      name: '意图识别基准集',
      description: '覆盖 20 个意图类别的标准测试集，每类 60 条',
      category: 'classification',
    },
  });

  const dataset3 = await prisma.dataset.create({
    data: {
      name: '摘要质量评估集',
      description: '人工标注的文档摘要质量评估数据',
      category: 'summarization',
    },
  });

  // 测试用例
  const testCases1 = await prisma.testCase.createMany({
    data: [
      {
        datasetId: dataset1.id,
        input: '我想退货，订单号是 12345',
        expectedOutput: '好的，我来帮您处理退货。请问退货原因是？',
        difficulty: 'easy',
        tags: 'refund,order',
      },
      {
        datasetId: dataset1.id,
        input: '我的快递什么时候到？',
        expectedOutput: '请提供您的订单号，我帮您查询物流状态。',
        difficulty: 'easy',
        tags: 'logistics,tracking',
      },
      {
        datasetId: dataset1.id,
        input: '这个产品支持保修吗？',
        expectedOutput: '我们的产品提供一年质保服务，如有质量问题可免费维修或更换。',
        difficulty: 'medium',
        tags: 'product,warranty',
      },
      {
        datasetId: dataset1.id,
        input: '你们支持哪些支付方式？',
        expectedOutput: '我们支持支付宝、微信支付、银行卡以及花呗分期。',
        difficulty: 'easy',
        tags: 'payment',
      },
      {
        datasetId: dataset1.id,
        input: '我要投诉你们的服务！',
        expectedOutput: '非常抱歉给您带来不好的体验，请问具体遇到了什么问题？我会帮您记录并尽快解决。',
        difficulty: 'hard',
        tags: 'complaint,emotion',
      },
    ],
  });

  const testCases2 = await prisma.testCase.createMany({
    data: [
      {
        datasetId: dataset2.id,
        input: '帮我查一下北京到上海的航班',
        expectedOutput: 'flight_query',
        difficulty: 'easy',
        tags: 'intent,flight',
      },
      {
        datasetId: dataset2.id,
        input: '今天天气怎么样？',
        expectedOutput: 'weather_query',
        difficulty: 'easy',
        tags: 'intent,weather',
      },
      {
        datasetId: dataset2.id,
        input: '帮我订一张明天下午的电影票',
        expectedOutput: 'movie_booking',
        difficulty: 'medium',
        tags: 'intent,booking',
      },
    ],
  });

  const testCases3 = await prisma.testCase.createMany({
    data: [
      {
        datasetId: dataset3.id,
        input: '人工智能（Artificial Intelligence，简称AI）是计算机科学的一个分支，它试图理解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。',
        expectedOutput: '人工智能是计算机科学分支，旨在理解智能本质并创造类人智能机器。',
        difficulty: 'medium',
        tags: 'summary,tech',
      },
    ],
  });

  // 获取创建的测试用例 ID
  const allTestCases1 = await prisma.testCase.findMany({ where: { datasetId: dataset1.id } });
  const allTestCases2 = await prisma.testCase.findMany({ where: { datasetId: dataset2.id } });
  const allTestCases3 = await prisma.testCase.findMany({ where: { datasetId: dataset3.id } });

  // ============================================
  // 3. 评测运行 + 结果
  // ============================================
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const evalRun1 = await prisma.evalRun.create({
    data: {
      skillId: skill1.id,
      endpointId: endpoint1.id,
      datasetId: dataset1.id,
      status: 'completed',
      startTime: oneDayAgo,
      endTime: new Date(oneDayAgo.getTime() + 45000),
      totalCases: 5,
      passedCases: 4,
      failedCases: 1,
    },
  });

  const evalRun2 = await prisma.evalRun.create({
    data: {
      skillId: skill3.id,
      endpointId: endpoint3.id,
      datasetId: dataset2.id,
      status: 'completed',
      startTime: twoDaysAgo,
      endTime: new Date(twoDaysAgo.getTime() + 32000),
      totalCases: 3,
      passedCases: 3,
      failedCases: 0,
    },
  });

  const evalRun3 = await prisma.evalRun.create({
    data: {
      skillId: skill2.id,
      endpointId: endpoint2.id,
      datasetId: dataset3.id,
      status: 'completed',
      startTime: threeDaysAgo,
      endTime: new Date(threeDaysAgo.getTime() + 28000),
      totalCases: 1,
      passedCases: 1,
      failedCases: 0,
    },
  });

  // 评测结果
  for (const tc of allTestCases1.slice(0, 4)) {
    await prisma.evalResult.create({
      data: {
        evalRunId: evalRun1.id,
        testCaseId: tc.id,
        status: 'passed',
        actualOutput: '这是模拟的实际输出，与期望输出匹配度较高。',
        metrics: JSON.stringify({ latency: 230, tokens: 150, cost: 0.002 }),
        scores: JSON.stringify({ accuracy: 0.92, relevance: 0.88, fluency: 0.95 }),
      },
    });
  }

  // 一个失败的
  if (allTestCases1[4]) {
    await prisma.evalResult.create({
      data: {
        evalRunId: evalRun1.id,
        testCaseId: allTestCases1[4].id,
        status: 'failed',
        actualOutput: '抱歉，我无法处理您的请求。',
        metrics: JSON.stringify({ latency: 180, tokens: 80, cost: 0.001 }),
        scores: JSON.stringify({ accuracy: 0.35, relevance: 0.40, fluency: 0.60 }),
        errorMessage: '回答过于模板化，未能处理投诉情绪',
      },
    });
  }

  for (const tc of allTestCases2) {
    await prisma.evalResult.create({
      data: {
        evalRunId: evalRun2.id,
        testCaseId: tc.id,
        status: 'passed',
        actualOutput: tc.expectedOutput || 'intent_detected',
        metrics: JSON.stringify({ latency: 95, tokens: 50, cost: 0.0008 }),
        scores: JSON.stringify({ accuracy: 0.98, confidence: 0.95 }),
      },
    });
  }

  for (const tc of allTestCases3) {
    await prisma.evalResult.create({
      data: {
        evalRunId: evalRun3.id,
        testCaseId: tc.id,
        status: 'passed',
        actualOutput: 'AI 是计算机科学分支，研究智能本质并创造类人机器。',
        metrics: JSON.stringify({ latency: 420, tokens: 280, cost: 0.004 }),
        scores: JSON.stringify({ accuracy: 0.88, completeness: 0.85, coherence: 0.92 }),
      },
    });
  }

  // ============================================
  // 4. 标注
  // ============================================
  const evalResults = await prisma.evalResult.findMany({ where: { evalRunId: evalRun1.id } });
  
  for (const er of evalResults.slice(0, 3)) {
    await prisma.annotation.create({
      data: {
        evalResultId: er.id,
        type: 'ai',
        scores: JSON.stringify({ quality: 0.9, accuracy: 0.88 }),
        comment: 'AI 自动标注：输出质量良好',
        isFinal: false,
      },
    });
  }

  if (evalResults[0]) {
    await prisma.annotation.create({
      data: {
        evalResultId: evalResults[0].id,
        type: 'human',
        annotatorId: 'annotator-001',
        scores: JSON.stringify({ quality: 0.85, accuracy: 0.82, fluency: 0.90 }),
        comment: '人工复核：回答准确但可更简洁',
        isFinal: true,
      },
    });
  }

  // ============================================
  // 5. 修复记录
  // ============================================
  if (evalResults[4]) {
    await prisma.fixRecord.create({
      data: {
        evalResultId: evalResults[4].id,
        diagnosis: '模型对情绪化输入处理不足，回答过于模板化',
        suggestion: '在 prompt 中增加情绪识别和共情回应指导',
        fixType: 'prompt',
        fixContent: JSON.stringify({
          before: '你是一个客服助手，请回答用户问题。',
          after: '你是一个有同理心的客服助手。面对投诉时先表达理解和歉意，再解决问题。',
        }),
        verified: true,
      },
    });
  }

  // ============================================
  // 6. 流水线
  // ============================================
  const pipeline1 = await prisma.pipeline.create({
    data: {
      name: '快速评测流水线',
      description: '执行 → 规则评测 → 出报告',
      template: JSON.stringify(['execute', 'rule-eval', 'report']),
      isPreset: true,
    },
  });

  const pipeline2 = await prisma.pipeline.create({
    data: {
      name: '完整评测流水线',
      description: '执行 → 规则评测 → AI评测 → 标注 → 修复 → 再验证',
      template: JSON.stringify(['execute', 'rule-eval', 'ai-eval', 'annotate', 'fix', 'verify', 'report']),
      isPreset: true,
    },
  });

  const pipeline3 = await prisma.pipeline.create({
    data: {
      name: '回归评测流水线',
      description: '执行 → 对比上一版本 → 告警',
      template: JSON.stringify(['execute', 'compare', 'alert']),
      isPreset: true,
    },
  });

  await prisma.pipeline.create({
    data: {
      name: '每日定时回归',
      description: '每天凌晨 2 点执行回归测试',
      template: JSON.stringify(['execute', 'compare', 'report', 'alert']),
      isPreset: false,
      cronExpression: '0 2 * * *',
    },
  });

  // 流水线实例
  await prisma.pipelineInstance.create({
    data: {
      pipelineId: pipeline1.id,
      evalRunId: evalRun1.id,
      status: 'completed',
      startTime: oneDayAgo,
      endTime: new Date(oneDayAgo.getTime() + 45000),
      currentNode: 'report',
      progress: JSON.stringify({ execute: 100, 'rule-eval': 100, report: 100 }),
    },
  });

  await prisma.pipelineInstance.create({
    data: {
      pipelineId: pipeline2.id,
      evalRunId: evalRun2.id,
      status: 'completed',
      startTime: twoDaysAgo,
      endTime: new Date(twoDaysAgo.getTime() + 32000),
      currentNode: 'report',
      progress: JSON.stringify({ execute: 100, 'rule-eval': 100, 'ai-eval': 100, annotate: 100, fix: 100, verify: 100, report: 100 }),
    },
  });

  // ============================================
  // 7. 告警配置
  // ============================================
  await prisma.alertConfig.create({
    data: {
      channel: 'wechat',
      webhookKey: 'demo-webhook-key-xxxx-xxxx',
      passRateThreshold: 80.0,
      enabled: true,
    },
  });

  console.log('✅ Mock 数据填充完成！');
  console.log(`   - 技能: 5 个`);
  console.log(`   - 接入点: 5 个`);
  console.log(`   - 数据集: 3 个`);
  console.log(`   - 测试用例: 9 个`);
  console.log(`   - 评测运行: 3 次`);
  console.log(`   - 评测结果: 9 条`);
  console.log(`   - 标注: 4 条`);
  console.log(`   - 修复记录: 1 条`);
  console.log(`   - 流水线: 4 个`);
  console.log(`   - 告警配置: 1 条`);
}

main()
  .catch((e) => {
    console.error('❌ 填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
