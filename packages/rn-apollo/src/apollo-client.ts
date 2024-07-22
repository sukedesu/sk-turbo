// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { ApolloClient, ApolloLink, from, HttpLink } from '@apollo/client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { ApolloClientOptions } from '@apollo/client/core/ApolloClient';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { setContext } from '@apollo/client/link/context';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { onError } from '@apollo/client/link/error';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import * as SecureStore from 'expo-secure-store';

import { rNApolloCache } from './apollo-cache';

export default class RnApolloClient {
  private readonly host: string;
  private readonly defaultHeaders: { id: string; secret: string };
  private readonly cache: ApolloClientOptions<unknown>['cache'];

  constructor(config: Config) {
    this.host = config.host;
    this.defaultHeaders = config.defaultHeaders;
    this.cache = config.cache || rNApolloCache;
  }

  createToken(props: TokenType): TokenType | void {
    if (typeof props !== 'object' || props === null) return console.warn(`\u26a0 createToken failed > props:`, props);

    if (!props.accessToken && !props.access_token) return console.warn(`\u26a0 access token is undefined > props:`, props);
    if (!props.expires && !props.expires_in) return console.warn(`\u26a0 expires is undefined`);

    const expires = Number(props.expires_in || props.expires) - 5;

    return {
      accessToken: props.accessToken || props.access_token,
      tokenType: props.tokenType || props.token_type,
      refreshToken: props.refreshToken || props.refresh_token,
      expires,
      // expired: () => expired(expiresIn(expires)),
    };
  }

  async request(body?: RequestBody, headers?: Headers): Promise<TokenType | void> {
    try {
      const response = await rawRequest(
        'POST',
        `${this.host}/oauth/token`,
        generateRequestBody(body),
        generateHeaders(headers || this.defaultHeaders),
      );
      if (response?.status === 200) return this.createToken(JSON.parse(response.body));
      else console.warn(`\u26a0 request failed > response:`, response);
    } catch (error) {
      console.error(error);
    }
  }

  async generateToken(): Promise<TokenType | void> {
    try {
      const userToken = await SecureStore.getItemAsync(USER_TOKEN_KEY);
      if (userToken) {
        const token = this.createToken(JSON.parse(userToken));
        if (token) return token;
      }
      const clientToken = await SecureStore.getItemAsync(CLIENT_TOKEN_KEY);
      if (clientToken) {
        const token = this.createToken(JSON.parse(clientToken));
        if (token) return token;
      }

      const response = await this.request();
      if (response) await SecureStore.setItemAsync(CLIENT_TOKEN_KEY, JSON.stringify(response));

      return response;
    } catch (error) {
      console.error(error);
    }
  }

  authLink() {
    return setContext(async (_, prevContext) =>
      this.generateToken().then((t) => ({ headers: { ...prevContext.headers, authorization: `Bearer ${t?.accessToken}` } })),
    );
  }

  httpLink() {
    return ApolloLink.split(
      (operation) => operation.getContext().upload,
      createUploadLink({ uri: `${this.host}/graphql` }),
      // createUploadLink({ uri: `${host}/graphql` }),
      // createHttpLink({uri: `${AppConfig.host}/graphql`}),
      // ApolloLink.split(hasSubscriptionOperation, createHttpLink({ uri: `${host}/graphql` })),
      // ApolloLink.split(
      //   hasSubscriptionOperation,
      //   new HttpLink({
      //     uri: `${host}/graphql`,
      //   }),
      // ),
      new HttpLink({
        // this needs to be an absolute url, as relative urls cannot be used in SSR
        uri: `${this.host}/graphql`,
        // you can disable result caching here if you want to
        // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
        fetchOptions: { cache: 'no-store' },
        // you can override the default `fetchOptions` on a per query basis
        // via the `context` property on the options passed as a second argument
        // to an Apollo Client data fetching hook, e.g.:
        // const { data } = useSuspenseQuery(MY_QUERY, { context: { fetchOptions: { cache: "force-cache" }}});
      }),
    );
  }

  client() {
    return new ApolloClient({
      cache: this.cache,
      link: from([
        onError(({ graphQLErrors, networkError }) => {
          if (graphQLErrors)
            graphQLErrors.forEach(({ message: msg }) => {
              console.error({ msg });
              // eslint-disable-next-line no-console
              // console.warn(`error: ${msg}`, { extensions });
            });
          if (networkError) {
            console.error(`[Network error]: ${networkError}`);
            SecureStore.deleteItemAsync(USER_TOKEN_KEY).catch(console.error);
            SecureStore.deleteItemAsync(CLIENT_TOKEN_KEY).catch(console.error);
          }
        }),
        this.authLink().concat(this.httpLink()),
      ]),
    });
  }
}

async function rawRequest(method: string, url: string, requestBody: string, headers: Headers) {
  try {
    const response = await fetch(url, {
      body: requestBody,
      method: method,
      headers: headers,
    });
    const body = await response.text();
    return { body, status: response.status };
  } catch (error) {
    console.error(error);
  }
}

function generateRequestBody(body?: RequestBody): string {
  return JSON.stringify({
    grant_type: body?.grant_type || 'client_credentials',
    username: body?.username,
    password: body?.password,
  });
}

function generateHeaders(headers: Headers): Headers {
  return {
    Accept: 'application/json, application/x-www-form-urlencoded',
    'Content-Type': 'application/json',
    Authorization: `Basic ${btoa(`${headers.id}:${headers.secret}`)}`,
  };
}

export interface TokenType {
  accessToken?: string;
  access_token?: string;
  tokenType?: string;
  token_type?: string;
  refreshToken?: string;
  refresh_token?: string;
  expires?: number;
  expires_in?: number;
  // expired(): boolean;
}

type Config = {
  host: string;
  defaultHeaders: {
    id: string;
    secret: string;
  };
  cache?: ApolloClientOptions<unknown>['cache'];
};

export interface TokenType {
  accessToken?: string;
  access_token?: string;
  tokenType?: string;
  token_type?: string;
  refreshToken?: string;
  refresh_token?: string;
  expires?: number;
  expires_in?: number;
  // expired(): boolean;
}

export interface Headers {
  [key: string]: string;
}

export interface RequestBody {
  grant_type?: 'client_credentials' | 'refresh_token' | 'password' | 'authorization_code' | 'assertion';
  username?: string;
  password?: string;
}

export const CLIENT_TOKEN_KEY = 'client.secret';
export const USER_TOKEN_KEY = 'user.secret';

// Usage example
// const client = new ApiClient({ host: 'https://api.example.com' });
// async function fetchData() {
//     try {
//         const data = await client.getData('/data');
//         console.log('Data:', data);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }
// fetchData();
// {
//     id: '0c58e787462a6eb21cee855bf9f7e7f0',
//         secret: 'a697fecdd396641cccb85156cab85a80ba5ddf31e66021da1ca8b25840561104',
// }
