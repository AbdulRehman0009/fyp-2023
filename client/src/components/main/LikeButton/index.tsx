import { BiLike } from "react-icons/bi";
import { useEffect, useState } from "react";
import { useDidMount } from "~/hooks";
import { likePost } from "~/services/api";
import { IPost } from "~/types/types";

interface IProps {
  postID: string;
  isLiked: boolean;
  likeCallback: (post: IPost) => void;
}

const LikeButton: React.FC<IProps> = (props) => {
  const [isLiked, setIsLiked] = useState(props.isLiked);
  const [isLoading, setLoading] = useState(false);
  const didMount = useDidMount();

  useEffect(() => {
    setIsLiked(props.isLiked);
  }, [props.isLiked]);

  const dispatchLike = async () => {
    if (isLoading) return;

    try {
      setLoading(true);

      const { post, state } = await likePost(props.postID);
      if (didMount) {
        setLoading(false);
        setIsLiked(state);
      }

      props.likeCallback(post);
    } catch (e: any) {
      didMount && setLoading(false);
      console.log(e);
    }
  };

  return (
    <span
      className={` px-1 py-2 rounded-md flex items-center justify-center hover:bg-gray-100 cursor-pointer text-l w-2/4  ${
        isLiked
          ? "text-indigo-700 font-bold dark:text-indigo-400 dark:hover:bg-indigo-1100"
          : "text-gray-700 dark:hover:bg-indigo-1100 dark:hover:text-white  dark:bg-indigo-1000 hover:text-gray-800 dark:text-gray-400"
      } ${isLoading && "opacity-50"}`}
      onClick={dispatchLike}
    >
      <BiLike style={{ marginRight: "8px" }} />

      {isLiked ? "Unlike" : "Like"}
    </span>
  );
};

export default LikeButton;
