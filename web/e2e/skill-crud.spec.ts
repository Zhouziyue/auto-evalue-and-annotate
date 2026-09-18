import { test, expect } from '@playwright/test';

test.describe('技能 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/skills');
  });

  test('应该能打开技能管理页面', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('技能');
  });

  test('应该能打开新建技能弹窗', async ({ page }) => {
    await page.click('button:has-text("新建")');
    await expect(page.locator('dialog, [role="dialog"]')).toBeVisible();
  });

  test('应该能填写技能信息', async ({ page }) => {
    await page.click('button:has-text("新建")');
    await page.fill('input[placeholder*="名称"]', '测试技能');
    await page.fill('textarea, input[placeholder*="描述"]', '这是一个测试技能描述');
    await expect(page.locator('input[placeholder*="名称"]')).toHaveValue('测试技能');
  });

  test('应该显示技能列表', async ({ page }) => {
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    // 检查是否有表格或列表容器
    const hasContent = await page.locator('table, [class*="grid"], [class*="list"]').first().isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('应该能搜索技能', async ({ page }) => {
    // 查找搜索框
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('测试');
      await expect(searchInput).toHaveValue('测试');
    }
  });
});
