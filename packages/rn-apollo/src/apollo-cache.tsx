import { InMemoryCache } from '@apollo/client';
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
