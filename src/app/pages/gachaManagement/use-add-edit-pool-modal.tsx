'use client';

import {
  ModalForm,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Form, message } from 'antd';
import { useState } from 'react';
import { saveGachaPool, type GachaPoolItem } from 'src/app/request/gacha-admin';

type PoolFormValues = Omit<Partial<GachaPoolItem>, 'status'> & { status?: boolean };

export default function useAddEditPoolModal({
  callBack,
}: {
  callBack?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<PoolFormValues>();
  const [poolId, setPoolId] = useState<string>();

  const toEdit = (row?: GachaPoolItem) => {
    setOpen(true);
    setPoolId(row?.poolId);
    form.setFieldsValue(
      row
        ? { ...row, status: row.status === 1 }
        : { status: true, poolId: `pool_${Date.now()}`, sort: 0 },
    );
  };

  const contextModal = (
    <ModalForm<PoolFormValues>
      title={poolId ? '编辑赏池' : '新建赏池'}
      open={open}
      form={form}
      modalProps={{ destroyOnClose: true, onCancel: () => setOpen(false) }}
      onFinish={async (values) => {
        const res = await saveGachaPool({
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
      <ProFormText name="poolId" label="赏池 ID" rules={[{ required: true }]} disabled={!!poolId} />
      <ProFormText name="name" label="名称" rules={[{ required: true }]} />
      <ProFormDigit
        name="sort"
        label="排序"
        min={0}
        fieldProps={{ precision: 0 }}
        tooltip="数值越大越靠前"
        rules={[{ required: true }]}
      />
      <ProFormTextArea name="description" label="描述" />
      <ProFormText name="coverImage" label="封面图 URL" />
      <ProFormSwitch name="status" label="启用" convertValue={(v) => v === 1 || v === true} />
    </ModalForm>
  );

  return { contextModal, toEdit };
}
