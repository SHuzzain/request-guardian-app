import { apiFetch } from '@/connector/http';
import type { Post } from '@/types/post-type';

export const postsApi = {
  createPost: async (post: Post) => {
    return apiFetch.post<Post>(`/api/posts`, post);
  },
  getAllPosts: async (): Promise<Post[]> => {
    return apiFetch.get<Post[]>(`/api/posts`);
  },
  getPostById: async (id: string): Promise<Post> => {
    return apiFetch.get<Post>(`/api/posts/${id}`);
  },
};