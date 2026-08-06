import type { Post } from '@/types/post-type';
import { postsApi } from './posts-api';
import { queryKeysPost } from './query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Post) => postsApi.createPost(data),
    onSuccess: () => {
      // Invalidate and refetch queries using same key
      queryClient.invalidateQueries({ queryKey: queryKeysPost.all() });
    },
  });
};