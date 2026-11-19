import { isRecord } from '../../utils';

function extractResponseData(err: Record<string, unknown>): Record<string, unknown> | undefined {
    const response = err['response'];
    if (!isRecord(response)) {
        return undefined;
    }
    const data = response['data'];
    return isRecord(data) ? data : undefined;
}

function parseErrorCode(rawCode: unknown): number | undefined {
    if (typeof rawCode === 'number' && Number.isFinite(rawCode)) {
        return rawCode;
    }
    if (typeof rawCode === 'string' && rawCode.trim() !== '') {
        const parsed = Number(rawCode);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

export class NotificationError extends Error {
    constructor(
        message: string,
        public readonly code?: number,
        public readonly rawError?: unknown,
    ) {
        super(message);
        this.name = 'NotificationError';
    }

    static fromLarkError(err: unknown): NotificationError {
        if (err instanceof NotificationError) {
            return err;
        }
        if (!isRecord(err)) {
            return new NotificationError(String(err));
        }

        const resData = extractResponseData(err);
        const rawCode = resData?.['code'] ?? err['code'];
        const parsedCode = parseErrorCode(rawCode);
        const rawMsg = resData?.['msg'] ?? err['msg'] ?? err['message'] ?? 'Unknown Feishu error';

        return new NotificationError(String(rawMsg), parsedCode, err);
    }
}
