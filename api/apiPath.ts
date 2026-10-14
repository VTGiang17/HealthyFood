export const API_PATH = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },

  CATEGORY: {
    LIST: "/api/category",
    DETAIL: (id: string) => `/api/category/${id}`,
  },

  INGREDIENT: {
    LIST: "/api/ingredient",
    DETAIL: (id: string) => `/api/ingredient/${id}`,
  },

  MEAL: {
    LIST: "/api/meal",
    DETAIL: (id: string) => `/api/meal/${id}`,
  },

  CUSTOM_MEAL: {
    PREVIEW: "/api/custom-meal/preview",
  },

  CART: {
    BASE: "/api/cart",
    ITEM: (id: string) => `/api/cart/items/${id}`,
  },

  ORDER: {
    BASE: "/api/order",
    DETAIL: (id: string) => `/api/order/${id}`,
    CANCEL: (id: string) => `/api/order/${id}/cancel`,
  },

  ADMIN: {
    CATEGORY: {
      CREATE: "/api/admin/category",
      UPDATE: (id: string) => `/api/admin/category/${id}`,
      DELETE: (id: string) => `/api/admin/category/${id}`,
    },

    INGREDIENT: {
      CREATE: "/api/admin/ingredient",
      UPDATE: (id: string) => `/api/admin/ingredient/${id}`,
      DELETE: (id: string) => `/api/admin/ingredient/${id}`,
    },

    MEAL: {
      CREATE: "/api/admin/meal",
      UPDATE: (id: string) => `/api/admin/meal/${id}`,
      DELETE: (id: string) => `/api/admin/meal/${id}`,
    },

    ORDER: {
      BASE: "/api/admin/order",
      DETAIL: (id: string) => `/api/admin/order/${id}`,
      STATUS: (id: string) => `/api/admin/order/${id}/status`,
    },

    USER: {
      BASE: "/api/admin/user",
      DETAIL: (id: string) => `/api/admin/user/${id}`,
      STATUS: (id: string) => `/api/admin/user/${id}/status`,
      ROLE: (id: string) => `/api/admin/user/${id}/role`,
    },
  },
} as const;
