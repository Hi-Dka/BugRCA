import { parseShape, parseString } from '../../utils';

interface LoginData {
    token: string;
}

const parseLoginPayload = parseShape<LoginData>({
    token: parseString,
});

export function parseLoginData(body: Record<string, unknown>): string {
    return parseLoginPayload(body, 'response').token;
}
