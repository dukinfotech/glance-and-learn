import {
  Button,
  Input,
  InputProps,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
} from "@nextui-org/react";
import { useState } from "react";
import { MESSAGES } from "../messages";

interface PromptProps extends InputProps {
  onPressOK: (value: unknown) => void;
  onClose: () => void;
}

export default function Prompt({ onPressOK, onClose, ...rest }: PromptProps) {
  const [value, setValue] = useState<any>();

  const handleClickOK = () => {
    if (value) {
      onPressOK(value);
    }
  };

  return (
    <Modal
      size="sm"
      placement="center"
      isDismissable={false}
      isOpen
      onClose={onClose}
      hideCloseButton
    >
      <ModalContent>
        <ModalBody className="pt-5 pb-5">
          <Input
            {...rest}
            variant="flat"
            value={value}
            onValueChange={setValue}
          />
        </ModalBody>
        <ModalFooter>
          <Button size="sm" color="primary" onPress={handleClickOK}>
            {MESSAGES.CONFIRM}
          </Button>
          <Button size="sm" color="danger" variant="light" onPress={onClose}>
            {MESSAGES.CLOSE}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
