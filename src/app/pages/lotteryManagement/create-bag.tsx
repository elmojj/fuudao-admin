'use client';

import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ProCard,
  ProFormDateTimePicker,
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProFormUploadButton,
  StepsForm,
} from '@ant-design/pro-components';
import { SelectProps, message } from 'antd';
import { RcFile, UploadFile, UploadProps } from 'antd/es/upload';
import { useEffect, useRef, useState } from 'react';
import { useAppLocation, useAppNavigate } from 'src/utils/app-navigation';
import { uploadRequest } from 'src/app/host-app';
import getBagCategoryList from 'src/app/request/bag-category-list';
import { EditorBagFormType, createAndEditBag } from 'src/app/request/bag-list';

import dayjs from 'dayjs';
import {
  EditorBagItemFormType,
  createAndEditBagItemBatch,
} from 'src/app/request/bag-item';
import EditLottery from './edit-lottery';

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};
export default function CreateBag() {
  const { state } = useAppLocation();
  const navigate = useAppNavigate();
  const [bagInfo, setBagInfo] = useState<EditorBagFormType>();
  const [sharePhotoFile, setSharePhotoFile] = useState<UploadFile[]>([]);
  const [coverFile, setCoverFile] = useState<UploadFile[]>([]);
  const [saveTime, setSaveTime] = useState<string | undefined>(undefined);
  const formRef = useRef<ProFormInstance>();
  const [categorySelector, setCategorySelector] =
    useState<SelectProps['options']>();
  const getCategorySelector = () => {
    getBagCategoryList({ page: 1, pageSize: 100 }).then((res) => {
      setCategorySelector(
        res.list.map((item) => ({
          value: item.id,
          label: item.categoryName,
        })),
      );
    });
  };

  useEffect(() => {
    if (state) {
      const bagInfos = (state as { record: any }).record;
      const formData: EditorBagFormType = {
        id: bagInfos.copyNewOne ? undefined : bagInfos.id,
        categoryId: bagInfos.categoryId,
        packageName: bagInfos.packageName,
        cover: bagInfos.cover,
        sharePhoto: bagInfos.sharePhoto,
        price: bagInfos.price,
        startTime: bagInfos.startTime,
        endTime: bagInfos.endTime,
        totalPackage: bagInfos.totalPackage,
        everyPrizeItemId: bagInfos.everyPrizeItemId,
        hasEveryPrize: bagInfos.hasEveryPrize,
        everyPrizeCount: bagInfos.everyPrizeCount,
        hasLastPrize: bagInfos.hasLastPrize,
        lastPrizeItemId: bagInfos.lastPrizeItemId,
        limitBuy: bagInfos.limitBuy,
        status: bagInfos.status,
      };
      setSharePhotoFile(
        formData.sharePhoto
          ? [
              {
                uid: 'sharePhoto',
                name: 'sharePhoto',
                status: 'done',
                url: formData.sharePhoto,
              },
            ]
          : [],
      );
      setCoverFile(
        formData.cover
          ? [
              {
                uid: 'cover',
                name: 'cover',
                status: 'done',
                url: formData.cover,
              },
            ]
          : [],
      );
      formRef.current?.setFieldsValue(formData);
    }
  }, [state, categorySelector]);

  useEffect(() => {
    getCategorySelector();
  }, []);

  const uploadFile = (file: RcFile, field: string) => {
    const data = new FormData();
    data.append('file', file as RcFile);
    return uploadRequest({
      params: data,
    }).then((res: any) => {
      if (field === 'cover') {
        formRef.current?.setFieldValue('cover', res.data);
        setCoverFile([
          {
            uid: 'cover',
            name: 'cover',
            status: 'done',
            url: res.data,
          },
        ]);
      } else {
        formRef.current?.setFieldValue('sharePhoto', res.data);
        setSharePhotoFile([
          {
            uid: 'sharePhoto',
            name: 'sharePhoto',
            status: 'done',
            url: res.data,
          },
        ]);
      }
      return res.data;
    });
  };
  const onCreateBag = (values: EditorBagFormType) =>
    createAndEditBag({ ...values }).then((res) => {
      if (res.status === 'Success') {
        message.success(`${values.id ? '福袋更新成功' : '福袋创建成功'}!`);
        setBagInfo(values);
        return true;
      }
      return false;
    });

  const handleCoverChange: UploadProps['onChange'] = ({
    fileList: newFileList,
  }) => setCoverFile(newFileList);

  const handleSharePhotoChange: UploadProps['onChange'] = ({
    fileList: newFileList,
  }) => setSharePhotoFile(newFileList);

  const save = (items: EditorBagItemFormType[]) =>
    createAndEditBagItemBatch(items).then((res) => {
      if (res.status === 'Success') {
        message.success({
          content: '保存成功!',
          onClose: () => {
            navigate(-1);
          },
        });

        return true;
      }
      message.error('保存失败!');
      return false;
    });
  return (
    <ProCard>
      <StepsForm
        formRef={formRef}
        formProps={{
          layout: 'horizontal',
          validateMessages: {
            required: '此项为必填项',
          },
          grid: false,
        }}
        onFinish={async () => {
          setSaveTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
        }}
      >
        <StepsForm.StepForm<EditorBagFormType>
          name="base"
          title="创建福袋"
          onFinish={(formData) => onCreateBag(formData)}
          rowProps={{
            gutter: [12, 12],
          }}
        >
          <ProFormGroup {...layout}>
            <ProFormText name="id" label="福袋ID" hidden />
            <ProFormText
              name="packageName"
              label="福袋名称"
              // tooltip="最长为 24 位，用于标定的唯一 id"
              placeholder="请输入名称"
              rules={[{ required: true }]}
            />
            <ProFormSelect
              label="福袋类型"
              name="categoryId"
              options={categorySelector}
              initialValue={categorySelector?.[0].value}
            />
            <ProFormText
              name="price"
              label="福袋价格"
              placeholder="请输入价格"
              rules={[{ required: true }]}
            />
          </ProFormGroup>
          <ProFormGroup>
            <ProFormText
              name="totalPackage"
              label="格子总数"
              placeholder="请总格子数"
              rules={[{ required: true }]}
            />
            <ProFormText
              name="limitBuy"
              label="限购数量"
              placeholder="默认0"
              initialValue={0}
            />
            <ProFormSwitch name="status" label="是否开启" />
          </ProFormGroup>
          <ProFormGroup>
            <ProFormDateTimePicker
              name="startTime"
              label="开始日期"
              rules={[{ required: true }]}
            />
            <ProFormDateTimePicker
              name="endTime"
              label="结束日期"
              rules={[{ required: true }]}
            />
          </ProFormGroup>
          <ProFormGroup>
            <ProFormSwitch name="hasEveryPrize" label="是否保底赏" />
            <ProFormText
              name="everyPrizeItemId"
              label="保底赏ID"
              placeholder="保底赏ID"
            />
            <ProFormText
              name="everyPrizeCount"
              label="多少个一轮保底赏"
              placeholder="多少个一轮保底赏"
            />
          </ProFormGroup>
          <ProFormGroup>
            <ProFormSwitch name="hasLastPrize" label="是否最终赏" />
            <ProFormText
              name="lastPrizeItemId"
              label="最终赏ID"
              placeholder="最终赏ID"
            />
          </ProFormGroup>
          <ProFormGroup
            colProps={{
              span: 24,
            }}
          >
            <ProFormText name="cover" label="封面图地址" hidden />
            <ProFormUploadButton
              name="file"
              label="封面图"
              max={1}
              fileList={coverFile}
              fieldProps={{
                name: 'file',
                listType: 'picture-card',
              }}
              onChange={handleCoverChange}
              action={(file: RcFile) => uploadFile(file, 'cover')}
            />
            <ProFormText name="sharePhoto" label="封面图地址" hidden />
            <ProFormUploadButton
              name="file2"
              label="分享图"
              max={1}
              fileList={sharePhotoFile}
              fieldProps={{
                name: 'file2',
                listType: 'picture-card',
              }}
              onChange={handleSharePhotoChange}
              action={(file: RcFile) => uploadFile(file, 'sharePhoto')}
            />
          </ProFormGroup>
          <ProFormTextArea
            name="remark"
            label="备注"
            width="lg"
            placeholder="请输入备注"
          />
        </StepsForm.StepForm>
        <StepsForm.StepForm name="lottery" title="创建赏品">
          <EditLottery
            save={save}
            saveTime={saveTime}
            bagInfo={bagInfo}
            copyId={
              !(state as { record?: { copyNewOne?: boolean; id?: string } })
                ?.record?.copyNewOne
                ? undefined
                : (state as { record?: { id?: string } })?.record?.id
            }
          />
        </StepsForm.StepForm>
      </StepsForm>
    </ProCard>
  );
}
