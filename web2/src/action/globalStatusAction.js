export const STOP_RECORDING = 'STOP_RECORDING';
export const RESUME_RECORDING = 'RESUME_RECORDING';

export function stopRecording() {
    return {
        type: STOP_RECORDING
    };
}

export function resumeRecording() {
    return {
        type: RESUME_RECORDING
    };
}