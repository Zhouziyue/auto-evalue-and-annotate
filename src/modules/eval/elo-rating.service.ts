// @ts-nocheck
import { Injectable } from '@nestjs/common';

// Elo 配置
const DEFAULT_K_FACTOR = 32;
const DEFAULT_INITIAL_RATING = 1200;

// 对战记录
export interface Battle {
  id: string;
  modelA: string;
  modelB: string;
  winner: 'A' | 'B' | 'tie';
  timestamp: Date;
  category?: string;
}

// Elo 排名
export interface EloRanking {
  model: string;
  rating: number;
  battles: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  confidence: number;  // 基于对战次数的置信度
}

// Elo 排行榜
export interface EloLeaderboard {
  rankings: EloRanking[];
  totalBattles: number;
  generatedAt: Date;
}

@Injectable()
export class EloRatingService {
  private battles: Battle[] = [];
  private ratings: Map<string, number> = new Map();

  constructor() {}

  // 记录对战
  recordBattle(battle: Omit<Battle, 'id' | 'timestamp'>): Battle {
    const newBattle: Battle = {
      ...battle,
      id: `battle_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
    };

    this.battles.push(newBattle);
    this.updateRatings(newBattle);

    return newBattle;
  }

  // 批量记录对战
  recordBattles(battles: Omit<Battle, 'id' | 'timestamp'>[]): Battle[] {
    return battles.map(b => this.recordBattle(b));
  }

  // 更新 Elo 评分
  private updateRatings(battle: Battle): void {
    const { modelA, modelB, winner } = battle;

    // 初始化评分
    if (!this.ratings.has(modelA)) {
      this.ratings.set(modelA, DEFAULT_INITIAL_RATING);
    }
    if (!this.ratings.has(modelB)) {
      this.ratings.set(modelB, DEFAULT_INITIAL_RATING);
    }

    const ratingA = this.ratings.get(modelA)!;
    const ratingB = this.ratings.get(modelB)!;

    // 计算期望得分
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

    // 实际得分
    let scoreA: number, scoreB: number;
    switch (winner) {
      case 'A':
        scoreA = 1;
        scoreB = 0;
        break;
      case 'B':
        scoreA = 0;
        scoreB = 1;
        break;
      case 'tie':
        scoreA = 0.5;
        scoreB = 0.5;
        break;
    }

    // 更新评分
    const newRatingA = ratingA + DEFAULT_K_FACTOR * (scoreA - expectedA);
    const newRatingB = ratingB + DEFAULT_K_FACTOR * (scoreB - expectedB);

    this.ratings.set(modelA, newRatingA);
    this.ratings.set(modelB, newRatingB);
  }

  // 生成排行榜
  generateLeaderboard(category?: string): EloLeaderboard {
    const filteredBattles = category
      ? this.battles.filter(b => b.category === category)
      : this.battles;

    // 统计每个模型的战绩
    const stats = new Map<string, { wins: number; losses: number; ties: number }>();

    for (const battle of filteredBattles) {
      if (!stats.has(battle.modelA)) {
        stats.set(battle.modelA, { wins: 0, losses: 0, ties: 0 });
      }
      if (!stats.has(battle.modelB)) {
        stats.set(battle.modelB, { wins: 0, losses: 0, ties: 0 });
      }

      const statsA = stats.get(battle.modelA)!;
      const statsB = stats.get(battle.modelB)!;

      switch (battle.winner) {
        case 'A':
          statsA.wins++;
          statsB.losses++;
          break;
        case 'B':
          statsB.wins++;
          statsA.losses++;
          break;
        case 'tie':
          statsA.ties++;
          statsB.ties++;
          break;
      }
    }

    // 构建排名
    const rankings: EloRanking[] = [];
    for (const [model, rating] of this.ratings.entries()) {
      const modelStats = stats.get(model) || { wins: 0, losses: 0, ties: 0 };
      const totalBattles = modelStats.wins + modelStats.losses + modelStats.ties;
      const winRate = totalBattles > 0 ? modelStats.wins / totalBattles : 0;

      // 置信度基于对战次数
      const confidence = Math.min(1, totalBattles / 30);

      rankings.push({
        model,
        rating,
        battles: totalBattles,
        wins: modelStats.wins,
        losses: modelStats.losses,
        ties: modelStats.ties,
        winRate,
        confidence,
      });
    }

    // 按评分排序
    rankings.sort((a, b) => b.rating - a.rating);

    return {
      rankings,
      totalBattles: filteredBattles.length,
      generatedAt: new Date(),
    };
  }

  // 获取两个模型的预期对战结果
  getExpectedOutcome(modelA: string, modelB: string): {
    expectedScoreA: number;
    expectedScoreB: number;
    ratingDiff: number;
  } {
    const ratingA = this.ratings.get(modelA) || DEFAULT_INITIAL_RATING;
    const ratingB = this.ratings.get(modelB) || DEFAULT_INITIAL_RATING;

    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

    return {
      expectedScoreA: expectedA,
      expectedScoreB: expectedB,
      ratingDiff: ratingA - ratingB,
    };
  }

  // 获取模型评分
  getModelRating(model: string): number {
    return this.ratings.get(model) || DEFAULT_INITIAL_RATING;
  }

  // 获取所有对战记录
  getBattles(model?: string, category?: string): Battle[] {
    let filtered = [...this.battles];

    if (model) {
      filtered = filtered.filter(b => b.modelA === model || b.modelB === model);
    }
    if (category) {
      filtered = filtered.filter(b => b.category === category);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // 重置所有数据
  reset(): void {
    this.battles = [];
    this.ratings.clear();
  }

  // 模拟对战（用于测试）
  simulateBattles(models: string[], battleCount: number): Battle[] {
    const battles: Battle[] = [];

    for (let i = 0; i < battleCount; i++) {
      // 随机选择两个不同的模型
      const idxA = Math.floor(Math.random() * models.length);
      let idxB = Math.floor(Math.random() * models.length);
      while (idxB === idxA) {
        idxB = Math.floor(Math.random() * models.length);
      }

      const modelA = models[idxA];
      const modelB = models[idxB];

      // 基于当前评分计算胜率
      const ratingA = this.ratings.get(modelA) || DEFAULT_INITIAL_RATING;
      const ratingB = this.ratings.get(modelB) || DEFAULT_INITIAL_RATING;
      const probA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

      // 随机决定胜负
      const rand = Math.random();
      let winner: 'A' | 'B' | 'tie';
      if (rand < probA * 0.9) {
        winner = 'A';
      } else if (rand < probA * 0.9 + 0.1) {
        winner = 'tie';
      } else {
        winner = 'B';
      }

      const battle = this.recordBattle({ modelA, modelB, winner });
      battles.push(battle);
    }

    return battles;
  }
}
