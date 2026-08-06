"use client";
import { useEffect, useState } from "react";

function useMount() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  return isMounted;
}

export default useMount;
