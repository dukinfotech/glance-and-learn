import { Button } from "@nextui-org/react";
import { useState } from "react";
import { BsDatabaseAdd } from "react-icons/bs";
import CreateDBModal from "./CreateDBModal";
import { MESSAGES } from "../../messages";

interface CreateDBButtonProps {
  onClose: () => void;
}

export default function CreateDBButton({ onClose }: CreateDBButtonProps) {
  const [isShowCreateDBModal, setIsShowCreateDBModal] =
    useState<boolean>(false);

  const handleClose = () => {
    setIsShowCreateDBModal(false);
    onClose();
  };

  return (
    <>
      <Button
        size="lg"
        color="success"
        isIconOnly
        title={MESSAGES.CREATE_DB}
        onClick={() => setIsShowCreateDBModal(true)}
      >
        <BsDatabaseAdd />
      </Button>

      {isShowCreateDBModal && <CreateDBModal onClose={handleClose} />}
    </>
  );
}
