"use server";

import { headers } from "next/headers";

export const getDeviceInfo = async () => {
    try {
        const headerList = await headers();
        const userAgent = headerList.get("user-agent") || "";
        const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
        const isTablet = /iPad|Tablet/i.test(userAgent);

        return {
            userAgent,
            isMobile,
            isTablet,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Unable to get device info");
    }
};
