import { logger } from '../../utils/logger';
import { ZenTaoError } from '../errors/ZenTaoError';
import { HttpClient } from '../client/HttpClient';
import { type Response } from '../types/HttpTypes';

const log = logger.tag('AuthApi');

export class AuthApi {
  constructor(private readonly httpClient: HttpClient) {
    log.info('AuthApi initialized');
  }

  async login(account: string, password: string): Promise<string> {
    const response = await this.httpClient.post<Response<{ token: string }>>(
      'users/login',
      { account, password },
      { auth: false },
    );

    if (response.status !== 'success') {
      log.error(`Login failed: ${response.status}`);
      throw new ZenTaoError('Login failed');
    }

    log.info(`Login response: ${response.status} Token: ${response.token}`);
    return response.token;
  }
}
