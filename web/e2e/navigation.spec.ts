import { test, expect } from '@playwright/test';

test.describe('页面导航', () => {
  test('应该能访问看板页面', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('看板');
  });

  test('应该能导航到技能管理', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("技能管理")');
    await expect(page).toHaveURL(/.*skills/);
  });

  test('应该能导航到智能体管理', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("智能体管理")');
    await expect(page).toHaveURL(/.*agents/);
  });

  test('应该能导航到评测数据集', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("评测数据集")');
    await expect(page).toHaveURL(/.*datasets/);
  });

  test('应该能导航到评测报告', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("评测报告")');
    await expect(page).toHaveURL(/.*reports/);
  });

  test('应该能导航到流水线', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("流水线")');
    await expect(page).toHaveURL(/.*pipelines/);
  });

  test('应该能导航到系统设置', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="系统设置"]');
    await expect(page).toHaveURL(/.*settings/);
  });

  test('侧边栏应该显示所有导航项', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button:has-text("看板")')).toBeVisible();
    await expect(page.locator('button:has-text("技能管理")')).toBeVisible();
    await expect(page.locator('button:has-text("智能体管理")')).toBeVisible();
    await expect(page.locator('button:has-text("评测数据集")')).toBeVisible();
    await expect(page.locator('button:has-text("评测执行")')).toBeVisible();
    await expect(page.locator('button:has-text("评测报告")')).toBeVisible();
    await expect(page.locator('button:has-text("流水线")')).toBeVisible();
  });
});
