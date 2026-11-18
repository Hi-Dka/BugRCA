import { asRecord } from '../../utils';
import { ZenTaoError } from '../errors/ZenTaoError';

export function parseEnvelope(raw: unknown): Record<string, unknown> {
    const body = asRecord(raw, 'response');
    if (body['status'] !== 'success') {
        throw new ZenTaoError(
            `Unexpected response status: ${String(body['status'])}`,
            undefined,
            raw,
        );
    }
    return body;
}
