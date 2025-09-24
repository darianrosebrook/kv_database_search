/**
 * @deprecated AlertNotice has been consolidated into Alert component.
 * Use Alert with level="inline|section|page" instead.
 * This alias will be removed in a future version.
 */
// @ts-nocheck

import Alert from '../Alert';

// Re-export Alert as AlertNotice for backwards compatibility
export default Alert;

// Also export the types for backwards compatibility
export type { AlertProps as AlertNoticeProps } from '../Alert/Alert';
