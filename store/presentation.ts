import { create } from "zustand";

interface PresentationStateProps {
    totalPages: number;
    currentPage: number;
    setTotalPages: (totalPages: number) => void;
    setCurrentPage: (currentPage: number) => void;
    reset: () => void;
}

const presentationStateInit = {
    totalPages: 0,
    currentPage: 1,
};
export const usePresentationStore = create<PresentationStateProps>((set) => ({
    ...presentationStateInit,
    setTotalPages: (totalPages) => set({ totalPages }),
    setCurrentPage: (currentPage) => set({ currentPage }),
    reset: () => set(presentationStateInit),
}));


interface PresentationVideoProps {
    timeFrame: number;
    nextTimeFrame: number;
    loaded: boolean;
    playSource: boolean;
    setFrame: (timeFrame: number, nextTimeFrame: number) => void;
    setPlaySource: (playSource: boolean) => void;
    reset: () => void;
}

const presentationVideoInit = {
    timeFrame: 0,
    nextTimeFrame: 0,
    loaded: false,
    playSource: false,
};

export const usePresentationVideoStore = create<PresentationVideoProps>((set) => ({
    ...presentationVideoInit,
    setFrame: (timeFrame, nextTimeFrame) => set({ timeFrame, nextTimeFrame, loaded: true, playSource: true }),
    setPlaySource: (playSource) => set({ playSource }),
    reset: () => set(presentationVideoInit),
}));