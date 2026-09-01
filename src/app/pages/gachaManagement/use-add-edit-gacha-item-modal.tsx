'use client';

import { ModalForm, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText } from '@ant-design/pro-components';
import { Form, message } from 'antd';
import { useState } from 'react';
import { saveGachaItem, type GachaItemRecord } from 'src/app/request/gacha-admin';

const RARITY_OPTIONS = ['N', 'R', 'SR', 'SSR', 'UR'].map((v) => ({ label: v, value: v }));
const ANIM_OPTIONS = ['normal', 'gold', 'rainbow'].map((v) => ({ label: v, value: v }));

type FormValues = Omit<Partial<GachaItemRecord>, 'status'> & {
  status?: boolean;
};

export default function useAddEditGachaItemModal({
  callBack,
  defaultPoolId,
}: {
  callBack?: () => void;
  defaultPoolId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [itemId, setItemId] = useState<string>();

  const toEdit = (row?: GachaItemRecord) => {
    setOpen(true);
    setItemId(row?.itemId);
    form.setFieldsValue(
      row
        ? { ...row, status: row.status === 1, isLimited: row.isLimited }
        : {
        poolId: defaultPoolId || 'default',
        rarity: 'N',
        rarityScore: 1,
        scoreValue: 10,
        series: '星际漫游',
        seriesTotal: 6,
        animation: 'normal',
        dropWeight: 10,
        status: true,
      },
    );
  };

  const contextModal = (
    <ModalForm<FormValues>
      title={itemId ? '编辑赏品' : '新建赏品'}
      open={open}
      form={form}
      width={520}
      modalProps={{ destroyOnClose: true, onCancel: () => setOpen(false) }}
      onFinish={async (values) => {
        const res = await saveGachaItem({
          ...values,
          status: values.status ? 1 : 0,
        });
        if (res.status === 'Success') {
          message.success('保存成功');
          setOpen(false);
          callBack?.();
          return true;
        }
        message.error(res.errorMessage);
        return false;
      }}
    >
      <ProFormText name="itemId" label="赏品 ID" rules={[{ required: true }]} disabled={!!itemId} />
      <ProFormText name="poolId" label="所属赏池" rules={[{ required: true }]} />
      <ProFormText name="name" label="名称" rules={[{ required: true }]} />
      <ProFormSelect name="rarity" label="稀有度" options={RARITY_OPTIONS} rules={[{ required: true }]} />
      <ProFormDigit name="rarityScore" label="欧气值" min={1} />
      <ProFormDigit name="scoreValue" label="积分值" min={0} />
      <ProFormText name="series" label="套系" />
      <ProFormDigit name="seriesTotal" label="套系总数" min={1} />
      <ProFormDigit name="dropWeight" label="权重" min={0.01} />
      <ProFormSelect name="animation" label="动画" options={ANIM_OPTIONS} />
      <ProFormText name="image" label="图片 URL" />
      <ProFormSwitch name="isLimited" label="限时" />
      <ProFormSwitch name="status" label="上架" convertValue={(v) => v === 1 || v === true} />
    </ModalForm>
  );

  return { contextModal, toEdit };
}
