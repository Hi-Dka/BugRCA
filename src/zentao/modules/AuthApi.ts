import { logger } from '../../utils/logger';
import { HttpClient } from '../client/HttpClient';
import { parseLoginData } from '../parsers/auth';
import { parseEnvelope } from '../parsers/envelope';

const log = logger.tag('AuthApi');

export class AuthApi {
    constructor(private readonly httpClient: HttpClient) {
        log.info('AuthApi initialized');
    }

    async login(account: string, password: string): Promise<string> {
        const raw = await this.httpClient.post(
            'users/login',
            { account, password },
            { auth: false },
        );
        const token = parseLoginData(parseEnvelope(raw));
        log.info('Login succeeded');
        return token;
    }
}
