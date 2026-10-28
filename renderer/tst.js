// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
/* 真太阳时统一计算（紫微/八字时辰校正用，纯函数，全局 TST）
 * 移植自开源项目 ziwei-doushu-main/lib/ziwei/true-solar-time.ts（算法公开：NOAA 均时差近似式 + 经度修正 + 晚子时流派规则）
 * 口径：地方真太阳时 = 东八区钟表时间 + 经度修正（(经度-120)×4 分钟）+ 均时差（NOAA fractional-year 近似，1900-2026 稳定）
 * 用途：工具层校正，非古籍内容。校正结果用于时辰分野提示；是否以校正时辰排盘由用户开关决定。
 */
'use strict';
const TST = (() => {
  const MINUTES_PER_DAY = 1440;
  const SECONDS_PER_DAY = 86400;
  const mod = (value, base) => ((value % base) + base) % base;

  function isLeapYear(year) { return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0); }
  function dayOfYear(year, month, day) {
    return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000);
  }
  function isValidDate(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
  }
  /** NOAA 均时差（分钟），正值=真太阳时快于平太阳时 */
  function equationOfTimeMinutes(year, month, day, clockHour = 12, clockMinute = 0) {
    if (!isValidDate(year, month, day)) return 0;
    const daysInYear = isLeapYear(year) ? 366 : 365;
    const fh = clockHour + clockMinute / 60;
    const gamma = (2 * Math.PI / daysInYear) * (dayOfYear(year, month, day) - 1 + (fh - 12) / 24);
    return 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  }
  /** 真太阳分钟 → 时辰地支序（0=子 … 11=亥；子时跨两日：23:00 起） */
  function branchFromSolarMinutes(normalizedMinutes) {
    if (normalizedMinutes >= 1380 || normalizedMinutes < 60) return 0; // 子时
    return Math.floor((normalizedMinutes - 60) / 120) + 1;
  }
  /**
   * 计算真太阳时。
   * input: { year, month, day, clockHour, clockMinute, longitude? }
   * longitude 缺省 = 不校正（返回原时间，corrected=false）
   * 返回：correction 明细 + 校正后时分秒 + 时辰 branch + dayOffset（相对输入日的天数偏移，±1）
   */
  function calculate(input) {
    const dateValid = isValidDate(input.year, input.month, input.day);
    const corrected = input.longitude !== undefined && Number.isFinite(input.longitude);
    const lonCorr = corrected ? (input.longitude - 120) * 4 : 0;
    const eot = corrected && dateValid
      ? equationOfTimeMinutes(input.year, input.month, input.day, input.clockHour, input.clockMinute) : 0;
    const total = lonCorr + eot;
    const rawMinutes = input.clockHour * 60 + input.clockMinute + total;
    const roundedTotalSeconds = Math.round(rawMinutes * 60);
    const dayOffset = Math.floor(roundedTotalSeconds / SECONDS_PER_DAY);
    const secondOfDay = mod(roundedTotalSeconds, SECONDS_PER_DAY);
    const hour = Math.floor(secondOfDay / 3600);
    const minute = Math.floor((secondOfDay % 3600) / 60);
    const second = secondOfDay % 60;
    const normalizedMinutes = secondOfDay / 60;
    return {
      dateValid, corrected,
      lonCorrectionMinutes: lonCorr, equationOfTimeMinutes: eot, totalCorrectionMinutes: total,
      rawMinutes, normalizedMinutes, dayOffset, hour, minute, second,
      branch: branchFromSolarMinutes(normalizedMinutes),
    };
  }
  /**
   * 晚子时流派规则 + 排盘日偏移。
   * lateZishi: 'next-day'（晚子时算次日·主流）| 'current-day'（晚子时算当日）| 'all-current'（全部算当日）| 'day-cur-time-next'（日干随时辰换日）
   * 返回 { dayOffset, branch, isLateZishi }
   */
  function resolveDayOffset(solar, lateZishi = 'next-day') {
    const nextDayRule = lateZishi === 'next-day';
    const isLateZishi = solar.branch === 0 && solar.normalizedMinutes >= 1380;
    if (solar.dayOffset < 0 && isLateZishi) return nextDayRule ? solar.dayOffset + 1 : solar.dayOffset;
    if (solar.dayOffset !== 0) return solar.dayOffset;
    if (isLateZishi) return nextDayRule ? 1 : 0;
    return 0;
  }
  /** 时辰名（含晚子时区分） */
  function branchName(branch, normalizedMinutes) {
    if (branch === 0 && normalizedMinutes >= 1380) return '晚子时';
    if (branch === 0) return '早子时';
    return ['丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][branch - 1];
  }
  function formatClock(hour, minute, second, withSeconds = false) {
    const b = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
    return withSeconds ? b + ':' + String(second).padStart(2, '0') : b;
  }
  return { calculate, resolveDayOffset, branchFromSolarMinutes, branchName, formatClock, equationOfTimeMinutes, mod };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = TST; }
