import { useEffect, useState } from "react";
import { TwitterPicker } from "react-color";
import { Chip, Spacer } from "@nextui-org/react";
import { MESSAGES } from "../../messages";

interface BgColorPickerProps {
  bgColor: string;
  onChange: (color: string) => void;
}

export default function BgColorPicker({
  bgColor,
  onChange,
}: BgColorPickerProps) {
  const [color, setColor] = useState<string>();

  useEffect(() => {
    setColor(bgColor);
  }, [bgColor]);

  const handleChangeColor = (color: string) => {
    setColor(color);
    onChange(color);
  };

  return (
    <>
      <Chip style={{ backgroundColor: color }}>{MESSAGES.BG_COLOR_PICKER}</Chip>
      <Spacer y={3} />
      <TwitterPicker
        color={color}
        onChangeComplete={(color) => handleChangeColor(color.hex)}
      />
    </>
  );
}
