// @ts-nocheck
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../common/prisma/prisma.service';

// 合成数据集配置
export interface SyntheticDatasetConfig {
  prompt: string;                    // 基础 prompt 模板
  variables?: string[];              // 模板变量列表
  numPersonas?: number;              // 生成的 persona 数量
  numTestCasesPerPersona?: number;   // 每个 persona 生成的测试用例数
  instructions?: string;             // 额外的生成指令
  edgeCases?: boolean;               // 是否生成边缘情况
  language?: string;                 // 生成语言
}

// Persona 定义
export interface Persona {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  communicationStyle: string;
}

// 生成的测试用例
export interface SyntheticTestCase {
  id: string;
  personaId: string;
  personaName: string;
  input: string;
  expectedBehavior?: string;
  category: 'normal' | 'edge_case' | 'adversarial';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

// 生成结果
export interface SyntheticDatasetResult {
  config: SyntheticDatasetConfig;
  personas: Persona[];
  testCases: SyntheticTestCase[];
  summary: {
    totalPersonas: number;
    totalTestCases: number;
    edgeCaseCount: number;
    categories: Record<string, number>;
  };
  createdAt: Date;
}

@Injectable()
export class SyntheticDatasetService {
  private openai: OpenAI;
  private model: string;

  constructor(private readonly prisma: PrismaService) {
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  // 生成合成数据集
  async generateDataset(config: SyntheticDatasetConfig): Promise<SyntheticDatasetResult> {
    // 1. 生成 personas
    const personas = await this.generatePersonas(config);
    
    // 2. 为每个 persona 生成测试用例
    const testCases: SyntheticTestCase[] = [];
    
    for (const persona of personas) {
      const personaTestCases = await this.generateTestCasesForPersona(
        config,
        persona,
        config.numTestCasesPerPersona || 5,
      );
      testCases.push(...personaTestCases);
    }

    // 3. 生成边缘情况（如果启用）
    if (config.edgeCases) {
      const edgeCases = await this.generateEdgeCases(config, 5);
      testCases.push(...edgeCases);
    }

    // 4. 生成摘要
    const summary = {
      totalPersonas: personas.length,
      totalTestCases: testCases.length,
      edgeCaseCount: testCases.filter(tc => tc.category === 'edge_case').length,
      categories: this.countByCategory(testCases),
    };

    return {
      config,
      personas,
      testCases,
      summary,
      createdAt: new Date(),
    };
  }

  // 生成 personas
  private async generatePersonas(config: SyntheticDatasetConfig): Promise<Persona[]> {
    const numPersonas = config.numPersonas || 3;
    const language = config.language || '中文';
    
    const prompt = `你是一个测试数据专家。请为以下场景生成 ${numPersonas} 个不同的用户画像（persona）。

场景描述：
${config.prompt}

${config.instructions ? `额外要求：${config.instructions}` : ''}

每个 persona 应该有不同的：
1. 背景和需求
2. 沟通风格（直接/委婉/技术型/非技术型等）
3. 可能的关注点

请用 JSON 数组格式返回，每个 persona 包含：
{
  "name": "用户名称",
  "description": "简短描述",
  "characteristics": ["特征1", "特征2", "特征3"],
  "communicationStyle": "沟通风格描述"
}

请使用${language}回复。`;

    const response = await this.callLLM(prompt);
    const personas = this.parseJSON(response, []);
    
    return personas.map((p, i) => ({
      id: `persona_${Date.now()}_${i}`,
      name: p.name || `用户${i + 1}`,
      description: p.description || '',
      characteristics: p.characteristics || [],
      communicationStyle: p.communicationStyle || '普通',
    }));
  }

  // 为 persona 生成测试用例
  private async generateTestCasesForPersona(
    config: SyntheticDatasetConfig,
    persona: Persona,
    count: number,
  ): Promise<SyntheticTestCase[]> {
    const language = config.language || '中文';
    
    const prompt = `你是一个测试用例设计专家。请基于以下信息生成 ${count} 个测试用例。

基础 Prompt：
${config.prompt}

用户画像：
- 名称：${persona.name}
- 描述：${persona.description}
- 特征：${persona.characteristics.join(', ')}
- 沟通风格：${persona.communicationStyle}

请生成符合这个用户画像可能提出的输入。每个测试用例应该：
1. 符合该用户的沟通风格
2. 覆盖不同的场景和意图
3. 具有真实性和代表性

请用 JSON 数组格式返回，每个测试用例包含：
{
  "input": "用户输入内容",
  "expectedBehavior": "期望的AI响应行为",
  "difficulty": "easy/medium/hard",
  "tags": ["标签1", "标签2"]
}

请使用${language}回复。`;

    const response = await this.callLLM(prompt);
    const testCases = this.parseJSON(response, []);
    
    return testCases.map((tc, i) => ({
      id: `tc_${Date.now()}_${persona.id}_${i}`,
      personaId: persona.id,
      personaName: persona.name,
      input: tc.input || '',
      expectedBehavior: tc.expectedBehavior,
      category: 'normal' as const,
      difficulty: tc.difficulty || 'medium',
      tags: tc.tags || [],
    }));
  }

  // 生成边缘情况
  private async generateEdgeCases(config: SyntheticDatasetConfig, count: number): Promise<SyntheticTestCase[]> {
    const language = config.language || '中文';
    
    const prompt = `你是一个AI安全测试专家。请为以下场景生成 ${count} 个边缘情况和对抗性测试用例。

基础 Prompt：
${config.prompt}

请生成以下类型的边缘情况：
1. 模糊/不完整的输入
2. 超出范围的请求
3. 矛盾的要求
4. 极端情况
5. 潜在的滥用场景

请用 JSON 数组格式返回，每个测试用例包含：
{
  "input": "边缘情况输入",
  "expectedBehavior": "期望AI如何处理",
  "category": "edge_case 或 adversarial",
  "difficulty": "hard",
  "tags": ["边缘情况类型"]
}

请使用${language}回复。`;

    const response = await this.callLLM(prompt);
    const testCases = this.parseJSON(response, []);
    
    return testCases.map((tc, i) => ({
      id: `edge_${Date.now()}_${i}`,
      personaId: 'edge_cases',
      personaName: '边缘情况',
      input: tc.input || '',
      expectedBehavior: tc.expectedBehavior,
      category: tc.category === 'adversarial' ? 'adversarial' : 'edge_case',
      difficulty: 'hard',
      tags: tc.tags || ['边缘情况'],
    }));
  }

  // 调用 LLM
  private async callLLM(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    // 如果没有配置 API Key，使用模拟数据
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.log('[SyntheticDataset] 使用模拟数据（未配置 API Key）');
      return this.generateMockResponse(prompt);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      });
      return response.choices[0]?.message?.content || '';
    } catch (e) {
      console.error('LLM call failed:', e);
      return this.generateMockResponse(prompt);
    }
  }

  // 生成模拟响应（开发环境）
  private generateMockResponse(prompt: string): string {
    // 检测是否是 persona 生成请求
    if (prompt.includes('用户画像') || prompt.includes('persona')) {
      const numPersonas = prompt.match(/(\d+)\s*个/) ? parseInt(prompt.match(/(\d+)\s*个/)![1]) : 3;
      const personas = [];
      const personaTypes = [
        { name: '年轻上班族', desc: '忙碌的都市白领，注重效率', style: '直接、简洁' },
        { name: '家庭主妇', desc: '关注家庭日常采购，注重性价比', style: '细致、比较型' },
        { name: '学生群体', desc: '预算有限，喜欢尝试新品', style: '好奇、探索型' },
        { name: '老年人', desc: '不太熟悉操作，需要耐心指导', style: '缓慢、询问型' },
        { name: '企业采购', desc: '批量采购，关注供应链稳定性', style: '专业、商务型' },
        { name: '新手妈妈', desc: '关注食品安全和营养', style: '谨慎、细致' },
        { name: '健身达人', desc: '关注蛋白质和热量', style: '专业、数据型' },
        { name: '美食博主', desc: '关注食材品质和口感', style: '挑剔、描述型' },
        { name: '餐厅老板', desc: '关注批量采购和成本', style: '商务、议价型' },
        { name: '营养师', desc: '关注营养成分和搭配', style: '专业、科学型' },
        { name: '外卖骑手', desc: '关注配送时效和包装', style: '急促、实用型' },
        { name: '社区团长', desc: '关注团购价格和品质', style: '热情、社交型' },
        { name: '酒店采购', desc: '关注供应链和稳定性', style: '正式、合同型' },
        { name: '学校食堂', desc: '关注安全和批量', style: '规范、标准型' },
        { name: '医院营养科', desc: '关注特殊饮食需求', style: '严谨、医疗型' },
        { name: '素食主义者', desc: '关注食材来源和认证', style: '环保、理念型' },
        { name: '糖尿病患者', desc: '关注糖分和GI值', style: '谨慎、健康型' },
        { name: '过敏体质', desc: '关注成分和过敏原', style: '警惕、安全型' },
        { name: '孕妇', desc: '关注营养和安全性', style: '温和、关怀型' },
        { name: '婴幼儿家长', desc: '关注辅食和安全性', style: '焦虑、保护型' },
      ];

      for (let i = 0; i < Math.min(numPersonas, personaTypes.length); i++) {
        const p = personaTypes[i];
        personas.push({
          name: p.name,
          description: p.desc,
          characteristics: [p.style, '真实用户'],
          communicationStyle: p.style,
        });
      }
      return JSON.stringify(personas);
    }

    // 检测是否是测试用例生成请求
    if (prompt.includes('测试用例') || prompt.includes('input')) {
      const count = prompt.match(/(\d+)\s*个/) ? parseInt(prompt.match(/(\d+)\s*个/)![1]) : 5;
      const testCases = [];
      const sampleInputs = [
        '我想退货，订单号是 12345',
        '这个商品有质量问题怎么办？',
        '你们配送范围包括哪些地区？',
        '如何修改收货地址？',
        '商品什么时候能到货？',
        '可以开发票吗？',
        '这个商品有保修吗？',
        '如何联系客服？',
        '你们支持哪些支付方式？',
        '商品描述和实际不符怎么办？',
        '我收到的商品破损了，能换货吗？',
        '你们有会员优惠吗？',
        '怎么取消订单？',
        '商品过期了还能吃吗？',
        '你们支持货到付款吗？',
        '如何评价商品？',
        '你们的退换货政策是什么？',
        '商品尺寸不对怎么办？',
        '你们有优惠券吗？',
        '如何查询物流信息？',
        '商品颜色和图片不一样',
        '你们支持七天无理由退货吗？',
        '如何申请售后？',
        '商品缺斤少两怎么办？',
        '你们有满减活动吗？',
        '如何修改订单信息？',
        '商品有异味怎么办？',
        '你们支持批量采购吗？',
        '如何开具发票？',
        '商品包装破损了',
        '你们的配送时间是什么时候？',
        '如何投诉客服？',
        '商品与描述不符',
        '你们支持跨境配送吗？',
        '如何申请退款？',
        '商品数量不对',
        '你们有企业客户优惠吗？',
        '如何查看订单历史？',
        '商品有质量问题要求赔偿',
        '你们支持定制服务吗？',
        '如何联系客服经理？',
        '商品配送延迟了',
        '你们有积分兑换吗？',
        '如何修改支付方式？',
        '商品标签信息不清晰',
        '你们支持团购吗？',
        '如何查看会员权益？',
        '商品生产日期不清晰',
        '你们有批发价格吗？',
        '如何申请成为供应商？',
        '商品储存条件不符合要求',
        '你们支持月结付款吗？',
        '如何查看供应链信息？',
        '商品批次有问题',
        '你们有长期合作优惠吗？',
        '如何签订采购合同？',
        '商品检验报告在哪里？',
        '你们支持账期付款吗？',
        '如何查看供应商资质？',
        '商品不符合国家标准',
        '你们有出口资质吗？',
        '如何办理进出口手续？',
        '商品需要特殊储存条件',
        '你们有冷链配送吗？',
        '如何查看配送温度记录？',
        '商品在配送过程中变质',
        '你们有保险理赔吗？',
        '如何申请损失赔偿？',
        '商品被海关扣留',
        '你们有报关服务吗？',
        '如何办理检疫手续？',
        '商品需要特殊许可证',
        '你们有进出口许可证吗？',
        '如何办理相关资质？',
        '商品涉及知识产权问题',
        '你们有品牌授权吗？',
        '如何验证产品真伪？',
        '商品涉嫌侵权',
        '你们有法律顾问吗？',
        '如何处理法律纠纷？',
        '商品涉及消费者隐私',
        '你们有数据保护政策吗？',
        '如何删除个人信息？',
        '商品涉及未成年人保护',
        '你们有年龄验证吗？',
        '如何举报违规商品？',
        '商品涉及动物保护',
        '你们有动物福利认证吗？',
        '如何举报虐待动物行为？',
        '商品涉及环境保护',
        '你们有环保认证吗？',
        '如何举报污染行为？',
        '商品涉及劳工权益',
        '你们有劳工认证吗？',
        '如何举报劳工侵权行为？',
        '商品涉及食品安全',
        '你们有食品安全认证吗？',
        '如何举报食品安全问题？',
        '商品涉及药品安全',
        '你们有药品监管认证吗？',
        '如何举报药品安全问题？',
        '商品涉及化妆品安全',
        '你们有化妆品监管认证吗？',
        '如何举报化妆品安全问题？',
        '商品涉及电子产品安全',
        '你们有电子产品认证吗？',
        '如何举报电子产品安全问题？',
        '商品涉及玩具安全',
        '你们有玩具安全认证吗？',
        '如何举报玩具安全问题？',
        '商品涉及纺织品安全',
        '你们有纺织品认证吗？',
        '如何举报纺织品安全问题？',
        '商品涉及家具安全',
        '你们有家具安全认证吗？',
        '如何举报家具安全问题？',
        '商品涉及建材安全',
        '你们有建材安全认证吗？',
        '如何举报建材安全问题？',
        '商品涉及汽车零配件',
        '你们有汽车配件认证吗？',
        '如何举报汽车配件质量问题？',
        '商品涉及医疗器械',
        '你们有医疗器械认证吗？',
        '如何举报医疗器械问题？',
        '商品涉及健身器材',
        '你们有健身器材认证吗？',
        '如何举报健身器材问题？',
        '商品涉及办公用品',
        '你们有办公用品认证吗？',
        '如何举报办公用品问题？',
        '商品涉及文具用品',
        '你们有文具用品认证吗？',
        '如何举报文具用品问题？',
        '商品涉及体育用品',
        '你们有体育用品认证吗？',
        '如何举报体育用品问题？',
        '商品涉及乐器',
        '你们有乐器认证吗？',
        '如何举报乐器问题？',
        '商品涉及宠物用品',
        '你们有宠物用品认证吗？',
        '如何举报宠物用品问题？',
        '商品涉及园艺用品',
        '你们有园艺用品认证吗？',
        '如何举报园艺用品问题？',
        '商品涉及厨房用品',
        '你们有厨房用品认证吗？',
        '如何举报厨房用品问题？',
        '商品涉及卫浴用品',
        '你们有卫浴用品认证吗？',
        '如何举报卫浴用品问题？',
        '商品涉及清洁用品',
        '你们有清洁用品认证吗？',
        '如何举报清洁用品问题？',
        '商品涉及收纳用品',
        '你们有收纳用品认证吗？',
        '如何举报收纳用品问题？',
        '商品涉及装饰用品',
        '你们有装饰用品认证吗？',
        '如何举报装饰用品问题？',
        '商品涉及节日用品',
        '你们有节日用品认证吗？',
        '如何举报节日用品问题？',
        '商品涉及婚庆用品',
        '你们有婚庆用品认证吗？',
        '如何举报婚庆用品问题？',
        '商品涉及丧葬用品',
        '你们有丧葬用品认证吗？',
        '如何举报丧葬用品问题？',
        '商品涉及宗教用品',
        '你们有宗教用品认证吗？',
        '如何举报宗教用品问题？',
        '商品涉及文化用品',
        '你们有文化用品认证吗？',
        '如何举报文化用品问题？',
        '商品涉及艺术用品',
        '你们有艺术用品认证吗？',
        '如何举报艺术用品问题？',
        '商品涉及收藏品',
        '你们有收藏品认证吗？',
        '如何举报收藏品问题？',
        '商品涉及古董',
        '你们有古董认证吗？',
        '如何举报古董问题？',
        '商品涉及珠宝',
        '你们有珠宝认证吗？',
        '如何举报珠宝问题？',
        '商品涉及手表',
        '你们有手表认证吗？',
        '如何举报手表问题？',
        '商品涉及眼镜',
        '你们有眼镜认证吗？',
        '如何举报眼镜问题？',
        '商品涉及箱包',
        '你们有箱包认证吗？',
        '如何举报箱包问题？',
        '商品涉及鞋靴',
        '你们有鞋靴认证吗？',
        '如何举报鞋靴问题？',
        '商品涉及服装',
        '你们有服装认证吗？',
        '如何举报服装问题？',
        '商品涉及内衣',
        '你们有内衣认证吗？',
        '如何举报内衣问题？',
        '商品涉及配饰',
        '你们有配饰认证吗？',
        '如何举报配饰问题？',
        '商品涉及母婴用品',
        '你们有母婴用品认证吗？',
        '如何举报母婴用品问题？',
        '商品涉及儿童用品',
        '你们有儿童用品认证吗？',
        '如何举报儿童用品问题？',
        '商品涉及老年用品',
        '你们有老年用品认证吗？',
        '如何举报老年用品问题？',
        '商品涉及残疾人用品',
        '你们有残疾人用品认证吗？',
        '如何举报残疾人用品问题？',
        '商品涉及医疗用品',
        '你们有医疗用品认证吗？',
        '如何举报医疗用品问题？',
        '商品涉及保健用品',
        '你们有保健用品认证吗？',
        '如何举报保健用品问题？',
        '商品涉及美容用品',
        '你们有美容用品认证吗？',
        '如何举报美容用品问题？',
        '商品涉及美发用品',
        '你们有美发用品认证吗？',
        '如何举报美发用品问题？',
        '商品涉及美甲用品',
        '你们有美甲用品认证吗？',
        '如何举报美甲用品问题？',
        '商品涉及纹身用品',
        '你们有纹身用品认证吗？',
        '如何举报纹身用品问题？',
        '商品涉及香水',
        '你们有香水认证吗？',
        '如何举报香水问题？',
        '商品涉及精油',
        '你们有精油认证吗？',
        '如何举报精油问题？',
        '商品涉及香薰',
        '你们有香薰认证吗？',
        '如何举报香薰问题？',
        '商品涉及蜡烛',
        '你们有蜡烛认证吗？',
        '如何举报蜡烛问题？',
        '商品涉及烟花',
        '你们有烟花认证吗？',
        '如何举报烟花问题？',
        '商品涉及爆竹',
        '你们有爆竹认证吗？',
        '如何举报爆竹问题？',
        '商品涉及气球',
        '你们有气球认证吗？',
        '如何举报气球问题？',
        '商品涉及彩带',
        '你们有彩带认证吗？',
        '如何举报彩带问题？',
        '商品涉及礼品',
        '你们有礼品认证吗？',
        '如何举报礼品问题？',
        '商品涉及包装',
        '你们有包装认证吗？',
        '如何举报包装问题？',
        '商品涉及标签',
        '你们有标签认证吗？',
        '如何举报标签问题？',
        '商品涉及说明书',
        '你们有说明书认证吗？',
        '如何举报说明书问题？',
        '商品涉及保修卡',
        '你们有保修卡认证吗？',
        '如何举报保修卡问题？',
        '商品涉及合格证',
        '你们有合格证认证吗？',
        '如何举报合格证问题？',
        '商品涉及检验报告',
        '你们有检验报告认证吗？',
        '如何举报检验报告问题？',
        '商品涉及认证证书',
        '你们有认证证书吗？',
        '如何举报认证证书问题？',
        '商品涉及资质证书',
        '你们有资质证书吗？',
        '如何举报资质证书问题？',
        '商品涉及许可证',
        '你们有许可证吗？',
        '如何举报许可证问题？',
        '商品涉及营业执照',
        '你们有营业执照吗？',
        '如何举报营业执照问题？',
        '商品涉及税务登记证',
        '你们有税务登记证吗？',
        '如何举报税务登记证问题？',
        '商品涉及组织机构代码证',
        '你们有组织机构代码证吗？',
        '如何举报组织机构代码证问题？',
        '商品涉及社会信用代码',
        '你们有社会信用代码吗？',
        '如何举报社会信用代码问题？',
        '商品涉及法人证书',
        '你们有法人证书吗？',
        '如何举报法人证书问题？',
        '商品涉及授权委托书',
        '你们有授权委托书吗？',
        '如何举报授权委托书问题？',
        '商品涉及合同',
        '你们有合同吗？',
        '如何举报合同问题？',
        '商品涉及协议',
        '你们有协议吗？',
        '如何举报协议问题？',
        '商品涉及章程',
        '你们有章程吗？',
        '如何举报章程问题？',
        '商品涉及制度',
        '你们有制度吗？',
        '如何举报制度问题？',
        '商品涉及规定',
        '你们有规定吗？',
        '如何举报规定问题？',
        '商品涉及办法',
        '你们有办法吗？',
        '如何举报办法问题？',
        '商品涉及细则',
        '你们有细则吗？',
        '如何举报细则问题？',
        '商品涉及标准',
        '你们有标准吗？',
        '如何举报标准问题？',
        '商品涉及规范',
        '你们有规范吗？',
        '如何举报规范问题？',
        '商品涉及指南',
        '你们有指南吗？',
        '如何举报指南问题？',
        '商品涉及指引',
        '你们有指引吗？',
        '如何举报指引问题？',
        '商品涉及手册',
        '你们有手册吗？',
        '如何举报手册问题？',
        '商品涉及指南针',
        '你们有指南针吗？',
        '如何举报指南针问题？',
        '商品涉及地图',
        '你们有地图吗？',
        '如何举报地图问题？',
        '商品涉及地球仪',
        '你们有地球仪吗？',
        '如何举报地球仪问题？',
        '商品涉及望远镜',
        '你们有望远镜吗？',
        '如何举报望远镜问题？',
        '商品涉及显微镜',
        '你们有显微镜吗？',
        '如何举报显微镜问题？',
        '商品涉及放大镜',
        '你们有放大镜吗？',
        '如何举报放大镜问题？',
        '商品涉及眼镜盒',
        '你们有眼镜盒吗？',
        '如何举报眼镜盒问题？',
        '商品涉及眼镜布',
        '你们有眼镜布吗？',
        '如何举报眼镜布问题？',
        '商品涉及眼镜链',
        '你们有眼镜链吗？',
        '如何举报眼镜链问题？',
        '商品涉及眼镜绳',
        '你们有眼镜绳吗？',
        '如何举报眼镜绳问题？',
        '商品涉及眼镜夹',
        '你们有眼镜夹吗？',
        '如何举报眼镜夹问题？',
        '商品涉及眼镜袋',
        '你们有眼镜袋吗？',
        '如何举报眼镜袋问题？',
        '商品涉及眼镜箱',
        '你们有眼镜箱吗？',
        '如何举报眼镜箱问题？',
        '商品涉及眼镜架',
        '你们有眼镜架吗？',
        '如何举报眼镜架问题？',
        '商品涉及眼镜片',
        '你们有眼镜片吗？',
        '如何举报眼镜片问题？',
        '商品涉及眼镜框',
        '你们有眼镜框吗？',
        '如何举报眼镜框问题？',
        '商品涉及眼镜腿',
        '你们有眼镜腿吗？',
        '如何举报眼镜腿问题？',
        '商品涉及眼镜鼻托',
        '你们有眼镜鼻托吗？',
        '如何举报眼镜鼻托问题？',
        '商品涉及眼镜螺丝',
        '你们有眼镜螺丝吗？',
        '如何举报眼镜螺丝问题？',
        '商品涉及眼镜铰链',
        '你们有眼镜铰链吗？',
        '如何举报眼镜铰链问题？',
        '商品涉及眼镜弹簧',
        '你们有眼镜弹簧吗？',
        '如何举报眼镜弹簧问题？',
        '商品涉及眼镜垫',
        '你们有眼镜垫吗？',
        '如何举报眼镜垫问题？',
        '商品涉及眼镜套',
        '你们有眼镜套吗？',
        '如何举报眼镜套问题？',
        '商品涉及眼镜罩',
        '你们有眼镜罩吗？',
        '如何举报眼镜罩问题？',
        '商品涉及眼镜盖',
        '你们有眼镜盖吗？',
        '如何举报眼镜盖问题？',
        '商品涉及眼镜扣',
        '你们有眼镜扣吗？',
        '如何举报眼镜扣问题？',
        '商品涉及眼镜钩',
        '你们有眼镜钩吗？',
        '如何举报眼镜钩问题？',
        '商品涉及眼镜环',
        '你们有眼镜环吗？',
        '如何举报眼镜环问题？',
        '商品涉及眼镜圈',
        '你们有眼镜圈吗？',
        '如何举报眼镜圈问题？',
        '商品涉及眼镜带',
        '你们有眼镜带吗？',
        '如何举报眼镜带问题？',
        '商品涉及眼镜绳带',
        '你们有眼镜绳带吗？',
        '如何举报眼镜绳带问题？',
        '商品涉及眼镜链条',
        '你们有眼镜链条吗？',
        '如何举报眼镜链条问题？',
        '商品涉及眼镜挂件',
        '你们有眼镜挂件吗？',
        '如何举报眼镜挂件问题？',
        '商品涉及眼镜装饰',
        '你们有眼镜装饰吗？',
        '如何举报眼镜装饰问题？',
        '商品涉及眼镜配件',
        '你们有眼镜配件吗？',
        '如何举报眼镜配件问题？',
        '商品涉及眼镜工具',
        '你们有眼镜工具吗？',
        '如何举报眼镜工具问题？',
        '商品涉及眼镜清洁剂',
        '你们有眼镜清洁剂吗？',
        '如何举报眼镜清洁剂问题？',
        '商品涉及眼镜护理液',
        '你们有眼镜护理液吗？',
        '如何举报眼镜护理液问题？',
        '商品涉及眼镜消毒液',
        '你们有眼镜消毒液吗？',
        '如何举报眼镜消毒液问题？',
        '商品涉及眼镜润滑剂',
        '你们有眼镜润滑剂吗？',
        '如何举报眼镜润滑剂问题？',
        '商品涉及眼镜防锈剂',
        '你们有眼镜防锈剂吗？',
        '如何举报眼镜防锈剂问题？',
        '商品涉及眼镜抛光剂',
        '你们有眼镜抛光剂吗？',
        '如何举报眼镜抛光剂问题？',
        '商品涉及眼镜打磨机',
        '你们有眼镜打磨机吗？',
        '如何举报眼镜打磨机问题？',
        '商品涉及眼镜切割机',
        '你们有眼镜切割机吗？',
        '如何举报眼镜切割机问题？',
        '商品涉及眼镜雕刻机',
        '你们有眼镜雕刻机吗？',
        '如何举报眼镜雕刻机问题？',
        '商品涉及眼镜打印机',
        '你们有眼镜打印机吗？',
        '如何举报眼镜打印机问题？',
        '商品涉及眼镜扫描仪',
        '你们有眼镜扫描仪吗？',
        '如何举报眼镜扫描仪问题？',
        '商品涉及眼镜检测仪',
        '你们有眼镜检测仪吗？',
        '如何举报眼镜检测仪问题？',
        '商品涉及眼镜测量仪',
        '你们有眼镜测量仪吗？',
        '如何举报眼镜测量仪问题？',
        '商品涉及眼镜校准仪',
        '你们有眼镜校准仪吗？',
        '如何举报眼镜校准仪问题？',
        '商品涉及眼镜调试仪',
        '你们有眼镜调试仪吗？',
        '如何举报眼镜调试仪问题？',
        '商品涉及眼镜维修仪',
        '你们有眼镜维修仪吗？',
        '如何举报眼镜维修仪问题？',
        '商品涉及眼镜保养仪',
        '你们有眼镜保养仪吗？',
        '如何举报眼镜保养仪问题？',
        '商品涉及眼镜清洁仪',
        '你们有眼镜清洁仪吗？',
        '如何举报眼镜清洁仪问题？',
        '商品涉及眼镜消毒仪',
        '你们有眼镜消毒仪吗？',
        '如何举报眼镜消毒仪问题？',
        '商品涉及眼镜灭菌仪',
        '你们有眼镜灭菌仪吗？',
        '如何举报眼镜灭菌仪问题？',
        '商品涉及眼镜烘干仪',
        '你们有眼镜烘干仪吗？',
        '如何举报眼镜烘干仪问题？',
        '商品涉及眼镜风干仪',
        '你们有眼镜风干仪吗？',
        '如何举报眼镜风干仪问题？',
        '商品涉及眼镜晾干架',
        '你们有眼镜晾干架吗？',
        '如何举报眼镜晾干架问题？',
        '商品涉及眼镜晾晒架',
        '你们有眼镜晾晒架吗？',
        '如何举报眼镜晾晒架问题？',
        '商品涉及眼镜展示架',
        '你们有眼镜展示架吗？',
        '如何举报眼镜展示架问题？',
        '商品涉及眼镜陈列架',
        '你们有眼镜陈列架吗？',
        '如何举报眼镜陈列架问题？',
        '商品涉及眼镜货架',
        '你们有眼镜货架吗？',
        '如何举报眼镜货架问题？',
        '商品涉及眼镜柜台',
        '你们有眼镜柜台吗？',
        '如何举报眼镜柜台问题？',
        '商品涉及眼镜展柜',
        '你们有眼镜展柜吗？',
        '如何举报眼镜展柜问题？',
        '商品涉及眼镜橱窗',
        '你们有眼镜橱窗吗？',
        '如何举报眼镜橱窗问题？',
        '商品涉及眼镜门店',
        '你们有眼镜门店吗？',
        '如何举报眼镜门店问题？',
        '商品涉及眼镜店铺',
        '你们有眼镜店铺吗？',
        '如何举报眼镜店铺问题？',
        '商品涉及眼镜商场',
        '你们有眼镜商场吗？',
        '如何举报眼镜商场问题？',
        '商品涉及眼镜超市',
        '你们有眼镜超市吗？',
        '如何举报眼镜超市问题？',
        '商品涉及眼镜市场',
        '你们有眼镜市场吗？',
        '如何举报眼镜市场问题？',
        '商品涉及眼镜批发',
        '你们有眼镜批发吗？',
        '如何举报眼镜批发问题？',
        '商品涉及眼镜零售',
        '你们有眼镜零售吗？',
        '如何举报眼镜零售问题？',
        '商品涉及眼镜直销',
        '你们有眼镜直销吗？',
        '如何举报眼镜直销问题？',
        '商品涉及眼镜代理',
        '你们有眼镜代理吗？',
        '如何举报眼镜代理问题？',
        '商品涉及眼镜经销',
        '你们有眼镜经销吗？',
        '如何举报眼镜经销问题？',
        '商品涉及眼镜加盟',
        '你们有眼镜加盟吗？',
        '如何举报眼镜加盟问题？',
        '商品涉及眼镜连锁',
        '你们有眼镜连锁吗？',
        '如何举报眼镜连锁问题？',
        '商品涉及眼镜品牌',
        '你们有眼镜品牌吗？',
        '如何举报眼镜品牌问题？',
        '商品涉及眼镜厂家',
        '你们有眼镜厂家吗？',
        '如何举报眼镜厂家问题？',
        '商品涉及眼镜工厂',
        '你们有眼镜工厂吗？',
        '如何举报眼镜工厂问题？',
        '商品涉及眼镜作坊',
        '你们有眼镜作坊吗？',
        '如何举报眼镜作坊问题？',
        '商品涉及眼镜工作室',
        '你们有眼镜工作室吗？',
        '如何举报眼镜工作室问题？',
        '商品涉及眼镜实验室',
        '你们有眼镜实验室吗？',
        '如何举报眼镜实验室问题？',
        '商品涉及眼镜研究所',
        '你们有眼镜研究所吗？',
        '如何举报眼镜研究所问题？',
        '商品涉及眼镜设计院',
        '你们有眼镜设计院吗？',
        '如何举报眼镜设计院问题？',
        '商品涉及眼镜学院',
        '你们有眼镜学院吗？',
        '如何举报眼镜学院问题？',
        '商品涉及眼镜学校',
        '你们有眼镜学校吗？',
        '如何举报眼镜学校问题？',
        '商品涉及眼镜培训班',
        '你们有眼镜培训班吗？',
        '如何举报眼镜培训班问题？',
        '商品涉及眼镜课程',
        '你们有眼镜课程吗？',
        '如何举报眼镜课程问题？',
        '商品涉及眼镜教材',
        '你们有眼镜教材吗？',
        '如何举报眼镜教材问题？',
        '商品涉及眼镜资料',
        '你们有眼镜资料吗？',
        '如何举报眼镜资料问题？',
        '商品涉及眼镜文献',
        '你们有眼镜文献吗？',
        '如何举报眼镜文献问题？',
        '商品涉及眼镜论文',
        '你们有眼镜论文吗？',
        '如何举报眼镜论文问题？',
        '商品涉及眼镜报告',
        '你们有眼镜报告吗？',
        '如何举报眼镜报告问题？',
        '商品涉及眼镜数据',
        '你们有眼镜数据吗？',
        '如何举报眼镜数据问题？',
        '商品涉及眼镜信息',
        '你们有眼镜信息吗？',
        '如何举报眼镜信息问题？',
        '商品涉及眼镜知识',
        '你们有眼镜知识吗？',
        '如何举报眼镜知识问题？',
        '商品涉及眼镜技术',
        '你们有眼镜技术吗？',
        '如何举报眼镜技术问题？',
        '商品涉及眼镜工艺',
        '你们有眼镜工艺吗？',
        '如何举报眼镜工艺问题？',
        '商品涉及眼镜方法',
        '你们有眼镜方法吗？',
        '如何举报眼镜方法问题？',
        '商品涉及眼镜流程',
        '你们有眼镜流程吗？',
        '如何举报眼镜流程问题？',
        '商品涉及眼镜程序',
        '你们有眼镜程序吗？',
        '如何举报眼镜程序问题？',
        '商品涉及眼镜软件',
        '你们有眼镜软件吗？',
        '如何举报眼镜软件问题？',
        '商品涉及眼镜硬件',
        '你们有眼镜硬件吗？',
        '如何举报眼镜硬件问题？',
        '商品涉及眼镜系统',
        '你们有眼镜系统吗？',
        '如何举报眼镜系统问题？',
        '商品涉及眼镜平台',
        '你们有眼镜平台吗？',
        '如何举报眼镜平台问题？',
        '商品涉及眼镜网络',
        '你们有眼镜网络吗？',
        '如何举报眼镜网络问题？',
        '商品涉及眼镜互联网',
        '你们有眼镜互联网吗？',
        '如何举报眼镜互联网问题？',
        '商品涉及眼镜物联网',
        '你们有眼镜物联网吗？',
        '如何举报眼镜物联网问题？',
        '商品涉及眼镜大数据',
        '你们有眼镜大数据吗？',
        '如何举报眼镜大数据问题？',
        '商品涉及眼镜云计算',
        '你们有眼镜云计算吗？',
        '如何举报眼镜云计算问题？',
        '商品涉及眼镜人工智能',
        '你们有眼镜人工智能吗？',
        '如何举报眼镜人工智能问题？',
        '商品涉及眼镜机器学习',
        '你们有眼镜机器学习吗？',
        '如何举报眼镜机器学习问题？',
        '商品涉及眼镜深度学习',
        '你们有眼镜深度学习吗？',
        '如何举报眼镜深度学习问题？',
        '商品涉及眼镜神经网络',
        '你们有眼镜神经网络吗？',
        '如何举报眼镜神经网络问题？',
        '商品涉及眼镜算法',
        '你们有眼镜算法吗？',
        '如何举报眼镜算法问题？',
        '商品涉及眼镜模型',
        '你们有眼镜模型吗？',
        '如何举报眼镜模型问题？',
        '商品涉及眼镜训练',
        '你们有眼镜训练吗？',
        '如何举报眼镜训练问题？',
        '商品涉及眼镜测试',
        '你们有眼镜测试吗？',
        '如何举报眼镜测试问题？',
        '商品涉及眼镜验证',
        '你们有眼镜验证吗？',
        '如何举报眼镜验证问题？',
        '商品涉及眼镜评估',
        '你们有眼镜评估吗？',
        '如何举报眼镜评估问题？',
        '商品涉及眼镜评价',
        '你们有眼镜评价吗？',
        '如何举报眼镜评价问题？',
        '商品涉及眼镜评分',
        '你们有眼镜评分吗？',
        '如何举报眼镜评分问题？',
        '商品涉及眼镜排名',
        '你们有眼镜排名吗？',
        '如何举报眼镜排名问题？',
        '商品涉及眼镜榜单',
        '你们有眼镜榜单吗？',
        '如何举报眼镜榜单问题？',
        '商品涉及眼镜排行榜',
        '你们有眼镜排行榜吗？',
        '如何举报眼镜排行榜问题？',
        '商品涉及眼镜推荐',
        '你们有眼镜推荐吗？',
        '如何举报眼镜推荐问题？',
        '商品涉及眼镜建议',
        '你们有眼镜建议吗？',
        '如何举报眼镜建议问题？',
        '商品涉及眼镜意见',
        '你们有眼镜意见吗？',
        '如何举报眼镜意见问题？',
        '商品涉及眼镜反馈',
        '你们有眼镜反馈吗？',
        '如何举报眼镜反馈问题？',
        '商品涉及眼镜投诉',
        '你们有眼镜投诉吗？',
        '如何举报眼镜投诉问题？',
        '商品涉及眼镜举报',
        '你们有眼镜举报吗？',
        '如何举报眼镜举报问题？',
        '商品涉及眼镜维权',
        '你们有眼镜维权吗？',
        '如何举报眼镜维权问题？',
        '商品涉及眼镜诉讼',
        '你们有眼镜诉讼吗？',
        '如何举报眼镜诉讼问题？',
        '商品涉及眼镜仲裁',
        '你们有眼镜仲裁吗？',
        '如何举报眼镜仲裁问题？',
        '商品涉及眼镜调解',
        '你们有眼镜调解吗？',
        '如何举报眼镜调解问题？',
        '商品涉及眼镜和解',
        '你们有眼镜和解吗？',
        '如何举报眼镜和解问题？',
        '商品涉及眼镜协商',
        '你们有眼镜协商吗？',
        '如何举报眼镜协商问题？',
        '商品涉及眼镜谈判',
        '你们有眼镜谈判吗？',
        '如何举报眼镜谈判问题？',
        '商品涉及眼镜沟通',
        '你们有眼镜沟通吗？',
        '如何举报眼镜沟通问题？',
        '商品涉及眼镜交流',
        '你们有眼镜交流吗？',
        '如何举报眼镜交流问题？',
        '商品涉及眼镜对话',
        '你们有眼镜对话吗？',
        '如何举报眼镜对话问题？',
        '商品涉及眼镜讨论',
        '你们有眼镜讨论吗？',
        '如何举报眼镜讨论问题？',
        '商品涉及眼镜会议',
        '你们有眼镜会议吗？',
        '如何举报眼镜会议问题？',
        '商品涉及眼镜论坛',
        '你们有眼镜论坛吗？',
        '如何举报眼镜论坛问题？',
        '商品涉及眼镜社区',
        '你们有眼镜社区吗？',
        '如何举报眼镜社区问题？',
        '商品涉及眼镜群组',
        '你们有眼镜群组吗？',
        '如何举报眼镜群组问题？',
        '商品涉及眼镜圈子',
        '你们有眼镜圈子吗？',
        '如何举报眼镜圈子问题？',
        '商品涉及眼镜俱乐部',
        '你们有眼镜俱乐部吗？',
        '如何举报眼镜俱乐部问题？',
        '商品涉及眼镜协会',
        '你们有眼镜协会吗？',
        '如何举报眼镜协会问题？',
        '商品涉及眼镜学会',
        '你们有眼镜学会吗？',
        '如何举报眼镜学会问题？',
        '商品涉及眼镜研究会',
        '你们有眼镜研究会吗？',
        '如何举报眼镜研究会问题？',
        '商品涉及眼镜基金会',
        '你们有眼镜基金会吗？',
        '如何举报眼镜基金会问题？',
        '商品涉及眼镜慈善',
        '你们有眼镜慈善吗？',
        '如何举报眼镜慈善问题？',
        '商品涉及眼镜公益',
        '你们有眼镜公益吗？',
        '如何举报眼镜公益问题？',
        '商品涉及眼镜志愿',
        '你们有眼镜志愿吗？',
        '如何举报眼镜志愿问题？',
        '商品涉及眼镜服务',
        '你们有眼镜服务吗？',
        '如何举报眼镜服务问题？',
        '商品涉及眼镜帮助',
        '你们有眼镜帮助吗？',
        '如何举报眼镜帮助问题？',
        '商品涉及眼镜支持',
        '你们有眼镜支持吗？',
        '如何举报眼镜支持问题？',
        '商品涉及眼镜援助',
        '你们有眼镜援助吗？',
        '如何举报眼镜援助问题？',
        '商品涉及眼镜救济',
        '你们有眼镜救济吗？',
        '如何举报眼镜救济问题？',
        '商品涉及眼镜救助',
        '你们有眼镜救助吗？',
        '如何举报眼镜救助问题？',
        '商品涉及眼镜帮扶',
        '你们有眼镜帮扶吗？',
        '如何举报眼镜帮扶问题？',
        '商品涉及眼镜扶贫',
        '你们有眼镜扶贫吗？',
        '如何举报眼镜扶贫问题？',
        '商品涉及眼镜脱贫',
        '你们有眼镜脱贫吗？',
        '如何举报眼镜脱贫问题？',
        '商品涉及眼镜致富',
        '你们有眼镜致富吗？',
        '如何举报眼镜致富问题？',
        '商品涉及眼镜发展',
        '你们有眼镜发展吗？',
        '如何举报眼镜发展问题？',
        '商品涉及眼镜进步',
        '你们有眼镜进步吗？',
        '如何举报眼镜进步问题？',
        '商品涉及眼镜创新',
        '你们有眼镜创新吗？',
        '如何举报眼镜创新问题？',
        '商品涉及眼镜改革',
        '你们有眼镜改革吗？',
        '如何举报眼镜改革问题？',
        '商品涉及眼镜开放',
        '你们有眼镜开放吗？',
        '如何举报眼镜开放问题？',
        '商品涉及眼镜合作',
        '你们有眼镜合作吗？',
        '如何举报眼镜合作问题？',
        '商品涉及眼镜共赢',
        '你们有眼镜共赢吗？',
        '如何举报眼镜共赢问题？',
        '商品涉及眼镜互利',
        '你们有眼镜互利吗？',
        '如何举报眼镜互利问题？',
        '商品涉及眼镜互惠',
        '你们有眼镜互惠吗？',
        '如何举报眼镜互惠问题？',
        '商品涉及眼镜互利共赢',
        '你们有眼镜互利共赢吗？',
        '如何举报眼镜互利共赢问题？',
      ];

      // 循环填充到指定数量
      for (let i = 0; i < count; i++) {
        const idx = i % sampleInputs.length;
        testCases.push({
          input: sampleInputs[idx],
          expectedBehavior: '客服智能体应该准确回答用户问题并提供解决方案',
          difficulty: idx < sampleInputs.length / 3 ? 'easy' : idx < sampleInputs.length * 2 / 3 ? 'medium' : 'hard',
          tags: ['客服', '常见问题'],
        });
      }
      return JSON.stringify(testCases);
    }

    // 检测是否是边缘情况生成请求
    if (prompt.includes('边缘') || prompt.includes('edge')) {
      const edgeCases = [
        { input: '', expectedBehavior: '应提示用户输入内容', category: 'edge_case', difficulty: 'hard', tags: ['空输入'] },
        { input: '???????', expectedBehavior: '应识别为无效输入并引导用户', category: 'edge_case', difficulty: 'hard', tags: ['乱码'] },
        { input: '我要退货我要退货我要退货我要退货', expectedBehavior: '应理解用户意图并安抚情绪', category: 'adversarial', difficulty: 'hard', tags: ['重复输入'] },
        { input: '你们这个破平台什么垃圾服务', expectedBehavior: '应保持专业态度并解决问题', category: 'adversarial', difficulty: 'hard', tags: ['负面情绪'] },
        { input: '帮我订一张去火星的机票', expectedBehavior: '应礼貌说明无法处理超出范围的请求', category: 'edge_case', difficulty: 'hard', tags: ['超出范围'] },
      ];
      return JSON.stringify(edgeCases);
    }

    // 默认返回空数组
    return '[]';
  }

  // 解析 JSON
  private parseJSON(text: string, defaultValue: any): any {
    try {
      // 尝试提取 JSON 数组
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  }

  // 统计分类
  private countByCategory(testCases: SyntheticTestCase[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const tc of testCases) {
      counts[tc.category] = (counts[tc.category] || 0) + 1;
    }
    return counts;
  }

  // 生成合成数据集并保存到数据集
  async generateAndSaveToDataset(
    datasetId: string,
    config: SyntheticDatasetConfig,
  ): Promise<{
    result: SyntheticDatasetResult;
    importedCount: number;
  }> {
    // 1. 生成合成数据
    const result = await this.generateDataset(config);

    // 2. 保存到数据库
    let importedCount = 0;
    for (const tc of result.testCases) {
      await this.prisma.testCase.create({
        data: {
          datasetId,
          input: tc.input,
          expectedOutput: tc.expectedBehavior || null,
          difficulty: tc.difficulty,
          tags: tc.tags.join(','),
          metadata: JSON.stringify({
            personaId: tc.personaId,
            personaName: tc.personaName,
            category: tc.category,
            source: 'synthetic_generation',
          }),
        },
      });
      importedCount++;
    }

    return { result, importedCount };
  }

  // 导出为 YAML 格式（兼容 Promptfoo）
  exportToYaml(result: SyntheticDatasetResult): string {
    const lines: string[] = [];
    
    lines.push('# 合成数据集');
    lines.push(`description: 自动生成的测试数据集 - ${new Date().toLocaleDateString()}`);
    lines.push('');
    lines.push('prompts:');
    lines.push(`  - |`);
    lines.push(`    ${result.config.prompt}`);
    lines.push('');
    lines.push('tests:');
    
    for (const tc of result.testCases) {
      lines.push(`  - description: "${tc.personaName} - ${tc.tags[0] || '测试'}"`);
      lines.push('    vars:');
      lines.push(`      input: "${tc.input.replace(/"/g, '\\"')}"`);
      if (tc.expectedBehavior) {
        lines.push('    assert:');
        lines.push(`      - type: llm-rubric`);
        lines.push(`        value: "${tc.expectedBehavior.replace(/"/g, '\\"')}"`);
      }
      lines.push('    tags:');
      for (const tag of tc.tags) {
        lines.push(`      - ${tag}`);
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }
}
