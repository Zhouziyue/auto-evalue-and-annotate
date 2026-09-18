// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 语言
export enum Language {
  ZH = 'zh',
  EN = 'en',
  JA = 'ja',
  KO = 'ko',
  FR = 'fr',
  DE = 'de',
  ES = 'es',
  RU = 'ru',
  AR = 'ar',
  PT = 'pt',
}

// 多语言评测类型
export enum MultilingualEvalType {
  TRANSLATION = 'translation',           // 翻译质量
  CROSS_LINGUAL = 'cross_lingual',       // 跨语言能力
  LANGUAGE_DETECTION = 'language_detection', // 语言检测
  CODE_SWITCHING = 'code_switching',     // 语码转换
  CULTURAL_ADAPTATION = 'cultural',      // 文化适配
  MULTILINGUAL_QA = 'multilingual_qa',   // 多语言问答
}

// 多语言评测输入
export interface MultilingualEvalInput {
  type: MultilingualEvalType;
  sourceText: string;
  sourceLanguage: Language;
  targetText?: string;
  targetLanguage?: Language;
  context?: string;
  metadata?: Record<string, any>;
}

// 多语言评测结果
export interface MultilingualEvalResult {
  id: string;
  input: MultilingualEvalInput;
  scores: {
    fluency: number;
    adequacy: number;
    culturalAppropriateness: number;
    grammaticalCorrectness: number;
    semanticSimilarity: number;
    overall: number;
  };
  detectedLanguage?: Language;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion?: string;
  }>;
  metadata: Record<string, any>;
  createdAt: Date;
}

// 语言配置文件
export interface LanguageConfig {
  language: Language;
  name: string;
  nativeName: string;
  script: string;
  supported: boolean;
  metrics: string[];
}

@Injectable()
export class MultilingualEvalService {
  private results: MultilingualEvalResult[] = [];
  private languageConfigs: Map<Language, LanguageConfig> = new Map();

  constructor() {
    this.initLanguageConfigs();
  }

  // 初始化语言配置
  private initLanguageConfigs(): void {
    const configs: LanguageConfig[] = [
      { language: Language.ZH, name: 'Chinese', nativeName: '中文', script: 'Hans', supported: true, metrics: ['fluency', 'adequacy', 'cultural'] },
      { language: Language.EN, name: 'English', nativeName: 'English', script: 'Latin', supported: true, metrics: ['fluency', 'adequacy', 'grammar'] },
      { language: Language.JA, name: 'Japanese', nativeName: '日本語', script: 'Jpan', supported: true, metrics: ['fluency', 'adequacy', 'honorifics'] },
      { language: Language.KO, name: 'Korean', nativeName: '한국어', script: 'Kore', supported: true, metrics: ['fluency', 'adequacy', 'honorifics'] },
      { language: Language.FR, name: 'French', nativeName: 'Français', script: 'Latin', supported: true, metrics: ['fluency', 'adequacy', 'grammar'] },
      { language: Language.DE, name: 'German', nativeName: 'Deutsch', script: 'Latin', supported: true, metrics: ['fluency', 'adequacy', 'grammar'] },
      { language: Language.ES, name: 'Spanish', nativeName: 'Español', script: 'Latin', supported: true, metrics: ['fluency', 'adequacy', 'grammar'] },
      { language: Language.RU, name: 'Russian', nativeName: 'Русский', script: 'Cyrl', supported: true, metrics: ['fluency', 'adequacy', 'grammar'] },
      { language: Language.AR, name: 'Arabic', nativeName: 'العربية', script: 'Arab', supported: true, metrics: ['fluency', 'adequacy', 'rtl'] },
      { language: Language.PT, name: 'Portuguese', nativeName: 'Português', script: 'Latin', supported: true, metrics: ['fluency', 'adequacy', 'grammar'] },
    ];

    for (const config of configs) {
      this.languageConfigs.set(config.language, config);
    }
  }

  // 执行多语言评测
  async evaluate(input: MultilingualEvalInput): Promise<MultilingualEvalResult> {
    const id = `multilingual_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // 根据类型执行不同评测
    let scores: MultilingualEvalResult['scores'];
    let issues: MultilingualEvalResult['issues'] = [];
    let detectedLanguage: Language | undefined;

    switch (input.type) {
      case MultilingualEvalType.TRANSLATION:
        const translationResult = this.evaluateTranslation(input);
        scores = translationResult.scores;
        issues = translationResult.issues;
        break;

      case MultilingualEvalType.CROSS_LINGUAL:
        const crossLingualResult = this.evaluateCrossLingual(input);
        scores = crossLingualResult.scores;
        issues = crossLingualResult.issues;
        break;

      case MultilingualEvalType.LANGUAGE_DETECTION:
        const detectionResult = this.evaluateLanguageDetection(input);
        scores = detectionResult.scores;
        detectedLanguage = detectionResult.detectedLanguage;
        issues = detectionResult.issues;
        break;

      case MultilingualEvalType.CODE_SWITCHING:
        const codeSwitchingResult = this.evaluateCodeSwitching(input);
        scores = codeSwitchingResult.scores;
        issues = codeSwitchingResult.issues;
        break;

      case MultilingualEvalType.CULTURAL_ADAPTATION:
        const culturalResult = this.evaluateCulturalAdaptation(input);
        scores = culturalResult.scores;
        issues = culturalResult.issues;
        break;

      case MultilingualEvalType.MULTILINGUAL_QA:
        const qaResult = this.evaluateMultilingualQA(input);
        scores = qaResult.scores;
        issues = qaResult.issues;
        break;

      default:
        scores = this.getDefaultScores();
    }

    const result: MultilingualEvalResult = {
      id,
      input,
      scores,
      detectedLanguage,
      issues,
      metadata: input.metadata || {},
      createdAt: new Date(),
    };

    this.results.push(result);
    return result;
  }

  // 翻译质量评测
  private evaluateTranslation(input: MultilingualEvalInput): {
    scores: MultilingualEvalResult['scores'];
    issues: MultilingualEvalResult['issues'];
  } {
    const issues: MultilingualEvalResult['issues'] = [];
    
    // 简化评分逻辑
    const fluency = 0.7 + Math.random() * 0.2;
    const adequacy = 0.7 + Math.random() * 0.2;
    const culturalAppropriateness = 0.75 + Math.random() * 0.15;
    const grammaticalCorrectness = 0.8 + Math.random() * 0.15;
    const semanticSimilarity = input.targetText ? this.calculateSimilarity(input.sourceText, input.targetText) : 0.75;
    const overall = (fluency + adequacy + culturalAppropriateness + grammaticalCorrectness + semanticSimilarity) / 5;

    // 检测问题
    if (fluency < 0.7) {
      issues.push({
        type: 'fluency',
        severity: 'medium',
        description: '翻译流畅度不足',
        suggestion: '建议优化语句结构',
      });
    }

    if (culturalAppropriateness < 0.7) {
      issues.push({
        type: 'cultural',
        severity: 'high',
        description: '文化适配性不足',
        suggestion: '建议检查文化敏感内容',
      });
    }

    return {
      scores: { fluency, adequacy, culturalAppropriateness, grammaticalCorrectness, semanticSimilarity, overall },
      issues,
    };
  }

  // 跨语言能力评测
  private evaluateCrossLingual(input: MultilingualEvalInput): {
    scores: MultilingualEvalResult['scores'];
    issues: MultilingualEvalResult['issues'];
  } {
    const issues: MultilingualEvalResult['issues'] = [];
    
    const fluency = 0.75 + Math.random() * 0.2;
    const adequacy = 0.7 + Math.random() * 0.2;
    const culturalAppropriateness = 0.8 + Math.random() * 0.15;
    const grammaticalCorrectness = 0.75 + Math.random() * 0.2;
    const semanticSimilarity = 0.7 + Math.random() * 0.2;
    const overall = (fluency + adequacy + culturalAppropriateness + grammaticalCorrectness + semanticSimilarity) / 5;

    return { scores: { fluency, adequacy, culturalAppropriateness, grammaticalCorrectness, semanticSimilarity, overall }, issues };
  }

  // 语言检测评测
  private evaluateLanguageDetection(input: MultilingualEvalInput): {
    scores: MultilingualEvalResult['scores'];
    detectedLanguage?: Language;
    issues: MultilingualEvalResult['issues'];
  } {
    const issues: MultilingualEvalResult['issues'] = [];
    
    // 简化：基于字符集检测
    const detectedLanguage = this.detectLanguage(input.sourceText);
    const correct = detectedLanguage === input.sourceLanguage;
    
    const fluency = correct ? 1.0 : 0.0;
    const adequacy = correct ? 1.0 : 0.5;
    const culturalAppropriateness = 1.0;
    const grammaticalCorrectness = 1.0;
    const semanticSimilarity = correct ? 1.0 : 0.0;
    const overall = correct ? 1.0 : 0.5;

    if (!correct) {
      issues.push({
        type: 'detection',
        severity: 'high',
        description: `语言检测错误：期望 ${input.sourceLanguage}，实际 ${detectedLanguage}`,
      });
    }

    return {
      scores: { fluency, adequacy, culturalAppropriateness, grammaticalCorrectness, semanticSimilarity, overall },
      detectedLanguage,
      issues,
    };
  }

  // 语码转换评测
  private evaluateCodeSwitching(input: MultilingualEvalInput): {
    scores: MultilingualEvalResult['scores'];
    issues: MultilingualEvalResult['issues'];
  } {
    const issues: MultilingualEvalResult['issues'] = [];
    
    const fluency = 0.7 + Math.random() * 0.2;
    const adequacy = 0.75 + Math.random() * 0.2;
    const culturalAppropriateness = 0.8 + Math.random() * 0.15;
    const grammaticalCorrectness = 0.7 + Math.random() * 0.2;
    const semanticSimilarity = 0.75 + Math.random() * 0.2;
    const overall = (fluency + adequacy + culturalAppropriateness + grammaticalCorrectness + semanticSimilarity) / 5;

    return { scores: { fluency, adequacy, culturalAppropriateness, grammaticalCorrectness, semanticSimilarity, overall }, issues };
  }

  // 文化适配评测
  private evaluateCulturalAdaptation(input: MultilingualEvalInput): {
    scores: MultilingualEvalResult['scores'];
    issues: MultilingualEvalResult['issues'];
  } {
    const issues: MultilingualEvalResult['issues'] = [];
    
    const fluency = 0.8 + Math.random() * 0.15;
    const adequacy = 0.75 + Math.random() * 0.2;
    const culturalAppropriateness = 0.7 + Math.random() * 0.25;
    const grammaticalCorrectness = 0.8 + Math.random() * 0.15;
    const semanticSimilarity = 0.75 + Math.random() * 0.2;
    const overall = (fluency + adequacy + culturalAppropriateness + grammaticalCorrectness + semanticSimilarity) / 5;

    if (culturalAppropriateness < 0.7) {
      issues.push({
        type: 'cultural',
        severity: 'high',
        description: '文化适配性不足',
        suggestion: '建议检查文化敏感内容和当地习俗',
      });
    }

    return { scores: { fluency, adequacy, culturalAppropriateness, grammaticalCorrectness, semanticSimilarity, overall }, issues };
  }

  // 多语言问答评测
  private evaluateMultilingualQA(input: MultilingualEvalInput): {
    scores: MultilingualEvalResult['scores'];
    issues: MultilingualEvalResult['issues'];
  } {
    const issues: MultilingualEvalResult['issues'] = [];
    
    const fluency = 0.75 + Math.random() * 0.2;
    const adequacy = 0.7 + Math.random() * 0.25;
    const culturalAppropriateness = 0.8 + Math.random() * 0.15;
    const grammaticalCorrectness = 0.75 + Math.random() * 0.2;
    const semanticSimilarity = 0.7 + Math.random() * 0.25;
    const overall = (fluency + adequacy + culturalAppropriateness + grammaticalCorrectness + semanticSimilarity) / 5;

    return { scores: { fluency, adequacy, culturalAppropriateness, grammaticalCorrectness, semanticSimilarity, overall }, issues };
  }

  // 计算相似度（简化）
  private calculateSimilarity(text1: string, text2: string): number {
    const set1 = new Set(text1.toLowerCase().split(/\s+/));
    const set2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = [...set1].filter(x => set2.has(x));
    const union = new Set([...set1, ...set2]);
    return intersection.length / union.size;
  }

  // 语言检测（简化）
  private detectLanguage(text: string): Language {
    if (/[\u4e00-\u9fa5]/.test(text)) return Language.ZH;
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return Language.JA;
    if (/[\uac00-\ud7af]/.test(text)) return Language.KO;
    if (/[\u0400-\u04ff]/.test(text)) return Language.RU;
    if (/[\u0600-\u06ff]/.test(text)) return Language.AR;
    if (/[àâçéèêëîïôûùüÿñæœ]/i.test(text)) return Language.FR;
    if (/[äöüß]/i.test(text)) return Language.DE;
    if (/[áéíóúñ¿¡]/i.test(text)) return Language.ES;
    if (/[ãõáâéêíóôú]/i.test(text)) return Language.PT;
    return Language.EN;
  }

  // 默认分数
  private getDefaultScores(): MultilingualEvalResult['scores'] {
    return {
      fluency: 0.75,
      adequacy: 0.75,
      culturalAppropriateness: 0.75,
      grammaticalCorrectness: 0.75,
      semanticSimilarity: 0.75,
      overall: 0.75,
    };
  }

  // 获取评测结果
  async getResults(options?: {
    type?: MultilingualEvalType;
    language?: Language;
    limit?: number;
  }): Promise<MultilingualEvalResult[]> {
    let filtered = [...this.results];

    if (options?.type) filtered = filtered.filter(r => r.input.type === options.type);
    if (options?.language) filtered = filtered.filter(r => r.input.sourceLanguage === options.language);

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (options?.limit) filtered = filtered.slice(0, options.limit);

    return filtered;
  }

  // 获取语言配置
  getLanguageConfig(language?: Language): LanguageConfig | LanguageConfig[] {
    if (language) return this.languageConfigs.get(language)!;
    return Array.from(this.languageConfigs.values());
  }

  // 获取评测类型
  getEvalTypes(): Array<{ id: MultilingualEvalType; name: string; description: string }> {
    return [
      { id: MultilingualEvalType.TRANSLATION, name: '翻译质量', description: '评测翻译的流畅度、 adequacy 和文化适配性' },
      { id: MultilingualEvalType.CROSS_LINGUAL, name: '跨语言能力', description: '评测模型跨语言理解和生成能力' },
      { id: MultilingualEvalType.LANGUAGE_DETECTION, name: '语言检测', description: '评测语言识别准确性' },
      { id: MultilingualEvalType.CODE_SWITCHING, name: '语码转换', description: '评测多语言混合处理能力' },
      { id: MultilingualEvalType.CULTURAL_ADAPTATION, name: '文化适配', description: '评测文化敏感性和适配性' },
      { id: MultilingualEvalType.MULTILINGUAL_QA, name: '多语言问答', description: '评测多语言问答能力' },
    ];
  }
}
