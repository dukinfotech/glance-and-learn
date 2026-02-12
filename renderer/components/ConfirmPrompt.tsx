import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
} from "@nextui-org/react";
import { MESSAGES } from "../messages";

interface ConfirmPromptProps {
  message: string;
  isShowing: boolean;
  hide: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmPrompt({
  isShowing,
  onConfirm,
  onCancel,
  message,
}: ConfirmPromptProps) {
  return (
    <Modal
      size="sm"
      placement="center"
      isDismissable={false}
      isOpen={isShowing}
      onClose={onCancel}
      hideCloseButton
    >
      <ModalContent>
        <ModalBody className="pt-5 pb-5">{message}</ModalBody>
        <ModalFooter>
          <Button size="sm" color="primary" onPress={onConfirm}>
            {MESSAGES.CONFIRM}
          </Button>
          <Button size="sm" color="danger" onPress={onCancel}>
            {MESSAGES.CLOSE}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
