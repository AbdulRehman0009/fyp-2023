import { CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { deleteComment } from '~/services/api';
import { IError } from '~/types/types';

interface IProps {
    isOpen: boolean;
    onAfterOpen?: () => void;
    closeModal: () => void;
    openModal: () => void;
    commentID: string;
    deleteSuccessCallback: (commentID: string) => void;
}

Modal.setAppElement('#root');

const DeleteCommentModal: React.FC<IProps> = (props) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<IError | null>(null);

    const handleDeleteComment = async () => {
        try {
            setIsDeleting(true);
            await deleteComment(props.commentID);

            props.closeModal();
            props.deleteSuccessCallback(props.commentID);
            toast.dark('Comment successfully deleted.', {
                progressStyle: { backgroundColor: '#4caf50' },
                autoClose: 2000
            });
            setIsDeleting(false);
        } catch (e: any) {
            setIsDeleting(false);
            setError(e);
        }
    };

    return (
        <Modal
            isOpen={props.isOpen}
            onAfterOpen={props.onAfterOpen}
            onRequestClose={props.closeModal}
            contentLabel="Delete Comment"
            className="modal"
            shouldCloseOnOverlayClick={!isDeleting}
            overlayClassName="modal-overlay"
        >
            <div className="relative">
                <div
                    className="absolute right-2 top-2 p-1 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-indigo-1100"
                    onClick={props.closeModal}
                >
                    <CloseOutlined className="p-2  outline-none text-gray-500 dark:text-white" />
                </div>
                {error && (
                    <span className="p-4 bg-red-100 text-red-500 w-full">
                        {error?.error?.message || 'Unable process request. Please try again.'}
                    </span>
                )}
                <div className="p-4 laptop:px-8">
                    <h2 className="dark:text-white">
                        <ExclamationCircleOutlined className="text-red-500 mr-2 pt-2" />
                        Delete Comment
                    </h2>
                    <p className="text-gray-600 my-4 dark:text-white">Are you sure you want to delete this comment?</p>
                    <div className="flex justify-between">
                        <button
                            className="button--muted !rounded-full dark:bg-indigo-1100 dark:text-white dark:hover:bg-indigo-1100"
                            onClick={props.closeModal}
                        >
                            Cancel
                        </button>
                        <button
                            className="button--danger"
                            disabled={isDeleting}
                            onClick={handleDeleteComment}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>

        </Modal>
    );
};

export default DeleteCommentModal;