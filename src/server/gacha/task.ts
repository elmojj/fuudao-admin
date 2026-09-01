import type { PoolClient } from 'pg';
import { query, withTransaction } from '../db';
import { grantDrawChances } from './chance';
import { todayDateStr } from './utils';
import type { TaskType } from './types';

const TASK_CONFIG: Record<
  TaskType,
  { title: string; description: string; reward: number; dailyLimit: number }
> = {
  login: {
    title: '每日登录',
    description: '每日登录领取抽赏次数',
    reward: 2,
    dailyLimit: 1,
  },
  share: {
    title: '分享抽赏结果',
    description: '分享给好友或群聊',
    reward: 1,
    dailyLimit: 3,
  },
  invite: {
    title: '邀请新用户',
    description: '邀请好友注册，双方各得奖励',
    reward: 5,
    dailyLimit: 9999,
  },
  checkin: {
    title: '每日签到',
    description: '连续签到第7天额外奖励',
    reward: 1,
    dailyLimit: 1,
  },
  ad: {
    title: '浏览广告',
    description: '观看激励视频',
    reward: 1,
    dailyLimit: 2,
  },
  series_complete: {
    title: '集齐套系',
    description: '自动发放',
    reward: 3,
    dailyLimit: 0,
  },
};

async function countTaskToday(userId: string, taskType: string) {
  const res = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM gacha_task_log
     WHERE user_id = $1 AND task_type = $2 AND task_date = CURRENT_DATE`,
    [userId, taskType],
  );
  return Number(res.rows[0]?.cnt ?? 0);
}

export async function getTaskList(userId: string) {
  const userRes = await query(
    `SELECT checkin_streak, last_checkin_date FROM app_user WHERE id = $1`,
    [userId],
  );
  const user = userRes.rows[0];
  const today = todayDateStr();
  const todayClaimed =
    user?.last_checkin_date &&
    String(user.last_checkin_date).slice(0, 10) === today;

  const weekRewardClaimed = Number(user?.checkin_streak ?? 0) >= 7;

  const taskTypes: TaskType[] = ['login', 'share', 'invite', 'checkin'];
  const tasks = await Promise.all(
    taskTypes.map(async (type) => {
      const cfg = TASK_CONFIG[type];
      const progress = await countTaskToday(userId, type);
      let status: 'available' | 'claimed' | 'locked' = 'available';
      if (type === 'invite') {
        status = 'available';
      } else if (progress >= cfg.dailyLimit) {
        status = 'claimed';
      }
      return {
        type,
        title: cfg.title,
        description: cfg.description,
        reward: cfg.reward,
        progress: Math.min(progress, cfg.dailyLimit),
        limit: cfg.dailyLimit === 9999 ? 0 : cfg.dailyLimit,
        status,
      };
    }),
  );

  return {
    tasks,
    checkin: {
      consecutiveDays: Number(user?.checkin_streak ?? 0),
      todayClaimed: Boolean(todayClaimed),
      weekRewardClaimed,
    },
  };
}

export async function claimTask(
  userId: string,
  type: TaskType,
): Promise<{ code?: number; message?: string; reward?: number; balance?: number }> {
  const cfg = TASK_CONFIG[type];
  if (!cfg || cfg.dailyLimit === 0) {
    return { code: 1, message: '任务类型无效' };
  }

  if (type === 'invite') {
    return { code: 1, message: '邀请奖励请通过分享绑定领取' };
  }

  return withTransaction(async (client) => {
    if (type === 'checkin') {
      const userRes = await client.query(
        `SELECT checkin_streak, last_checkin_date FROM app_user WHERE id = $1 FOR UPDATE`,
        [userId],
      );
      const user = userRes.rows[0];
      const today = todayDateStr();
      const lastDate = user?.last_checkin_date
        ? String(user.last_checkin_date).slice(0, 10)
        : '';
      if (lastDate === today) {
        return { code: 1, message: '今日已签到' };
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = todayDateStr(yesterday);

      let streak = Number(user?.checkin_streak ?? 0);
      if (lastDate === yesterdayStr) streak += 1;
      else streak = 1;

      let reward = cfg.reward;
      let weekBonus = 0;
      if (streak === 7) weekBonus = 5;

      await client.query(
        `UPDATE app_user
         SET checkin_streak = $2,
             last_checkin_date = CURRENT_DATE,
             week_task_points = week_task_points + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [userId, streak],
      );

      await client.query(
        `INSERT INTO gacha_task_log (user_id, task_type, task_date, reward)
         VALUES ($1, 'checkin', CURRENT_DATE, $2)`,
        [userId, reward + weekBonus],
      );

      const totalReward = reward + weekBonus;
      const balance = await grantDrawChances(
        client,
        userId,
        totalReward,
        'checkin',
      );
      return { reward: totalReward, balance };
    }

    const progress = await countTaskToday(userId, type);
    if (progress >= cfg.dailyLimit) {
      return { code: 1, message: '今日奖励已领取' };
    }

    await client.query(
      `INSERT INTO gacha_task_log (user_id, task_type, task_date, reward)
       VALUES ($1, $2, CURRENT_DATE, $3)`,
      [userId, type, cfg.reward],
    );

    if (type === 'login') {
      await client.query(
        `UPDATE app_user SET week_task_points = week_task_points + 1, updated_at = NOW()
         WHERE id = $1`,
        [userId],
      );
    }

    const balance = await grantDrawChances(
      client,
      userId,
      cfg.reward,
      type,
    );
    return { reward: cfg.reward, balance };
  });
}
