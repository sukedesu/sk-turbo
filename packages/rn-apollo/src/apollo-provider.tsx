import { FC, ReactNode, useEffect, useState } from 'react';

import { ApolloClient, ApolloProvider as Provider, NormalizedCacheObject } from '@apollo/client';
import type { ApolloClientOptions } from '@apollo/client/core/ApolloClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageWrapper, CachePersistor } from 'apollo3-cache-persist';
import type { ApolloPersistOptions } from 'apollo3-cache-persist/src/types';

export function RnApolloProvider({
  children,
  splash: Splash,
  client,
  cache,
  cachePersistOptions,
}: {
  children: ReactNode;
  splash: FC;
  client: ApolloClient<any>; // eslint-disable-line
  cache: ApolloClientOptions<any>['cache']; // eslint-disable-line
  cachePersistOptions: Omit<ApolloPersistOptions<{ key: string }>, 'cache' | 'storage'>;
}) {
  const [persistor, setPersistor] = useState<CachePersistor<NormalizedCacheObject>>();

  useEffect(() => {
    async function init() {
      const newPersistor = new CachePersistor({
        cache,
        storage: new AsyncStorageWrapper(AsyncStorage),
        trigger: 'write',
        debounce: 3000,
        maxSize: 10485760,
        ...cachePersistOptions,
      });
      await newPersistor.restore();
      setPersistor(newPersistor);
    }
    init().catch(console.error);
  }, []);

  if (!persistor) return <Splash />;

  return <Provider client={client}>{children}</Provider>;
}
