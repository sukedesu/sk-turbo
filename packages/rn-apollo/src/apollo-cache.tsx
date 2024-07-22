// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { InMemoryCache } from '@apollo/client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { relayStylePagination } from '@apollo/client/utilities';

export const rNApolloCache = new InMemoryCache({
  typePolicies: {
    Website: {
      fields: {
        orders: relayStylePagination(['filter', 'sort', 'status']),
        lineItems: relayStylePagination(['filter', 'sort']),
      },
    },
    Query: {
      fields: {
        products: relayStylePagination(['filter', 'sort']),
      },
    },
    Subscription: { fields: { orderUpdated: (data) => data ?? undefined } },
  },
});
