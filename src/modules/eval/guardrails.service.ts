// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 护栏类型
export enum GuardType {
  INPUT = 'input',     // 输入护栏
  OUTPUT = 'output',   // 输出护栏
}

// 验证器类型
export enum ValidatorType {
  PII_DETECTION = 'pii_detection',           // PII 检测
  TOXICITY_FILTER = 'toxicity_filter',       // 毒性过滤
  JSON_SCHEMA = 'json_schema',               // JSON Schema 验证
  REGEX = 'regex',                           // 正则表达式验证
  LENGTH = 'length',                         // 长度限制
  KEYWORDS = 'keywords',                     // 关键词过滤
  CUSTOM = 'custom',                         // 自定义规则
}

// 验证器配置
export interface ValidatorConfig {
  id: string;
  name: string;
  type: ValidatorType;
  guardType: GuardType;
  enabled: boolean;
  config: Record<string, any>;
  action: 'block' | 'warn' | 'mask';  // 阻断/警告/脱敏
  errorMessage?: string;
}

// 验证结果
export interface ValidationResult {
  validatorId: string;
  validatorName: string;
  type: ValidatorType;
  passed: boolean;
  action: 'block' | 'warn' | 'mask' | 'pass';
  details?: string;
  maskedOutput?: string;  // 脱敏后的输出
}

// 护栏检查结果
export interface GuardrailResult {
  originalInput?: string;
  originalOutput?: string;
  processedInput?: string;
  processedOutput?: string;
  validations: ValidationResult[];
  passed: boolean;
  blocked: boolean;
  warnings: string[];
}

// 预定义验证器
const DEFAULT_VALIDATORS: ValidatorConfig[] = [
  {
    id: 'pii_email',
    name: '邮箱 PII 检测',
    type: ValidatorType.PII_DETECTION,
    guardType: GuardType.OUTPUT,
    enabled: true,
    config: { pattern: 'email' },
    action: 'mask',
    errorMessage: '检测到邮箱信息，已自动脱敏',
  },
  {
    id: 'pii_phone',
    name: '手机号 PII 检测',
    type: ValidatorType.PII_DETECTION,
    guardType: GuardType.OUTPUT,
    enabled: true,
    config: { pattern: 'phone' },
    action: 'mask',
    errorMessage: '检测到手机号信息，已自动脱敏',
  },
  {
    id: 'pii_id_card',
    name: '身份证号 PII 检测',
    type: ValidatorType.PII_DETECTION,
    guardType: GuardType.OUTPUT,
    enabled: true,
    config: { pattern: 'id_card' },
    action: 'mask',
    errorMessage: '检测到身份证号信息，已自动脱敏',
  },
  {
    id: 'toxicity_basic',
    name: '基础毒性过滤',
    type: ValidatorType.TOXICITY_FILTER,
    guardType: GuardType.OUTPUT,
    enabled: true,
    config: {
      keywords: ['暴力', '歧视', '仇恨', '自杀方法', '制毒方法'],
      threshold: 0.7,
    },
    action: 'block',
    errorMessage: '内容包含有害信息，已被阻断',
  },
  {
    id: 'length_max',
    name: '最大长度限制',
    type: ValidatorType.LENGTH,
    guardType: GuardType.OUTPUT,
    enabled: true,
    config: { max: 10000, min: 0 },
    action: 'block',
    errorMessage: '输出超过最大长度限制',
  },
  {
    id: 'input_injection',
    name: '输入注入检测',
    type: ValidatorType.KEYWORDS,
    guardType: GuardType.INPUT,
    enabled: true,
    config: {
      keywords: ['ignore previous', 'forget instructions', 'system prompt', '忽略之前', '忘记指令'],
      mode: 'any',
    },
    action: 'block',
    errorMessage: '检测到潜在的提示注入攻击',
  },
];

@Injectable()
export class GuardrailsService {
  private validators: Map<string, ValidatorConfig> = new Map();

  constructor() {
    // 初始化默认验证器
    for (const validator of DEFAULT_VALIDATORS) {
      this.validators.set(validator.id, validator);
    }
  }

  // 检查输入
  async checkInput(input: string): Promise<GuardrailResult> {
    const inputValidators = this.getEnabledValidators(GuardType.INPUT);
    const validations: ValidationResult[] = [];
    let processedInput = input;

    for (const validator of inputValidators) {
      const result = await this.runValidator(validator, input);
      validations.push(result);

      if (result.action === 'mask' && result.maskedOutput) {
        processedInput = result.maskedOutput;
      }
    }

    const blocked = validations.some(v => v.action === 'block');
    const warnings = validations
      .filter(v => v.action === 'warn' && !v.passed)
      .map(v => v.details || '');

    return {
      originalInput: input,
      processedInput,
      validations,
      passed: !blocked,
      blocked,
      warnings,
    };
  }

  // 检查输出
  async checkOutput(output: string): Promise<GuardrailResult> {
    const outputValidators = this.getEnabledValidators(GuardType.OUTPUT);
    const validations: ValidationResult[] = [];
    let processedOutput = output;

    for (const validator of outputValidators) {
      const result = await this.runValidator(validator, output);
      validations.push(result);

      if (result.action === 'mask' && result.maskedOutput) {
        processedOutput = result.maskedOutput;
      }
    }

    const blocked = validations.some(v => v.action === 'block');
    const warnings = validations
      .filter(v => v.action === 'warn' && !v.passed)
      .map(v => v.details || '');

    return {
      originalOutput: output,
      processedOutput,
      validations,
      passed: !blocked,
      blocked,
      warnings,
    };
  }

  // 同时检查输入和输出
  async checkBoth(input: string, output: string): Promise<{
    inputResult: GuardrailResult;
    outputResult: GuardrailResult;
    passed: boolean;
  }> {
    const inputResult = await this.checkInput(input);
    const outputResult = await this.checkOutput(output);

    return {
      inputResult,
      outputResult,
      passed: inputResult.passed && outputResult.passed,
    };
  }

  // 获取所有验证器
  getValidators(): ValidatorConfig[] {
    return Array.from(this.validators.values());
  }

  // 获取单个验证器
  getValidator(id: string): ValidatorConfig | undefined {
    return this.validators.get(id);
  }

  // 创建自定义验证器
  createValidator(config: Omit<ValidatorConfig, 'id'>): ValidatorConfig {
    const id = `validator_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newValidator: ValidatorConfig = { ...config, id };
    this.validators.set(id, newValidator);
    return newValidator;
  }

  // 启用/禁用验证器
  toggleValidator(id: string, enabled: boolean): ValidatorConfig | undefined {
    const validator = this.validators.get(id);
    if (validator) {
      validator.enabled = enabled;
      this.validators.set(id, validator);
    }
    return validator;
  }

  // 运行单个验证器
  private async runValidator(
    validator: ValidatorConfig,
    content: string,
  ): Promise<ValidationResult> {
    let passed = true;
    let details = '';
    let maskedOutput: string | undefined;

    switch (validator.type) {
      case ValidatorType.PII_DETECTION:
        const piiResult = this.detectPII(validator.config.pattern, content);
        passed = piiResult.passed;
        details = piiResult.details;
        maskedOutput = piiResult.maskedContent;
        break;

      case ValidatorType.TOXICITY_FILTER:
        const toxicityResult = this.detectToxicity(validator.config.keywords, content);
        passed = toxicityResult.passed;
        details = toxicityResult.details;
        break;

      case ValidatorType.JSON_SCHEMA:
        const schemaResult = this.validateJSONSchema(validator.config.schema, content);
        passed = schemaResult.passed;
        details = schemaResult.details;
        break;

      case ValidatorType.REGEX:
        const regexResult = this.validateRegex(validator.config.pattern, content);
        passed = regexResult.passed;
        details = regexResult.details;
        break;

      case ValidatorType.LENGTH:
        const lengthResult = this.validateLength(validator.config, content);
        passed = lengthResult.passed;
        details = lengthResult.details;
        break;

      case ValidatorType.KEYWORDS:
        const keywordResult = this.detectKeywords(validator.config.keywords, validator.config.mode, content);
        passed = keywordResult.passed;
        details = keywordResult.details;
        break;

      default:
        passed = true;
        details = 'Unknown validator type';
    }

    return {
      validatorId: validator.id,
      validatorName: validator.name,
      type: validator.type,
      passed,
      action: passed ? 'pass' : validator.action,
      details: passed ? undefined : (details || validator.errorMessage),
      maskedOutput: passed ? undefined : maskedOutput,
    };
  }

  // 获取启用的验证器
  private getEnabledValidators(guardType: GuardType): ValidatorConfig[] {
    return Array.from(this.validators.values()).filter(
      v => v.enabled && v.guardType === guardType,
    );
  }

  // PII 检测
  private detectPII(pattern: string, content: string): {
    passed: boolean;
    details: string;
    maskedContent?: string;
  } {
    const patterns: Record<string, RegExp> = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b1[3-9]\d{9}\b/g,
      id_card: /\b\d{17}[\dXx]\b/g,
      bank_card: /\b\d{16,19}\b/g,
    };

    const regex = patterns[pattern];
    if (!regex) return { passed: true, details: '' };

    const matches = content.match(regex);
    if (!matches || matches.length === 0) {
      return { passed: true, details: '' };
    }

    let masked = content;
    for (const match of matches) {
      const maskedValue = match.substring(0, 3) + '***' + match.substring(match.length - 2);
      masked = masked.replace(new RegExp(match, 'g'), maskedValue);
    }

    return {
      passed: false,
      details: `检测到 ${matches.length} 处 ${pattern} 信息`,
      maskedContent: masked,
    };
  }

  // 毒性检测
  private detectToxicity(keywords: string[], content: string): {
    passed: boolean;
    details: string;
  } {
    const lowerContent = content.toLowerCase();
    const found = keywords.filter(kw => lowerContent.includes(kw.toLowerCase()));

    if (found.length === 0) {
      return { passed: true, details: '' };
    }

    return {
      passed: false,
      details: `检测到有害关键词: ${found.join(', ')}`,
    };
  }

  // JSON Schema 验证（简化版）
  private validateJSONSchema(schema: any, content: string): {
    passed: boolean;
    details: string;
  } {
    try {
      const parsed = JSON.parse(content);
      // 简化版：只检查是否为有效 JSON
      return { passed: true, details: '' };
    } catch (e) {
      return {
        passed: false,
        details: `JSON 解析失败: ${e.message}`,
      };
    }
  }

  // 正则验证
  private validateRegex(pattern: string, content: string): {
    passed: boolean;
    details: string;
  } {
    try {
      const regex = new RegExp(pattern);
      const passed = regex.test(content);
      return {
        passed,
        details: passed ? '' : `内容不匹配正则: ${pattern}`,
      };
    } catch (e) {
      return {
        passed: false,
        details: `正则表达式错误: ${e.message}`,
      };
    }
  }

  // 长度验证
  private validateLength(config: { min?: number; max?: number }, content: string): {
    passed: boolean;
    details: string;
  } {
    const length = content.length;
    const min = config.min || 0;
    const max = config.max || Infinity;

    if (length < min) {
      return { passed: false, details: `内容长度 ${length} 小于最小值 ${min}` };
    }
    if (length > max) {
      return { passed: false, details: `内容长度 ${length} 超过最大值 ${max}` };
    }

    return { passed: true, details: '' };
  }

  // 关键词检测
  private detectKeywords(keywords: string[], mode: 'any' | 'all', content: string): {
    passed: boolean;
    details: string;
  } {
    const lowerContent = content.toLowerCase();
    const found = keywords.filter(kw => lowerContent.includes(kw.toLowerCase()));

    if (mode === 'any') {
      if (found.length > 0) {
        return { passed: false, details: `检测到关键词: ${found.join(', ')}` };
      }
    } else {
      if (found.length < keywords.length) {
        const missing = keywords.filter(kw => !found.includes(kw));
        return { passed: false, details: `缺少关键词: ${missing.join(', ')}` };
      }
    }

    return { passed: true, details: '' };
  }
}
