import { SelectProps as AntdSelectProps, Image, Select } from 'antd';

type ValueType = string;
type OptionType = { src: string };

type SelectProps = AntdSelectProps<ValueType, OptionType>;

type Props = {
  options: SelectProps['options'];
} & SelectProps;

const OptionRender: SelectProps['optionRender'] = (option) => {
  const { label, data } = option;
  return (
    <div>
      <div>{label}</div>
      <Image
        width="100%"
        src={data.src}
        preview={{
          src: data.src,
        }}
      />
    </div>
  );
};

const SelectImage = (props: Props) => {
  const { ...reset } = props;

  return <Select {...reset} optionRender={OptionRender} />;
};

export default SelectImage;
