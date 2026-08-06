import { postsApi } from './posts-api';
import { queryKeysPost } from './query-keys';

import { useQuery } from '@tanstack/react-query';

export const useGetAllPosts = () => {
  return useQuery({
    queryKey: queryKeysPost.all(),
    queryFn: postsApi.getAllPosts
  });
};

export const useGetPostById = (id: string, {enabled}: {enabled: boolean}) => {
  return useQuery({
    queryKey: queryKeysPost.byId(id),
    queryFn: () => postsApi.getPostById(id),
    enabled
  });
};