// Define the base URL for the API
// export const API_BASE_URL = 'http://192.168.1.53/api/v1';
import Constants from "expo-constants";

export const DOMAIN = Constants?.expoConfig?.extra?.API_URL;
export const PROTOCOL =  Constants?.expoConfig?.extra?.API_PROTOCOL;
export const API_BASE_URL = PROTOCOL + DOMAIN + "/api/v1";

// Define the API routes
export const API_ROUTES = {
    // Auth routes
    AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
    AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
    AUTH_LOGIN_FORGOT_PASSWORD: `${API_BASE_URL}/auth/login/forgot-password`,
    AUTH_RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    AUTH_REGISTER: `${API_BASE_URL}/auth/registration/vendor`,
    AUTH_REFRESH: `${API_BASE_URL}/auth/refresh`,
    AUTH_VERIFY_USER_DATA: `${API_BASE_URL}/auth/registration/verify-user`,
    AUTH_ME: `${API_BASE_URL}/auth/me`,
    AUTH_UPDATE_PROFILE: `${API_BASE_URL}/auth/profile/update`,
    AUTH_LOCALE: `${API_BASE_URL}/auth/locale`,
    EMAIL_VERIFY: `${API_BASE_URL}/auth/email/send-confirmation`,
    GET_SMS_VALIDATION: `${API_BASE_URL}/auth/sms-validation`,
    POST_SMS_VALIDATION: `${API_BASE_URL}/auth/sms-validation`,

    // Common routes
    COMMON_GET_GENDERS: `${API_BASE_URL}/common/genders`,
    COMMON_GET_NOTIFICATIONS: `${API_BASE_URL}/common/notifications`,

    COMMON_GET_UPDATE_APP: `${API_BASE_URL}/common/app-update`,
    COMMON_APP_VERSION: `${API_BASE_URL}/common/app-version`,
    COMMON_ACCOUNT_DELETE: `${API_BASE_URL}/common/account/delete`,

    // Campaign notification tracking
    CAMPAIGN_LOG_OPEN: (campaignLogId: number | string) => `${API_BASE_URL}/common/notifications/campaign-log/${campaignLogId}/open`,
    CAMPAIGN_LOG_CLICK: (campaignLogId: number | string) => `${API_BASE_URL}/common/notifications/campaign-log/${campaignLogId}/click`,
    CAMPAIGN_OPT_OUT: `${API_BASE_URL}/common/notifications/opt-out`,

    // VENDOR
    VENDOR_GET_OPERATION_AREAS: `${API_BASE_URL}/vendor/services/operation-areas`,
    VENDOR_SET_OPERATION_AREAS: `${API_BASE_URL}/vendor/services/operation-areas`,
    VENDOR_GET_SERVICE_TYPES: `${API_BASE_URL}/vendor/services/operation-areas/services-types`,
    VENDOR_SET_SERVICE_TYPES: `${API_BASE_URL}/vendor/services/operation-areas/services-types`,
    VENDOR_GET_SERVICE_BY_ID: (id: string) => `${API_BASE_URL}/vendor/services/${id}/`,
    VENDOR_ACCEPT_SERVICE_BY_ID: (id: string) => `${API_BASE_URL}/vendor/services/${id}/accept`,
    VENDOR_UPDATE_LOCATION: `${API_BASE_URL}/vendor/location/update`,
    VENDOR_UPDATE_STATUS: `${API_BASE_URL}/vendor/status`,
    VENDOR_GET_STATUS: `${API_BASE_URL}/vendor/status`,
    VENDOR_GET_WALLET: `${API_BASE_URL}/vendor/wallet`,
    VENDOR_GET_OPEN_SERVICES: `${API_BASE_URL}/vendor/services/`,
    VENDOR_GET_OPEN_SERVICE: (id: Number) => `${API_BASE_URL}/vendor/services/${id}`,
    VENDOR_GET_PENDING_SERVICE: `${API_BASE_URL}/vendor/services/pending`,
    VENDOR_GET_PENDING_ALL_SERVICES: `${API_BASE_URL}/vendor/services/pending/all`,
    VENDOR_UPDATE_PAYMENT: `${API_BASE_URL}/vendor/settings/update/payment`,
    VENDOR_GET_SCHEDULES: `${API_BASE_URL}/vendor/schedule/schedules`,
    VENDOR_GET_SCHEDULE_SETTINGS: (id: Number) => `${API_BASE_URL}/vendor/schedule/settings/${id}`,
    VENDOR_UPDATE_SCHEDULE_SETTINGS: `${API_BASE_URL}/vendor/schedule/update`,
    VENDOR_UPDATE_SCHEDULE_AVAILABILITY: `${API_BASE_URL}/vendor/schedule/update-availability`,
    VENDOR_ACCEPT_SCHEDULED_SERVICE: `${API_BASE_URL}/vendor/schedule/accept`,
    VENDOR_GET_PENDING_SCHEDULE_SERVICE: `${API_BASE_URL}/vendor/schedule/pending-schedules`,
    VENDOR_GET_SCHEDULED_DETAILS: (id: string) => `${API_BASE_URL}/vendor/schedule/details/${id}`,
    VENDOR_SCHEDULE_GO_TO_LOCATION: (id: number) => `${API_BASE_URL}/vendor/schedule/go-to-location/${id}`,
    VENDOR_CANCEL_SCHEDULE: (id: number | string) => `${API_BASE_URL}/vendor/schedule/${id}/cancel`,
    VENDOR_GET_SERVICE_ROUTE: (serviceId: number | string) => `${API_BASE_URL}/vendor/services/${serviceId}/route`,

    // Services
    POST_REFUSE_SERVICE: (id: string) => `${API_BASE_URL}/vendor/services/${id}/refuse`,
    POST_FINISH_SERVICE: (id: string) => `${API_BASE_URL}/vendor/services/${id}/finish`,
    POST_CANCEL_SERVICE: (id: string) => `${API_BASE_URL}/vendor/services/${id}/cancel`,
    POST_ARRIVED_AT_DESTINATION_SERVICE: (id: string) => `${API_BASE_URL}/vendor/services/${id}/arrived`,
    PUT_RATE_SERVICE: (id: string) => `${API_BASE_URL}/vendor/services/${id}/rate`,
    GET_SERVICE_DETAILS: (id: string) => `${API_BASE_URL}/vendor/services/${id}`,
    POST_SERVICES_HISTORY: `${API_BASE_URL}/vendor/services/history`,

    // Survey
    VENDOR_SURVEY_GET_CITIES: `${API_BASE_URL}/vendor/survey/cities`,
    VENDOR_SURVEY_VOTE: `${API_BASE_URL}/vendor/survey/vote`,

    // Company Address
    GET_COMPANY_ADDRESS: `${API_BASE_URL}/vendor/address`,
    POST_COMPANY_ADDRESS: `${API_BASE_URL}/vendor/address`,

    // At User
    POST_AT_USER: `${API_BASE_URL}/vendor/at-user`,

    // Wallet
    POST_PAYMENTS_HISTORY: `${API_BASE_URL}/vendor/wallet/history`,

    //PUBLIC KEY
    GET_PUBLIC_KEY: `${API_BASE_URL}/auth/key`,

    GET_DOCUMENTS_TYPES: `${API_BASE_URL}/auth/registration/documents/types`,
    POST_DOCUMENTS: `${API_BASE_URL}/vendor/documents`,
    GET_SERVICES_TYPES: `${API_BASE_URL}/common/services/types`,

    // Chat Service
    GET_SERVICE_PUBLIC_KEY: (id: string) => `${API_BASE_URL}/common/services/${id}/public-key`,
    POST_MESSAGE: (id: string) => `${API_BASE_URL}/common/services/${id}/message`,
    GET_CHATS: (id: string) => `${API_BASE_URL}/common/services/${id}/message`,

    //this is needed to get the operation areas and then,
    //search for the servicetype that has the same id than the
    //current ipen service and extract from there the include / exclude
    //and set this information on the vendor service status screen
    POST_SEARCH_OPERATION_AREAS: `${API_BASE_URL}/customer/services/operation-areas/search`,
    CUSTOMER_REQUEST_SERVICE: `${API_BASE_URL}/customer/services`,
};
