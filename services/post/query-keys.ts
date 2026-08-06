export const queryKeysPost = {
  all: () => ["posts"],
  byId: (id: string | null) => ["posts", id],
} as const;
