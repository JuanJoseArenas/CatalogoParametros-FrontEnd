declare module 'minifront-mensajes' {
  export interface MessageUcoLabMountOptions {
    apiBaseUrl?: string;
    applicationName?: string;
    environmentName?: string;
    loginUrl?: string;
    lockContext?: boolean;
    allowApplicationCreation?: boolean;
    onUnauthorized?: (error: unknown) => void;
    [key: string]: unknown;
  }

  export interface MessageUcoLabWidget {
    unmount(): void;
    refresh(): void;
    reload(): void;
  }

  export function mount(element: HTMLElement, options?: MessageUcoLabMountOptions): MessageUcoLabWidget;
  export function unmount(element: HTMLElement): void;
  export function createMessageClient(options?: Record<string, unknown>): {
    get(code: string, variables?: Record<string, string>): Promise<unknown>;
  };
}
