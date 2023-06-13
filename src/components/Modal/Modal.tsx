import React, { PropsWithChildren, useEffect, useState } from 'react';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  header: string;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ open, header, children, onClose }) => {
  const [showModal, setShowModal] = useState(open);

  useEffect(() => {
    setShowModal(open);
  }, [open]);

  const closeModal = () => {
    setShowModal(false);
    onClose && onClose();
  };

  return (
    <>
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
            <div className="relative mx-auto my-6 w-auto max-w-3xl">
              <div className="relative flex w-full flex-col rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none">
                <div className="flex items-start justify-between rounded-t border-b border-solid border-slate-200 p-2">
                  <h3 className="text-xl font-semibold">{header}</h3>
                  <button
                    className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black outline-none focus:outline-none"
                    onClick={closeModal}
                  >
                    <span className="block h-6 w-6 bg-transparent text-2xl text-black outline-none focus:outline-none">×</span>
                  </button>
                </div>
                <div className="relative flex-auto">{children}</div>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
        </>
      )}
    </>
  );
};
