import { Tag } from 'antd';

const COLOR_MAP: Record<string, string> = {
  N: 'default',
  R: 'blue',
  SR: 'purple',
  SSR: 'gold',
  UR: 'red',
};

export default function RarityTag({ rarity }: { rarity?: string }) {
  const key = String(rarity || 'N').toUpperCase();
  return <Tag color={COLOR_MAP[key] || 'default'}>{key}</Tag>;
}
