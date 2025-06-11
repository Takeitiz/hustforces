export const DEBUG_MODE = {
    WEBSOCKET: import.meta.env.DEV,
    CODE_ROOM: import.meta.env.DEV,
    WEBRTC: import.meta.env.DEV,
}

export function debugLog(module: keyof typeof DEBUG_MODE, ...args: any[]) {
    if (DEBUG_MODE[module]) {
        console.log(`[${module}]`, ...args)
    }
}

export function debugError(module: keyof typeof DEBUG_MODE, ...args: any[]) {
    if (DEBUG_MODE[module]) {
        console.error(`[${module}]`, ...args)
    }
}

export function debugWarn(module: keyof typeof DEBUG_MODE, ...args: any[]) {
    if (DEBUG_MODE[module]) {
        console.warn(`[${module}]`, ...args)
    }
}