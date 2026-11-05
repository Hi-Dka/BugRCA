export type CardColorTheme =
  | 'blue'
  | 'wathet'
  | 'turquoise'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'carmine'
  | 'violet'
  | 'purple'
  | 'indigo'
  | 'grey'
  | 'default';

export type CardButtonType = 'default' | 'primary' | 'danger';

export interface CardElement {
  tag: string;
  [key: string]: unknown;
}

export interface CardHeader {
  title: {
    tag: 'plain_text';
    content: string;
  };
  template?: CardColorTheme | undefined;
}

export interface CardActionItem {
  tag: 'button';
  text: {
    tag: 'plain_text';
    content: string;
  };
  type?: CardButtonType | undefined;
  url?: string | undefined;
  multi_url?:
    | {
        url?: string | undefined;
        android_url?: string | undefined;
        ios_url?: string | undefined;
        pc_url?: string | undefined;
      }
    | undefined;
  value?: Record<string, unknown> | undefined;
}

export interface FeishuCardPayload {
  config?: {
    wide_screen_mode?: boolean;
    [key: string]: unknown;
  };
  header?: CardHeader | undefined;
  elements: CardElement[];
}
