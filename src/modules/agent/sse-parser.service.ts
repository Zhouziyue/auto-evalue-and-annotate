import { Injectable } from '@nestjs/common';
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';
import { Readable } from 'stream';

interface ParsedResult {
  text: string;
  raw: string;
  detectedFormat: string;
  tokenCount: number;
}

@Injectable()
export class SseParserService {
  /**
   * 自动检测 SSE 响应格式
   */
  async detectFormat(stream: Readable): Promise<string> {
    const chunks: string[] = [];
    let chunkCount = 0;

    return new Promise((resolve) => {
      const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event' && chunkCount < 5) {
          chunks.push(event.data);
          chunkCount++;

          if (chunkCount >= 5) {
            const format = this.inferFormat(chunks);
            resolve(format);
          }
        }
      });

      stream.on('data', (chunk: Buffer) => {
        parser.feed(chunk.toString());
      });

      stream.on('end', () => {
        if (chunkCount === 0) {
          resolve('unknown');
        } else {
          resolve(this.inferFormat(chunks));
        }
      });

      stream.on('error', () => {
        resolve('error');
      });

      // 超时保护
      setTimeout(() => {
        resolve(chunkCount > 0 ? this.inferFormat(chunks) : 'unknown');
      }, 5000);
    });
  }

  /**
   * 解析 SSE 流
   */
  async parseStream(
    stream: Readable,
    format: string,
    template: Record<string, any> | null,
    onChunk?: (chunk: string) => void,
  ): Promise<ParsedResult> {
    const textParts: string[] = [];
    const rawParts: string[] = [];
    let detectedFormat = format;

    return new Promise((resolve, reject) => {
      const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          rawParts.push(event.data);

          let text = '';

          if (format === 'auto') {
            text = this.extractTextAuto(event.data);
          } else if (format === 'custom' && template) {
            text = this.extractWithTemplate(event.data, template);
          } else {
            text = this.extractWithFormat(event.data, format);
          }

          if (text) {
            textParts.push(text);
            onChunk?.(text);
          }
        }
      });

      stream.on('data', (chunk: Buffer) => {
        parser.feed(chunk.toString());
      });

      stream.on('end', () => {
        resolve({
          text: textParts.join(''),
          raw: rawParts.join('\n'),
          detectedFormat: detectedFormat === 'auto' ? this.inferFormat(rawParts) : detectedFormat,
          tokenCount: this.estimateTokenCount(textParts.join('')),
        });
      });

      stream.on('error', reject);
    });
  }

  /**
   * 根据样本推断 SSE 格式
   */
  private inferFormat(chunks: string[]): string {
    for (const chunk of chunks) {
      try {
        const data = JSON.parse(chunk);

        if (data.content !== undefined) return 'content';
        if (data.delta?.content !== undefined) return 'delta';
        if (data.choices?.[0]?.delta?.content !== undefined) return 'openai';
        if (data.text !== undefined) return 'text';
        if (data.output !== undefined) return 'output';
      } catch {
        // 非 JSON 格式
        if (chunk.startsWith('data: ')) {
          return 'raw_sse';
        }
      }
    }
    return 'unknown';
  }

  /**
   * 自动提取文本
   */
  private extractTextAuto(rawData: string): string {
    try {
      const data = JSON.parse(rawData);

      // OpenAI 格式
      if (data.choices?.[0]?.delta?.content) {
        return data.choices[0].delta.content;
      }

      // content 格式
      if (data.content !== undefined) {
        return typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
      }

      // delta 格式
      if (data.delta?.content) {
        return data.delta.content;
      }

      // text 格式
      if (data.text !== undefined) {
        return data.text;
      }

      // output 格式
      if (data.output !== undefined) {
        return data.output;
      }

      return '';
    } catch {
      return rawData;
    }
  }

  /**
   * 按已知格式提取
   */
  private extractWithFormat(rawData: string, format: string): string {
    try {
      const data = JSON.parse(rawData);

      switch (format) {
        case 'content':
          return data.content || '';
        case 'delta':
          return data.delta?.content || '';
        case 'text':
          return data.text || '';
        case 'output':
          return data.output || '';
        default:
          return this.extractTextAuto(rawData);
      }
    } catch {
      return rawData;
    }
  }

  /**
   * 使用自定义模板提取
   */
  private extractWithTemplate(rawData: string, template: Record<string, any>): string {
    try {
      const data = JSON.parse(rawData);
      const jsonPath = template.jsonPath || template.path;

      if (jsonPath) {
        return this.resolveJsonPath(data, jsonPath);
      }

      if (template.regex) {
        const match = rawData.match(new RegExp(template.regex));
        return match ? match[1] || match[0] : '';
      }

      return '';
    } catch {
      return '';
    }
  }

  /**
   * 简易 JSONPath 解析
   */
  private resolveJsonPath(data: any, path: string): string {
    const parts = path.replace(/^\$\.?/, '').split('.');
    let current = data;

    for (const part of parts) {
      if (current === undefined || current === null) return '';

      // 处理数组索引 data.choices[0].delta.content
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        current = current[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        current = current[part];
      }
    }

    return typeof current === 'string' ? current : JSON.stringify(current || '');
  }

  /**
   * 获取格式推荐说明
   */
  getRecommendation(format: string): string {
    const recommendations: Record<string, string> = {
      content: '检测到 content 格式，建议使用 sseFormat: "content"',
      delta: '检测到 delta 格式，建议使用 sseFormat: "delta"',
      openai: '检测到 OpenAI 格式，建议使用 sseFormat: "delta"',
      text: '检测到 text 格式，建议使用 sseFormat: "text"',
      output: '检测到 output 格式，建议使用 sseFormat: "output"',
      raw_sse: '检测到原始 SSE 格式，建议配置自定义解析模板',
      unknown: '未能识别格式，建议配置自定义 JSONPath 或正则模板',
    };
    return recommendations[format] || '未知格式';
  }

  /**
   * 粗略估算 token 数量
   */
  private estimateTokenCount(text: string): number {
    // 粗略估算：中文约 1.5 字符/token，英文约 4 字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }
}
